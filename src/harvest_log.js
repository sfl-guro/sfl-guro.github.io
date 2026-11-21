import { dailyHarvestTotals, dailyHarvestOnYield } from "./daily_harvest.js";

import { getIcon, cookFoodIcon } from "./ui.js";

import { ICON_DATA } from "./icon_data.js";

import { FLOWER_ICON, COIN_ICON, COOKING_FOOD_IMAGES } from "./calculator.js";

import { craftedToolsInit, craftedToolsPrepare, craftedToolsViewFor, craftedToolsSync, craftedToolsPush } from "./crafted_tools.js";

const HARVEST_LOG_BASE = "https://sfl-harvest-log.bossweki.workers.dev";

const SENT_KEY = "hl_hlog_sent_v1";

const SETTLE_MS = 1200;

const FALLBACK_MS = 6000;

const REQUEST_TIMEOUT_MS = 8000;

const NODE_ORDER = [ "Wood", "Stone", "Iron", "Gold", "Crimstone", "Oil" ];

const MACHINE_LABEL = "Crop Machine";

const MACHINE_PREFIX = "Crop Machine ";

const KIND_ORDER = {
  node: 0,
  crop: 1,
  fruit: 2,
  greenhouse: 3,
  animal: 4,
  beehive: 5,
  cooking: 6,
  composter: 7,
  cave: 8
};

let pendingFarm = "";

let settleTimer = null;

let fallbackTimer = null;

function loadSent() {
  try {
    const raw = JSON.parse(localStorage.getItem(SENT_KEY) || "null");
    return raw && typeof raw === "object" ? raw : {};
  } catch (e) {
    return {};
  }
}

function saveSent(obj) {
  try {
    localStorage.setItem(SENT_KEY, JSON.stringify(obj));
  } catch (e) {}
}

function fetchWithTimeout(url, opts) {
  const ctrl = typeof AbortController === "function" ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS) : null;
  return fetch(url, Object.assign({}, opts, ctrl ? {
    signal: ctrl.signal
  } : {})).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

const TOOLS_KEY = "hl_hlog_tl_v1";
const APPLY_KEY = "hl_hlog_apply_tools";
const TOOLS_MAX_DAYS = 400;

let applyTools = false;

try {
  applyTools = localStorage.getItem(APPLY_KEY) === "1";
} catch (e) {}

function setApplyTools(on) {
  applyTools = !!on;
  try {
    localStorage.setItem(APPLY_KEY, applyTools ? "1" : "0");
  } catch (e) {}
}

function loadTools(farmId) {
  try {
    const raw = JSON.parse(localStorage.getItem(TOOLS_KEY) || "null");
    if (raw && raw.farm === farmId && raw.days && typeof raw.days === "object") return raw;
  } catch (e) {}
  return {
    farm: farmId,
    days: {}
  };
}

function rememberTools(farmId, data) {
  if (!farmId || !data || !data.totals) return;
  const found = {};
  Object.keys(data.totals).forEach(name => {
    const e = data.totals[name];
    if (e && e.tl > 0) found[name] = e.tl;
  });
  if (!Object.keys(found).length) return;
  const store = loadTools(farmId);
  store.days[data.day] = found;
  const keys = Object.keys(store.days).sort();
  while (keys.length > TOOLS_MAX_DAYS) delete store.days[keys.shift()];
  try {
    localStorage.setItem(TOOLS_KEY, JSON.stringify(store));
  } catch (e) {}
}

function rememberCoins(farmId, data) {
  if (!farmId || !data || !data.day || !data.coins || typeof data.coins !== "object") return;
  const cache = loadCache(farmId);
  const cur = cache.coins[data.day];
  const incoming = data.coins;
  if (cur && cur.e + cur.s > incoming.e + incoming.s) return;
  if (cur && JSON.stringify(cur) === JSON.stringify(incoming)) return;
  cache.coins[data.day] = incoming;
  saveCache(cache);
}

function withLocalTools(list) {
  const farmId = currentFarmId();
  if (!farmId) return list;
  const store = loadTools(farmId);
  return list.map(d => {
    const lt = store.days[d.day];
    if (!lt) return d;
    const totals = Object.assign({}, d.totals);
    let changed = false;
    Object.keys(lt).forEach(name => {
      const e = totals[name];
      if (e && !(e.tl > 0) && lt[name] > 0) {
        totals[name] = Object.assign({}, e, {
          tl: lt[name]
        });
        changed = true;
      }
    });
    return changed ? {
      day: d.day,
      totals: totals,
      coins: d.coins || null
    } : d;
  });
}

const FARM_KEY = "hl_hlog_farm";
const FARM_RE = /^\d{1,20}$/;

export function harvestLogSetFarm(id) {
  id = String(id == null ? "" : id).trim();
  if (!FARM_RE.test(id)) return;
  try {
    localStorage.setItem(FARM_KEY, id);
  } catch (e) {}
}

