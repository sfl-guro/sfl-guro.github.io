import { FLOWER_ICON, escapeHtml } from "./calculator.js";
import { getIcon } from "./ui.js";
import { SFL_COMMUNITY_PROXY_BASE } from "./prices.js";
import { foldClock } from "./fold_clock.js";
import { AUCTION_RESULT_ICONS } from "./auction_result_icons.js";
import { GAME_ICON_DATA } from "./game_icons.js";

const CHAPTERS = [
  { name: "Solar Flare", start: "2023-01-01", end: "2023-05-01", ticket: "Solar Flare Ticket" },
  { name: "Dawn Breaker", start: "2023-05-01", end: "2023-08-01", ticket: "Dawn Breaker Ticket" },
  { name: "Witches' Eve", start: "2023-08-01", end: "2023-11-01", ticket: "Crow Feather" },
  { name: "Catch the Kraken", start: "2023-11-01", end: "2024-02-01", ticket: "Mermaid Scale" },
  { name: "Spring Blossom", start: "2024-02-01", end: "2024-05-01", ticket: "Tulip Bulb" },
  { name: "Clash of Factions", start: "2024-05-01", end: "2024-08-01", ticket: "Scroll" },
  { name: "Pharaoh's Treasure", start: "2024-08-01", end: "2024-11-01", ticket: "Amber Fossil" },
  { name: "Bull Run", start: "2024-11-01", end: "2025-02-03", ticket: "Horseshoe" },
  { name: "Winds of Change", start: "2025-02-03", end: "2025-05-01", ticket: "Timeshard" },
  { name: "Great Bloom", start: "2025-05-01", end: "2025-08-04", ticket: "Geniseed" },
  { name: "Better Together", start: "2025-08-04", end: "2025-11-03", ticket: "Bracelet" },
  { name: "Paw Prints", start: "2025-11-03", end: "2026-02-02", ticket: "Pet Cookie" },
  { name: "Crabs and Traps", start: "2026-02-02", end: "2026-05-04", ticket: "Floater" },
  { name: "Salt Awakening", start: "2026-05-04", end: "2026-08-03", ticket: "Salt Rock" },
  { name: "Ascension Age", start: "2026-08-03", end: "2026-11-02", ticket: "Shiny Feather" },
  { name: "Cave Dwellers", start: "2026-11-02", end: "2027-02-01", ticket: "Duende Cap" }
].map(c => ({ ...c, startMs: Date.parse(c.start + "T00:00:00Z"), endMs: Date.parse(c.end + "T00:00:00Z") }));

const SORTS = [ [ "mix", "Schedule" ], [ "flower", "FLOWER" ], [ "gems", "Gems" ], [ "ticket", "Ticket" ] ];
const TYPE_LABEL = { w: "Wearable", c: "Collectible", n: "NFT" };
const SCHEDULE_CACHE_KEY = "guro_auction_schedule_v1";
const RESULT_CACHE_PREFIX = "guro_auction_res_v1:";
const SCHEDULE_TTL_MS = 30 * 60 * 1e3;
const RESULT_GAP_MS = 5200;
const PAGE_SIZE = 30;
const CLICK_COOLDOWN_MS = 7000;

const state = {
  tab: "pending",
  sort: "mix",
  chapter: null,
  shown: PAGE_SIZE,
  open: new Set(),
  auctions: [],
  source: "",
  loadingSchedule: false,
  scheduleError: ""
};

const results = new Map();
let body = null;
let tickTimer = null;
let queueTail = Promise.resolve();
let lastRequestAt = 0;
let cooldownUntil = 0;
let cdTimer = null;

function lsGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}

function currentChapter() {
  const now = Date.now();
  return CHAPTERS.find(c => now >= c.startMs && now < c.endMs) || CHAPTERS[CHAPTERS.length - 1];
}

function chapterOf(ms) {
  return CHAPTERS.find(c => ms >= c.startMs && ms < c.endMs) || null;
}

function normalizeApi(a) {
  const type = a.type === "wearable" ? "w" : a.type === "nft" ? "n" : "c";
  return { id: a.auctionId, type, name: a.wearable || a.collectible || a.nft || "?", supply: a.supply, sfl: a.sfl, ing: a.ingredients || {}, start: a.startAt, end: a.endAt };
}

function normalizeRow(r) {
  return { id: r[0], type: r[1], name: r[2], supply: r[3], sfl: r[4], ing: r[5] || {}, start: r[6], end: r[7] };
}

