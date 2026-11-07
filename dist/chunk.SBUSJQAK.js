import {
  ICON_DATA
} from "./chunk.VR6FV3KR.js";

// src/crafted_tools.js
var deps = null;
function craftedToolsInit(d) {
  deps = d;
}
function getIcon(name) {
  return deps.getIcon(name);
}
function harvestLogRequest(path, opts) {
  return deps.request(path, opts);
}
function harvestLogFarmId() {
  return deps.farmId();
}
function harvestLogCachedDays(farmId) {
  return deps.cachedDays(farmId);
}
function harvestLogLoadDays(farmId) {
  return deps.loadDays(farmId);
}
var LOCAL_KEY = "hl_crafted_v1";
var CACHE_KEY = "hl_crafted_cache_v1";
var CACHE_FRESH_MS = 6e4;
var MAX_LOCAL_DAYS = 400;
var MAX_LOCAL_FARMS = 8;
var SEND_WINDOW_DAYS = 364;
var SEND_CHUNK = 40;
var PAGE_SIZE = 30;
var FARM_RE = /^\d{1,20}$/;
var TOOLS = ["Axe", "Pickaxe", "Stone Pickaxe", "Iron Pickaxe", "Gold Pickaxe", "Oil Drill", "Rod", "Salt Rake", "Sand Shovel", "Sand Drill", "Crab Pot", "Mariner Pot"];
var RECIPES = {
  "Axe": {},
  "Pickaxe": {
    Wood: 3
  },
  "Stone Pickaxe": {
    Wood: 3,
    Stone: 5
  },
  "Iron Pickaxe": {
    Wood: 3,
    Iron: 5
  },
  "Gold Pickaxe": {
    Wood: 3,
    Gold: 3
  },
  "Oil Drill": {
    Wood: 20,
    Iron: 9,
    Leather: 10
  },
  "Rod": {
    Wood: 3,
    Stone: 1
  },
  "Salt Rake": {
    Wood: 3
  },
  "Sand Shovel": {
    Wood: 2,
    Stone: 1
  },
  "Sand Drill": {
    Oil: 1,
    Crimstone: 1,
    Wood: 3,
    Leather: 1
  },
  "Crab Pot": {
    Feather: 5,
    Wool: 3
  },
  "Mariner Pot": {
    Feather: 10,
    "Merino Wool": 10
  }
};
var TOOL_GROUP = {
  "Axe": "Wood",
  "Pickaxe": "Stone",
  "Stone Pickaxe": "Iron",
  "Iron Pickaxe": "Gold",
  "Gold Pickaxe": "Crimstone",
  "Oil Drill": "Oil"
};
var RES = ["Wood", "Stone", "Iron", "Gold", "Crimstone", "Oil", "Leather", "Feather", "Wool", "Merino Wool"];
var view = emptyView();
var ui = {
  host: null,
  token: 0,
  farmId: "",
  showCount: PAGE_SIZE,
  open: {}
};
function emptyView() {
  return {
    openDay: "",
    final: {},
    resView: {},
    sig: ""
  };
}
function utcDay(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}
function r2(n) {
  return Math.round(n * 100) / 100;
}
function num(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
function isObj(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function canon(v) {
  if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
  if (isObj(v)) {
    return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}";
  }
  return JSON.stringify(v);
}
function dateLabel(day) {
  return (/* @__PURE__ */ new Date(day + "T00:00:00Z")).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  });
}
function fmtQty(n) {
  if (Number.isInteger(n)) return n.toLocaleString("en-US");
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
function fmtRes(n) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
function loadLocalAll() {
  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL_KEY) || "null");
    if (isObj(raw)) return raw;
  } catch (e) {
  }
  return {};
}
function loadLocal(farmId) {
  const all = loadLocalAll();
  const rec = all[farmId];
  if (isObj(rec) && isObj(rec.days)) return rec;
  return {
    ctr: null,
    days: {},
    open: null,
    snap: null
  };
}
function saveLocal(farmId, rec) {
  const all = loadLocalAll();
  const keys = Object.keys(rec.days).sort();
  while (keys.length > MAX_LOCAL_DAYS) delete rec.days[keys.shift()];
  all[farmId] = rec;
  const farms = Object.keys(all);
  if (farms.length > MAX_LOCAL_FARMS) {
    farms.sort((a, b) => (all[a].snap && all[a].snap.at || 0) - (all[b].snap && all[b].snap.at || 0));
    while (farms.length > MAX_LOCAL_FARMS) delete all[farms.shift()];
  }
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
  } catch (e) {
  }
}
function loadCache(farmId) {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (c && c.farm === farmId && isObj(c.days)) return c;
  } catch (e) {
  }
  return {
    farm: farmId,
    days: {},
    at: 0
  };
}
function saveCache(c) {
  const keys = Object.keys(c.days).sort();
  while (keys.length > MAX_LOCAL_DAYS) delete c.days[keys.shift()];
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch (e) {
  }
}
function sumR(r) {
  let sum = 0;
  if (!isObj(r)) return sum;
  Object.keys(r).forEach((res) => {
    const lots = r[res];
    if (!isObj(lots)) return;
    Object.keys(lots).forEach((lot) => {
      sum += Number(lots[lot]) || 0;
    });
  });
  return sum;
}
function normalizeDay(raw) {
  if (!isObj(raw)) return null;
  const out = {
    t: {},
    r: {}
  };
  if (isObj(raw.t)) {
    Object.keys(raw.t).forEach((name) => {
      const e = raw.t[name];
      if (!TOOLS.includes(name) || !isObj(e)) return;
      const c = num(e.c);
      const x = num(e.x);
      if (!(c > 0) && !(x > 0)) return;
      const entry = {};
      if (c > 0) entry.c = c;
      const u = Math.min(num(e.u), c);
      if (u > 0) entry.u = u;
      if (x > 0) entry.x = x;
      out.t[name] = entry;
    });
  }
  if (isObj(raw.r)) out.r = raw.r;
  if (isObj(raw.s) && sumR(raw.s) > 0) out.s = raw.s;
  if (isObj(raw.i) && Number(raw.i.at) > 0 && isObj(raw.i.v)) out.i = {
    at: Number(raw.i.at),
    v: raw.i.v
  };
  if (isObj(raw.o)) out.o = raw.o;
  return out;
}
function mergeDay(a, b) {
  if (!a) return b || null;
  if (!b) return a;
  const t = {};
  const names = /* @__PURE__ */ new Set([...Object.keys(a.t || {}), ...Object.keys(b.t || {})]);
  names.forEach((name) => {
    const x = a.t && a.t[name];
    const y = b.t && b.t[name];
    if (!x || !y) {
      t[name] = x || y;
      return;
    }
    const c = Math.max(x.c || 0, y.c || 0);
    const u = Math.min(Math.max(x.u || 0, y.u || 0), c);
    const used = Math.max(x.x || 0, y.x || 0);
    const entry = {};
    if (c > 0) entry.c = c;
    if (u > 0) entry.u = u;
    if (used > 0) entry.x = used;
    t[name] = entry;
  });
  const r = sumR(b.r) >= sumR(a.r) ? b.r || {} : a.r || {};
  const out = {
    t,
    r
  };
  if (a.s || b.s) out.s = sumR(b.s) >= sumR(a.s) ? b.s || {} : a.s || {};
  const i = a.i && b.i ? b.i.at >= a.i.at ? b.i : a.i : a.i || b.i;
  if (i) out.i = i;
  const o = a.o || b.o;
  if (o) out.o = o;
  return out;
}
function localRecords(rec) {
  const out = {};
  Object.keys(rec.days).forEach((day) => {
    const n = normalizeDay(rec.days[day]);
    if (n) out[day] = n;
  });
  if (rec.open && rec.open.day) {
    const cur = out[rec.open.day] || {
      t: {},
      r: {}
    };
    cur.o = {
      r: rec.open.r || {},
      t: rec.open.t || {}
    };
    if (rec.open.f) {
      cur.o.a = rec.open.a || {};
      cur.o.u = rec.open.u || {};
    }
    out[rec.open.day] = cur;
  }
  return out;
}
function craftFacts(farmId, cache) {
  const local = localRecords(loadLocal(farmId));
  const out = {};
  const days = /* @__PURE__ */ new Set([...Object.keys(cache.days), ...Object.keys(local)]);
  days.forEach((day) => {
    const merged = mergeDay(cache.days[day] || null, local[day] || null);
    if (merged) out[day] = merged;
  });
  return out;
}
function craftedCount(facts, day, tool) {
  const rec = facts[day];
  return rec && rec.t && rec.t[tool] ? num(rec.t[tool].c) : 0;
}
var BALANCE_EPS = 0.05;
function remainOf(lots) {
  return lots.reduce((sum, lot) => sum + (lot.acc - lot.used), 0);
}
function isBought(key) {
  return String(key).startsWith("b:");
}
function spendOrder(lots, day) {
  const old = lots.filter((l) => !isBought(l.key) && l.key !== day);
  const other = lots.filter((l) => isBought(l.key));
  const current = lots.filter((l) => !isBought(l.key) && l.key === day);
  return [...old, ...other, ...current];
}
function drain(lots, amount, sink, day) {
  let need = r2(amount);
  for (const lot of spendOrder(lots, day)) {
    if (need <= 0) break;
    const free = r2(lot.acc - lot.used);
    if (free <= 0) continue;
    const take = Math.min(free, need);
    lot.used = r2(lot.used + take);
    need = r2(need - take);
    sink(lot.key, take);
  }
}
function sinkTo(store, day, res) {
  return (key, take) => {
    const dayRec = store[day] || (store[day] = {});
    const resRec = dayRec[res] || (dayRec[res] = {});
    resRec[key] = r2((resRec[key] || 0) + take);
  };
}
function computeLedger(list, facts) {
  const factDays = Object.keys(facts).sort();
  if (!factDays.length) return emptyView();
  const openDay = factDays.find((d) => facts[d].o) || factDays[0];
  const open = facts[openDay] && facts[openDay].o ? facts[openDay].o : {
    r: {},
    t: {}
  };
  const acc = {};
  const use = {};
  RES.forEach((res) => {
    acc[res] = {};
  });
  TOOLS.forEach((tool) => {
    use[tool] = {};
  });
  const harvestDays = [];
  (list || []).forEach((entry) => {
    if (!entry || !entry.day || entry.day < openDay) return;
    const totals = entry.totals || {};
    harvestDays.push(entry.day);
    const first = entry.day === openDay;
    RES.forEach((res) => {
      const e = totals[res];
      const a = e ? e.a - (first ? num(open.a && open.a[res]) : 0) : 0;
      if (a > 0) acc[res][entry.day] = a;
    });
    TOOLS.forEach((tool) => {
      if (!TOOL_GROUP[tool]) return;
      const e = totals[TOOL_GROUP[tool]];
      const used = e && e.k === "node" ? e.tl - (first ? num(open.u && open.u[tool]) : 0) : 0;
      if (used > 0) use[tool][entry.day] = used;
    });
  });
  TOOLS.forEach((tool) => {
    if (TOOL_GROUP[tool]) return;
    factDays.forEach((day) => {
      const rec = facts[day];
      const x = rec && rec.t && rec.t[tool] ? num(rec.t[tool].x) : 0;
      if (day >= openDay && x > 0) use[tool][day] = x;
    });
  });
  const timeline = Array.from(/* @__PURE__ */ new Set([...factDays.filter((d) => d >= openDay), ...harvestDays])).sort();
  const toolLots = {};
  TOOLS.forEach((tool) => {
    const lots = [];
    const opening = num(open.t && open.t[tool]);
    if (opening > 0) lots.push({
      key: "o",
      c: opening,
      u: 0
    });
    timeline.forEach((day) => {
      const c = craftedCount(facts, day, tool);
      if (c > 0) lots.push({
        key: day,
        c,
        u: 0
      });
      let need = use[tool][day] || 0;
      for (const lot of lots) {
        if (need <= 0) break;
        const free = r2(lot.c - lot.u);
        if (free <= 0) continue;
        const take = Math.min(free, need);
        lot.u = r2(lot.u + take);
        need = r2(need - take);
      }
    });
    toolLots[tool] = lots;
  });
  const recipes = RECIPES;
  const consumed = {};
  const spent = {};
  const resLots = {};
  RES.forEach((res) => {
    const lots = [];
    const opening = num(open.r && open.r[res]);
    if (opening > 0) lots.push({
      key: "o",
      acc: opening,
      used: 0
    });
    timeline.forEach((day) => {
      const gained = num(acc[res][day]);
      if (gained > 0) lots.push({
        key: day,
        acc: r2(gained),
        used: 0
      });
      let need = 0;
      TOOLS.forEach((tool) => {
        need += craftedCount(facts, day, tool) * (recipes[tool][res] || 0);
      });
      need = r2(need);
      const snap = facts[day] && facts[day].i && isObj(facts[day].i.v) ? facts[day].i.v[res] : void 0;
      const hasSnap = typeof snap === "number" && snap >= 0;
      if (hasSnap) {
        const gain = r2(snap - r2(remainOf(lots) - need));
        if (gain > BALANCE_EPS) lots.push({
          key: "b:" + day,
          acc: gain,
          used: 0
        });
      }
      const consumeSink = sinkTo(consumed, day, res);
      drain(lots, need, consumeSink, day);
      if (hasSnap) {
        const early = r2(remainOf(lots) - snap);
        if (early > BALANCE_EPS) drain(lots, early, sinkTo(spent, day, res), day);
      }
      if (hasSnap) {
        const extra = r2(remainOf(lots) - snap);
        if (extra > BALANCE_EPS) drain(lots, extra, sinkTo(spent, day, res), day);
      }
    });
    resLots[res] = lots;
  });
  const computed = {};
  timeline.forEach((day) => {
    const t = {};
    TOOLS.forEach((tool) => {
      const c = craftedCount(facts, day, tool);
      if (!(c > 0)) return;
      const lot = toolLots[tool].find((l) => l.key === day);
      const u = lot ? lot.u : 0;
      t[tool] = u > 0 ? {
        c,
        u
      } : {
        c
      };
    });
    const rec = {
      t,
      r: consumed[day] || {}
    };
    if (spent[day]) rec.s = spent[day];
    if (day === openDay && facts[day] && facts[day].o) rec.o = facts[day].o;
    if (Object.keys(t).length || rec.o || rec.s) computed[day] = rec;
  });
  const final = {};
  (/* @__PURE__ */ new Set([...Object.keys(facts), ...Object.keys(computed)])).forEach((day) => {
    const merged = mergeDay(facts[day] || null, computed[day] || null);
    if (merged) final[day] = merged;
  });
  const usedBy = {};
  Object.keys(final).forEach((day) => {
    [final[day].r, final[day].s].forEach((source) => {
      if (!isObj(source)) return;
      Object.keys(source).forEach((res) => {
        const lots = source[res];
        if (!isObj(lots)) return;
        Object.keys(lots).forEach((key) => {
          const bucket = usedBy[res] || (usedBy[res] = {});
          bucket[key] = (bucket[key] || 0) + (Number(lots[key]) || 0);
        });
      });
    });
  });
  const resView = {};
  RES.forEach((res) => {
    resView[res] = resLots[res].map((lot) => {
      const used = Math.min(lot.acc, r2(usedBy[res] && usedBy[res][lot.key] || 0));
      return {
        key: lot.key,
        acc: lot.acc,
        used,
        remain: r2(lot.acc - used)
      };
    });
  });
  return {
    openDay,
    final,
    resView,
    sig: canon(final)
  };
}
function displayLots(lots, today) {
  const old = [];
  const current = [];
  const other = {
    key: "x",
    acc: 0,
    used: 0,
    remain: 0
  };
  lots.forEach((lot) => {
    if (isBought(lot.key) || lot.key === "x") {
      other.acc = r2(other.acc + lot.acc);
      other.used = r2(other.used + lot.used);
      other.remain = r2(other.remain + lot.remain);
    } else if (lot.key === today) {
      current.push(Object.assign({}, lot));
    } else {
      old.push(Object.assign({}, lot));
    }
  });
  return {
    old,
    other,
    current
  };
}
function fitLots(lots, balance, today) {
  const parts = displayLots(lots, today);
  if (balance >= 0) {
    const sum = parts.old.concat(parts.current).reduce((s, l) => s + l.remain, 0) + parts.other.remain;
    if (sum > balance) {
      let over = r2(sum - balance);
      for (const lot of [...parts.old, parts.other, ...parts.current]) {
        if (over <= 0) break;
        const cut = Math.min(lot.remain, over);
        lot.remain = r2(lot.remain - cut);
        lot.used = r2(lot.used + cut);
        over = r2(over - cut);
      }
    } else if (balance - sum > 4e-3) {
      const extra = r2(balance - sum);
      parts.other.acc = r2(parts.other.acc + extra);
      parts.other.remain = r2(parts.other.remain + extra);
    }
  }
  const out = [...parts.old];
  if (parts.other.acc > 0 || parts.other.used > 0 || parts.other.remain > 0) out.push(parts.other);
  return out.concat(parts.current);
}
async function refreshCache(farmId, cache) {
  const res = await harvestLogRequest("/crafted?farm=" + encodeURIComponent(farmId), {
    cache: "no-store"
  });
  if (!res.ok) throw new Error("bad_response_" + res.status);
  const json = await res.json();
  const days = Array.isArray(json.days) ? json.days : [];
  let changed = false;
  days.forEach((d) => {
    if (!d || !d.day) return;
    const incoming = normalizeDay(d.data);
    if (!incoming) return;
    const merged = mergeDay(cache.days[d.day] || null, incoming);
    if (canon(merged) !== canon(cache.days[d.day] || null)) {
      cache.days[d.day] = merged;
      changed = true;
    }
  });
  cache.at = Date.now();
  saveCache(cache);
  return changed;
}
async function craftedToolsSync(farmId) {
  const fid = String(farmId || "");
  if (!FARM_RE.test(fid)) return false;
  const cache = loadCache(fid);
  if (Date.now() - cache.at < CACHE_FRESH_MS) return false;
  try {
    return await refreshCache(fid, cache);
  } catch (e) {
    return false;
  }
}
function craftedToolsTrack(g, farmId) {
  if (!g || typeof g !== "object") return;
  const fid = String(farmId || "");
  if (!FARM_RE.test(fid)) return;
  const act = isObj(g.farmActivity) ? g.farmActivity : null;
  if (!act) return;
  const inv = isObj(g.inventory) ? g.inventory : {};
  const now = Date.now();
  const today = utcDay(now);
  const rec = loadLocal(fid);
  const prevTools = rec.snap && isObj(rec.snap.tools) ? rec.snap.tools : null;
  const counters = {};
  const tools = {};
  const res = {};
  TOOLS.forEach((tool) => {
    counters[tool] = num(act[tool + " Crafted"]);
    tools[tool] = r2(num(inv[tool]));
  });
  RES.forEach((name) => {
    res[name] = r2(num(inv[name]));
  });
  rec.snap = {
    at: now,
    tools,
    res
  };
  if (!rec.ctr) {
    rec.ctr = counters;
    rec.open = {
      day: today,
      r: res,
      t: tools
    };
  } else {
    TOOLS.forEach((tool) => {
      if (typeof rec.ctr[tool] !== "number") {
        rec.ctr[tool] = counters[tool];
        if (rec.open && isObj(rec.open.t) && typeof rec.open.t[tool] !== "number") rec.open.t[tool] = tools[tool];
        return;
      }
      const delta = counters[tool] - rec.ctr[tool];
      const crafted = delta > 0 ? delta : 0;
      const used = !TOOL_GROUP[tool] && prevTools && typeof prevTools[tool] === "number" ? r2(prevTools[tool] + crafted - tools[tool]) : 0;
      if (!(crafted > 0) && !(used > 0)) return;
      const dayRec = rec.days[today] || (rec.days[today] = {
        t: {}
      });
      const cur = dayRec.t[tool] || {};
      const next = {};
      const c = r2((cur.c || 0) + crafted);
      const x = r2((cur.x || 0) + (used > 0 ? used : 0));
      if (c > 0) next.c = c;
      if (x > 0) next.x = x;
      dayRec.t[tool] = next;
    });
    TOOLS.forEach((tool) => {
      rec.ctr[tool] = counters[tool];
    });
  }
  const snapDay = rec.days[today] || (rec.days[today] = {
    t: {}
  });
  snapDay.i = {
    at: now,
    v: res
  };
  saveLocal(fid, rec);
}
function freezeOpen(farmId, list) {
  const rec = loadLocal(farmId);
  if (!rec.open || rec.open.f) return;
  const entry = (list || []).find((e) => e && e.day === rec.open.day);
  const a = {};
  const u = {};
  if (entry && entry.totals) {
    RES.forEach((res) => {
      const e = entry.totals[res];
      if (e && e.a > 0) a[res] = r2(e.a);
    });
    TOOLS.forEach((tool) => {
      if (!TOOL_GROUP[tool]) return;
      const e = entry.totals[TOOL_GROUP[tool]];
      if (e && e.k === "node" && e.tl > 0) u[tool] = r2(e.tl);
    });
  }
  rec.open.a = a;
  rec.open.u = u;
  rec.open.f = 1;
  saveLocal(farmId, rec);
}
var pushing = false;
var pushAgain = false;
async function postChunk(farmId, days) {
  const res = await harvestLogRequest("/crafted", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      farmId,
      days
    })
  });
  return res.status < 300;
}
async function craftedToolsPush(farmId) {
  const fid = String(farmId || "");
  if (!FARM_RE.test(fid)) return;
  if (pushing) {
    pushAgain = true;
    return;
  }
  pushing = true;
  try {
    do {
      pushAgain = false;
      const cache = loadCache(fid);
      try {
        await refreshCache(fid, cache);
      } catch (e) {
      }
      const list = await harvestLogLoadDays(fid);
      freezeOpen(fid, list);
      const ledger = computeLedger(list, craftFacts(fid, cache));
      view = ledger;
      const oldest = utcDay(Date.now() - SEND_WINDOW_DAYS * 864e5);
      const send = Object.keys(ledger.final).filter((day) => day >= oldest && canon(cache.days[day] || null) !== canon(ledger.final[day])).sort();
      for (let i = 0; i < send.length; i += SEND_CHUNK) {
        const chunk = {};
        send.slice(i, i + SEND_CHUNK).forEach((day) => {
          chunk[day] = ledger.final[day];
        });
        let ok = false;
        try {
          ok = await postChunk(fid, chunk);
        } catch (e) {
          ok = false;
        }
        if (!ok) break;
        Object.keys(chunk).forEach((day) => {
          cache.days[day] = chunk[day];
        });
        saveCache(cache);
      }
    } while (pushAgain);
  } finally {
    pushing = false;
  }
}
function craftedToolsPrepare(list, farmId) {
  const fid = String(farmId || "");
  if (!FARM_RE.test(fid)) {
    view = emptyView();
    return view.sig;
  }
  view = computeLedger(list, craftFacts(fid, loadCache(fid)));
  return view.sig;
}
function craftedToolsViewFor(day) {
  const rec = view.final[day];
  if (!rec || !rec.t) return null;
  const tools = TOOLS.filter((name) => rec.t[name] && rec.t[name].c > 0).map((name) => ({
    name,
    c: rec.t[name].c
  }));
  if (!tools.length) return null;
  const own = {};
  const r = rec.r || {};
  Object.keys(r).forEach((res) => {
    const amount = r[res] && Number(r[res][day]);
    if (amount > 0) own[res] = amount;
  });
  return {
    tools,
    own
  };
}
function toolItemHtml(name, qty) {
  return `<div class="ct-tool"><span class="ct-qty">\xD7${fmtQty(qty)}</span><span class="ct-ico">${getIcon(name)}</span><span class="ct-name">${esc(name)}</span></div>`;
}
function lotLabel(key) {
  if (key === "o") return "Before tracking";
  if (key === "x") return "Other";
  return dateLabel(key);
}
function lotsHtml(lots) {
  if (!lots.length) return `<div class="ct-empty">No balance recorded yet.</div>`;
  const rows = lots.slice().reverse().map((l) => `<div class="ct-lot-row"><span>${esc(lotLabel(l.key))}</span><span>${fmtRes(l.acc)}</span><span>${l.used > 0 ? "-" : ""}${fmtRes(l.used)}</span><span>${fmtRes(l.remain)}</span></div>`).join("");
  return `<div class="ct-lots"><div class="ct-lot-row ct-lot-head"><span>Date</span><span>Gained</span><span>Used</span><span>Remain</span></div>${rows}<div class="ct-note">Crafting, sales and other spending use your oldest balance first, then Other, and the harvest of the same day last.</div></div>`;
}
function resourceHtml(name, snap) {
  const balance = snap && typeof snap.res[name] === "number" ? snap.res[name] : null;
  const base = view.resView[name] || [];
  const today = utcDay(Date.now());
  const lots = balance === null ? fitLots(base, -1, today) : fitLots(base, balance, today);
  const shown = balance === null ? lots.reduce((s, l) => s + l.remain, 0) : balance;
  const open = !!ui.open[name];
  return `<div class="ct-res-item guro-frame${open ? " is-open" : ""}"><div class="ct-res-head px-no-frame${open ? " open" : ""}" role="button" tabindex="0" data-ct-res="${esc(name)}" aria-expanded="${open ? "true" : "false"}"><span class="ct-ico">${getIcon(name)}</span><span class="ct-name">${esc(name)}</span><span class="ct-res-bal">${fmtRes(shown)}</span><img class="ct-chev" src="${ICON_DATA["chevron_down.png"]}" alt=""></div>${open ? lotsHtml(lots) : ""}</div>`;
}
function dateHtml(day, rec) {
  const rows = TOOLS.filter((name) => rec.t[name] && rec.t[name].c > 0).map((name) => {
    const c = rec.t[name].c;
    const u = Math.min(rec.t[name].u || 0, c);
    const remain = r2(c - u);
    return `<div class="ct-trow ct-dr"><span class="ct-tcell">${getIcon(name)}<span class="ct-name">${esc(name)}</span></span><span>${fmtQty(c)}</span><span>${u > 0 ? "-" : ""}${fmtQty(u)}</span><span>${fmtQty(remain)}</span></div>`;
  }).join("");
  return `<div class="ct-date guro-frame"><div class="dh-hlog-dayhead"><span class="dh-hlog-date">${esc(dateLabel(day))}</span></div><div class="ct-trow ct-dr ct-thead"><span>Tools</span><span>Quantity</span><span>Used</span><span>Remain</span></div>${rows}</div>`;
}
function render() {
  const host = ui.host;
  if (!host || !host.isConnected) return;
  const farmId = ui.farmId;
  const list = harvestLogCachedDays(farmId);
  craftedToolsPrepare(list, farmId);
  const snap = loadLocal(farmId).snap;
  const today = utcDay(Date.now());
  const invTools = snap ? TOOLS.filter((name) => snap.tools[name] > 0) : [];
  const toolsInv = invTools.length ? `<div class="ct-tools">${invTools.map((name) => toolItemHtml(name, snap.tools[name])).join("")}</div>` : `<div class="ct-empty">${snap ? "No tools in your inventory." : "Sync your farm to see your inventory."}</div>`;
  const resRows = RES.filter((name) => snap && snap.res[name] > 0 || (view.resView[name] || []).length).map((name) => resourceHtml(name, snap)).join("") || `<div class="ct-empty">No resources recorded yet.</div>`;
  const todayRec = view.final[today];
  const todayTools = todayRec ? TOOLS.filter((name) => todayRec.t[name] && todayRec.t[name].c > 0) : [];
  const todayHtml = todayTools.length ? `<div class="ct-tools">${todayTools.map((name) => toolItemHtml(name, todayRec.t[name].c)).join("")}</div>` : `<div class="ct-empty">Nothing crafted today.</div>`;
  const days = Object.keys(view.final).filter((day) => TOOLS.some((name) => view.final[day].t[name] && view.final[day].t[name].c > 0)).sort().reverse();
  const cards = days.slice(0, ui.showCount).map((day) => dateHtml(day, view.final[day])).join("");
  const more = days.length > ui.showCount ? `<div class="dh-hlog-more"><button type="button" class="dh-pop-log-btn" data-ct-more="1">Show more (${days.length - ui.showCount} older)</button></div>` : "";
  const dates = days.length ? `<div class="ct-dates">${cards}</div>${more}` : `<div class="ct-empty">No crafted tools recorded yet. Sync your farm after crafting to start recording.</div>`;
  const inventoryBox = `<div class="pf-box ct-box guro-frame"><div class="pf-title">Inventory</div>${toolsInv}<div class="ct-sub">Resources</div><div class="ct-res">${resRows}</div></div>`;
  const todayBox = `<div class="pf-box ct-box guro-frame"><div class="pf-title">Crafted Today</div>${todayHtml}</div>`;
  host.innerHTML = `<div class="ct-head"><div class="pf-title">Daily Record of Crafted Tools</div><div class="ct-desc">Tools you craft are saved for each UTC day. Crafting, sales and other spending use your oldest balance first, then Other, and the harvest of the same day last. Mining uses your oldest tools first.</div></div><div class="ct-grid"><div class="ct-col">${inventoryBox}</div><div class="ct-col">${todayBox}${dates}</div></div>`;
}
function message(html) {
  const host = ui.host;
  if (host && host.isConnected) host.innerHTML = `<div class="dh-hlog-msg">${html}</div>`;
}
function onHostClick(ev) {
  const res = ev.target.closest("[data-ct-res]");
  if (res) {
    const name = res.getAttribute("data-ct-res");
    ui.open[name] = !ui.open[name];
    render();
    return;
  }
  if (ev.target.closest("[data-ct-more]")) {
    ui.showCount += PAGE_SIZE;
    render();
  }
}
function onHostKey(ev) {
  if (ev.key !== "Enter" && ev.key !== " ") return;
  const res = ev.target.closest("[data-ct-res]");
  if (!res) return;
  ev.preventDefault();
  const name = res.getAttribute("data-ct-res");
  ui.open[name] = !ui.open[name];
  render();
}
async function craftedToolsOpen(host) {
  ui.host = host;
  ui.showCount = PAGE_SIZE;
  const token = ++ui.token;
  host.onclick = onHostClick;
  host.onkeydown = onHostKey;
  const farmId = harvestLogFarmId();
  ui.farmId = farmId;
  if (!farmId) {
    message("Sync your Farm ID first to see your crafted tools.");
    return;
  }
  render();
  try {
    await craftedToolsPush(farmId);
  } catch (e) {
  }
  if (token !== ui.token) return;
  render();
}
function craftedToolsClose() {
  ui.token++;
  ui.host = null;
}
window.addEventListener("guroFarmSaved", () => {
  if (ui.host && ui.host.isConnected) craftedToolsOpen(ui.host);
});

export {
  craftedToolsInit,
  craftedToolsSync,
  craftedToolsTrack,
  craftedToolsPush,
  craftedToolsPrepare,
  craftedToolsViewFor,
  craftedToolsOpen,
  craftedToolsClose
};