export function harvestLogRequest(path, opts) {
  return fetchWithTimeout(HARVEST_LOG_BASE + path, opts);
}

export function harvestLogFarmId() {
  return currentFarmId();
}

export function harvestLogCachedDays(farmId) {
  return mergeLocalToday(cacheToList(loadCache(farmId)), farmId);
}

export async function harvestLogLoadDays(farmId) {
  const cache = loadCache(farmId);
  if (!Object.keys(cache.days).length || Date.now() - cache.at >= CACHE_FRESH_MS) {
    try {
      await refreshCache(farmId, cache);
    } catch (e) {}
  }
  return mergeLocalToday(cacheToList(cache), farmId);
}

function currentFarmId() {
  const tries = [];
  try {
    tries.push(localStorage.getItem("hl_farm_panel_id"));
    tries.push(localStorage.getItem(FARM_KEY));
  } catch (e) {}
  const input = document.getElementById("farmPanelIdInput");
  tries.push(input ? input.value : "");
  for (const t of tries) {
    const id = String(t || "").trim();
    if (FARM_RE.test(id)) return id;
  }
  return "";
}

const CHUNK_MAX_CHARS = 20000;

const CHUNK_MAX_GROUPS = 100;

function chunkTotals(totals) {
  const chunks = [];
  let cur = {};
  let size = 0;
  let count = 0;
  Object.keys(totals).forEach(name => {
    const len = name.length + JSON.stringify(totals[name]).length + 6;
    if (count && (size + len > CHUNK_MAX_CHARS || count >= CHUNK_MAX_GROUPS)) {
      chunks.push(cur);
      cur = {};
      size = 0;
      count = 0;
    }
    cur[name] = totals[name];
    size += len;
    count++;
  });
  if (count) chunks.push(cur);
  return chunks;
}

async function pushTotals(trackKey) {
  const keyed = String(trackKey || "").trim();
  const farmId = FARM_RE.test(keyed) ? keyed : currentFarmId();
  if (!farmId) return;
  const data = dailyHarvestTotals(trackKey);
  if (!data || !Object.keys(data.totals).length) return;
  rememberTools(farmId, data);
  rememberCoins(farmId, data);
  const coinSig = data.coins ? [ data.coins.e, data.coins.s ] : null;
  const sig = JSON.stringify([ farmId, data.day, data.totals, coinSig ]);
  const sent = loadSent();
  if (sent.sig === sig) return;
  const postOne = (totals, withCoins) => fetchWithTimeout(HARVEST_LOG_BASE + "/log", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      farmId: farmId,
      day: data.day,
      totals: totals,
      coins: withCoins ? data.coins || undefined : undefined
    })
  });
  const post = async totals => {
    const chunks = chunkTotals(totals);
    let last = null;
    for (let i = 0; i < chunks.length; i++) {
      last = await postOne(chunks[i], i === 0);
      if (!last.ok) return last;
    }
    return last;
  };
  let res = await post(data.totals);
  if (res.status === 400) {
    const plain = {};
    Object.keys(data.totals).forEach(name => {
      const e = Object.assign({}, data.totals[name]);
      delete e.tl;
      plain[name] = e;
    });
    res = await post(plain);
    if (res.status === 400) {
      const legacy = {};
      Object.keys(plain).forEach(name => {
        if (plain[name].k !== "composter" && plain[name].k !== "cave") legacy[name] = plain[name];
      });
      if (Object.keys(legacy).length && Object.keys(legacy).length < Object.keys(plain).length) {
        res = await post(legacy);
        if (res.status < 500) return;
      }
    }
  }
  if (res.status < 500 && res.status !== 413) saveSent({
    sig: sig
  });
}

function flush() {
  clearTimeout(settleTimer);
  clearTimeout(fallbackTimer);
  settleTimer = null;
  fallbackTimer = null;
  const farmId = pendingFarm;
  pendingFarm = "";
  if (!farmId) return;
  pushTotals(farmId).catch(() => {}).finally(() => {
    craftedToolsPush(farmId).catch(() => {});
  });
}

export function harvestLogArm(farmId) {
  if (!farmId) return;
  pendingFarm = String(farmId);
  clearTimeout(settleTimer);
  clearTimeout(fallbackTimer);
  fallbackTimer = setTimeout(flush, FALLBACK_MS);
}

dailyHarvestOnYield(() => {
  if (!pendingFarm) return;
  clearTimeout(settleTimer);
  settleTimer = setTimeout(flush, SETTLE_MS);
});

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmtAmount(n) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function dateLabel(day) {
  return new Date(day + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  });
}

function sortedNames(totals) {
  return Object.keys(totals).sort((a, b) => {
    const ka = KIND_ORDER[totals[a].k] ?? 9;
    const kb = KIND_ORDER[totals[b].k] ?? 9;
    if (ka !== kb) return ka - kb;
    if (ka === 0) return NODE_ORDER.indexOf(a) - NODE_ORDER.indexOf(b);
    return a.localeCompare(b);
  });
}