function decorate(list) {
  list.forEach(a => {
    const keys = Object.keys(a.ing);
    a.cur = a.ing.Gem ? "gems" : keys.length ? "ticket" : "flower";
    const ch = chapterOf(a.start);
    a.chapter = ch ? ch.name : "";
  });
  return list;
}

function iconHtml(name, size) {
  const src = AUCTION_RESULT_ICONS[name] || GAME_ICON_DATA[name];
  const px = size || 20;
  if (src) return `<img src="${src}" alt="${escapeHtml(name)}" style="width:${px}px;height:${px}px;object-fit:contain;image-rendering:pixelated;vertical-align:middle;">`;
  return getIcon(name);
}

function fmtNum(n) {
  const v = Number(n);
  if (!isFinite(v)) return "0";
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function fmtDate(ms) {
  return new Date(ms).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

function curLabel(a) {
  if (a.cur === "gems") return `${iconHtml("Gem", 14)} Gems`;
  if (a.cur === "ticket") return `${iconHtml(Object.keys(a.ing)[0], 14)} Ticket`;
  return `${FLOWER_ICON} FLOWER`;
}

function bidHtml(a) {
  const parts = [];
  if (a.sfl > 0 && !Object.keys(a.ing).length) parts.push(`${FLOWER_ICON} FLOWER`);
  Object.keys(a.ing).forEach(k => parts.push(`${iconHtml(k, 14)} ${escapeHtml(k)}${a.ing[k] > 1 ? ` ×${fmtNum(a.ing[k])}` : ""}`));
  return parts.join(" · ") || `${FLOWER_ICON} FLOWER`;
}

function sortList(list, descending) {
  const sorted = list.slice().sort((x, y) => descending ? y.end - x.end : x.start - y.start);
  if (state.sort === "mix") return sorted;
  const first = sorted.filter(a => a.cur === state.sort);
  const rest = sorted.filter(a => a.cur !== state.sort);
  return first.concat(rest);
}

function chapterAuctions() {
  return state.auctions.filter(a => a.chapter === state.chapter);
}

function timeLine(a) {
  const now = Date.now();
  if (a.end <= now) return `<span class="ar-time">Ended ${escapeHtml(fmtDate(a.end))}</span>`;
  if (a.start <= now) return `<span class="ar-time is-live">LIVE · ends in <b data-ar-at="${a.end}">${foldClock((a.end - now) / 1e3)}</b></span><span class="ar-time">${escapeHtml(fmtDate(a.start))}</span>`;
  return `<span class="ar-time">Starts in <b data-ar-at="${a.start}">${foldClock((a.start - now) / 1e3)}</b></span><span class="ar-time">${escapeHtml(fmtDate(a.start))}</span>`;
}

function cooldownLeft() {
  return Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1e3));
}

function hasSaved(id) {
  const r = results.get(id);
  return !!(r && r.status === "done") || !!readCached(id);
}

function guardHtml(cls, attrs, label) {
  const sec = cooldownLeft();
  return `<button type="button" class="${cls}" ${attrs} data-ar-cd="${escapeHtml(label)}"${sec ? " disabled" : ""}>${sec ? `${escapeHtml(label)} · ${sec}s` : escapeHtml(label)}</button>`;
}

function applyCooldownAll() {
  if (!body) return;
  const sec = cooldownLeft();
  body.querySelectorAll("[data-ar-cd]").forEach(el => {
    const base = el.getAttribute("data-ar-cd");
    el.disabled = sec > 0;
    el.textContent = sec > 0 ? `${base} · ${sec}s` : base;
  });
}

function startCooldown() {
  cooldownUntil = Date.now() + CLICK_COOLDOWN_MS;
  applyCooldownAll();
  if (cdTimer) clearInterval(cdTimer);
  cdTimer = setInterval(() => {
    applyCooldownAll();
    if (!cooldownLeft()) {
      clearInterval(cdTimer);
      cdTimer = null;
    }
  }, 250);
}

function openBtnHtml(a, open) {
  const attrs = `data-ar-open="${escapeHtml(a.id)}"`;
  if (open) return `<button type="button" class="ar-chip ar-open guro-frame" ${attrs}>Hide winners</button>`;
  if (hasSaved(a.id)) return `<button type="button" class="ar-chip ar-open guro-frame" ${attrs}>Show winners</button>`;
  return guardHtml("ar-chip ar-open guro-frame", attrs, "Show winners");
}

