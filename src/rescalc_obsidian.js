import * as calc from "./calculator.js";
import * as prices from "./prices.js";
import * as ui from "./ui.js";
import { boostsBySubjectHtml } from "./rescalc_boosts.js";
import { loadBaseCropsIfNeeded } from "./storage.js";
import { farmPanelGetMarketPriceFlower } from "./inprogress.js";
import { normalizeSeason } from "./rescalc_shared.js";

const STORE_KEY = "guro_rc_obsidian_v1";

const MAX_CUSTOM_CYCLES = 100000;

const AUTO_COLLECT_MIN_PROFIT = .2;

const NODE_NAME = "Lava Pit";

const ITEM = "Obsidian";

const MODES = [ {
  id: "harvest",
  label: "Per Harvest"
}, {
  id: "weekly",
  label: "Weekly"
} ];

let host = null;
let state = null;
let popup = null;
let overlayEl = null;
let promptEl = null;
let restoreFns = [];
let nodesDraft = null;
let listening = false;
let detailsOpen = false;
let savedSkillCategory = null;

function esc(s) {
  return calc.escapeHtml(String(s));
}

function loadState() {
  const base = {
    mode: "harvest",
    season: normalizeSeason(calc.previewSeason),
    cycles: 0
  };
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (raw && typeof raw === "object") {
      if (raw.mode === "weekly" || raw.mode === "harvest") base.mode = raw.mode;
      if (calc.SEASON_ORDER.includes(raw.season)) base.season = raw.season;
      const v = Math.floor(Number(raw.cycles));
      if (isFinite(v) && v > 0) base.cycles = Math.min(v, MAX_CUSTOM_CYCLES);
    }
  } catch (e) {}
  return base;
}

function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) {}
}

function n2(n) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function fl(n) {
  if (!isFinite(n)) return "—";
  const a = Math.abs(n);
  const max = a >= 1e3 ? 0 : a >= 1 ? 2 : 4;
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: max
  });
}

function signed(n, f) {
  const r = f(Math.abs(n));
  if (n > 0 && r !== "0") return "+" + r;
  if (n < 0 && r !== "0") return "-" + r;
  return r;
}

function flowerSigned(n) {
  return `${signed(n, fl)}${calc.FLOWER_ICON}`;
}

function flowerHtml(n) {
  return `${fl(n)}${calc.FLOWER_ICON}`;
}

function autoModeFor(material) {
  const sell = farmPanelGetMarketPriceFlower(material) || 0;
  if (!(sell > 0)) return null;
  const cost = calc.coinsToFlower(prices.getItemCostByName(material));
  if (!isFinite(cost)) return null;
  if (cost <= 0) return "collect";
  const net = sell * (1 - (calc.feePercent || 0) / 100);
  return (net - cost) / cost >= AUTO_COLLECT_MIN_PROFIT ? "collect" : "buy";
}

function refreshAutoModes() {
  const map = {};
  calc.setAutoMaterialModes(map);
  prices.invalidateCostCache();
  calc.SEASON_ORDER.forEach(season => {
    const res = "Obsidian_" + season;
    calc.LAVA_PIT_RECIPES[season].materials.forEach(m => {
      if (m.name.toLowerCase() === "oil" || calc.hasManualMaterialMode(res, m.name)) return;
      const mode = autoModeFor(m.name);
      if (!mode) return;
      map[res + ":" + m.name] = mode;
      prices.invalidateCostCache();
    });
  });
}