function fmtFlower(n) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  });
}

function fmtPrice(p) {
  return p.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: p < 0.0001 ? 6 : 4
  });
}

function round4(n) {
  return Math.round(n * 1e4) / 1e4;
}

function netOf(e) {
  if (!(e.p > 0)) return null;
  if (typeof e.n === "number" && isFinite(e.n)) return e.n;
  const fee = e.f > 0 && e.f < 1 ? e.f : 0;
  return round4(round4(e.a * e.p) * (1 - fee));
}

function itemIcon(name, kind) {
  if (kind === "crop" && name === "Golden Sunflower") return getIcon("Gold");
  if (kind === "cave" && name === "Beetle") return getIcon("Green Beetle");
  if (kind === "cooking" && COOKING_FOOD_IMAGES[name]) return cookFoodIcon(name);
  return getIcon(name);
}

function flowerHtml() {
  return `<span class="dh-hlog-fl">${FLOWER_ICON}</span>`;
}

function taxLabel(list) {
  const days = list.slice().sort((a, b) => a.day < b.day ? 1 : a.day > b.day ? -1 : 0);
  for (const d of days) {
    const names = Object.keys(d.totals);
    for (const name of names) {
      const e = d.totals[name];
      if (e && e.p > 0 && e.f > 0) return `${parseFloat((e.f * 100).toFixed(2))}%`;
    }
  }
  return "";
}

function taxNoteHtml(list) {
  const tax = taxLabel(list);
  return `Total Gained and item values are net: Gross − Tax${tax ? ` (current tax ${tax})` : ""}.`;
}