function winnersHtml(a) {
  const st = results.get(a.id);
  if (!st || st.status === "queued") return `<div class="at-empty">Waiting in line…</div>`;
  if (st.status === "loading") return `<div class="at-empty">Loading winners…</div>`;
  if (st.status === "error") return `<div class="at-empty">${escapeHtml(st.msg || "Could not load the results.")}</div><div class="ar-actions">${guardHtml("ar-chip guro-frame", `data-ar-retry="${escapeHtml(a.id)}"`, "Retry")}</div>`;
  if (st.status === "empty") return `<div class="at-empty">No result found for this auction.</div>`;
  if (st.status === "pending") return `<div class="at-empty">The winners are still being picked. Try again in a few minutes.</div><div class="ar-actions">${guardHtml("ar-chip guro-frame", `data-ar-retry="${escapeHtml(a.id)}"`, "Check again")}</div>`;
  const rows = st.data.winners.map(w => {
    const bid = [];
    if (w.s > 0) bid.push(`${FLOWER_ICON} ${fmtNum(w.s)}`);
    Object.keys(w.i || {}).forEach(k => bid.push(`${iconHtml(k, 14)} ${fmtNum(w.i[k])}`));
    return `<div class="ar-win guro-frame"><div class="ar-win-top"><span class="ar-win-rank">#${fmtNum(w.r)}</span><span class="ar-win-name">${escapeHtml(w.u || "Farm #" + w.f)}</span></div><div class="ar-win-stats"><span><b>Farm ID</b>${escapeHtml(String(w.f))}</span><span><b>Tickets</b>${fmtNum(w.t)}</span><span><b>EXP</b>${fmtNum(w.e)}</span>${bid.length ? `<span><b>Bid</b>${bid.join(" ")}</span>` : ""}</div></div>`;
  }).join("");
  return `<div class="ar-win-head">${fmtNum(st.data.winners.length)} winner${st.data.winners.length === 1 ? "" : "s"} · ${fmtNum(st.data.count)} bidders</div><div class="ar-wins">${rows || `<div class="at-empty">No winners were recorded.</div>`}</div>`;
}

function cardHtml(a, isResult) {
  const open = isResult && state.open.has(a.id);
  const head = `<div class="ar-head"><span class="ar-icon">${iconHtml(a.name, 28)}</span><div class="ar-title"><div class="ar-name">${escapeHtml(a.name)}</div><div class="ar-sub"><span>${TYPE_LABEL[a.type] || "Item"}</span><span class="ar-supply">Supply ${fmtNum(a.supply)}</span></div></div><span class="ar-cur">${curLabel(a)}</span></div>`;
  const meta = `<div class="ar-meta"><span class="ar-bid"><b>Bid</b> ${bidHtml(a)}</span>${timeLine(a)}</div>`;
  const foot = isResult ? `${openBtnHtml(a, open)}${open ? `<div class="ar-winbox">${winnersHtml(a)}</div>` : ""}` : "";
  return `<div class="at-row ar-card" data-ar-id="${escapeHtml(a.id)}">${head}${meta}${foot}</div>`;
}

function sortRowHtml() {
  const ch = CHAPTERS.find(c => c.name === state.chapter);
  const icons = { flower: FLOWER_ICON, gems: iconHtml("Gem", 14), ticket: ch ? iconHtml(ch.ticket, 14) : "" };
  return `<div class="ar-sortrow"><span class="at-section-label">Sort</span>${SORTS.map(([k, label]) => `<button type="button" class="ar-chip ar-small guro-frame${state.sort === k ? " active" : ""}" data-ar-sort="${k}">${icons[k] || ""}${label}</button>`).join("")}</div>`;
}

function tabsHtml() {
  const tabs = [ [ "pending", "Pending Auction" ], [ "result", "Auction Result" ], [ "chapters", "Chapters" ] ];
  return `<div class="ar-switch">${tabs.map(([k, label]) => `<button type="button" class="ar-chip ar-fixed guro-frame${state.tab === k ? " active" : ""}" data-ar-tab="${k}">${label}</button>`).join("")}</div>`;
}

function chapterHeaderHtml() {
  const ch = CHAPTERS.find(c => c.name === state.chapter);
  return `<div class="ar-chapline">${ch ? iconHtml(ch.ticket, 18) : ""}<span>${escapeHtml(state.chapter || "")}</span></div>`;
}

function statusHtml() {
  if (state.loadingSchedule && !state.auctions.length) return `<div class="at-empty">Loading the auction schedule…</div>`;
  const note = state.source ? `<div class="at-updated-note">${escapeHtml(state.source)}${state.scheduleError ? " · " + escapeHtml(state.scheduleError) : ""}</div>` : "";
  return note;
}

