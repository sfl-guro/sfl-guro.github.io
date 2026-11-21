import { dailyHarvestReloadStore } from "./daily_harvest.js";

import { harvestLogRequestTimed, harvestLogSetAfterPush } from "./harvest_log.js";

import { stateEmit, stateCodeInfo, stateSaveLocalCode, stateMarkBad, stateCodeValid, stateRemoveLocalCode } from "./hl_code_store.js";

const SAVED_KEY = "hl_hlog_state_saved_v1";

const STORE_KEY = "hl_daily_harvest_v1";

const SENT_KEY = "hl_hlog_sent_v1";

const FARM_RE = /^\d{1,20}$/;

const MAX_STATE_CHARS = 560000;

const PULL_TIMEOUT_MS = 4000;

const PUSH_TIMEOUT_MS = 8000;

const RETRY_AFTER_FAIL_MS = 120000;

const pulled = {};

const forceNext = {};

let lastNetFail = 0;

let pushing = false;

function utcDay() {
  return new Date().toISOString().substring(0, 10);
}

function isPlain(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch (e) {
    return null;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}

function emitLocal(type) {
  stateEmit(type);
}

export function stateRemoveCode(farm) {
  stateRemoveLocalCode(farm);
  delete pulled[String(farm || "")];
}

export function stateLastSaved(farm) {
  const saved = readJson(SAVED_KEY);
  const e = isPlain(saved) ? saved[String(farm || "")] : null;
  if (!isPlain(e) || e.day !== utcDay()) return null;
  return {
    at: Number(e.at) || 0,
    score: Number(e.score) || 0,
    tooLarge: e.tooLarge === true
  };
}

function markSaved(farm, score, tooLarge) {
  const saved = readJson(SAVED_KEY);
  const all = isPlain(saved) ? saved : {};
  all[farm] = {
    day: utcDay(),
    score: score,
    at: Date.now(),
    tooLarge: tooLarge === true
  };
  writeJson(SAVED_KEY, all);
  emitLocal("saved");
}

function sumObj(o, field) {
  let s = 0;
  if (!isPlain(o)) return 0;
  Object.keys(o).forEach(k => {
    const v = o[k];
    if (isPlain(v)) {
      const n = Number(v[field]);
      if (Number.isFinite(n)) s += n;
    }
  });
  return s;
}

function scoreRec(rec) {
  if (!isPlain(rec)) return 0;
  let s = 0;
  const stats = isPlain(rec.stats) ? rec.stats : {};
  Object.keys(stats).forEach(k => {
    const st = stats[k];
    if (!isPlain(st)) return;
    s += (Number(st.banked) || 0) * 1000;
    if (isPlain(st.counts)) Object.keys(st.counts).forEach(id => {
      const n = Number(st.counts[id]);
      if (Number.isFinite(n)) s += n;
    });
  });
  s += sumObj(rec.cook, "a");
  s += sumObj(rec.mach, "a");
  if (isPlain(rec.gs)) s += Number(rec.gs.a) || 0;
  if (isPlain(rec.bris)) s += Number(rec.bris.a) || 0;
  if (isPlain(rec.coin)) s += (Number(rec.coin.e) || 0) + (Number(rec.coin.s) || 0);
  return Math.max(0, Math.floor(s));
}

function caveScore(track, today) {
  if (!isPlain(track) || !isPlain(track.days)) return 0;
  const d = track.days[today];
  if (!isPlain(d)) return 0;
  let s = (Number(d.tiles) || 0) + (Number(d.twin) || 0);
  if (isPlain(d.used)) Object.keys(d.used).forEach(k => {
    s += Number(d.used[k]) || 0;
  });
  return Math.max(0, Math.floor(s));
}

function stateScore(rec, track, today) {
  return scoreRec(rec) + caveScore(track, today);
}

function caveKeysFor(farm) {
  return [ "guro_cave_dug_v1_" + farm, "guro_cave_track_v2_" + farm ];
}

function buildState(farm) {
  const store = readJson(STORE_KEY);
  const today = utcDay();
  const rec = isPlain(store) ? store[farm] : null;
  if (!isPlain(rec) || rec.day !== today || !isPlain(rec.stats)) return null;
  const data = {};
  data[STORE_KEY] = {};
  data[STORE_KEY][farm] = rec;
  caveKeysFor(farm).forEach(k => {
    const v = readJson(k);
    if (isPlain(v)) data[k] = v;
  });
  return {
    day: today,
    score: stateScore(rec, data["guro_cave_track_v2_" + farm], today),
    data: data
  };
}

async function post(path, body, ms) {
  const res = await harvestLogRequestTimed(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  }, ms);
  let json = null;
  try {
    json = await res.json();
  } catch (e) {}
  return {
    status: res.status,
    json: json
  };
}