function fmtCount(n) {
  return Number.isInteger(n) ? n.toLocaleString("en-US") : n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function craftedRowsHtml(crafted) {
  const rows = crafted.tools.map(t => `<div class="dh-hlog-row"><span class="dh-hlog-amt">×${fmtCount(t.c)}</span><span class="dh-hlog-ico">${getIcon(t.name)}</span><span class="dh-hlog-name">${esc(t.name)}</span></div>`).join("");
  return `<div class="dh-hlog-crafted"><div class="dh-hlog-crafted-label">Crafted Tools</div>${rows}</div>`;
}

function totalsAfterTools(totals, used) {
  const out = Object.assign({}, totals);
  Object.keys(used).forEach(name => {
    const e = out[name];
    if (!e) return;
    const left = Math.round((e.a - Math.min(used[name], e.a)) * 100) / 100;
    if (!(left > 0)) {
      delete out[name];
      return;
    }
    const adjusted = Object.assign({}, e, {
      a: left
    });
    delete adjusted.n;
    delete adjusted.g;
    out[name] = adjusted;
  });
  return out;
}

function signed(n, fmt) {
  return `${n < 0 ? "-" : "+"}${fmt(Math.abs(n))}`;
}

function coinsHtml(c) {
  if (!c || !(c.e > 0 || c.s > 0)) return "";
  const mark = c.est ? "~" : "";
  const net = c.e - c.s;
  const ico = `<span class="dh-hlog-coin-ico">${COIN_ICON}</span>`;
  const row = (label, value, cls) => `<div class="dh-hlog-coin-row"><span>${label}</span><span class="dh-hlog-coin-val${cls ? ` ${cls}` : ""}">${value}${ico}</span></div>`;
  const balance = typeof c.b === "number" && isFinite(c.b) ? row("Balance", fmtAmount(c.b), "") : "";
  return `<div class="dh-hlog-coins">${balance}${row("Earned Coins", `${mark}+${fmtAmount(c.e)}`, "pos")}${row("Spend Coins", `${mark}-${fmtAmount(c.s)}`, "neg")}${row("Net", `${mark}${signed(net, fmtAmount)}`, net < 0 ? "neg" : "pos")}</div>`;
}

const foldState = {
  popup: {},
  inline: {}
};

function foldOpen(fold) {
  const v = foldState[fold.ctx][fold.key];
  return v === undefined ? fold.def : v;
}

function dayHtml(entry, number, ctx) {
  return cardHtml(entry, number, dateLabel(entry.day), craftedToolsViewFor(entry.day), false, {
    ctx: ctx,
    key: "day:" + entry.day,
    def: entry.day === utcToday()
  });
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function pad2(n) {
  return n < 10 ? "0" + n : String(n);
}

function daysInMonth(y, m) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function periodKey(day, mode) {
  const ym = day.slice(0, 7);
  if (mode === "month") return ym;
  return ym + "-" + Math.floor((Number(day.slice(8, 10)) - 1) / 7);
}

function periodRange(key, mode) {
  const y = Number(key.slice(0, 4));
  const m = Number(key.slice(5, 7));
  const dim = daysInMonth(y, m);
  const prefix = key.slice(0, 7) + "-";
  if (mode === "month") return {
    start: prefix + "01",
    end: prefix + pad2(dim)
  };
  const w = Number(key.slice(8));
  return {
    start: prefix + pad2(w * 7 + 1),
    end: prefix + pad2(Math.min(w * 7 + 7, dim))
  };
}

function periodLabel(range, mode) {
  const start = new Date(range.start + "T00:00:00Z");
  const month = start.toLocaleDateString("en-US", {
    month: "long",
    timeZone: "UTC"
  });
  const year = range.start.slice(0, 4);
  if (mode === "month") return `${month} ${year}`;
  return `${month} ${Number(range.start.slice(8))} – ${Number(range.end.slice(8))}, ${year}`;
}

function daySpan(from, to) {
  return Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86400000) + 1;
}

function buildPeriod(group, mode, today) {
  const range = periodRange(group.key, mode);
  const acc = {};
  const toolQty = {};
  const own = {};
  const coins = {
    e: 0,
    s: 0,
    est: false
  };
  let hasCoins = false;
  let hasCrafted = false;
  let logged = 0;
  group.days.forEach(d => {
    if (Object.keys(d.totals).length) logged++;
    const ct = craftedToolsViewFor(d.day);
    const dayView = applyTools && ct ? totalsAfterTools(d.totals, ct.own) : d.totals;
    if (ct) {
      hasCrafted = true;
      ct.tools.forEach(t => {
        toolQty[t.name] = round2((toolQty[t.name] || 0) + t.c);
      });
      Object.keys(ct.own).forEach(res => {
        own[res] = round2((own[res] || 0) + ct.own[res]);
      });
    }
    Object.keys(dayView).forEach(name => {
      const e = dayView[name];
      const a = acc[name] || (acc[name] = {
        k: e.k,
        a: 0,
        c: 0,
        tl: 0,
        pa: 0,
        gross: 0,
        net: 0
      });
      a.k = e.k;
      a.a += e.a;
      a.c += e.c || 0;
      a.tl += e.tl || 0;
      const n = netOf(e);
      if (n !== null) {
        a.pa += e.a;
        a.gross += e.a * e.p;
        a.net += n;
      }
    });
    if (d.coins && (d.coins.e > 0 || d.coins.s > 0)) {
      hasCoins = true;
      coins.e += d.coins.e || 0;
      coins.s += d.coins.s || 0;
      if (d.coins.est) coins.est = true;
    }
  });
  const totals = {};
  Object.keys(acc).forEach(name => {
    const a = acc[name];
    const entry = {
      k: a.k,
      a: round2(a.a)
    };
    if (a.c > 0) entry.c = a.c;
    if (a.tl > 0) entry.tl = round2(a.tl);
    if (a.pa > 0 && a.gross > 0) {
      entry.p = Math.round(a.gross / a.pa * 1e6) / 1e6;
      entry.f = 0;
      entry.n = round4(a.net);
    }
    totals[name] = entry;
  });
  const expected = daySpan(range.start, range.end < today ? range.end : today);
  const note = logged < expected ? `<span class="dh-hlog-span">${logged} of ${expected} days</span>` : "";
  const crafted = hasCrafted ? {
    tools: Object.keys(toolQty).map(name => ({
      name: name,
      c: toolQty[name]
    })),
    own: own
  } : null;
  return {
    sortKey: range.start,
    mode: mode,
    current: range.start <= today && range.end >= today,
    head: esc(periodLabel(range, mode)) + note,
    totals: totals,
    coins: hasCoins ? (coins.est ? coins : {
      e: coins.e,
      s: coins.s
    }) : null,
    crafted: crafted
  };
}

function aggregateEntries(list, mode) {
  const today = utcToday();
  const groups = {};
  list.forEach(d => {
    if (!d || !d.day || !d.totals) return;
    const key = periodKey(d.day, mode);
    (groups[key] || (groups[key] = {
      key: key,
      days: []
    })).days.push(d);
  });
  return Object.keys(groups).map(key => buildPeriod(groups[key], mode, today)).sort((a, b) => a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : 0);
}

function utcToday() {
  return new Date().toISOString().slice(0, 10);
}

function periodHtml(entry, number, ctx) {
  return cardHtml(entry, number, entry.head, entry.crafted, true, {
    ctx: ctx,
    key: entry.mode + ":" + entry.sortKey,
    def: entry.current
  });
}

function cardHtml(entry, number, head, crafted, preApplied, fold) {
  const open = foldOpen(fold);
  let totalNet = 0;
  const showCrafted = applyTools && !!crafted;
  const view = showCrafted && !preApplied ? totalsAfterTools(entry.totals, crafted.own) : entry.totals;
  const isMachineName = name => view[name].k === "crop" && name.startsWith(MACHINE_PREFIX);
  const rowFor = name => {
    const e = view[name];
    const shown = isMachineName(name) ? name.slice(MACHINE_PREFIX.length) : name;
    const net = netOf(e);
    if (net !== null) totalNet += net;
    const value = net !== null ? `<span class="dh-hlog-val"><span class="dh-hlog-price">(${fmtPrice(e.p)}${flowerHtml()}/U)</span><span class="dh-hlog-net">(${signed(net, fmtFlower)}${flowerHtml()})</span></span>` : "";
    const count = e.c > 0 ? `<span class="dh-hlog-count"><span class="dh-hlog-h" role="button" tabindex="0" data-dh-h="1" aria-label="${e.k === "cooking" || e.k === "composter" ? "Collected" : "Harvested"}">${e.k === "cooking" || e.k === "composter" ? "C" : "H"}<span class="dh-hlog-tip">${e.k === "cooking" || e.k === "composter" ? "Collected" : "Harvested"}</span></span>${e.c}x</span>` : "";
    return `<div class="dh-hlog-row"><span class="dh-hlog-amt">${signed(e.a, fmtAmount)}</span><span class="dh-hlog-ico">${itemIcon(shown, e.k)}</span><span class="dh-hlog-name">${esc(shown)}</span>${value}${count}</div>`;
  };
  const orderedNames = sortedNames(view);
  const plainNames = orderedNames.filter(name => !isMachineName(name));
  const machineNames = orderedNames.filter(isMachineName);
  const machineBlock = machineNames.length ? `<div class="dh-hlog-crafted-label">${MACHINE_LABEL}</div>${machineNames.map(rowFor).join("")}` : "";
  const rows = plainNames.map(rowFor).join("") + machineBlock;
  const toolBtn = crafted ? `<button type="button" class="fd-lb-tab dh-hlog-craftbtn guro-frame${applyTools ? " active" : ""}" data-dh-tools="1" aria-pressed="${applyTools ? "true" : "false"}">Crafted Tools</button>` : "";
  const craftedBlock = showCrafted ? craftedRowsHtml(crafted) : "";
  const total = totalNet > 0 || crafted ? `<div class="dh-hlog-gain${toolBtn ? " dh-hlog-gain-tools" : ""}">${toolBtn}<span class="dh-hlog-gain-sum"><span>Total Gained:</span><span class="dh-hlog-gain-val">${signed(totalNet, n => n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }))}${flowerHtml()}</span></span></div>` : "";
  const coinsBlock = coinsHtml(entry.coins);
  const sumBox = total || coinsBlock ? `<div class="dh-hlog-sumbox">${total}${coinsBlock}</div>` : "";
  return `<div class="dh-hlog-day guro-frame"><div class="dh-hlog-dayhead dh-hlog-fold" role="button" tabindex="0" data-dh-fold="${esc(fold.key)}" data-dh-fold-ctx="${fold.ctx}" aria-expanded="${open ? "true" : "false"}"><span class="dh-hlog-no">#${number}</span><span class="dh-hlog-date">${head}</span><img class="ct-chev dh-hlog-chev${open ? " open" : ""}" src="${ICON_DATA["chevron_down.png"]}" alt=""></div>${sumBox}${open ? `${craftedBlock}<div class="dh-hlog-rows">${rows}</div>` : ""}</div>`;
}

function mergeLocalToday(days, farmId) {
  return withLocalTools(mergeToday(days, farmId));
}

function mergeToday(days, farmId) {
  const local = dailyHarvestTotals(farmId);
  if (!local || !Object.keys(local.totals).length) return days;
  const out = days.map(d => ({
    day: d.day,
    totals: Object.assign({}, d.totals),
    coins: d.coins || null
  }));
  let today = out.find(d => d.day === local.day);
  if (!today) {
    today = {
      day: local.day,
      totals: {},
      coins: null
    };
    out.push(today);
  }
  if (local.coins && (!today.coins || local.coins.e + local.coins.s >= today.coins.e + today.coins.s)) today.coins = local.coins;
  Object.keys(local.totals).forEach(name => {
    const cur = today.totals[name];
    const loc = local.totals[name];
    if (!cur) {
      today.totals[name] = Object.assign({}, loc);
      return;
    }
    const lv = loc.v || 0;
    const cv = cur.v || 0;
    if (lv > cv) {
      today.totals[name] = Object.assign({}, loc);
      return;
    }
    if (lv < cv) return;
    const a = Math.max(cur.a, loc.a);
    const c = Math.max(cur.c || 0, loc.c || 0);
    const tl = Math.max(cur.tl || 0, loc.tl || 0);
    const next = {
      k: loc.a > cur.a ? loc.k : cur.k,
      a: a
    };
    if (c > 0) next.c = c;
    if (tl > 0) next.tl = tl;
    if (cv > 0) next.v = cv;
    const src = loc.p > 0 ? loc : cur;
    if (src.p > 0) {
      next.p = src.p;
      next.f = src.f || 0;
    }
    today.totals[name] = next;
  });
  return out;
}

const CACHE_KEY = "hl_hlog_cache_v1";
const CACHE_FRESH_MS = 60000;
const CACHE_MAX_DAYS = 400;

function loadCache(farmId) {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (c && c.farm === farmId && c.days && typeof c.days === "object") {
      if (!c.coins || typeof c.coins !== "object") c.coins = {};
      return c;
    }
  } catch (e) {}
  return {
    farm: farmId,
    days: {},
    coins: {},
    at: 0
  };
}