function listTabHtml(isResult) {
  const now = Date.now();
  const base = chapterAuctions().filter(a => isResult ? a.end <= now : a.end > now);
  const list = sortList(base, isResult);
  const shown = isResult ? list.slice(0, state.shown) : list;
  const label = isResult ? "Finished auctions" : "Pending auctions";
  const empty = isResult ? "No finished auction found for this chapter." : "No pending auction in this chapter.";
  const more = isResult && list.length > shown.length ? `<div class="ar-actions"><button type="button" class="ar-chip guro-frame" data-ar-more="1">Show more (${fmtNum(list.length - shown.length)} left)</button></div>` : "";
  return `<div class="at-list-wrap">${chapterHeaderHtml()}<div class="at-section-label">${label} · ${fmtNum(list.length)}</div>${sortRowHtml()}${statusHtml()}<div class="ar-list${isResult ? "" : " ar-pending"}">${shown.map(a => cardHtml(a, isResult)).join("") || `<div class="at-empty">${empty}</div>`}</div>${more}</div>`;
}

function chaptersTabHtml() {
  const counts = {};
  state.auctions.forEach(a => {
    counts[a.chapter] = (counts[a.chapter] || 0) + 1;
  });
  const now = Date.now();
  const cur = currentChapter();
  const rows = CHAPTERS.slice().reverse().map(c => {
    const n = counts[c.name] || 0;
    const range = `${new Date(c.startMs).toLocaleDateString(undefined, { month: "short", year: "numeric", timeZone: "UTC" })} – ${new Date(c.endMs - 1).toLocaleDateString(undefined, { month: "short", year: "numeric", timeZone: "UTC" })}`;
    return `<button type="button" class="ar-chap guro-frame${state.chapter === c.name ? " active" : ""}" data-ar-chapter="${escapeHtml(c.name)}"><span class="ar-icon">${iconHtml(c.ticket, 26)}</span><span class="ar-chap-text"><span class="ar-name">${escapeHtml(c.name)}${c.name === cur.name ? ` <i class="ar-badge">CURRENT</i>` : ""}</span><span class="ar-sub"><span>${escapeHtml(range)}</span><span>${n ? fmtNum(n) + " auctions" : "No schedule data"}</span></span></span></button>`;
  }).join("");
  return `<div class="at-list-wrap"><div class="at-section-label">All chapters</div>${statusHtml()}<div class="ar-chaps">${rows}</div></div>`;
}

function render() {
  if (!body) return;
  const content = state.tab === "chapters" ? chaptersTabHtml() : listTabHtml(state.tab === "result");
  body.innerHTML = `${tabsHtml()}${content}`;
}

function updateCard(id) {
  const a = state.auctions.find(x => x.id === id);
  const el = body && body.querySelector(`[data-ar-id="${CSS.escape(id)}"]`);
  if (!a || !el) return;
  const tmp = document.createElement("div");
  tmp.innerHTML = cardHtml(a, true);
  el.replaceWith(tmp.firstElementChild);
}

function readCached(id) {
  const c = lsGet(RESULT_CACHE_PREFIX + id);
  return c && c.winners ? c : null;
}

function enqueue(fn) {
  const run = queueTail.then(async () => {
    const wait = lastRequestAt + RESULT_GAP_MS - Date.now();
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    lastRequestAt = Date.now();
    return fn();
  });
  queueTail = run.catch(() => {});
  return run;
}

async function requestResult(id, attempt) {
  const url = `${SFL_COMMUNITY_PROXY_BASE}community/data?type=auctionResults&auctionId=${encodeURIComponent(id)}`;
  const res = await fetch(url);
  if (res.status === 404) return { status: "empty" };
  if (res.status === 429) {
    if (attempt < 2) {
      await new Promise(r => setTimeout(r, 11e3));
      lastRequestAt = Date.now();
      return requestResult(id, attempt + 1);
    }
    return { status: "error", msg: "Too many requests. Try again in a moment." };
  }
  if (!res.ok) return { status: "error", msg: "The results are not available right now." };
  const json = await res.json();
  const d = json && json.data;
  if (!d) return { status: "error", msg: "The results are not available right now." };
  if (d.status !== "complete") return { status: "pending" };
  const supply = d.supply || Infinity;
  const winners = (d.leaderboard || []).filter(r => r.rank <= supply).map(r => ({ r: r.rank, f: r.farmId, u: r.username || "", t: r.tickets || 0, e: r.experience || 0, s: r.sfl || 0, i: r.items || {} }));
  const data = { winners, count: d.participantCount != null ? d.participantCount : (d.leaderboard || []).length };
  lsSet(RESULT_CACHE_PREFIX + id, data);
  return { status: "done", data };
}