function compute() {
  refreshAutoModes();
  const season = state.season;
  const mode = state.mode;
  const fig = calc.computeLavaPitFigures(season);
  const nodes = calc.getNodeCount(NODE_NAME) || 0;
  const sell = farmPanelGetMarketPriceFlower(ITEM) || 0;
  const feeRate = (calc.feePercent || 0) / 100;
  const shrine = prices.getActiveShrineDailyCost(fig.activeBoosts);
  const costPit = calc.coinsToFlower(fig.totalMaterialsCost);
  const yieldPit = fig.yieldVal;
  const yieldAll = nodes * yieldPit;
  const grossCycle = yieldAll * sell;
  const costCycle = nodes * costPit;
  const shrineCycle = shrine.total * fig.timeSec / 86400;
  const out = {
    season: season,
    mode: mode,
    fig: fig,
    nodes: nodes,
    timeSec: fig.timeSec,
    yieldPit: yieldPit,
    yieldAll: yieldAll,
    sell: sell,
    costPit: costPit,
    grossCycle: grossCycle,
    costCycle: costCycle,
    shrineCycle: shrineCycle,
    feeRate: feeRate,
    activeBoosts: fig.activeBoosts
  };
  const autoCycles = fig.timeSec > 0 ? Math.round(7 * 86400 / fig.timeSec) : 0;
  out.autoCycles = autoCycles;
  if (mode === "harvest") {
    out.cycles = 1;
    out.cyclesCustom = false;
    out.totalYield = yieldAll;
    out.sellable = yieldAll;
    out.gross = grossCycle;
    out.fee = grossCycle * feeRate;
    out.cost = costCycle;
    out.shrine = shrineCycle;
  } else {
    const custom = state.cycles > 0 ? state.cycles : undefined;
    const w = calc.computeObsidianWeeklyProfit(fig, sell, custom);
    out.cycles = w.cyclesPerWeek;
    out.cyclesCustom = custom != null;
    out.totalYield = w.produced;
    out.sellable = w.sellable;
    out.gross = w.sellable * sell;
    out.fee = out.gross - w.revenue;
    out.cost = w.cost;
    out.shrine = shrine.total * 7;
    out.allGross = w.produced * sell;
    out.allFee = out.allGross * feeRate;
    out.allCost = w.cyclesPerWeek * costCycle;
    out.allNet = out.allGross - out.allFee - out.allCost - out.shrine;
  }
  out.net = out.gross - out.fee - out.cost - out.shrine;
  out.netCycle = grossCycle * (1 - feeRate) - costCycle - shrineCycle;
  return out;
}

function seasonCardsHtml() {
  return calc.SEASON_ORDER.map(s => {
    const on = state.season === s;
    const icon = calc.SEASON_EMOJI[s];
    return `<button type="button" class="rc-season guro-frame${on ? " is-on" : ""}" data-rc-season="${s}" aria-pressed="${on ? "true" : "false"}">${icon}<span class="rc-season-name">${s}</span></button>`;
  }).join("");
}

function itemCellHtml() {
  return `<div class="rc-crop guro-frame is-on"><span class="rc-crop-icon">${ui.getIcon(ITEM)}</span><span class="rc-crop-name">${ITEM}</span></div>`;
}

function tilesHtml(r) {
  const good = r.net >= 0;
  return `<div class="rc-tiles-wrap guro-frame"><div class="rc-tiles"><div class="rc-tile guro-frame ${good ? "is-profit" : "is-loss"}"><span class="rc-tile-icon">${ui.getIcon(ITEM)}</span><span class="rc-tile-yield">${signed(r.totalYield, n2)}</span><span class="rc-tile-net">${fl(r.gross)}${calc.FLOWER_ICON}</span></div></div></div>`;
}

function valueBoxHtml(label, html, extra) {
  return `<div class="rc-val guro-frame${extra ? " " + extra : ""}"><span class="rc-val-label">${label}</span><span class="rc-val-num">${html}</span></div>`;
}

function netBoxHtml(label, net, extra) {
  return valueBoxHtml(label, `<span class="${net >= 0 ? "is-profit" : "is-loss"}">${signed(net, fl)}${calc.FLOWER_ICON}</span>`, extra);
}