function applyState(farm, payload) {
  const today = utcDay();
  if (!isPlain(payload) || payload.day !== today || !isPlain(payload.data)) return false;
  const data = payload.data;
  const allowed = [ STORE_KEY ].concat(caveKeysFor(farm));
  if (Object.keys(data).some(k => allowed.indexOf(k) === -1)) return false;
  if (!isPlain(data[STORE_KEY])) return false;
  const rec = data[STORE_KEY][farm];
  if (!isPlain(rec) || rec.day !== today || !isPlain(rec.stats)) return false;
  const incoming = stateScore(rec, data["guro_cave_track_v2_" + farm], today);
  const localStore = readJson(STORE_KEY);
  const local = isPlain(localStore) ? localStore : {};
  const localScore = isPlain(local[farm]) && local[farm].day === today ? stateScore(local[farm], readJson("guro_cave_track_v2_" + farm), today) : 0;
  if (!(incoming > localScore)) return false;
  const snap = {};
  [ STORE_KEY, SENT_KEY ].concat(caveKeysFor(farm)).forEach(k => {
    try {
      snap[k] = localStorage.getItem(k);
    } catch (e) {
      snap[k] = null;
    }
  });
  try {
    local[farm] = rec;
    if (!local.__last) local.__last = farm;
    localStorage.setItem(STORE_KEY, JSON.stringify(local));
    caveKeysFor(farm).forEach(k => {
      if (isPlain(data[k])) localStorage.setItem(k, JSON.stringify(data[k]));
    });
    localStorage.removeItem(SENT_KEY);
  } catch (e) {
    Object.keys(snap).forEach(k => {
      try {
        if (snap[k] == null) localStorage.removeItem(k); else localStorage.setItem(k, snap[k]);
      } catch (e2) {}
    });
    dailyHarvestReloadStore();
    return false;
  }
  dailyHarvestReloadStore();
  markSaved(farm, incoming, false);
  return true;
}

export async function harvestStatePull(farmId) {
  const farm = String(farmId || "");
  if (!FARM_RE.test(farm) || pulled[farm]) return false;
  const info = stateCodeInfo(farm);
  if (!info || info.bad) return false;
  if (Date.now() - lastNetFail < RETRY_AFTER_FAIL_MS) return false;
  let r;
  try {
    r = await post("/state/load", {
      farmId: farm,
      code: info.code
    }, PULL_TIMEOUT_MS);
  } catch (e) {
    lastNetFail = Date.now();
    return false;
  }
  if (r.status >= 500) {
    lastNetFail = Date.now();
    return false;
  }
  pulled[farm] = true;
  if (r.status === 404 && r.json && r.json.error === "no_code") {
    try {
      const c = await post("/state/claim", {
        farmId: farm,
        code: info.code
      }, PUSH_TIMEOUT_MS);
      if (c.status === 403) stateMarkBad(farm); else if (c.status === 200) forceNext[farm] = true;
    } catch (e) {}
    return false;
  }
  if (r.status === 403) {
    stateMarkBad(farm);
    return false;
  }
  if (r.status !== 200 || !r.json || r.json.ok !== true) return false;
  if (r.json.empty) {
    forceNext[farm] = true;
    return false;
  }
  const applied = applyState(farm, r.json);
  if (applied) {
    emitLocal("applied");
    return true;
  }
  const serverRec = isPlain(r.json.data) && isPlain(r.json.data[STORE_KEY]) ? r.json.data[STORE_KEY][farm] : null;
  const localStore = readJson(STORE_KEY);
  const localRec = isPlain(localStore) ? localStore[farm] : null;
  const serverTrack = isPlain(r.json.data) ? r.json.data["guro_cave_track_v2_" + farm] : null;
  const todayNow = utcDay();
  if (isPlain(localRec) && localRec.day === todayNow && stateScore(localRec, readJson("guro_cave_track_v2_" + farm), todayNow) > stateScore(serverRec, serverTrack, todayNow)) forceNext[farm] = true;
  return false;
}