function saveCache(c) {
  const keys = Object.keys(c.days).sort();
  while (keys.length > CACHE_MAX_DAYS) {
    const old = keys.shift();
    delete c.days[old];
    if (c.coins) delete c.coins[old];
  }
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch (e) {}
}

async function fetchDays(farmId) {
  const url = HARVEST_LOG_BASE + "/log?farm=" + encodeURIComponent(farmId);
  const res = await fetchWithTimeout(url, {
    cache: "no-store"
  });
  if (!res.ok) throw new Error("bad_response_" + res.status);
  const json = await res.json();
  return Array.isArray(json.days) ? json.days : [];
}

async function refreshCache(farmId, cache) {
  const days = await fetchDays(farmId);
  let changed = false;
  days.forEach(d => {
    if (!d || !d.day || !d.totals) return;
    const old = JSON.stringify(cache.days[d.day] || null);
    const nu = JSON.stringify(d.totals);
    if (old !== nu) {
      cache.days[d.day] = d.totals;
      changed = true;
    }
    if (d.coins && typeof d.coins === "object" && JSON.stringify(cache.coins[d.day] || null) !== JSON.stringify(d.coins)) {
      cache.coins[d.day] = d.coins;
      changed = true;
    }
  });
  cache.at = Date.now();
  saveCache(cache);
  return changed;
}