function valuesHtml(r) {
  const weekly = r.mode === "weekly";
  const feeBox = r.feeRate > 0 ? valueBoxHtml("Market Fee", flowerHtml(r.fee)) : "";
  const allFeeBox = r.feeRate > 0 ? valueBoxHtml("Market Fee", flowerHtml(r.allFee)) : "";
  const sellLabel = weekly ? "Sellable " : "";
  const sellable = `<div class="rc-values">
    ${weekly ? valueBoxHtml("Sellable (max " + calc.OBSIDIAN_WEEKLY_SELL_CAP + ")", `${signed(r.sellable, n2)}${ui.getIcon(ITEM)}`, "rc-val-wide") : ""}
    ${valueBoxHtml(sellLabel + "Gross", flowerHtml(r.gross))}
    ${valueBoxHtml(sellLabel + "Cost", flowerHtml(r.cost))}
    ${valueBoxHtml("Shrine Cost", flowerHtml(r.shrine))}
    ${feeBox}
  </div>
  <div class="rc-net-row">
    ${netBoxHtml(sellLabel + "Net", r.net, "rc-val-net")}
    <button type="button" class="rc-linktext" data-rc-open="computation">Computation</button>
  </div>`;
  if (!weekly) return sellable;
  const all = `<div class="rc-values">
    ${valueBoxHtml("Weekly Yield", `${signed(r.totalYield, n2)}${ui.getIcon(ITEM)}`, "rc-val-wide")}
    ${valueBoxHtml("Yield Gross", flowerHtml(r.allGross))}
    ${valueBoxHtml("Yield Cost", flowerHtml(r.allCost))}
    ${valueBoxHtml("Shrine Cost", flowerHtml(r.shrine))}
    ${allFeeBox}
  </div>
  <div class="rc-net-row">
    ${netBoxHtml("Yield Net", r.allNet, "rc-val-net")}
  </div>`;
  return all + sellable;
}

function modeNoteHtml(r) {
  const warn = r.nodes > 0 ? "" : `<div class="rc-note is-warn">Lava Pit is 0, so every result is 0. Open Nodes above and enter your lava pits.</div>`;
  const text = state.mode === "harvest" ? `Per Harvest: one harvest of every Lava Pit. The recipe is paid for every pit and every obsidian is valued at the market price.` : `Weekly: ${calc.OBSIDIAN_WEEKLY_SELL_CAP} obsidian can be sold per week, so only that many are counted as gross and cost. Buying is capped at ${calc.OBSIDIAN_WEEKLY_PURCHASE_CAP} per week.`;
  return `<div class="rc-details-row"><button type="button" class="rc-linktext" data-rc-details aria-expanded="${detailsOpen ? "true" : "false"}">Details</button></div>${detailsOpen ? `<div class="rc-note">${text}</div>` : ""}${warn}`;
}

function pickerHtml() {
  return `<section class="rc-block guro-frame" aria-label="Obsidian Calculator">
    <div class="rc-block-title">Obsidian Calculator</div>
    <div class="rc-seasons" id="rcSeasons">${seasonCardsHtml()}</div>
    <div class="rc-crops" id="rcCrops">${itemCellHtml()}</div>
  </section>`;
}

function resultsHtml() {
  const r = compute();
  return `<section class="rc-block guro-frame" aria-label="Obsidian results">
    <div class="rc-modes" role="group" aria-label="Calculation mode">${MODES.map(m => `<button type="button" class="rc-mode guro-frame${state.mode === m.id ? " is-on" : ""}" data-rc-mode="${m.id}" aria-pressed="${state.mode === m.id ? "true" : "false"}">${m.label}</button>`).join("")}</div>
    <div class="rc-tools">
      <button type="button" class="rc-tool guro-frame" data-rc-open="skills">Skills</button>
      <button type="button" class="rc-tool guro-frame" data-rc-open="boost">Boost</button>
      <button type="button" class="rc-tool guro-frame" data-rc-open="nodes">Nodes</button>
    </div>
    ${modeNoteHtml(r)}
    <div id="rcResults">${tilesHtml(r)}${valuesHtml(r)}</div>
  </section>`;
}

function render() {
  if (!host) return;
  const scroller = document.scrollingElement;
  const y = scroller ? scroller.scrollTop : 0;
  host.innerHTML = pickerHtml() + resultsHtml();
  if (scroller) scroller.scrollTop = y;
}

function refreshResults() {
  if (!host) return;
  const blocks = host.querySelectorAll(".rc-block");
  if (!blocks[1]) {
    render();
    return;
  }
  const tmp = document.createElement("div");
  tmp.innerHTML = resultsHtml();
  blocks[1].replaceWith(tmp.firstElementChild);
  if (popup === "computation") renderOverlayBody();
}

function effectParts(b) {
  const y = [];
  const t = [];
  const c = [];
  if (b.yieldAdd) y.push(`${b.yieldAdd > 0 ? "+" : ""}${n2(b.yieldAdd)} yield`);
  if (b.timeMult) t.push(`×${b.timeMult} time`);
  if (b.materialQtyMult) c.push(`×${b.materialQtyMult} materials`);
  return {
    yield: y,
    time: t,
    cost: c
  };
}