function loadResult(id, force) {
  const cur = results.get(id);
  if (!force && cur && (cur.status === "done" || cur.status === "loading" || cur.status === "queued")) return;
  const cached = force ? null : readCached(id);
  if (cached) {
    results.set(id, { status: "done", data: cached });
    updateCard(id);
    return;
  }
  results.set(id, { status: "queued" });
  startCooldown();
  updateCard(id);
  enqueue(async () => {
    results.set(id, { status: "loading" });
    updateCard(id);
    try {
      results.set(id, await requestResult(id, 0));
    } catch (e) {
      results.set(id, { status: "error", msg: "Could not reach the server." });
    }
    updateCard(id);
  });
}

async function loadSchedule(force) {
  const cached = lsGet(SCHEDULE_CACHE_KEY);
  const fresh = cached && cached.at && Date.now() - cached.at < SCHEDULE_TTL_MS && Array.isArray(cached.rows);
  if (!state.auctions.length) {
    if (cached && Array.isArray(cached.rows) && cached.rows.length) {
      state.auctions = decorate(cached.rows.map(normalizeRow));
      state.source = "Saved schedule";
    } else {
      const mod = await import("./auction_snapshot.js");
      state.auctions = decorate(mod.AUCTION_SNAPSHOT.map(normalizeRow));
      state.source = "Built-in schedule";
    }
    render();
  }
  if (fresh && !force) return;
  state.loadingSchedule = true;
  try {
    const res = await fetch(`${SFL_COMMUNITY_PROXY_BASE}community/data?type=auctions`);
    if (!res.ok) throw new Error("status " + res.status);
    const json = await res.json();
    const list = json && json.data && json.data.auctions;
    if (!Array.isArray(list) || list.length < 50) throw new Error("empty");
    const norm = list.map(normalizeApi);
    state.auctions = decorate(norm);
    state.source = "Live schedule";
    state.scheduleError = "";
    lsSet(SCHEDULE_CACHE_KEY, { at: Date.now(), rows: norm.map(a => [ a.id, a.type, a.name, a.supply, a.sfl, a.ing, a.start, a.end ]) });
  } catch (e) {
    state.scheduleError = "live update unavailable";
  }
  state.loadingSchedule = false;
  render();
}

function tick() {
  if (!body || !body.isConnected) return;
  const els = body.querySelectorAll("[data-ar-at]");
  for (const el of els) {
    const sec = (Number(el.getAttribute("data-ar-at")) - Date.now()) / 1e3;
    if (sec <= 0) {
      render();
      return;
    }
    el.textContent = foldClock(sec);
  }
}

function onClick(e) {
  const t = e.target.closest("[data-ar-tab],[data-ar-sort],[data-ar-chapter],[data-ar-open],[data-ar-retry],[data-ar-more]");
  if (!t || !body.contains(t)) return;
  if (t.hasAttribute("data-ar-tab")) {
    state.tab = t.getAttribute("data-ar-tab");
    state.shown = PAGE_SIZE;
    render();
  } else if (t.hasAttribute("data-ar-sort")) {
    state.sort = t.getAttribute("data-ar-sort");
    state.shown = PAGE_SIZE;
    render();
  } else if (t.hasAttribute("data-ar-chapter")) {
    state.chapter = t.getAttribute("data-ar-chapter");
    state.shown = PAGE_SIZE;
    state.open.clear();
    state.tab = state.chapter === currentChapter().name ? "pending" : "result";
    render();
    window.scrollTo({ top: 0 });
  } else if (t.hasAttribute("data-ar-open")) {
    const id = t.getAttribute("data-ar-open");
    if (state.open.has(id)) state.open.delete(id);
    else {
      if (cooldownLeft() && !hasSaved(id)) return;
      state.open.add(id);
      loadResult(id, false);
    }
    updateCard(id);
  } else if (t.hasAttribute("data-ar-retry")) {
    if (cooldownLeft()) return;
    loadResult(t.getAttribute("data-ar-retry"), true);
  } else if (t.hasAttribute("data-ar-more")) {
    state.shown += PAGE_SIZE;
    render();
  }
}

export function mountAuctionResult(root) {
  body = root.querySelector("#auctionResultBody");
  if (!body) return;
  if (!state.chapter) state.chapter = currentChapter().name;
  body.onclick = onClick;
  render();
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(tick, 1e3);
  loadSchedule(false);
}

export function unmountAuctionResult() {
  if (cdTimer) clearInterval(cdTimer);
  cdTimer = null;
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = null;
}