function cacheToList(cache) {
  return Object.keys(cache.days).map(day => ({
    day: day,
    totals: cache.days[day],
    coins: cache.coins && cache.coins[day] ? cache.coins[day] : null
  }));
}

const PERIODS = [ {
  id: "day",
  label: "Day",
  sub: "Total harvested per UTC day, newest first. Saved from your Farm ID syncs."
}, {
  id: "week",
  label: "Week",
  sub: "Total harvested per UTC week (days 1-7, 8-14, 15-21, 22-28, 29-end of each month), newest first. Built from your daily logs."
}, {
  id: "month",
  label: "Month",
  sub: "Total harvested per UTC month, newest first. Built from your daily logs."
} ];

let period = "day";

function syncPeriodUi() {
  const layer = document.getElementById("dhLogLayer");
  if (!layer) return;
  layer.querySelectorAll("[data-dh-period]").forEach(btn => {
    const on = btn.getAttribute("data-dh-period") === period;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
  });
  const sub = document.getElementById("dhLogSub");
  const cur = PERIODS.find(p => p.id === period);
  if (sub && cur) sub.textContent = cur.sub;
}

function setPeriod(next) {
  if (next === period || !PERIODS.some(p => p.id === next)) return;
  period = next;
  showCount = PAGE_SIZE;
  syncPeriodUi();
  renderedSig = "";
  rerender();
  const body = document.getElementById("dhLogBody");
  if (body) body.scrollTop = 0;
}

function ensureLayer() {
  let layer = document.getElementById("dhLogLayer");
  if (layer) return layer;
  layer = document.createElement("div");
  layer.id = "dhLogLayer";
  layer.innerHTML = `<div class="dh-log-outer guro-frame" role="dialog" aria-modal="true"><button type="button" class="guro-reward-close" id="dhLogClose" aria-label="Close"><img src="${ICON_DATA["close.png"]}" alt="Close"></button><div class="dh-hlog-title">Daily Harvest History Log</div><div class="dh-hlog-sub" id="dhLogSub"></div><div class="dh-hlog-tax" id="dhLogTax"></div><div class="dh-hlog-periods" id="dhLogPeriods">${PERIODS.map(p => `<button type="button" class="fd-lb-tab dh-hlog-craftbtn guro-frame" data-dh-period="${p.id}" aria-pressed="false">${p.label}</button>`).join("")}</div><div class="dh-hlog-body" id="dhLogBody"></div></div>`;
  document.body.appendChild(layer);
  layer.addEventListener("click", ev => {
    const hBadge = ev.target.closest("[data-dh-h]");
    layer.querySelectorAll(".dh-hlog-h.open").forEach(el => {
      if (el !== hBadge) el.classList.remove("open");
    });
    if (hBadge) {
      hBadge.classList.toggle("open");
      return;
    }
    const pBtn = ev.target.closest("[data-dh-period]");
    if (pBtn) {
      setPeriod(pBtn.getAttribute("data-dh-period"));
      return;
    }
    if (ev.target === layer || ev.target.closest("#dhLogClose")) closeLog();
    if (ev.target.closest("[data-dh-more]")) {
      showCount += PAGE_SIZE;
      rerender();
      return;
    }
    if (ev.target.closest("[data-dh-retry]")) openLog(layer.getAttribute("data-farm") || "");
  });
  return layer;
}