function appliedBoostHtml(r) {
  const groups = {
    yield: [],
    time: [],
    cost: []
  };
  r.activeBoosts.forEach(b => {
    const p = effectParts(b);
    [ "yield", "time", "cost" ].forEach(k => {
      if (p[k].length) groups[k].push(`<div class="rc-boost-row">${ui.getBoostIconAnyFallback(b.name)}<span class="rc-boost-name">${esc(b.name)}</span><span class="rc-boost-eff">${esc(p[k].join(", "))}</span></div>`);
    });
  });
  const section = (label, items) => items.length ? `<div class="rc-boost-group"><div class="rc-boost-label">${label}</div>${items.join("")}</div>` : "";
  const body = section("Yield Boost", groups.yield) + section("Time Boost", groups.time) + section("Material Boost", groups.cost);
  return `<div class="rc-group"><div class="rc-comp-sub">Applied Boost</div>${body || `<div class="rc-boost-none">No boost applied</div>`}</div>`;
}

function kv(label, html, cls) {
  return `<div class="rc-kv${cls ? " " + cls : ""}"><span class="rc-kv-label">${label}</span><span class="rc-kv-val">${html}</span></div>`;
}

function totalCycleHtml(r) {
  const val = n2(r.cycles);
  if (r.mode !== "weekly") return val;
  return `<span class="rc-cycle-val"><span>${val}${r.cyclesCustom ? ` <span class="rc-kv-sub">Custom</span>` : ""}</span><button type="button" class="rc-edit-link" data-rc-edit-cycle="${ITEM}">Edit</button></span>`;
}

function recipeConfigHtml(r) {
  const res = "Obsidian_" + r.season;
  const btn = (m, mode, label) => `<button type="button" class="es-mode-btn es-toolcfg-tbtn${m.mode === mode ? " active" : ""}" data-rc-res="${esc(res)}" data-rc-mat="${esc(m.name)}" data-rc-mode="${mode}">${label}</button>`;
  const rows = r.fig.breakdown.map(m => {
    const tog = m.name.toLowerCase() === "oil" ? `<span class="es-toolcfg-free">Always Collect</span>` : `<span class="es-toolcfg-tog">${btn(m, "collect", "Collect")}${btn(m, "buy", "Buy")}</span>`;
    const unit = m.mode === "buy" ? flowerHtml(calc.coinsToFlower(m.unitCost)) : `${fl(m.unitCost)}${calc.COIN_ICON}`;
    return `<div class="rc-tool-mat"><span class="rc-tool-mat-item"><span class="rc-tool-mat-qty">${n2(m.qty)}</span>${ui.getIcon(m.name)}<span class="rc-kv-sub">${m.mode === "buy" ? "market" : "collect"} @ ${unit}/u</span></span>${tog}</div>`;
  }).join("");
  return `<div class="rc-group"><div class="rc-comp-sub">${esc(r.season)} Recipe (per Lava Pit)</div>
    <div class="rc-tool-cfg"><div class="rc-tool-name">${ui.getIcon(NODE_NAME)}<span>${NODE_NAME}</span></div>${rows}</div></div>`;
}

