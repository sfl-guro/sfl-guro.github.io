import * as calc from "./calculator.js";
import * as prices from "./prices.js";
import * as ui from "./ui.js";
import { boostsBySubjectHtml } from "./rescalc_boosts.js";
import { normalizeSeason } from "./rescalc_shared.js";

const STORE_KEY = "guro_rc_composters_v1";

const MAX_CUSTOM_CYCLES = 100000;

const MODES = [ {
  id: "cycle",
  label: "Per Cycle Mode"
}, {
  id: "24h",
  label: "24Hrs Mode"
} ];

let host = null;
let state = null;
let popup = null;
let overlayEl = null;
let promptEl = null;
let restoreFns = [];
let listening = false;
let detailsOpen = false;
let savedSkillCategory = null;

function esc(s) {
  return calc.escapeHtml(String(s));
}

function loadState() {
  const base = {
    mode: "cycle",
    season: normalizeSeason(calc.previewSeason),
    selected: [],
    cycles: {}
  };
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (raw && typeof raw === "object") {
      if (raw.mode === "24h" || raw.mode === "cycle") base.mode = raw.mode;
      if (calc.SEASON_ORDER.includes(raw.season)) base.season = raw.season;
      if (Array.isArray(raw.selected)) base.selected = raw.selected.filter(n => calc.BASE_COMPOSTERS[n]);
      if (raw.cycles && typeof raw.cycles === "object") Object.keys(raw.cycles).forEach(k => {
        const v = Math.floor(Number(raw.cycles[k]));
        if (calc.BASE_COMPOSTERS[k] && isFinite(v) && v > 0) base.cycles[k] = Math.min(v, MAX_CUSTOM_CYCLES);
      });
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

function flowerHtml(n) {
  return `${fl(n)}${calc.FLOWER_ICON}`;
}

function ingredientMode(item) {
  return calc.getMaterialMode("Composter", item) === "buy" ? "buy" : "collect";
}

function ingredientFlower(item) {
  return calc.coinsToFlower(prices.getMaterialUnitCostCoins(item, ingredientMode(item), new Set));
}

function composterNames() {
  return Object.keys(calc.BASE_COMPOSTERS);
}

function seasonReqs(name) {
  const bySeason = calc.SEASON_COMPOST_REQUIREMENTS[state.season];
  return bySeason && bySeason[name] || [];
}

function defaultCycles(name) {
  const fig = calc.computeComposterFigures(name);
  return fig.timeVal > 0 ? Math.round(86400 / fig.timeVal) : 0;
}

function compute(name) {
  const fig = calc.computeComposterFigures(name);
  const reqs = seasonReqs(name);
  const costCycle = reqs.reduce((sum, r) => sum + (r.qty || 0) * ingredientFlower(r.item), 0);
  const outputCycle = fig.outputQty;
  const custom = state.cycles[name] > 0 ? state.cycles[name] : 0;
  const cycles = state.mode === "24h" ? custom > 0 ? custom : defaultCycles(name) : 1;
  return {
    name: name,
    fertilizer: fig.fertilizer,
    wormName: fig.wormName,
    timeSec: fig.timeVal,
    baseTimeSec: calc.BASE_COMPOSTERS[name].timeSec,
    outputCycle: outputCycle,
    wormCycle: fig.wormAvg,
    reqs: reqs,
    costCycle: costCycle,
    unitCost: outputCycle > 0 ? costCycle / outputCycle : 0,
    activeBoosts: fig.activeBoosts,
    mode: state.mode,
    cycles: cycles,
    cyclesCustom: state.mode === "24h" && custom > 0,
    totalOutput: outputCycle * cycles,
    totalWorms: fig.wormAvg * cycles,
    totalCost: costCycle * cycles,
    totalTimeSec: fig.timeVal * cycles
  };
}

function computeAll() {
  return state.selected.filter(n => calc.BASE_COMPOSTERS[n]).map(compute);
}

function totalsOf(rows) {
  const t = {
    cost: 0,
    output: 0,
    worms: 0
  };
  rows.forEach(r => {
    t.cost += r.totalCost;
    t.output += r.totalOutput;
    t.worms += r.totalWorms;
  });
  return t;
}

function seasonCardsHtml() {
  return calc.SEASON_ORDER.map(s => {
    const on = state.season === s;
    const icon = calc.SEASON_EMOJI[s];
    return `<button type="button" class="rc-season guro-frame${on ? " is-on" : ""}" data-rc-season="${s}" aria-pressed="${on ? "true" : "false"}">${icon}<span class="rc-season-name">${s}</span></button>`;
  }).join("");
}

function composterCellsHtml() {
  return composterNames().map(n => {
    const on = state.selected.includes(n);
    return `<label class="rc-crop guro-frame${on ? " is-on" : ""}"><span class="rc-crop-icon">${ui.getIcon(n)}</span><span class="rc-crop-name">${esc(n)}</span><input type="checkbox" data-rc-composter="${esc(n)}"${on ? " checked" : ""} aria-label="${esc(n)}"></label>`;
  }).join("");
}

function tilesHtml(rows) {
  if (!rows.length) return `<div class="rc-empty">No composters selected yet. Tick a composter above to include it in the calculation.</div>`;
  return `<div class="rc-tiles-wrap guro-frame"><div class="rc-tiles">${rows.map(r => `<div class="rc-tile guro-frame is-profit" data-rc-tile="${esc(r.name)}"><span class="rc-tile-icon">${ui.getIcon(r.name)}</span><span class="rc-tile-yield">+${n2(r.totalOutput)}${ui.getIcon(r.fertilizer)}</span><span class="rc-tile-net">${fl(r.totalCost)}${calc.FLOWER_ICON}</span></div>`).join("")}</div></div>`;
}

function valueBoxHtml(label, html, extra) {
  return `<div class="rc-val guro-frame${extra ? " " + extra : ""}"><span class="rc-val-label">${label}</span><span class="rc-val-num">${html}</span></div>`;
}

function valuesHtml(rows) {
  const t = totalsOf(rows);
  const unit = t.output > 0 ? t.cost / t.output : 0;
  return `<div class="rc-values">
    ${valueBoxHtml("Ingredient Cost", flowerHtml(t.cost))}
    ${valueBoxHtml("Fertiliser Output", n2(t.output))}
    ${valueBoxHtml("Worms (bait)", `~${n2(t.worms)}`)}
  </div>
  <div class="rc-net-row">
    ${valueBoxHtml("Cost / Fertiliser", flowerHtml(unit), "rc-val-net")}
    <button type="button" class="rc-linktext" data-rc-open="computation"${rows.length ? "" : " disabled"}>Computation</button>
  </div>`;
}

function modeNoteHtml() {
  const text = state.mode === "cycle" ? "Per Cycle Mode: shows the cost and output of one compost cycle for each selected composter." : "24Hrs Mode: runs each composter back to back for 24 hours. Use Edit in the computation to set your own cycle count.";
  return `<div class="rc-details-row"><button type="button" class="rc-linktext" data-rc-details aria-expanded="${detailsOpen ? "true" : "false"}">Details</button></div>${detailsOpen ? `<div class="rc-note">${text}</div>` : ""}`;
}

function pickerHtml() {
  return `<section class="rc-block guro-frame" aria-label="Composter Calculator">
    <div class="rc-block-title">Composter Calculator</div>
    <div class="rc-seasons" id="rcSeasons">${seasonCardsHtml()}</div>
    <div class="rc-crops" id="rcCrops">${composterCellsHtml()}</div>
  </section>`;
}

function resultsHtml() {
  const rows = computeAll();
  return `<section class="rc-block guro-frame" aria-label="Composter results">
    <div class="rc-modes" role="group" aria-label="Calculation mode">${MODES.map(m => `<button type="button" class="rc-mode guro-frame${state.mode === m.id ? " is-on" : ""}" data-rc-mode="${m.id}" aria-pressed="${state.mode === m.id ? "true" : "false"}">${m.label}</button>`).join("")}</div>
    <div class="rc-tools">
      <button type="button" class="rc-tool guro-frame" data-rc-open="skills">Skills</button>
      <button type="button" class="rc-tool guro-frame" data-rc-open="boost">Boost</button>
    </div>
    ${modeNoteHtml()}
    <div id="rcResults">${tilesHtml(rows)}${valuesHtml(rows)}</div>
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
  const picker = host.querySelector("#rcCrops");
  if (!picker) {
    render();
    return;
  }
  const blocks = host.querySelectorAll(".rc-block");
  if (blocks[1]) {
    const tmp = document.createElement("div");
    tmp.innerHTML = resultsHtml();
    blocks[1].replaceWith(tmp.firstElementChild);
  }
  if (popup === "computation") renderOverlayBody();
}

function effectParts(b) {
  const out = [];
  const time = [];
  const worm = [];
  if (b.fertMult) out.push(`×${n2(b.fertMult)} base fertiliser`);
  if (b.fertAdd) out.push(`${b.fertAdd > 0 ? "+" : ""}${n2(b.fertAdd)} fertiliser`);
  if (b.timeMult) time.push(`×${b.timeMult} time`);
  if (b.wormBaseMult) worm.push(`×${n2(b.wormBaseMult)} base worms`);
  if (b.wormAdd) worm.push(`${b.wormAdd > 0 ? "+" : ""}${n2(b.wormAdd)} worms`);
  return {
    output: out,
    time: time,
    worm: worm
  };
}

function appliedBoostHtml(row) {
  const groups = {
    output: [],
    time: [],
    worm: []
  };
  row.activeBoosts.forEach(b => {
    const p = effectParts(b);
    [ "output", "time", "worm" ].forEach(k => {
      if (p[k].length) groups[k].push(`<div class="rc-boost-row">${ui.getBoostIconSkillFallback(b.name)}<span class="rc-boost-name">${esc(b.name)}</span><span class="rc-boost-eff">${esc(p[k].join(", "))}</span></div>`);
    });
  });
  const section = (label, items) => items.length ? `<div class="rc-boost-group"><div class="rc-boost-label">${label}</div>${items.join("")}</div>` : "";
  const body = section("Output Boost", groups.output) + section("Time Boost", groups.time) + section("Worm Boost", groups.worm);
  return `<div class="rc-group"><div class="rc-comp-sub">Applied Boost</div>${body || `<div class="rc-boost-none">No boost applied</div>`}</div>`;
}

function kv(label, html, cls) {
  return `<div class="rc-kv${cls ? " " + cls : ""}"><span class="rc-kv-label">${label}</span><span class="rc-kv-val">${html}</span></div>`;
}

function totalCycleHtml(r) {
  const val = n2(r.cycles);
  if (r.mode !== "24h") return val;
  return `<span class="rc-cycle-val"><span>${val}${r.cyclesCustom ? ` <span class="rc-kv-sub">Custom</span>` : ""}</span><button type="button" class="rc-edit-link" data-rc-edit-cycle="${esc(r.name)}">Edit</button></span>`;
}

function reqLineHtml(r) {
  if (!r.reqs.length) return "—";
  return r.reqs.map(q => `<span class="rc-req-chip">${ui.getIcon(q.item)} ${n2(q.qty)}× ${esc(q.item)}</span>`).join(" + ");
}

function ingredientConfigHtml(r) {
  if (!r.reqs.length) return "";
  const rows = r.reqs.map(q => {
    const mode = ingredientMode(q.item);
    const btn = (m, label) => `<button type="button" class="es-mode-btn es-toolcfg-tbtn${mode === m ? " active" : ""}" data-rc-cmode="${esc(q.item)}" data-rc-cmode-val="${m}">${label}</button>`;
    return `<div class="rc-tool-mat"><span class="rc-tool-mat-item"><span class="rc-tool-mat-qty">${n2(q.qty)}</span>${ui.getIcon(q.item)}<span class="rc-tool-mat-name">${esc(q.item)}</span><span class="rc-kv-sub">${flowerHtml(q.qty * ingredientFlower(q.item))}</span></span><span class="es-toolcfg-tog">${btn("collect", "Collect")}${btn("buy", "Buy")}</span></div>`;
  }).join("");
  return `<div class="rc-group"><div class="rc-comp-sub">Ingredient Config</div><div class="rc-tool-cfg">${rows}</div></div>`;
}

function computationCardHtml(r) {
  const fert = ui.getIcon(r.fertilizer);
  const worm = ui.getIcon(r.wormName);
  const timeChanged = Math.round(r.timeSec) !== Math.round(r.baseTimeSec);
  const modeLabel = r.mode === "cycle" ? "Per Cycle Mode" : "24Hrs Mode";
  return `<article class="rc-comp-card guro-frame">
    <header class="rc-comp-head"><span class="rc-comp-icon">${ui.getIcon(r.name)}</span><span class="rc-comp-name">${esc(r.name)}</span><span class="rc-comp-nodes">${fert} ${esc(r.fertilizer)}</span></header>
    <div class="rc-group"><div class="rc-kv-grid">
      ${kv(`${esc(state.season)} Requirements`, reqLineHtml(r), "rc-kv-wide")}
      ${kv("Time / Cycle", `${esc(calc.formatDuration(r.timeSec))}${timeChanged ? `<span class="rc-kv-sub">${esc(calc.formatDuration(r.baseTimeSec))} base</span>` : ""}`, "rc-kv-wide")}
      ${kv("Ingredient Cost / Cycle", flowerHtml(r.costCycle))}
      ${kv("Output / Cycle", `${n2(r.outputCycle)}${fert}`)}
      ${kv("Worms / Cycle", `~${n2(r.wormCycle)}${worm}`)}
      ${kv("Cost / Fertiliser", flowerHtml(r.unitCost))}
    </div></div>
    <div class="rc-group"><div class="rc-comp-sub">${modeLabel}</div>
    <div class="rc-kv-grid">
      ${kv("Total Cycle", totalCycleHtml(r))}
      ${kv("Total Time", esc(calc.formatDuration(r.totalTimeSec)))}
      ${kv("Total Output", `${n2(r.totalOutput)}${fert}`)}
      ${kv("Total Worms", `~${n2(r.totalWorms)}${worm}`)}
      ${kv("Total Ingredient Cost", flowerHtml(r.totalCost), "rc-kv-wide rc-kv-net")}
    </div></div>
    ${ingredientConfigHtml(r)}
    ${appliedBoostHtml(r)}
  </article>`;
}

function computationBodyHtml() {
  const rows = computeAll();
  if (!rows.length) return `<div class="rc-empty">No composters selected.</div>`;
  return rows.map(computationCardHtml).join("");
}

function boostBodyHtml() {
  if (!state.selected.length) return `<div class="rc-empty">Select at least one composter to see the boosts that affect it.</div>`;
  const subjects = state.selected.map(n => ({
    name: n,
    icon: ui.getIcon(n),
    tier: ""
  }));
  const boosts = calc.BOOSTS.filter(b => b.category === "composter" && b.source !== "skill" && !b.hiddenFromOwnPanel);
  const appliesTo = (b, s) => {
    if (b.scope === "composterGlobal") return true;
    if (b.scope === "composter") return b.target === s.name;
    return false;
  };
  const html = boostsBySubjectHtml({
    subjects: subjects,
    boosts: boosts,
    appliesTo: appliesTo,
    unit: "composters",
    allLabel: "Boost for All Selected Composters"
  });
  return `<div class="rc-pop-hint">Boosts that affect ${state.selected.length > 1 ? "your selected composters" : esc(state.selected[0])}. Tap a boost to switch it on or off, then press Save.</div>${html || `<div class="rc-empty">No boosts found.</div>`}`;
}

function popupTitle() {
  if (popup === "skills") return "Composter Skills";
  if (popup === "boost") return "Composter Boosts";
  return "Computation";
}

function popupBodyHtml() {
  if (popup === "boost") return boostBodyHtml();
  if (popup === "computation") return computationBodyHtml();
  return `<div class="rc-pop-hint">All composter skills from the Skill Tree. Changes here also change the Skill Tree. Press Save to apply them.</div><div id="rcSkillSlot"></div>`;
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
    calc.setSkillCategory("compost");
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
  return false;
}

function openPopup(kind) {
  if (popup) return;
  popup = kind;
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
  document.body.classList.remove("rc-no-scroll");
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

function closeCycleEditor() {
  if (promptEl) promptEl.remove();
  promptEl = null;
}

function openCycleEditor(name) {
  if (promptEl) promptEl.remove();
  const current = state.cycles[name] > 0 ? state.cycles[name] : "";
  const fallback = defaultCycles(name);
  promptEl = document.createElement("div");
  promptEl.className = "rc-overlay rc-overlay-top";
  promptEl.innerHTML = `<div class="rc-prompt rc-cycle-edit guro-frame" role="dialog" aria-modal="true" aria-label="Editing Cycle"><div class="rc-cycle-edit-label">Editing Cycle</div><div class="rc-cycle-edit-row"><input type="number" min="0" max="${MAX_CUSTOM_CYCLES}" step="1" inputmode="numeric" class="rc-cycle-input guro-frame" data-rc-cycle-input value="${current}" placeholder="${fallback}" aria-label="Cycle count"><button type="button" class="rc-prompt-btn guro-frame" data-rc-cycle-save>Save</button></div></div>`;
  promptEl.addEventListener("click", e => {
    if (e.target === promptEl) {
      closeCycleEditor();
      return;
    }
    if (e.target.closest("[data-rc-cycle-save]")) saveCycleEdit(name);
  });
  promptEl.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveCycleEdit(name);
    }
  });
  document.body.appendChild(promptEl);
  const input = promptEl.querySelector("[data-rc-cycle-input]");
  if (input) {
    input.focus();
    input.select();
  }
}

function saveCycleEdit(name) {
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
    if (isFinite(value) && value > 0) state.cycles[name] = Math.min(value, MAX_CUSTOM_CYCLES); else delete state.cycles[name];
    saveState();
    closeCycleEditor();
    refreshResults();
    chip.classList.add("is-done");
    chip.innerHTML = `<span class="bg-sim-tick">✓</span><span class="bg-sim-saving-text">Saved</span>`;
    setTimeout(() => chip.remove(), 900);
  }, 700);
}

function toggleComposter(name, input) {
  const idx = state.selected.indexOf(name);
  if (idx >= 0) state.selected.splice(idx, 1); else state.selected.push(name);
  saveState();
  const label = input ? input.closest(".rc-crop") : null;
  if (label) label.classList.toggle("is-on", state.selected.includes(name));
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

function onChange(e) {
  const t = e.target;
  if (t && t.dataset && t.dataset.rcComposter != null) toggleComposter(t.dataset.rcComposter, t);
}

function onDocClick(e) {
  if (!overlayEl) return;
  if (promptEl && promptEl.contains(e.target)) return;
  if (e.target === overlayEl || e.target.closest("[data-rc-close]")) {
    closePopup(false);
    return;
  }
  if (!overlayEl.contains(e.target)) return;
  const cmode = e.target.closest("[data-rc-cmode]");
  if (cmode && popup === "computation") {
    calc.setMaterialMode("Composter", cmode.getAttribute("data-rc-cmode"), cmode.getAttribute("data-rc-cmode-val"));
    prices.invalidateCostCache();
    renderOverlayBody();
    refreshResults();
    return;
  }
  const editCycle = e.target.closest("[data-rc-edit-cycle]");
  if (editCycle && popup === "computation") {
    openCycleEditor(editCycle.getAttribute("data-rc-edit-cycle"));
    return;
  }
  const row = e.target.closest("[data-boost-id]");
  if (row && popup === "boost" && overlayEl.contains(row)) {
    ui.draftToggleBoost(row.getAttribute("data-boost-id"));
    renderOverlayBody();
  }
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

export function mountComposterCalculator(root) {
  host = root;
  prices.invalidateCostCache();
  state = loadState();
  detailsOpen = false;
  host.addEventListener("click", onClick);
  host.addEventListener("change", onChange);
  document.addEventListener("click", onDocClick);
  document.addEventListener("keydown", onKey);
  window.addEventListener("guroBoostsChanged", onBoostsChanged);
  window.addEventListener("guroPricesUpdated", onExternalChange);
  listening = true;
  render();
}

export function unmountComposterCalculator() {
  if (popup) destroyPopup();
  if (promptEl) {
    promptEl.remove();
    promptEl = null;
  }
  if (host) {
    host.removeEventListener("click", onClick);
    host.removeEventListener("change", onChange);
    host.innerHTML = "";
  }
  if (listening) {
    document.removeEventListener("click", onDocClick);
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("guroBoostsChanged", onBoostsChanged);
    window.removeEventListener("guroPricesUpdated", onExternalChange);
    listening = false;
  }
  host = null;
}

export function composterCalculatorCanLeave() {
  if (!popup) return true;
  if (isPopupDirty()) {
    calc.toast("⚠️ Save your changes first");
    return false;
  }
  destroyPopup();
  return true;
}