function closeLog() {
  const layer = document.getElementById("dhLogLayer");
  if (layer) layer.classList.remove("show");
}

let openToken = 0;
let renderedSig = "";
const PAGE_SIZE = 30;
let showCount = PAGE_SIZE;
let lastList = [];
let lastNotice = "";

function renderList(body, list, notice) {
  lastList = list;
  lastNotice = notice;
  if (!list.length) return false;
  const craftedSig = craftedToolsPrepare(list, currentFarmId());
  const sig = JSON.stringify([ notice, showCount, applyTools, craftedSig, period, foldState.popup, list ]);
  const taxEl = document.getElementById("dhLogTax");
  if (taxEl) taxEl.textContent = taxNoteHtml(list);
  if (sig === renderedSig && body.childElementCount) return true;
  const asc = list.slice().sort((a, b) => a.day < b.day ? -1 : a.day > b.day ? 1 : 0);
  const cards = period === "day" ? asc.map((entry, i) => dayHtml(entry, i + 1, "popup")).reverse() : aggregateEntries(asc, period).map((entry, i) => periodHtml(entry, i + 1, "popup")).reverse();
  const more = cards.length > showCount ? `<div class="dh-hlog-more"><button type="button" class="dh-pop-log-btn" data-dh-more="1">Show more (${cards.length - showCount} older)</button></div>` : "";
  body.innerHTML = (notice ? `<div class="dh-hlog-msg">${notice}</div>` : "") + cards.slice(0, showCount).join("") + more;
  renderedSig = sig;
  return true;
}

function rerender() {
  const body = document.getElementById("dhLogBody");
  if (!body) return;
  const top = body.scrollTop;
  renderList(body, lastList, lastNotice);
  body.scrollTop = top;
}

async function openLog(trackKey) {
  const farmId = currentFarmId();
  const layer = ensureLayer();
  const body = document.getElementById("dhLogBody");
  period = "day";
  foldState.popup = {};
  renderedSig = "";
  syncPeriodUi();
  layer.setAttribute("data-farm", trackKey || "");
  layer.classList.add("show");
  if (!farmId) {
    renderedSig = "";
    body.innerHTML = `<div class="dh-hlog-msg">Sync your Farm ID first to see your history.</div>`;
    return;
  }
  const token = ++openToken;
  showCount = PAGE_SIZE;
  body.scrollTop = 0;
  craftedToolsSync(farmId).then(changed => {
    if (changed && token === openToken) {
      renderedSig = "";
      rerender();
    }
  });
  const cache = loadCache(farmId);
  const hasCache = Object.keys(cache.days).length > 0;
  if (hasCache) {
    renderList(body, mergeLocalToday(cacheToList(cache), trackKey), "");
    if (Date.now() - cache.at < CACHE_FRESH_MS) return;
  } else {
    renderedSig = "";
    body.innerHTML = `<div class="dh-hlog-msg">Loading…</div>`;
  }
  try {
    await refreshCache(farmId, cache);
  } catch (e) {
    if (token !== openToken) return;
    if (hasCache) return;
    const local = mergeLocalToday([], trackKey);
    if (!renderList(body, local, "Offline: showing today only.")) {
      renderedSig = "";
      body.innerHTML = `<div class="dh-hlog-msg">Couldn't load history. Check your connection.<br><button type="button" class="dh-pop-log-btn" data-dh-retry="1">Retry</button></div>`;
    }
    return;
  }
  if (token !== openToken) return;
  const list = mergeLocalToday(cacheToList(cache), trackKey);
  if (!renderList(body, list, "")) {
    renderedSig = "";
    body.innerHTML = `<div class="dh-hlog-msg">No history yet. Sync your farm to start recording.</div>`;
  }
}

const inlineState = {
  period: "day",
  host: null,
  token: 0,
  showCount: PAGE_SIZE,
  list: [],
  notice: ""
};

function inlineRender() {
  const host = inlineState.host;
  if (!host || !host.isConnected) return;
  const list = inlineState.list;
  craftedToolsPrepare(list, currentFarmId());
  const asc = list.slice().sort((a, b) => a.day < b.day ? -1 : a.day > b.day ? 1 : 0);
  const mode = inlineState.period;
  const cards = mode === "day" ? asc.map((entry, i) => dayHtml(entry, i + 1, "inline")).reverse() : aggregateEntries(asc, mode).map((entry, i) => periodHtml(entry, i + 1, "inline")).reverse();
  const periodBtns = `<div class="dh-hlog-periods">${PERIODS.map(p => `<button type="button" class="fd-lb-tab dh-hlog-craftbtn guro-frame${p.id === mode ? " active" : ""}" data-pf-hperiod="${p.id}" aria-pressed="${p.id === mode ? "true" : "false"}">${p.label}</button>`).join("")}</div>`;
  const more = cards.length > inlineState.showCount ? `<div class="dh-hlog-more"><button type="button" class="dh-pop-log-btn" data-pf-hmore="1">Show more (${cards.length - inlineState.showCount} older)</button></div>` : "";
  host.innerHTML = `<div class="dh-hlog-tax">${taxNoteHtml(list)}</div>` + periodBtns + (inlineState.notice ? `<div class="dh-hlog-msg">${inlineState.notice}</div>` : "") + `<div class="pf-hlog-grid">${cards.slice(0, inlineState.showCount).join("")}</div>` + more;
}