function computationCardHtml(r) {
  const modeLabel = r.mode === "harvest" ? "Per Harvest" : "Weekly";
  const weeklyRows = r.mode === "weekly" ? `${kv("Total Cycle", totalCycleHtml(r), "rc-kv-wide")}${kv("Produced / Week", `${signed(r.totalYield, n2)}${ui.getIcon(ITEM)}`)}${kv("Sellable (cap " + calc.OBSIDIAN_WEEKLY_SELL_CAP + ")", `${signed(r.sellable, n2)}${ui.getIcon(ITEM)}`)}` : `${kv("Total Yield", `${signed(r.totalYield, n2)}${ui.getIcon(ITEM)}`, "rc-kv-wide")}`;
  return `<article class="rc-comp-card guro-frame">
    <header class="rc-comp-head"><span class="rc-comp-icon">${ui.getIcon(ITEM)}</span><span class="rc-comp-name">${ITEM} · ${esc(r.season)}</span><span class="rc-comp-nodes">${ui.getIcon(NODE_NAME)} ${n2(r.nodes)}</span></header>
    <div class="rc-group"><div class="rc-kv-grid">
      ${kv("Growth Time", esc(calc.formatDuration(r.timeSec)), "rc-kv-wide")}
      ${kv("Yield / Pit", `${signed(r.yieldPit, n2)}${ui.getIcon(ITEM)}`)}
      ${kv("Yield / Harvest", `${signed(r.yieldAll, n2)}${ui.getIcon(ITEM)}`)}
      ${kv("Market Price / Unit", flowerSigned(r.sell))}
      ${kv("Gross / Harvest", flowerSigned(r.grossCycle))}
      ${kv("Cost / Pit", flowerHtml(r.costPit))}
      ${kv("Cost / Harvest", flowerHtml(r.costCycle))}
      ${kv("Shrine / Harvest", flowerHtml(r.shrineCycle))}
      ${kv("Net / Harvest", `<span class="${r.netCycle >= 0 ? "is-profit" : "is-loss"}">${signed(r.netCycle, fl)}${calc.FLOWER_ICON}</span>`)}
    </div></div>
    <div class="rc-group"><div class="rc-comp-sub">${modeLabel}</div>
    <div class="rc-kv-grid">
      ${weeklyRows}
      ${r.mode === "weekly" ? kv("Yield Gross", flowerSigned(r.allGross)) + kv("Yield Cost", flowerHtml(r.allCost)) + kv("Yield Net", `<span class="${r.allNet >= 0 ? "is-profit" : "is-loss"}">${signed(r.allNet, fl)}${calc.FLOWER_ICON}</span>`, "rc-kv-wide") : ""}
      ${kv(r.mode === "weekly" ? "Sellable Gross" : "Total Gross", flowerSigned(r.gross))}
      ${kv(r.mode === "weekly" ? "Sellable Cost" : "Total Cost", flowerHtml(r.cost))}
      ${kv("Total Shrine Cost", flowerHtml(r.shrine))}
      ${r.feeRate > 0 ? kv("Market Fee", flowerHtml(r.fee)) : ""}
      ${kv(r.mode === "weekly" ? "Sellable Net" : "Total Net", `<span class="${r.net >= 0 ? "is-profit" : "is-loss"}">${signed(r.net, fl)}${calc.FLOWER_ICON}</span>`, "rc-kv-wide rc-kv-net")}
    </div></div>
    ${appliedBoostHtml(r)}
    ${recipeConfigHtml(r)}
  </article>`;
}

function computationBodyHtml() {
  return computationCardHtml(compute());
}

function boostBodyHtml() {
  const subjects = [ {
    name: ITEM,
    icon: ui.getIcon(ITEM)
  } ];
  const boosts = calc.BOOSTS.filter(b => b.category === "resources" && b.scope === "lavaPit" && b.source !== "skill" && !b.hiddenFromOwnPanel);
  const html = boostsBySubjectHtml({
    subjects: subjects,
    boosts: boosts,
    appliesTo: () => true,
    unit: "pits",
    allLabel: "Boost for Obsidian"
  });
  return `<div class="rc-pop-hint">Boosts that affect ${ITEM}. Tap a boost to switch it on or off, then press Save.</div>${html || `<div class="rc-empty">No boosts found.</div>`}`;
}

function nodesBodyHtml() {
  const value = nodesDraft == null ? calc.getNodeCount(NODE_NAME) : nodesDraft;
  return `<div class="rc-pop-hint">Enter how many Lava Pits you have, then press Save.</div>
  <label class="rc-node-row guro-frame"><span class="rc-node-icon">${ui.getIcon(NODE_NAME)}</span><span class="rc-node-text"><span class="rc-node-name">${NODE_NAME}</span><span class="rc-node-used">Used by: ${ITEM}</span></span><input type="number" min="0" step="1" inputmode="numeric" id="rcNodesInput" value="${value ? value : ""}" placeholder="0"></label>`;
}

function popupTitle() {
  if (popup === "skills") return "Obsidian Skills";
  if (popup === "boost") return "Obsidian Boosts";
  if (popup === "nodes") return "Obsidian Nodes";
  return "Computation";
}

