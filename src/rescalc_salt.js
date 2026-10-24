import * as calc from "./calculator.js";
import * as prices from "./prices.js";
import * as ui from "./ui.js";
import { boostsBySubjectHtml } from "./rescalc_boosts.js";
import { farmPanelGetMarketPriceFlower } from "./inprogress.js";
import { applySelection, currentRatio } from "./gem_packs.js";
import { toolRestockShareCount, toolRestockIconsHtml } from "./rescalc_shared.js";
import { loadBaseSaltMarketIfNeeded } from "./storage.js";

const STORE_KEY = "guro_rc_salt_v1";

const MAX_CUSTOM_CYCLES = 100000;

const RAKE_TOOL_ID = "default_salt_rake";

const RAKE_MODE_KEY = "ToolLib_" + RAKE_TOOL_ID;

const MODES = [ {
  id: "restock",
  label: "Per Restock Mode"
}, {
  id: "24h",
  label: "24Hrs Mode"
} ];

let host = null;
let api = null;
let state = null;
let popup = null;
let overlayEl = null;
let promptEl = null;
let restoreFns = [];
let nodesDraft = null;
let listening = false;
let detailsOpen = false;

function esc(s) {
  return calc.escapeHtml(String(s));
}

function loadState() {
  const base = {
    mode: "restock",
    cycles: 0
  };
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (raw && typeof raw === "object") {
      if (raw.mode === "24h" || raw.mode === "restock") base.mode = raw.mode;
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

function gemHtml(n) {
  return `${n2(n)}${calc.GEM_ICON}`;
}

function ratioInfo() {
  const fpg = calc.flowerPerGem();
  return {
    free: !(fpg > 0),
    gemsPerFlower: fpg > 0 ? 1 / fpg : 0
  };
}

function syncGemRatio() {
  try {
    const want = currentRatio();
    const fpg = calc.flowerPerGem();
    const have = fpg > 0 ? 1 / fpg : 0;
    const same = want.free ? !(fpg > 0) : Math.abs(want.gems - have) < 1e-6;
    if (!same) applySelection();
  } catch (e) {}
}

function rakeBoosts() {
  return calc.BOOSTS.filter(b => b.category === "tools" && b.scope === "tool" && b.target === "Salt Rake" && calc.isBoostActive(b.id));
}

function rakeRecipe() {
  const item = calc.findTool(RAKE_TOOL_ID);
  if (!item) return null;
  const boosted = calc.getBoostedToolRecipe(item);
  return {
    item: item,
    coinCost: boosted.coinCost,
    materials: boosted.materials.map(m => ({
      name: m.name,
      qty: m.qty,
      mode: calc.getMaterialMode(RAKE_MODE_KEY, m.name)
    }))
  };
}

function compute(mode, share) {
  const fig = calc.computeSaltFarmFigures();
  const eff = fig.eff;
  const sb = fig.seaBlessed;
  const nodes = fig.nodeCount;
  const sell = farmPanelGetMarketPriceFlower("Salt") || fig.sellFlower || 0;
  const feeRate = (calc.feePercent || 0) / 100;
  const regrowChance = sb.active ? sb.offspring : 0;
  const avgHarvests = sb.harvestMult;
  const freeRake = prices.hasFreeSaltRakeCost();
  const toolUse = freeRake ? 0 : nodes * avgHarvests;
  const baseYieldCycle = nodes * fig.yieldPerCharge;
  const yieldCycle = baseYieldCycle * avgHarvests;
  const toolUnit = calc.coinsToFlower(fig.rakeCoinCost);
  const shrine = prices.getActiveShrineDailyCost(fig.activeBoosts);
  const stockBase = calc.BASE_STOCK_TOOLS["Salt Rake"] || 0;
  const stockQty = stockBase ? calc.computeBoostedStock(stockBase, "tool", "Salt Rake") : 0;
  const gemPerRestock = prices.getRestockGemCostIndividual("tool");
  const fullRestockFlower = calc.gemsToFlower(gemPerRestock);
  const recipe = rakeRecipe();
  const grossCycle = yieldCycle * sell;
  const costCycle = toolUnit * toolUse;
  const shrineCycle = shrine.total * fig.timeSec / 86400;
  const out = {
    nodes: nodes,
    timeSec: fig.timeSec,
    yieldCharge: fig.yieldPerCharge,
    yieldBonus: fig.saltYieldBonus,
    storedChargeCap: fig.storedChargeCap,
    regrowChance: regrowChance,
    regrowRank: sb.rank,
    regrowMaxRank: sb.maxRank,
    regrowTargets: sb.targets,
    avgHarvests: avgHarvests,
    extraNodesCycle: nodes * (avgHarvests - 1),
    extraYieldCycle: yieldCycle - baseYieldCycle,
    toolUse: toolUse,
    yieldCycle: yieldCycle,
    sell: sell,
    toolUnit: toolUnit,
    grossCycle: grossCycle,
    costCycle: costCycle,
    shrineCycle: shrineCycle,
    feeRate: feeRate,
    gemPerRestock: gemPerRestock,
    fullRestockFlower: fullRestockFlower,
    stockQty: stockQty,
    recipe: recipe,
    manualRake: !!(recipe && recipe.item.manualPrice != null && !recipe.item.locked),
    freeTool: freeRake,
    eff: eff,
    activeBoosts: fig.activeBoosts.concat(rakeBoosts()),
    shareCount: share,
    mode: mode
  };
  const customCycles = state.cycles > 0 ? state.cycles : 0;
  let cycles = 0;
  let toolUses = 0;
  let totalTimeSec = 0;
  let restockQty = 0;
  let restockGems = 0;
  let restockCost = 0;
  let shrineTotal = 0;
  if (nodes > 0 && yieldCycle > 0) {
    if (mode === "restock") {
      if (toolUse > 0) {
        toolUses = stockQty;
        cycles = stockQty / toolUse;
        restockQty = stockQty > 0 ? 1 : 0;
      } else {
        cycles = 1;
      }
      totalTimeSec = cycles * fig.timeSec;
      shrineTotal = shrine.total * totalTimeSec / 86400;
      restockGems = restockQty ? gemPerRestock / Math.max(1, share) : 0;
      restockCost = restockQty ? fullRestockFlower / Math.max(1, share) : 0;
    } else {
      cycles = customCycles > 0 ? customCycles : Math.round(86400 / fig.timeSec);
      toolUses = toolUse * cycles;
      totalTimeSec = customCycles > 0 ? cycles * fig.timeSec : 86400;
      shrineTotal = shrine.total * totalTimeSec / 86400;
      restockQty = stockQty > 0 && toolUses > 0 ? Math.ceil(toolUses / stockQty - 1e-9) : 0;
      restockGems = restockQty * gemPerRestock / Math.max(1, share);
      restockCost = calc.gemsToFlower(restockGems);
    }
  }
  const totalYield = yieldCycle * cycles;
  const gross = totalYield * sell;
  const fee = gross * feeRate;
  const costTotal = toolUnit * toolUses;
  out.cycles = cycles;
  out.cyclesCustom = mode === "24h" && customCycles > 0;
  out.extraNodes = out.extraNodesCycle * cycles;
  out.extraYield = out.extraYieldCycle * cycles;
  out.toolUses = toolUses;
  out.totalTimeSec = totalTimeSec;
  out.totalYield = totalYield;
  out.gross = gross;
  out.fee = fee;
  out.cost = costTotal;
  out.shrine = shrineTotal;
  out.restock = restockCost;
  out.restockQty = restockQty;
  out.restockGems = restockGems;
  out.net = gross - fee - costTotal - shrineTotal - restockCost;
  out.restockCycle = cycles > 0 ? restockCost / cycles : 0;
  out.netCycle = grossCycle * (1 - feeRate) - costCycle - shrineCycle - out.restockCycle;
  return out;
}

function computeRow() {
  syncGemRatio();
  prices.invalidateCostCache();
  return compute(state.mode, toolRestockShareCount());
}

function pickerHtml() {
  return `<section class="rc-block guro-frame" aria-label="Salt Calculator">
    <div class="rc-block-title">Salt Calculator</div>
    <div class="rc-crops" id="rcCrops"><div class="rc-crop guro-frame is-on"><span class="rc-crop-icon">${ui.getIcon("Salt")}</span><span class="rc-crop-name">Salt</span></div></div>
  </section>`;
}

function valueBoxHtml(label, html, extra) {
  return `<div class="rc-val guro-frame${extra ? " " + extra : ""}"><span class="rc-val-label">${label}</span><span class="rc-val-num">${html}</span></div>`;
}

function tilesHtml(r) {
  const good = r.net >= 0;
  return `<div class="rc-tiles-wrap guro-frame"><div class="rc-tiles"><div class="rc-tile guro-frame ${good ? "is-profit" : "is-loss"}"><span class="rc-tile-icon">${ui.getIcon("Salt")}</span><span class="rc-tile-yield">${signed(r.totalYield, n2)}</span><span class="rc-tile-net">${fl(r.gross)}${calc.FLOWER_ICON}</span></div></div></div>`;
}

function valuesHtml(r) {
  const feeBox = (calc.feePercent || 0) > 0 ? valueBoxHtml("Market Fee", flowerHtml(r.fee)) : "";
  return `<div class="rc-values">
    ${valueBoxHtml("Gross", flowerHtml(r.gross))}
    ${valueBoxHtml("Tool Cost", flowerHtml(r.cost))}
    ${valueBoxHtml("Shrine Cost", flowerHtml(r.shrine))}
    ${valueBoxHtml("Restock Cost", flowerHtml(r.restock))}
    ${feeBox}
  </div>
  <div class="rc-net-row">
    ${valueBoxHtml("Net", `<span class="${r.net >= 0 ? "is-profit" : "is-loss"}">${signed(r.net, fl)}${calc.FLOWER_ICON}</span>`, "rc-val-net")}
    <button type="button" class="rc-linktext" data-rc-open="computation">Computation</button>
  </div>`;
}

function modeNoteHtml(r) {
  const warn = r.nodes <= 0 ? `<div class="rc-note is-warn">You have 0 Salt nodes, so every result is 0. Open Nodes above and enter your nodes.</div>` : "";
  const text = state.mode === "restock" ? `Per Restock Mode: the Salt Rake stock is used up and 1 restock is shared by all ${toolRestockShareCount()} tools ${toolRestockIconsHtml()}, selected or not.` : `24Hrs Mode: the nodes are harvested all day and every restock needed is shared by all ${toolRestockShareCount()} tools ${toolRestockIconsHtml()}, selected or not.`;
  return `<div class="rc-details-row"><button type="button" class="rc-linktext" data-rc-details aria-expanded="${detailsOpen ? "true" : "false"}">Details</button></div>${detailsOpen ? `<div class="rc-note">${text}</div>` : ""}${warn}`;
}

function resultsHtml() {
  const r = computeRow();
  return `<section class="rc-block guro-frame" aria-label="Salt results">
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

function kv(label, html, cls) {
  return `<div class="rc-kv${cls ? " " + cls : ""}"><span class="rc-kv-label">${label}</span><span class="rc-kv-val">${html}</span></div>`;
}

function matPrice(name) {
  return farmPanelGetMarketPriceFlower(name) || 0;
}

function matRowHtml(name, qty, price, badge) {
  return `<div class="rc-mat-row"><span class="rc-mat-main">${ui.getIcon(name)}<span class="rc-mat-name">${esc(name)}</span><span class="rc-mat-qty">×${n2(qty)}</span><span class="rc-mat-val">(${flowerHtml(qty * price)})</span></span><span class="rc-badge">${badge}</span></div>`;
}

function appliedBoostHtml(r) {
  const groups = {
    yield: [],
    time: [],
    cost: [],
    regrow: []
  };
  const list = r.activeBoosts.slice();
  const artist = calc.BOOSTS.find(b => b.id === "artist_discount");
  if (artist && calc.isBoostActive(artist.id) && !list.includes(artist)) list.push(artist);
  const row = (b, text) => `<div class="rc-boost-row">${ui.getBoostIconAnyFallback(b.name)}<span class="rc-boost-name">${esc(b.name)}</span><span class="rc-boost-eff">${esc(text)}</span></div>`;
  list.forEach(b => {
    if (b.id === "skill_sea_blessed") {
      groups.regrow.push(row(b, `${n2(r.regrowChance * 100)}% instant regrow`));
      return;
    }
    if (b.saltYieldAdd) groups.yield.push(row(b, `+${n2(b.saltYieldAdd)} yield`));
    if (b.saltRechargeTimeMult) groups.time.push(row(b, `×${b.saltRechargeTimeMult} time`));
    const cost = [];
    if (b.freeCost) cost.push("free tool");
    if (b.toolCostMult) cost.push(`×${b.toolCostMult} tool cost`);
    if (b.coinCostMult) cost.push(`×${b.coinCostMult} tool cost`);
    if (cost.length) groups.cost.push(row(b, cost.join(", ")));
  });
  const section = (label, items) => items.length ? `<div class="rc-boost-group"><div class="rc-boost-label">${label}</div>${items.join("")}</div>` : "";
  const body = section("Yield Boost", groups.yield) + section("Time Boost", groups.time) + section("Tool Boost", groups.cost) + section("Instant Regrow", groups.regrow);
  return `<div class="rc-group"><div class="rc-comp-sub">Applied Boost</div>${body || `<div class="rc-boost-none">No boost applied</div>`}</div>`;
}

function sculptureHtml(r) {
  const total = calc.SCULPTURE_LEVELS.length;
  const level = calc.saltSculptureLevel;
  const chips = [ 0, 1, 2, 3, 4, 5, 6 ].map(n => `<button type="button" class="rc-lvl es-mode-btn es-toolcfg-tbtn${level === n ? " active" : ""}" data-rc-sculpt-level="${n}" aria-pressed="${level === n ? "true" : "false"}">${n}</button>`).join("");
  const perks = calc.SCULPTURE_EFFECTS_LIST.map((text, i) => {
    const lv = i + 1;
    const on = calc.isSculpturePerkOn(lv);
    return `<div class="rc-perk-row guro-frame${on ? " is-on" : ""}"><span class="rc-perk-lv">Lv.${lv}</span><span class="rc-perk-text">${esc(text)}</span><button type="button" class="es-mode-btn es-toolcfg-tbtn${on ? " active" : ""}" data-rc-perk="${lv}" aria-pressed="${on ? "true" : "false"}">${on ? "On" : "Off"}</button></div>`;
  }).join("");
  return `<div class="rc-group"><div class="rc-comp-sub">Sculpture</div>
    <div class="rc-sculpt-head"><span class="rc-sculpt-icon">${ui.getIcon("Salt Sculpture")}</span><span class="rc-sculpt-name">Salt Sculpture</span><span class="rc-sculpt-level">Level ${n2(level)}/${total}</span></div>
    <div class="rc-lvl-row">${chips}</div>
    <div class="rc-perks">${perks}</div>
    <div class="rc-boost-none">Tap a level to set it, then switch each perk On or Off.</div>
  </div>`;
}

function toolCostConfigHtml(r) {
  if (r.freeTool) return `<div class="rc-group"><div class="rc-comp-sub">Tool Cost Config</div><div class="rc-boost-none">Free tool</div></div>`;
  if (!r.recipe || r.manualRake) return `<div class="rc-group"><div class="rc-comp-sub">Tool Cost Config</div><div class="rc-tool-cfg"><div class="rc-tool-name">${ui.getIcon("Salt Rake")}<span>Salt Rake</span></div><div class="rc-tool-mat"><span class="rc-tool-mat-item"><span class="rc-tool-mat-qty">${fl(r.toolUnit)}</span>${calc.FLOWER_ICON}</span></div></div></div>`;
  const btn = (m, mode, label) => `<button type="button" class="es-mode-btn es-toolcfg-tbtn${m.mode === mode ? " active" : ""}" data-rc-mat="${esc(m.name)}" data-rc-mode="${mode}">${label}</button>`;
  const rows = r.recipe.materials.map(m => {
    const tog = m.name.toLowerCase() === "oil" ? `<span class="es-toolcfg-free">Always Collect</span>` : `<span class="es-toolcfg-tog">${btn(m, "collect", "Collect")}${btn(m, "buy", "Buy")}</span>`;
    return `<div class="rc-tool-mat"><span class="rc-tool-mat-item"><span class="rc-tool-mat-qty">${n2(m.qty)}</span>${ui.getIcon(m.name)}</span>${tog}</div>`;
  }).join("");
  const coinRow = r.recipe.coinCost > 0 ? `<div class="rc-tool-mat"><span class="rc-tool-mat-item"><span class="rc-tool-mat-qty">${n2(r.recipe.coinCost)}</span>${calc.COIN_ICON}</span></div>` : "";
  const disc = r.eff.rakeCostMult < 1 ? `<div class="rc-boost-none">Sculpture Lv.4 rake discount ×${r.eff.rakeCostMult} applied to the total.</div>` : "";
  return `<div class="rc-group"><div class="rc-comp-sub">Tool Cost Config</div>
    <div class="rc-tool-cfg"><div class="rc-tool-name">${ui.getIcon("Salt Rake")}<span>Salt Rake</span></div>${coinRow}${rows}</div>${disc}</div>`;
}

function materialsHtml(r) {
  const modeBadge = r.mode === "restock" ? "Per Restock" : "24hr";
  const mats = r.recipe ? r.recipe.materials.filter(m => m.qty > 0) : [];
  const matRows = !mats.length || r.toolUse <= 0 ? `<div class="rc-boost-none">No material used</div>` : mats.map(m => {
    const p = matPrice(m.name);
    return matRowHtml(m.name, m.qty * r.toolUse, p, "1 cycle") + matRowHtml(m.name, m.qty * r.toolUses, p, modeBadge);
  }).join("");
  const yieldRows = matRowHtml("Salt", r.yieldCycle, r.sell, "1 cycle") + matRowHtml("Salt", r.totalYield, r.sell, modeBadge);
  return `<div class="rc-mat-section rc-group"><div class="rc-boost-label">Material Used</div>${matRows}</div>
    <div class="rc-mat-section rc-group"><div class="rc-boost-label">Salt Yield</div>${yieldRows}</div>`;
}

function totalCycleHtml(r) {
  if (r.mode !== "24h") return n2(r.cycles);
  return `<span class="rc-cycle-val"><span>${n2(r.cycles)}${r.cyclesCustom ? ` <span class="rc-kv-sub">Custom</span>` : ""}</span><button type="button" class="rc-edit-link" data-rc-edit-cycle="Salt">Edit</button></span>`;
}

function computationCardHtml(r) {
  const ratio = ratioInfo();
  const modeLabel = r.mode === "restock" ? "Per Restock Mode" : "24Hrs Mode";
  const qtyLabel = r.mode === "restock" ? `×${r.restockQty} Restock` : `×${n2(r.restockQty)} Restock${r.restockQty === 1 ? "" : "s"}`;
  const ratioLine = ratio.free ? `Free gems` : `1${calc.FLOWER_ICON} : ${n2(ratio.gemsPerFlower)}${calc.GEM_ICON}`;
  const shareLine = r.shareCount > 1 ? `<div class="rc-kv rc-kv-wide"><span class="rc-kv-label">Your share of ${r.mode === "restock" ? "1 restock" : "each restock"}</span><span class="rc-kv-val">1/${r.shareCount} = ${flowerHtml(r.restock)}</span></div>` : "";
  const yieldNote = r.yieldBonus ? `<span class="rc-kv-sub">${n2(r.yieldCharge - r.yieldBonus)} + ${n2(r.yieldBonus)}</span>` : "";
  return `<article class="rc-comp-card guro-frame">
    <header class="rc-comp-head"><span class="rc-comp-icon">${ui.getIcon("Salt")}</span><span class="rc-comp-name">Salt</span><span class="rc-comp-nodes">${ui.getIcon("Salt")} ${n2(r.nodes)}</span></header>
    <div class="rc-group"><div class="rc-kv-grid">
      ${kv("Yield / Charge", `${signed(r.yieldCharge, n2)}${ui.getIcon("Salt")}${yieldNote}`, "rc-kv-wide")}
      ${kv("Recovery Time", esc(calc.formatDuration(r.timeSec)), "rc-kv-wide")}
      ${kv("Max Stored Charges", `${n2(r.storedChargeCap)} / node`, "rc-kv-wide")}
      ${r.regrowChance > 0 ? kv("Instant Regrow Chance", `${n2(r.regrowChance * 100)}%`) : ""}
      ${r.regrowChance > 0 ? kv("Avg Harvests / Node", `×${n2(r.avgHarvests)}`) : ""}
      ${r.regrowChance > 0 ? kv("Extra Nodes / Cycle", `${signed(r.extraNodesCycle, n2)}${ui.getIcon("Salt")}`) : ""}
      ${r.regrowChance > 0 ? kv("Extra Yield / Cycle", `${signed(r.extraYieldCycle, n2)}${ui.getIcon("Salt")}`) : ""}
      ${kv("Rakes / Cycle", `${n2(r.toolUse)}${ui.getIcon("Salt Rake")}`)}
      ${kv("Yield / Cycle", `${signed(r.yieldCycle, n2)}${ui.getIcon("Salt")}`)}
      ${kv("Market Price / Unit", flowerSigned(r.sell))}
      ${kv("Gross / Cycle", flowerSigned(r.grossCycle))}
      ${kv("Tool Cost / Tool", flowerHtml(r.toolUnit))}
      ${kv("Tool Cost / Cycle", flowerHtml(r.costCycle))}
      ${kv("Shrine / Cycle", flowerHtml(r.shrineCycle))}
      ${kv("Restock / Cycle", flowerHtml(r.restockCycle))}
      ${kv("Net / Cycle", `<span class="${r.netCycle >= 0 ? "is-profit" : "is-loss"}">${signed(r.netCycle, fl)}${calc.FLOWER_ICON}</span>`, "rc-kv-wide")}
    </div></div>
    <div class="rc-group"><div class="rc-comp-sub">${modeLabel}</div>
    <div class="rc-kv-grid">
      ${kv("Total Cycle", totalCycleHtml(r))}
      ${kv("Rakes Used", `${n2(r.toolUses)}${ui.getIcon("Salt Rake")}`)}
      ${kv("Total Yield", `${signed(r.totalYield, n2)}${ui.getIcon("Salt")}`)}
      ${r.regrowChance > 0 ? kv("Extra Nodes", `${signed(r.extraNodes, n2)}${ui.getIcon("Salt")}`) : ""}
      ${r.regrowChance > 0 ? kv("Extra Yield", `${signed(r.extraYield, n2)}${ui.getIcon("Salt")}`) : ""}
      ${kv("Total Gross", flowerSigned(r.gross))}
      ${kv("Total Tool Cost", flowerHtml(r.cost))}
      ${kv("Total Shrine Cost", flowerHtml(r.shrine))}
      ${kv("Total Restock Cost", flowerHtml(r.restock))}
      ${kv("Restock Quantity", qtyLabel)}
      ${kv("Cost / Restock", `${gemHtml(r.gemPerRestock)}<span class="rc-kv-sub">${ratioLine}</span>`)}
      ${kv("Gems Used", `${gemHtml(r.restockGems)} = ${flowerHtml(r.restock)}`, "rc-kv-wide")}
      ${shareLine}
      ${r.feeRate > 0 ? kv("Market Fee", flowerHtml(r.fee)) : ""}
      ${kv("Total Net", `<span class="${r.net >= 0 ? "is-profit" : "is-loss"}">${signed(r.net, fl)}${calc.FLOWER_ICON}</span>`, "rc-kv-wide rc-kv-net")}
    </div></div>
    ${sculptureHtml(r)}
    ${appliedBoostHtml(r)}
    ${toolCostConfigHtml(r)}
    ${materialsHtml(r)}
  </article>`;
}

function computationBodyHtml() {
  return computationCardHtml(computeRow());
}

function boostBodyHtml() {
  const boosts = calc.BOOSTS.filter(b => b.source !== "skill" && !b.hiddenFromOwnPanel && (b.category === "salt" && b.scope === "saltGlobal" || b.category === "tools" && b.scope === "tool" && b.target === "Salt Rake"));
  const html = boostsBySubjectHtml({
    subjects: [ {
      name: "Salt",
      icon: ui.getIcon("Salt")
    } ],
    boosts: boosts,
    appliesTo: () => true,
    unit: "nodes",
    noteSkip: /Salt|Rake|AOE|expected/i,
    allLabel: "Boost for Salt"
  });
  return `<div class="rc-pop-hint">Boosts that affect Salt. Tap a boost to switch it on or off, then press Save.</div>${html || `<div class="rc-empty">No boosts found.</div>`}`;
}

function currentNodeValue() {
  return calc.getNodeCount("Salt") || 0;
}

function nodeValue() {
  if (nodesDraft && Object.prototype.hasOwnProperty.call(nodesDraft, "nodes")) return nodesDraft.nodes;
  return currentNodeValue();
}

function levelValue() {
  if (nodesDraft && Object.prototype.hasOwnProperty.call(nodesDraft, "level")) return nodesDraft.level;
  return calc.saltFarmLevel;
}

function nodesBodyHtml() {
  const maxLevel = calc.FARM_LEVEL_NODES.length;
  const level = Math.max(1, Math.min(maxLevel, Math.floor(Number(levelValue())) || 1));
  const cap = calc.FARM_LEVEL_NODES[level - 1];
  return `<div class="rc-pop-hint">Enter your Salt Farm level and how many Salt nodes you have, then press Save. A level ${level} farm holds up to ${cap} node${cap === 1 ? "" : "s"}.</div>
    <label class="rc-node-row guro-frame"><span class="rc-node-icon">${ui.getIcon("Salt")}</span><span class="rc-node-text"><span class="rc-node-name">Salt Farm Level</span><span class="rc-node-used">1 to ${maxLevel}</span></span><input type="number" min="1" max="${maxLevel}" step="1" inputmode="numeric" data-rc-salt-level value="${level}"></label>
    <label class="rc-node-row guro-frame"><span class="rc-node-icon">${ui.getIcon("Salt")}</span><span class="rc-node-text"><span class="rc-node-name">Salt Node</span><span class="rc-node-used">Used by: Salt</span></span><input type="number" min="0" max="${cap}" step="1" inputmode="numeric" data-rc-salt-nodes value="${nodeValue()}"></label>`;
}

function popupTitle() {
  if (popup === "skills") return "Salt Skills";
  if (popup === "boost") return "Salt Boosts";
  if (popup === "nodes") return "Salt Nodes";
  return "Computation";
}

function popupBodyHtml() {
  if (popup === "boost") return boostBodyHtml();
  if (popup === "nodes") return nodesBodyHtml();
  if (popup === "computation") return computationBodyHtml();
  return `<div class="rc-pop-hint">Aging skills from the Skill Tree that change Salt. Changes here also change the Skill Tree. Press Save to apply them.</div><div id="rcSkillSlot"></div>`;
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

let savedSkillCategory = null;

function setupBorrowed() {
  if (popup === "skills") {
    savedSkillCategory = calc.skillCategory;
    calc.setSkillCategory("aging");
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
  if (popup === "nodes") {
    if (!nodesDraft) return false;
    const levelChanged = Object.prototype.hasOwnProperty.call(nodesDraft, "level") && Number(nodesDraft.level) !== calc.saltFarmLevel;
    const nodesChanged = Object.prototype.hasOwnProperty.call(nodesDraft, "nodes") && Number(nodesDraft.nodes) !== currentNodeValue();
    return levelChanged || nodesChanged;
  }
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
  const fig = calc.computeSaltFarmFigures();
  const current = state.cycles > 0 ? state.cycles : "";
  const fallback = fig && fig.timeSec > 0 ? Math.round(86400 / fig.timeSec) : 0;
  promptEl = document.createElement("div");
  promptEl.className = "rc-overlay rc-overlay-top";
  promptEl.innerHTML = `<div class="rc-prompt rc-cycle-edit guro-frame" role="dialog" aria-modal="true" aria-label="Editing Cycle"><div class="rc-cycle-edit-label">Editing Cycle</div><div class="rc-cycle-edit-row"><input type="number" min="0" max="${MAX_CUSTOM_CYCLES}" step="1" inputmode="numeric" data-rc-cycle-input value="${current}" placeholder="${fallback}"><button type="button" class="rc-prompt-btn guro-frame" data-rc-cycle-save>Save</button></div></div>`;
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
  const draft = nodesDraft || {};
  const maxLevel = calc.FARM_LEVEL_NODES.length;
  if (Object.prototype.hasOwnProperty.call(draft, "level")) {
    calc.setSaltFarmLevel(Math.max(1, Math.min(maxLevel, Math.floor(Number(draft.level)) || 1)));
  }
  if (Object.prototype.hasOwnProperty.call(draft, "nodes")) {
    const v = Math.max(0, Math.floor(Number(draft.nodes) || 0));
    calc.setNodeCount("Salt", Math.min(v, calc.farmLevelMaxNodes()));
  }
  prices.invalidateCostCache();
  ui.renderLibraryLists();
  ui.renderBoostPanel();
  calc.updateCalcSummary();
  nodesDraft = null;
  calc.toast("✅ Salt nodes saved");
  renderOverlayBody();
  refreshResults();
}

function setMode(id) {
  if (id === state.mode) return;
  state.mode = id;
  saveState();
  refreshResults();
}

function sculptureChanged() {
  prices.invalidateCostCache();
  renderOverlayBody();
  refreshResults();
}

function onClick(e) {
  const details = e.target.closest("[data-rc-details]");
  if (details) {
    detailsOpen = !detailsOpen;
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
  const editCycle = e.target.closest("[data-rc-edit-cycle]");
  if (editCycle && popup === "computation") {
    openCycleEditor();
    return;
  }
  const lvl = e.target.closest("[data-rc-sculpt-level]");
  if (lvl && popup === "computation") {
    calc.setSculptureLevel(Number(lvl.getAttribute("data-rc-sculpt-level")));
    sculptureChanged();
    return;
  }
  const perk = e.target.closest("[data-rc-perk]");
  if (perk && popup === "computation") {
    const i = Number(perk.getAttribute("data-rc-perk"));
    calc.setSculpturePerk(i, !calc.isSculpturePerkOn(i));
    sculptureChanged();
    return;
  }
  const matBtn = e.target.closest("[data-rc-mat]");
  if (matBtn && popup === "computation") {
    calc.setMaterialMode(RAKE_MODE_KEY, matBtn.getAttribute("data-rc-mat"), matBtn.getAttribute("data-rc-mode"));
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
  const t = e.target;
  if (!t || !t.dataset) return;
  if (t.dataset.rcSaltNodes != null) {
    nodesDraft = nodesDraft || {};
    nodesDraft.nodes = t.value === "" ? 0 : Number(t.value);
  }
  if (t.dataset.rcSaltLevel != null) {
    nodesDraft = nodesDraft || {};
    nodesDraft.level = t.value === "" ? 1 : Number(t.value);
  }
}

function onDocChange(e) {
  const t = e.target;
  if (popup === "nodes" && t && t.dataset && t.dataset.rcSaltLevel != null) renderOverlayBody();
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

export function mountSaltCalculator(root, appApi) {
  host = root;
  api = appApi;
  prices.invalidateCostCache();
  loadBaseSaltMarketIfNeeded();
  state = loadState();
  detailsOpen = false;
  syncGemRatio();
  host.addEventListener("click", onClick);
  document.addEventListener("click", onDocClick);
  document.addEventListener("input", onDocInput);
  document.addEventListener("change", onDocChange);
  document.addEventListener("keydown", onKey);
  window.addEventListener("guroBoostsChanged", onBoostsChanged);
  window.addEventListener("guroGemPackChanged", onExternalChange);
  window.addEventListener("guroPricesUpdated", onExternalChange);
  listening = true;
  render();
}

export function unmountSaltCalculator() {
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
    document.removeEventListener("change", onDocChange);
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("guroBoostsChanged", onBoostsChanged);
    window.removeEventListener("guroGemPackChanged", onExternalChange);
    window.removeEventListener("guroPricesUpdated", onExternalChange);
    listening = false;
  }
  host = null;
  api = null;
}

export function saltCalculatorCanLeave() {
  if (!popup) return true;
  if (isPopupDirty()) {
    calc.toast("⚠️ Save your changes first");
    return false;
  }
  destroyPopup();
  return true;
}
