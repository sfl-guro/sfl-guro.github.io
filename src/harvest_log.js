import { dailyHarvestTotals, dailyHarvestOnYield } from "./daily_harvest.js";

import { getIcon, cookFoodIcon } from "./ui.js";

import { ICON_DATA } from "./icon_data.js";

import { FLOWER_ICON, COOKING_FOOD_IMAGES } from "./calculator.js";

const HARVEST_LOG_BASE = "https://sfl-harvest-log.bossweki.workers.dev";

const SENT_KEY = "hl_hlog_sent_v1";

const SETTLE_MS = 1200;

const FALLBACK_MS = 6000;

const REQUEST_TIMEOUT_MS = 8000;

const NODE_ORDER = [ "Wood", "Stone", "Iron", "Gold", "Crimstone", "Oil" ];

const KIND_ORDER = {
  node: 0,
  crop: 1,
  fruit: 2,
  greenhouse: 3,
  animal: 4,
  beehive: 5,
  cooking: 6,
  composter: 7
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

const FARM_KEY = "hl_hlog_farm";
const FARM_RE = /^\d{1,20}$/;

export function harvestLogSetFarm(id) {
  id = String(id == null ? "" : id).trim();
  if (!FARM_RE.test(id)) return;
  try {
    localStorage.setItem(FARM_KEY, id);
  } catch (e) {}
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

async function pushTotals(trackKey) {
  const keyed = String(trackKey || "").trim();
  const farmId = FARM_RE.test(keyed) ? keyed : currentFarmId();
  if (!farmId) return;
  const data = dailyHarvestTotals(trackKey);
  if (!data || !Object.keys(data.totals).length) return;
  const sig = JSON.stringify([ farmId, data.day, data.totals ]);
  const sent = loadSent();
  if (sent.sig === sig) return;
  const post = totals => fetchWithTimeout(HARVEST_LOG_BASE + "/log", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      farmId: farmId,
      day: data.day,
      totals: totals
    })
  });
  let res = await post(data.totals);
  if (res.status === 400) {
    const legacy = {};
    Object.keys(data.totals).forEach(name => {
      if (data.totals[name].k !== "composter") legacy[name] = data.totals[name];
    });
    if (Object.keys(legacy).length && Object.keys(legacy).length < Object.keys(data.totals).length) {
      res = await post(legacy);
      if (res.status < 500) return;
    }
  }
  if (res.status < 500) saveSent({
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
  pushTotals(farmId).catch(() => {});
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

function dayHtml(entry, number) {
  let totalNet = 0;
  const rows = sortedNames(entry.totals).map(name => {
    const e = entry.totals[name];
    const net = netOf(e);
    if (net !== null) totalNet += net;
    const value = net !== null ? `<span class="dh-hlog-val"><span class="dh-hlog-price">(${fmtPrice(e.p)}${flowerHtml()}/U)</span><span class="dh-hlog-net">(+${fmtFlower(net)}${flowerHtml()})</span></span>` : "";
    const count = e.c > 0 ? `<span class="dh-hlog-count"><span class="dh-hlog-h" role="button" tabindex="0" data-dh-h="1" aria-label="${e.k === "cooking" || e.k === "composter" ? "Collected" : "Harvested"}">${e.k === "cooking" || e.k === "composter" ? "C" : "H"}<span class="dh-hlog-tip">${e.k === "cooking" || e.k === "composter" ? "Collected" : "Harvested"}</span></span>${e.c}x</span>` : "";
    return `<div class="dh-hlog-row"><span class="dh-hlog-amt">+${fmtAmount(e.a)}</span><span class="dh-hlog-ico">${itemIcon(name, e.k)}</span><span class="dh-hlog-name">${esc(name)}</span>${value}${count}</div>`;
  }).join("");
  const total = totalNet > 0 ? `<div class="dh-hlog-gain"><span>Total Gained:</span><span class="dh-hlog-gain-val">+${totalNet.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}${flowerHtml()}</span></div>` : "";
  return `<div class="dh-hlog-day guro-frame"><div class="dh-hlog-dayhead"><span class="dh-hlog-no">#${number}</span><span class="dh-hlog-date">${dateLabel(entry.day)}</span></div>${rows}${total}</div>`;
}

function mergeLocalToday(days, farmId) {
  const local = dailyHarvestTotals(farmId);
  if (!local || !Object.keys(local.totals).length) return days;
  const out = days.map(d => ({
    day: d.day,
    totals: Object.assign({}, d.totals)
  }));
  let today = out.find(d => d.day === local.day);
  if (!today) {
    today = {
      day: local.day,
      totals: {}
    };
    out.push(today);
  }
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
    const next = {
      k: loc.a > cur.a ? loc.k : cur.k,
      a: a
    };
    if (c > 0) next.c = c;
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
    if (c && c.farm === farmId && c.days && typeof c.days === "object") return c;
  } catch (e) {}
  return {
    farm: farmId,
    days: {},
    at: 0
  };
}

function saveCache(c) {
  const keys = Object.keys(c.days).sort();
  while (keys.length > CACHE_MAX_DAYS) delete c.days[keys.shift()];
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
  });
  cache.at = Date.now();
  saveCache(cache);
  return changed;
}