function popupBodyHtml() {
  if (popup === "boost") return boostBodyHtml();
  if (popup === "nodes") return nodesBodyHtml();
  if (popup === "computation") return computationBodyHtml();
  return `<div class="rc-pop-hint">Mining skills from the Skill Tree. Changes here also change the Skill Tree. Press Save to apply them.</div><div id="rcSkillSlot"></div>`;
}

function borrow(id, slotId) {
  const el = document.getElementById(id);
  const slot = document.getElementById(slotId);
  if (!el || !slot) return;
  const parent = el.parentNode;
  const next = el.nextSibling;
  slot.appendChild(el);
  restoreFns.push(() => {
    if (!parent) return;
    if (next && next.parentNode === parent) parent.insertBefore(el, next); else parent.appendChild(el);
  });
}

function releaseBorrowed() {
  while (restoreFns.length) restoreFns.pop()();
}

function setupBorrowed() {
  if (popup === "skills") {
    savedSkillCategory = calc.skillCategory;
    calc.setSkillCategory("mining");
    borrow("ascensionBar", "rcAscSlot");
    borrow("skillListWrap", "rcSkillSlot");
    borrow("skillSaveBar", "rcSaveSlot");
    ui.renderSkillPanel();
    ui.renderAscensionBar();
    calc.updateSkillSaveBarState();
  } else if (popup === "boost") {
    borrow("skillSaveBar", "rcSaveSlot");
    calc.updateSkillSaveBarState();
  }
}

function teardownBorrowed() {
  releaseBorrowed();
  if (savedSkillCategory != null) {
    calc.setSkillCategory(savedSkillCategory);
    savedSkillCategory = null;
    ui.renderSkillPanel();
  }
}

function footerHtml() {
  if (popup === "nodes") return `<button type="button" class="rc-save guro-frame" id="rcNodesSave">Save Changes</button>`;
  if (popup === "skills" || popup === "boost") return `<div id="rcSaveSlot"></div>`;
  return "";
}

function overlayHtml() {
  return `<div class="rc-pop guro-frame${popup === "computation" ? " rc-pop-comp" : ""}" role="dialog" aria-modal="true" aria-label="${popupTitle()}">
    <div class="rc-pop-head"><span class="rc-pop-title">${popupTitle()}</span><button type="button" class="rc-pop-close" data-rc-close aria-label="Close">✕</button></div>
    <div class="rc-pop-body" id="rcPopBody">${popupBodyHtml()}</div>
    <div class="rc-pop-foot">${footerHtml()}</div>
  </div>`;
}

function renderOverlayBody() {
  if (!overlayEl) return;
  const body = overlayEl.querySelector("#rcPopBody");
  if (!body) return;
  if (popup === "skills") return;
  const top = body.scrollTop;
  body.innerHTML = popupBodyHtml();
  body.scrollTop = top;
  calc.updateSkillSaveBarState();
}

function isPopupDirty() {
  if (popup === "skills" || popup === "boost") return calc.isSkillDraftDirty() || calc.isBoostDraftDirty();
  if (popup === "nodes") return nodesDraft != null && Number(nodesDraft) !== (calc.getNodeCount(NODE_NAME) || 0);
  return false;
}

function openPopup(kind) {
  if (popup) return;
  popup = kind;
  nodesDraft = null;
  overlayEl = document.createElement("div");
  overlayEl.className = "rc-overlay";
  overlayEl.innerHTML = overlayHtml();
  document.body.appendChild(overlayEl);
  document.body.classList.add("rc-no-scroll");
  const slot = overlayEl.querySelector("#rcSkillSlot");
  if (kind === "skills" && slot) {
    const asc = document.createElement("div");
    asc.id = "rcAscSlot";
    slot.parentNode.insertBefore(asc, slot);
  }
  setupBorrowed();
}

function destroyPopup() {
  teardownBorrowed();
  if (overlayEl) overlayEl.remove();
  overlayEl = null;
  popup = null;
  nodesDraft = null;
  document.body.classList.remove("rc-no-scroll");
}