function inlineMessage(html) {
  const host = inlineState.host;
  if (host && host.isConnected) host.innerHTML = `<div class="dh-hlog-msg">${html}</div>`;
}

export function harvestLogInlineMore() {
  inlineState.showCount += PAGE_SIZE;
  inlineRender();
}

export function harvestLogInlinePeriod(next) {
  if (next === inlineState.period || !PERIODS.some(p => p.id === next)) return;
  inlineState.period = next;
  inlineState.showCount = PAGE_SIZE;
  inlineRender();
}

export function harvestLogInlineClose() {
  inlineState.token++;
  inlineState.host = null;
}

export async function harvestLogInlineOpen(host) {
  inlineState.host = host;
  inlineState.period = "day";
  foldState.inline = {};
  inlineState.showCount = PAGE_SIZE;
  const token = ++inlineState.token;
  const farmId = currentFarmId();
  if (!farmId) {
    inlineMessage("Sync your Farm ID first to see your history.");
    return;
  }
  craftedToolsSync(farmId).then(changed => {
    if (changed && token === inlineState.token) inlineRender();
  });
  const cache = loadCache(farmId);
  const hasCache = Object.keys(cache.days).length > 0;
  if (hasCache) {
    inlineState.list = mergeLocalToday(cacheToList(cache), farmId);
    inlineState.notice = "";
    inlineRender();
    if (Date.now() - cache.at < CACHE_FRESH_MS) return;
  } else {
    inlineMessage("Loading…");
  }
  try {
    await refreshCache(farmId, cache);
  } catch (e) {
    if (token !== inlineState.token || hasCache) return;
    const local = mergeLocalToday([], farmId);
    if (local.length) {
      inlineState.list = local;
      inlineState.notice = "Offline: showing today only.";
      inlineRender();
    } else {
      inlineMessage(`Couldn't load history. Check your connection.<br><button type="button" class="dh-pop-log-btn" data-pf-hretry="1">Retry</button>`);
    }
    return;
  }
  if (token !== inlineState.token) return;
  const list = mergeLocalToday(cacheToList(cache), farmId);
  if (!list.length) {
    inlineMessage("No history yet. Sync your farm to start recording.");
    return;
  }
  inlineState.list = list;
  inlineState.notice = "";
  inlineRender();
}

document.addEventListener("click", ev => {
  const btn = ev.target && ev.target.closest ? ev.target.closest("[data-dh-tools]") : null;
  if (!btn) return;
  ev.stopPropagation();
  ev.preventDefault();
  setApplyTools(!applyTools);
  rerender();
  inlineRender();
}, true);

function toggleFold(head) {
  const ctx = head.getAttribute("data-dh-fold-ctx");
  const key = head.getAttribute("data-dh-fold");
  if (!foldState[ctx]) return;
  const cur = head.getAttribute("aria-expanded") === "true";
  foldState[ctx][key] = !cur;
  if (ctx === "popup") rerender();
  else inlineRender();
}

document.addEventListener("click", ev => {
  const head = ev.target && ev.target.closest ? ev.target.closest("[data-dh-fold]") : null;
  if (!head) return;
  ev.stopPropagation();
  toggleFold(head);
}, true);

document.addEventListener("keydown", ev => {
  if (ev.key !== "Enter" && ev.key !== " ") return;
  const head = ev.target && ev.target.closest ? ev.target.closest("[data-dh-fold]") : null;
  if (!head) return;
  ev.preventDefault();
  toggleFold(head);
}, true);

document.addEventListener("dh-open-log", ev => {
  openLog(ev && ev.detail && ev.detail.farm ? String(ev.detail.farm) : "");
});

window.addEventListener("keydown", ev => {
  if (ev.key !== "Escape") return;
  const layer = document.getElementById("dhLogLayer");
  if (!layer || !layer.classList.contains("show")) return;
  ev.stopPropagation();
  closeLog();
}, true);

craftedToolsInit({
  getIcon: name => getIcon(name),
  request: (path, opts) => harvestLogRequest(path, opts),
  farmId: () => harvestLogFarmId(),
  cachedDays: farmId => harvestLogCachedDays(farmId),
  loadDays: farmId => harvestLogLoadDays(farmId)
});