export async function harvestStatePush(farmId, force) {
  const farm = String(farmId || "");
  if (!FARM_RE.test(farm) || pushing) return;
  const info = stateCodeInfo(farm);
  if (!info || info.bad) return;
  const built = buildState(farm);
  if (!built) return;
  const prev = stateLastSaved(farm);
  if (forceNext[farm]) {
    force = true;
    delete forceNext[farm];
  }
  if (!force && prev) {
    if (!(built.score > prev.score)) return;
  }
  const body = {
    farmId: farm,
    code: info.code,
    day: built.day,
    score: built.score,
    data: built.data
  };
  if (JSON.stringify(body).length > MAX_STATE_CHARS) {
    markSaved(farm, built.score, true);
    return;
  }
  pushing = true;
  try {
    let r = await post("/state/save", body, PUSH_TIMEOUT_MS);
    if (r.status === 404 && r.json && r.json.error === "no_code") {
      const c = await post("/state/claim", {
        farmId: farm,
        code: info.code
      }, PUSH_TIMEOUT_MS);
      if (c.status === 403) {
        stateMarkBad(farm);
        return;
      }
      if (c.status === 200) r = await post("/state/save", body, PUSH_TIMEOUT_MS);
    }
    if (r.status === 403) {
      stateMarkBad(farm);
      return;
    }
    if (r.status === 200 && r.json && r.json.ok === true) {
      const stored = Number(r.json.score);
      markSaved(farm, Number.isFinite(stored) ? Math.max(stored, built.score) : built.score, false);
    }
  } catch (e) {} finally {
    pushing = false;
  }
}

export async function stateSetCode(farmId, codeRaw) {
  const farm = String(farmId || "");
  const code = String(codeRaw == null ? "" : codeRaw).trim();
  if (!FARM_RE.test(farm)) return {
    ok: false,
    reason: "no_farm"
  };
  if (!stateCodeValid(code)) return {
    ok: false,
    reason: "bad_code"
  };
  let r;
  try {
    r = await post("/state/claim", {
      farmId: farm,
      code: code
    }, PUSH_TIMEOUT_MS);
  } catch (e) {
    return {
      ok: false,
      reason: "network"
    };
  }
  if (r.status === 200 && r.json && r.json.ok === true) {
    stateSaveLocalCode(farm, code, false);
    delete pulled[farm];
    emitLocal("code");
    (async () => {
      await harvestStatePull(farm);
      await harvestStatePush(farm, true);
    })().catch(() => {});
    return {
      ok: true,
      created: r.json.created === true
    };
  }
  if (r.status === 403) return {
    ok: false,
    reason: "code_exists",
    left: r.json && r.json.left
  };
  if (r.status === 429) return {
    ok: false,
    reason: "locked",
    retryAfter: r.json && r.json.retryAfter
  };
  if (r.status === 400) return {
    ok: false,
    reason: "bad_code"
  };
  return {
    ok: false,
    reason: "server"
  };
}

export function harvestStateInit() {
  harvestLogSetAfterPush(farmId => {
    harvestStatePush(farmId, false).catch(() => {});
  });
}