function closePopup(force) {
  if (!popup) return;
  if (!force && isPopupDirty()) {
    showPrompt("You have unsaved changes. Save them first, or discard them to close.", [ {
      label: "Keep Editing"
    }, {
      label: "Discard",
      run: () => {
        calc.discardSkillBoostDrafts();
        destroyPopup();
        refreshResults();
      }
    } ]);
    return;
  }
  const wasComputation = popup === "computation";
  destroyPopup();
  if (!wasComputation) refreshResults();
}

function showPrompt(message, buttons) {
  if (promptEl) promptEl.remove();
  promptEl = document.createElement("div");
  promptEl.className = "rc-overlay rc-overlay-top";
  promptEl.innerHTML = `<div class="rc-prompt guro-frame" role="alertdialog" aria-modal="true"><p class="rc-prompt-text">${esc(message)}</p><div class="rc-prompt-actions">${buttons.map((b, i) => `<button type="button" class="rc-prompt-btn guro-frame" data-rc-prompt="${i}">${esc(b.label)}</button>`).join("")}</div></div>`;
  promptEl.addEventListener("click", e => {
    const btn = e.target.closest("[data-rc-prompt]");
    if (!btn) return;
    const b = buttons[Number(btn.getAttribute("data-rc-prompt"))];
    promptEl.remove();
    promptEl = null;
    if (b && b.run) b.run();
  });
  document.body.appendChild(promptEl);
  const first = promptEl.querySelector("button");
  if (first) first.focus();
}

function closeCycleEditor() {
  if (promptEl) promptEl.remove();
  promptEl = null;
}

function openCycleEditor() {
  if (promptEl) promptEl.remove();
  const current = state.cycles > 0 ? state.cycles : "";
  const fallback = compute().autoCycles;
  promptEl = document.createElement("div");
  promptEl.className = "rc-overlay rc-overlay-top";
  promptEl.innerHTML = `<div class="rc-prompt rc-cycle-edit guro-frame" role="dialog" aria-modal="true" aria-label="Editing Cycle"><div class="rc-cycle-edit-label">Editing Cycle</div><div class="rc-cycle-edit-row"><input type="number" min="0" max="${MAX_CUSTOM_CYCLES}" step="1" inputmode="numeric" class="rc-cycle-input guro-frame" data-rc-cycle-input value="${current}" placeholder="${fallback}" aria-label="Cycle count"><button type="button" class="rc-prompt-btn guro-frame" data-rc-cycle-save>Save</button></div></div>`;
  promptEl.addEventListener("click", e => {
    if (e.target === promptEl) {
      closeCycleEditor();
      return;
    }
    if (e.target.closest("[data-rc-cycle-save]")) saveCycleEdit();
  });
  promptEl.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveCycleEdit();
    }
  });
  document.body.appendChild(promptEl);
  const input = promptEl.querySelector("[data-rc-cycle-input]");
  if (input) {
    input.focus();
    input.select();
  }
}

function saveCycleEdit() {
  if (!promptEl) return;
  const input = promptEl.querySelector("[data-rc-cycle-input]");
  const btn = promptEl.querySelector("[data-rc-cycle-save]");
  if (!input || (btn && btn.disabled)) return;
  const value = input.value === "" ? 0 : Math.floor(Number(input.value));
  if (btn) btn.disabled = true;
  input.disabled = true;
  const chip = document.createElement("div");
  chip.className = "bg-sim-saving guro-frame";
  chip.innerHTML = `<span class="bg-sim-spin"></span><span class="bg-sim-saving-text">Saving...</span>`;
  document.body.appendChild(chip);
  setTimeout(() => {
    state.cycles = isFinite(value) && value > 0 ? Math.min(value, MAX_CUSTOM_CYCLES) : 0;
    saveState();
    closeCycleEditor();
    refreshResults();
    chip.classList.add("is-done");
    chip.innerHTML = `<span class="bg-sim-tick">✓</span><span class="bg-sim-saving-text">Saved</span>`;
    setTimeout(() => chip.remove(), 900);
  }, 700);
}

function saveNodes() {
  const v = Math.max(0, Math.floor(Number(nodesDraft == null ? calc.getNodeCount(NODE_NAME) : nodesDraft) || 0));
  calc.setNodeCount(NODE_NAME, v);
  prices.invalidateCostCache();
  ui.renderLibraryLists();
  ui.renderBoostPanel();
  calc.updateCalcSummary();
  nodesDraft = null;
  calc.toast("✅ Lava pits saved");
  renderOverlayBody();
  refreshResults();
}