function cacheToList(cache) {
  return Object.keys(cache.days).map(day => ({
    day: day,
    totals: cache.days[day]
  }));
}

function ensureLayer() {
  let layer = document.getElementById("dhLogLayer");
  if (layer) return layer;
  layer = document.createElement("div");
  layer.id = "dhLogLayer";
  layer.innerHTML = `<div class="dh-log-outer guro-frame" role="dialog" aria-modal="true"><button type="button" class="guro-reward-close" id="dhLogClose" aria-label="Close"><img src="${ICON_DATA["close.png"]}" alt="Close"></button><div class="dh-hlog-title">Daily Harvest History Log</div><div class="dh-hlog-sub">Total harvested per UTC day, newest first. Saved from your Farm ID syncs.</div><div class="dh-hlog-tax" id="dhLogTax"></div><div class="dh-hlog-body" id="dhLogBody"></div></div>`;
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
  const sig = JSON.stringify([ notice, showCount, list ]);
  const taxEl = document.getElementById("dhLogTax");
  if (taxEl) taxEl.textContent = taxNoteHtml(list);
  if (sig === renderedSig && body.childElementCount) return true;
  const asc = list.slice().sort((a, b) => a.day < b.day ? -1 : a.day > b.day ? 1 : 0);
  const cards = asc.map((entry, i) => dayHtml(entry, i + 1)).reverse();
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
  const asc = list.slice().sort((a, b) => a.day < b.day ? -1 : a.day > b.day ? 1 : 0);
  const cards = asc.map((entry, i) => dayHtml(entry, i + 1)).reverse();
  const more = cards.length > inlineState.showCount ? `<div class="dh-hlog-more"><button type="button" class="dh-pop-log-btn" data-pf-hmore="1">Show more (${cards.length - inlineState.showCount} older)</button></div>` : "";
  host.innerHTML = `<div class="dh-hlog-tax">${taxNoteHtml(list)}</div>` + (inlineState.notice ? `<div class="dh-hlog-msg">${inlineState.notice}</div>` : "") + `<div class="pf-hlog-grid">${cards.slice(0, inlineState.showCount).join("")}</div>` + more;
}

function inlineMessage(html) {
  const host = inlineState.host;
  if (host && host.isConnected) host.innerHTML = `<div class="dh-hlog-msg">${html}</div>`;
}

export function harvestLogInlineMore() {
  inlineState.showCount += PAGE_SIZE;
  inlineRender();
}

export function harvestLogInlineClose() {
  inlineState.token++;
  inlineState.host = null;
}

export async function harvestLogInlineOpen(host) {
  inlineState.host = host;
  inlineState.showCount = PAGE_SIZE;
  const token = ++inlineState.token;
  const farmId = currentFarmId();
  if (!farmId) {
    inlineMessage("Sync your Farm ID first to see your history.");
    return;
  }
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