function setMode(id) {
  if (id === state.mode) return;
  state.mode = id;
  saveState();
  refreshResults();
}

function onClick(e) {
  const details = e.target.closest("[data-rc-details]");
  if (details) {
    detailsOpen = !detailsOpen;
    refreshResults();
    return;
  }
  const season = e.target.closest("[data-rc-season]");
  if (season) {
    state.season = season.getAttribute("data-rc-season");
    saveState();
    const seasons = host.querySelector("#rcSeasons");
    if (seasons) seasons.innerHTML = seasonCardsHtml();
    refreshResults();
    return;
  }
  const mode = e.target.closest("[data-rc-mode]");
  if (mode) {
    setMode(mode.getAttribute("data-rc-mode"));
    return;
  }
  const open = e.target.closest("[data-rc-open]");
  if (open && !open.disabled) openPopup(open.getAttribute("data-rc-open"));
}

function onDocClick(e) {
  if (!overlayEl) return;
  if (promptEl && promptEl.contains(e.target)) return;
  if (e.target === overlayEl || e.target.closest("[data-rc-close]")) {
    closePopup(false);
    return;
  }
  if (!overlayEl.contains(e.target)) return;
  if (e.target.closest("#rcNodesSave")) {
    saveNodes();
    return;
  }
  if (e.target.closest("[data-rc-edit-cycle]") && popup === "computation") {
    openCycleEditor();
    return;
  }
  const matBtn = e.target.closest("[data-rc-mat]");
  if (matBtn && popup === "computation") {
    calc.setMaterialMode(matBtn.getAttribute("data-rc-res"), matBtn.getAttribute("data-rc-mat"), matBtn.getAttribute("data-rc-mode"));
    prices.invalidateCostCache();
    renderOverlayBody();
    refreshResults();
    return;
  }
  const row = e.target.closest("[data-boost-id]");
  if (row && popup === "boost" && overlayEl.contains(row)) {
    ui.draftToggleBoost(row.getAttribute("data-boost-id"));
    renderOverlayBody();
  }
}

function onDocInput(e) {
  if (e.target && e.target.id === "rcNodesInput") nodesDraft = e.target.value === "" ? 0 : Number(e.target.value);
}

function onKey(e) {
  if (e.key !== "Escape") return;
  if (promptEl) {
    promptEl.remove();
    promptEl = null;
    return;
  }
  if (popup) closePopup(false);
}

function onBoostsChanged() {
  if (!host) return;
  prices.invalidateCostCache();
  if (popup === "boost") renderOverlayBody();
  refreshResults();
}

function onExternalChange() {
  if (!host) return;
  refreshResults();
}

export function mountObsidianCalculator(root) {
  host = root;
  loadBaseCropsIfNeeded();
  prices.invalidateCostCache();
  state = loadState();
  detailsOpen = false;
  host.addEventListener("click", onClick);
  document.addEventListener("click", onDocClick);
  document.addEventListener("input", onDocInput);
  document.addEventListener("keydown", onKey);
  window.addEventListener("guroBoostsChanged", onBoostsChanged);
  window.addEventListener("guroGemPackChanged", onExternalChange);
  window.addEventListener("guroPricesUpdated", onExternalChange);
  listening = true;
  render();
}

export function unmountObsidianCalculator() {
  calc.setAutoMaterialModes({});
  prices.invalidateCostCache();
  if (popup) destroyPopup();
  if (promptEl) {
    promptEl.remove();
    promptEl = null;
  }
  if (host) {
    host.removeEventListener("click", onClick);
    host.innerHTML = "";
  }
  if (listening) {
    document.removeEventListener("click", onDocClick);
    document.removeEventListener("input", onDocInput);
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("guroBoostsChanged", onBoostsChanged);
    window.removeEventListener("guroGemPackChanged", onExternalChange);
    window.removeEventListener("guroPricesUpdated", onExternalChange);
    listening = false;
  }
  host = null;
}

export function obsidianCalculatorCanLeave() {
  if (!popup) return true;
  if (isPopupDirty()) {
    calc.toast("⚠️ Save your changes first");
    return false;
  }
  destroyPopup();
  return true;
}
