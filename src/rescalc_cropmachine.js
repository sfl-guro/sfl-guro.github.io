import * as calc from "./calculator.js";
import * as prices from "./prices.js";
import * as ui from "./ui.js";
import { boostsBySubjectHtml } from "./rescalc_boosts.js";
import { saveCmQueue, saveCmOilTank } from "./storage.js";
import { applySelection, currentRatio } from "./gem_packs.js";

const STORE_KEY = "guro_rc_cropmachine_v1";

const MODULES = [ {
  key: "I",
  label: "Module I",
  crops: "Rhubarb, Zucchini"
}, {
  key: "II",
  label: "Module II",
  crops: "Carrot, Cabbage"
}, {
  key: "III",
  label: "Module III",
  crops: "Yam, Broccoli"
} ];

let host = null;
let state = null;
let popup = null;
let overlayEl = null;
let promptEl = null;
let restoreFns = [];
let listening = false;
let detailsOpen = false;

function esc(s) {
  return calc.escapeHtml(String(s));
}

function cropNames() {
  return Object.keys(calc.BASE_CROP_MACHINE);
}

function loadState() {
  const base = {
    crop: "Sunflower",
    qty: 0
  };
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (raw && typeof raw === "object") {
      if (calc.BASE_CROP_MACHINE[raw.crop]) base.crop = raw.crop;
      const q = Math.floor(Number(raw.qty));
      if (isFinite(q) && q > 0) base.qty = q;
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

function seedIcon(name) {
  return ui.getIcon(name);
}

function packMax(name) {
  return calc.getCropMachinePackMax(name);
}

function currentQty() {
  const max = packMax(state.crop);
  return state.qty > 0 ? Math.min(state.qty, max) : max;
}

function oilCoinsPerUnit() {
  return prices.getItemCostByName("Oil") || 0;
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

function computeAll() {
  syncGemRatio();
  prices.invalidateCostCache();
  const feeRate = (calc.feePercent || 0) / 100;
  const groups = {};
  const packs = calc.cmQueue.filter(p => calc.BASE_CROP_MACHINE[p.name]);
  const rows = packs.map(p => ({
    pack: p,
    b: calc.computeCropMachineBatch(p.name, p.qty)
  }));
  rows.forEach(r => {
    const g = groups[r.pack.name] || (groups[r.pack.name] = {
      name: r.pack.name,
      packs: 0,
      seeds: 0,
      timeSec: 0,
      oil: 0,
      yieldQty: 0,
      seedCost: 0,
      oilCost: 0,
      net: 0,
      gross: 0,
      sell: r.b.sellFlower
    });
    g.packs += 1;
    g.seeds += r.pack.qty;
    g.timeSec += r.b.timeSec;
    g.oil += r.b.oilQty;
    g.yieldQty += r.b.yieldQty;
    g.seedCost += calc.coinsToFlower(r.b.seedCoinCost);
    g.oilCost += calc.coinsToFlower(r.b.oilCoinCost);
    g.gross += r.b.sellFlower * r.b.yieldQty;
    g.net += r.b.revenueFlower;
  });
  const list = Object.keys(groups).map(k => {
    const g = groups[k];
    const ri = calc.computeMachineRestockGems(k, g.seeds);
    g.restockCount = ri.restocksNeeded || 0;
    g.restockGems = ri.gemsTotal || 0;
    g.restock = ri.flowerCost || 0;
    g.gemPerRestock = ri.gemCostPerRestock || 0;
    g.stock = ri.boostedStock || 0;
    g.fee = g.gross * feeRate;
    g.profit = g.net - g.seedCost - g.oilCost - g.restock;
    return g;
  });
  const t = {
    seeds: 0,
    timeSec: 0,
    oil: 0,
    yieldQty: 0,
    gross: 0,
    fee: 0,
    seedCost: 0,
    oilCost: 0,
    restock: 0,
    net: 0
  };
  list.forEach(g => {
    t.seeds += g.seeds;
    t.timeSec += g.timeSec;
    t.oil += g.oil;
    t.yieldQty += g.yieldQty;
    t.gross += g.gross;
    t.fee += g.fee;
    t.seedCost += g.seedCost;
    t.oilCost += g.oilCost;
    t.restock += g.restock;
    t.net += g.profit;
  });
  t.perDay = t.timeSec > 0 ? t.net / t.timeSec * 86400 : 0;
  return {
    rows: rows,
    groups: list,
    totals: t
  };
}

function modulesHtml() {
  return `<div class="rcm-modules">${MODULES.map(m => {
    const on = calc.isSkillActive(calc.CM_MODULE_SKILL_IDS[m.key]);
    return `<div class="rcm-module guro-frame${on ? " is-on" : ""}" title="${esc(m.crops)}"><span>${on ? "✅" : "🔒"}</span><span>${m.label}</span></div>`;
  }).join("")}</div>`;
}

function seedCellsHtml() {
  return cropNames().map(n => {
    const locked = !calc.isCropMachineUnlocked(n);
    const on = state.crop === n;
    return `<label class="rc-crop guro-frame${on ? " is-on" : ""}${locked ? " is-locked" : ""}"><span class="rc-crop-icon">${locked ? "🔒" : seedIcon(n)}</span><span class="rc-crop-name">${esc(n)}</span><input type="radio" name="rcmSeed" data-rcm-seed="${esc(n)}"${on ? " checked" : ""}${locked ? " disabled" : ""} aria-label="${esc(n)}"></label>`;
  }).join("");
}

function pickerHtml() {
  return `<section class="rc-block guro-frame" aria-label="Crop Machine">
    <div class="rc-block-title">Crop Machine</div>
    ${modulesHtml()}
    <div class="rc-crops" id="rcCrops">${seedCellsHtml()}</div>
  </section>`;
}

function packBuilderHtml() {
  const name = state.crop;
  const qty = currentQty();
  const b = calc.computeCropMachineBatch(name, qty);
  const full = calc.cmQueue.length >= calc.getCropMachineQueueSlots();
  return `<div class="rcm-builder">
    <label class="rc-node-row guro-frame"><span class="rc-node-icon">${seedIcon(name)}</span><span class="rc-node-text"><span class="rc-node-name">${esc(name)} Seeds</span><span class="rc-node-used">Max ${n2(packMax(name))} per pack</span></span><input type="number" min="1" max="${packMax(name)}" step="1" inputmode="numeric" data-rcm-qty value="${qty}"></label>
    <div class="rc-kv-grid">
      ${kv("Yield", `${n2(b.yieldQty)}${ui.getIcon(name)}`)}
      ${kv("Time", esc(calc.formatDuration(b.timeSec)))}
      ${kv("Oil", `${n2(b.oilQty)}${ui.getIcon("Oil")}`)}
      ${kv("Profit", `<span class="${b.profitFlower >= 0 ? "is-profit" : "is-loss"}">${signed(b.profitFlower, fl)}${calc.FLOWER_ICON}</span>`)}
    </div>
    <div class="rcm-actions">
      <button type="button" class="rc-tool guro-frame" data-rcm-act="max">Max</button>
      <button type="button" class="rc-tool guro-frame" data-rcm-act="add"${full || qty <= 0 ? " disabled" : ""}>Add Pack</button>
    </div>
  </div>`;
}

function queueHtml() {
  const slots = calc.getCropMachineQueueSlots();
  const cells = [];
  for (let i = 0; i < slots; i++) {
    const p = calc.cmQueue[i];
    if (p && calc.BASE_CROP_MACHINE[p.name]) {
      const b = calc.computeCropMachineBatch(p.name, p.qty);
      cells.push(`<div class="rcm-slot guro-frame is-filled"><button type="button" class="rcm-slot-x" data-rcm-remove="${i}" aria-label="Remove pack">✕</button><span class="rcm-slot-icon">${seedIcon(p.name)}</span><span class="rcm-slot-qty">${n2(p.qty)}</span><span class="rcm-slot-time">${esc(calc.formatDuration(b.timeSec))}</span></div>`);
    } else {
      cells.push(`<div class="rcm-slot guro-frame"><span class="rcm-slot-empty">Empty</span></div>`);
    }
  }
  return `<div class="rc-comp-sub">Queue ${calc.cmQueue.length}/${slots}</div><div class="rcm-slots">${cells.join("")}</div>`;
}

function tankHtml(totals) {
  const cap = calc.getCropMachineOilCap();
  const tank = Math.max(0, Math.min(cap, calc.cmOilTank));
  const left = Math.max(0, tank - totals.oil);
  const pct = cap > 0 ? left / cap * 100 : 0;
  const covered = tank + 1e-9 >= totals.oil;
  return `<div class="rc-comp-sub">${ui.getIcon("Oil")} Oil Tank</div>
    <div class="rcm-bar guro-frame"><div class="rcm-bar-fill" style="width:${pct}%"></div></div>
    <label class="rc-node-row guro-frame"><span class="rc-node-icon">${ui.getIcon("Oil")}</span><span class="rc-node-text"><span class="rc-node-name">Oil in tank</span><span class="rc-node-used">Holds up to ${n2(cap)} (${n2(calc.getCropMachineOilCapHours())}h of fuel)</span></span><input type="number" min="0" max="${cap}" step="any" inputmode="decimal" data-rcm-tank value="${n2(tank).replace(/,/g, "")}"></label>
    <div class="rcm-actions">
      <button type="button" class="rc-tool guro-frame" data-rcm-act="fill">Fill Tank</button>
      <button type="button" class="rc-tool guro-frame" data-rcm-act="empty">Empty</button>
    </div>
    <div class="rc-note${covered || !calc.cmQueue.length ? "" : " is-warn"}">${calc.cmQueue.length ? (covered ? `Tank covers the queue (${n2(totals.oil)} oil needed).` : `Tank is short by ${n2(totals.oil - tank)} oil (${n2(totals.oil)} needed).`) : "Queue is empty."}</div>`;
}

function valueBoxHtml(label, html, extra) {
  return `<div class="rc-val guro-frame${extra ? " " + extra : ""}"><span class="rc-val-label">${label}</span><span class="rc-val-num">${html}</span></div>`;
}

function valuesHtml(res) {
  const t = res.totals;
  const feeBox = (calc.feePercent || 0) > 0 ? valueBoxHtml("Market Fee", flowerHtml(t.fee)) : "";
  return `<div class="rc-values">
    ${valueBoxHtml("Gross", flowerHtml(t.gross))}
    ${valueBoxHtml("Seed Cost", flowerHtml(t.seedCost))}
    ${valueBoxHtml("Oil Cost", flowerHtml(t.oilCost))}
    ${valueBoxHtml("Restock Cost", flowerHtml(t.restock))}
    ${valueBoxHtml("Runtime", esc(calc.formatDuration(t.timeSec)))}
    ${valueBoxHtml("Oil Needed", `${n2(t.oil)}${ui.getIcon("Oil")}`)}
    ${feeBox}
    ${valueBoxHtml("Net / 24Hrs", `<span class="${t.perDay >= 0 ? "is-profit" : "is-loss"}">${signed(t.perDay, fl)}${calc.FLOWER_ICON}</span>`)}
  </div>
  <div class="rc-net-row">
    ${valueBoxHtml("Net", `<span class="${t.net >= 0 ? "is-profit" : "is-loss"}">${signed(t.net, fl)}${calc.FLOWER_ICON}</span>`, "rc-val-net")}
    <button type="button" class="rc-linktext" data-rc-open="computation">Computation</button>
  </div>`;
}

function noteHtml() {
  const text = `Crop Machine: packs grow one after another using the oil in the tank. The machine burns oil per hour of running, so faster packs use less oil. More plots make packs finish sooner. Yield uses the normal crop yield boosts, but not the plot-only ones (scarecrow areas, fertilisers, bee swarms).`;
  return `<div class="rc-details-row"><button type="button" class="rc-linktext" data-rc-details aria-expanded="${detailsOpen ? "true" : "false"}">Details</button></div>${detailsOpen ? `<div class="rc-note">${text}</div>` : ""}`;
}

function resultsHtml() {
  const res = computeAll();
  return `<section class="rc-block guro-frame" aria-label="Crop Machine results">
    <div class="rc-tools rc-tools-two">
      <button type="button" class="rc-tool guro-frame" data-rc-open="skills">Skills</button>
      <button type="button" class="rc-tool guro-frame" data-rc-open="boost">Boost</button>
    </div>
    <div class="rc-note">Plots ${calc.getCropMachinePlots()} · Oil use ×${n2(calc.computeCropMachineOilMult())} per hour · Queue ${calc.getCropMachineQueueSlots()} packs</div>
    ${noteHtml()}
    <div id="rcResults">${packBuilderHtml()}${queueHtml()}${tankHtml(res.totals)}${valuesHtml(res)}</div>
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
  const scroller = document.scrollingElement;
  const y = scroller ? scroller.scrollTop : 0;
  const tmp = document.createElement("div");
  tmp.innerHTML = pickerHtml() + resultsHtml();
  if (blocks[0] && tmp.children[0]) blocks[0].replaceWith(tmp.children[0]);
  const second = host.querySelectorAll(".rc-block")[1];
  if (second && tmp.children[0]) second.replaceWith(tmp.children[0]);
  if (scroller) scroller.scrollTop = y;
  if (popup === "computation") renderOverlayBody();
}

function kv(label, html, cls) {
  return `<div class="rc-kv${cls ? " " + cls : ""}"><span class="rc-kv-label">${label}</span><span class="rc-kv-val">${html}</span></div>`;
}

function matRowHtml(icon, name, qty, value, badge) {
  return `<div class="rc-mat-row"><span class="rc-mat-main">${icon}<span class="rc-mat-name">${esc(name)}</span><span class="rc-mat-qty">×${n2(qty)}</span><span class="rc-mat-val">(${flowerHtml(value)})</span></span><span class="rc-badge">${badge}</span></div>`;
}

function machineEffectParts(b) {
  const p = [];
  if (b.timeMult) p.push(`×${b.timeMult} time`);
  if (b.oilQtyMult) p.push(`${b.oilQtyMult > 1 ? "+" : "-"}${n2(Math.abs(b.oilQtyMult - 1) * 100)}% oil use`);
  if (b.oilReducePct) p.push(`-${n2(b.oilReducePct * 100)}% oil use`);
  if (b.queueAdd) p.push(`+${n2(b.queueAdd)} packs`);
  if (b.plotAdd) p.push(`+${n2(b.plotAdd)} plots`);
  if (b.oilTankMult) p.push(`×${n2(b.oilTankMult)} tank`);
  return p;
}

function yieldBoostsFor(name) {
  return calc.getActiveBoostsForCrop(name).filter(b => !b.plotCap && b.id !== "hoot" && !b.composterFertilizer && !b.beeSwarmStack && !b.debuffStack);
}

function boostRowHtml(b, text) {
  return `<div class="rc-boost-row">${ui.getBoostIconAnyFallback(b.name)}<span class="rc-boost-name">${esc(b.name)}</span><span class="rc-boost-eff">${esc(text)}</span></div>`;
}

function machineCardHtml() {
  const boosts = calc.BOOSTS.filter(b => b.category === "cropmachine" && calc.isBoostActive(b.id) && machineEffectParts(b).length);
  const boostRows = boosts.map(b => boostRowHtml(b, machineEffectParts(b).join(", "))).join("") || `<div class="rc-boost-none">No boost applied</div>`;
  const oil = calc.RESOURCE_DATA.Oil;
  const btn = (m, mode, label) => `<button type="button" class="es-mode-btn es-toolcfg-tbtn${calc.getMaterialMode("Oil", m) === mode ? " active" : ""}" data-rcm-act="oilmat" data-rcm-a="${esc(m)}" data-rcm-b="${mode}">${label}</button>`;
  const oilRows = oil.materials.map(m => `<div class="rc-tool-mat"><span class="rc-tool-mat-item"><span class="rc-tool-mat-qty">${n2(m.qty)}</span>${ui.getIcon(m.name)}<span class="rc-tool-mat-name">${esc(m.name)}</span></span><span class="es-toolcfg-tog">${btn(m.name, "collect", "Collect")}${btn(m.name, "buy", "Buy")}</span></div>`).join("");
  const unit = calc.coinsToFlower(oilCoinsPerUnit());
  return `<article class="rc-comp-card guro-frame">
    <header class="rc-comp-head"><span class="rc-comp-icon">${ui.getIcon("Crop Machine")}</span><span class="rc-comp-name">Crop Machine</span><span class="rc-comp-nodes">${calc.getCropMachinePlots()} plots</span></header>
    <div class="rc-group"><div class="rc-kv-grid">
      ${kv("Plots", n2(calc.getCropMachinePlots()))}
      ${kv("Queue Slots", n2(calc.getCropMachineQueueSlots()))}
      ${kv("Oil Use / Hour", `×${n2(calc.computeCropMachineOilMult())}`)}
      ${kv("Tank Capacity", `${n2(calc.getCropMachineOilCapHours())}h`)}
      ${kv("Tank Oil", `${n2(calc.getCropMachineOilCap())}${ui.getIcon("Oil")}`)}
      ${kv("Oil Price / Unit", flowerHtml(unit))}
    </div></div>
    <div class="rc-group"><div class="rc-comp-sub">Applied Boost</div>${boostRows}</div>
    <div class="rc-group"><div class="rc-comp-sub">Oil Cost Config (Oil Drill)</div><div class="rc-tool-cfg">${oilRows}</div></div>
  </article>`;
}

function cropCardHtml(g) {
  const b = calc.computeCropMachineBatch(g.name, g.seeds);
  const ratio = ratioInfo();
  const ratioLine = ratio.free ? `Free gems` : `1${calc.FLOWER_ICON} : ${n2(ratio.gemsPerFlower)}${calc.GEM_ICON}`;
  const yieldBoosts = yieldBoostsFor(g.name).map(x => {
    const add = x.resourceEffects ? x.resourceEffects[g.name] || 0 : x.yieldAdd || 0;
    const parts = [];
    if (add) parts.push(`${add > 0 ? "+" : ""}${n2(add)} yield`);
    if (x.yieldMult) parts.push(`×${x.yieldMult} yield`);
    return parts.length ? boostRowHtml(x, parts.join(", ")) : "";
  }).join("") || `<div class="rc-boost-none">No yield boost applied</div>`;
  const seedUnit = g.seeds > 0 ? g.seedCost / g.seeds : 0;
  const matRows = matRowHtml(seedIcon(g.name), `${g.name} Seed`, g.seeds, g.seedCost, "Seeds") + matRowHtml(ui.getIcon("Oil"), "Oil", g.oil, g.oilCost, "Oil");
  const yieldRows = matRowHtml(ui.getIcon(g.name), g.name, g.yieldQty, g.gross, "Yield");
  return `<article class="rc-comp-card guro-frame">
    <header class="rc-comp-head"><span class="rc-comp-icon">${ui.getIcon(g.name)}</span><span class="rc-comp-name">${esc(g.name)}</span><span class="rc-comp-nodes">${n2(g.packs)} pack${g.packs === 1 ? "" : "s"}</span></header>
    <div class="rc-group"><div class="rc-kv-grid">
      ${kv("Seeds", n2(g.seeds))}
      ${kv("Yield / Seed", `×${n2(b.yieldMult)}`)}
      ${kv("Total Yield", `${signed(g.yieldQty, n2)}${ui.getIcon(g.name)}`)}
      ${kv("Runtime", esc(calc.formatDuration(g.timeSec)))}
      ${kv("Oil Needed", `${n2(g.oil)}${ui.getIcon("Oil")}`)}
      ${kv("Market Price / Unit", flowerSigned(g.sell))}
      ${kv("Total Gross", flowerSigned(g.gross))}
      ${kv("Seed Cost", flowerHtml(g.seedCost))}
      ${kv("Seed Price / Unit", flowerHtml(seedUnit))}
      ${kv("Oil Cost", flowerHtml(g.oilCost))}
      ${kv("Restocks Needed", `${n2(g.restockCount)} × ${gemHtml(g.gemPerRestock)}`)}
      ${kv("Cost / Restock", `${gemHtml(g.gemPerRestock)}<span class="rc-kv-sub">${ratioLine}</span>`)}
      ${kv("Gems Used", `${gemHtml(g.restockGems)} = ${flowerHtml(g.restock)}`)}
      ${kv("Restock Cost", flowerHtml(g.restock))}
      ${(calc.feePercent || 0) > 0 ? kv("Market Fee", flowerHtml(g.fee)) : ""}
      ${kv("Total Net", `<span class="${g.profit >= 0 ? "is-profit" : "is-loss"}">${signed(g.profit, fl)}${calc.FLOWER_ICON}</span>`, "rc-kv-wide rc-kv-net")}
    </div></div>
    <div class="rc-group"><div class="rc-comp-sub">Applied Boost</div>${yieldBoosts}</div>
    <div class="rc-mat-section rc-group"><div class="rc-boost-label">Material Used</div>${matRows}</div>
    <div class="rc-mat-section rc-group"><div class="rc-boost-label">${esc(g.name)} Yield</div>${yieldRows}</div>
  </article>`;
}

function computationBodyHtml() {
  const res = computeAll();
  const note = res.groups.length ? "" : `<div class="rc-empty">The queue is empty. Add packs to see the crop cards.</div>`;
  return machineCardHtml() + res.groups.map(cropCardHtml).join("") + note;
}

function boostBodyHtml() {
  const machineBoosts = calc.BOOSTS.filter(b => b.source !== "skill" && !b.hiddenFromOwnPanel && b.category === "cropmachine");
  const machineHtml = boostsBySubjectHtml({
    subjects: [ {
      name: "Crop Machine",
      icon: ui.getIcon("Crop Machine")
    } ],
    boosts: machineBoosts,
    appliesTo: () => true,
    unit: "plots",
    noteSkip: /AOE|expected/i
  });
  const crops = cropNames().filter(n => calc.cmQueue.some(p => p.name === n) || n === state.crop);
  const yieldBoosts = calc.BOOSTS.filter(b => (b.category || "crops") === "crops" && b.source !== "skill" && !b.hiddenFromOwnPanel && !b.plotCap && b.id !== "hoot" && !b.composterFertilizer && !b.beeSwarmStack && !b.debuffStack && !b.timeMult && (b.yieldAdd || b.yieldMult || b.resourceEffects));
  const appliesTo = (b, s) => {
    if (b.scope === "global") return true;
    if (b.scope === "crop") return (b.target || "").toLowerCase() === s.name.toLowerCase();
    if (b.scope === "tier") return (calc.BASE_CROPS[s.name] || {}).tier === b.target;
    return false;
  };
  const cropHtml = boostsBySubjectHtml({
    subjects: crops.map(n => ({
      name: n,
      icon: ui.getIcon(n)
    })),
    boosts: yieldBoosts,
    appliesTo: appliesTo,
    unit: "plots",
    noteSkip: /AOE|expected/i,
    allLabel: "Yield Boost for All Crops"
  });
  return `<div class="rc-pop-hint">Boosts that change the machine speed and oil, and the crop yield boosts that work inside the machine. Tap a boost to switch it on or off, then press Save.</div>${machineHtml}${cropHtml}`;
}

function popupTitle() {
  if (popup === "skills") return "Machine Skills";
  if (popup === "boost") return "Machine Boosts";
  return "Computation";
}

function popupBodyHtml() {
  if (popup === "boost") return boostBodyHtml();
  if (popup === "computation") return computationBodyHtml();
  return `<div class="rc-pop-hint">Machinery skills from the Skill Tree. Changes here also change the Skill Tree. Press Save to apply them.</div><div id="rcSkillSlot"></div>`;
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
    calc.setSkillCategory("machine");
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

function selectCrop(name) {
  if (!calc.isCropMachineUnlocked(name)) return;
  state.crop = name;
  state.qty = 0;
  saveState();
  refreshResults();
}

function addPack() {
  const qty = Math.min(currentQty(), packMax(state.crop));
  if (qty <= 0) return;
  if (calc.cmQueue.length >= calc.getCropMachineQueueSlots()) {
    calc.toast("🚜 Queue is full");
    return;
  }
  calc.cmQueue.push({
    name: state.crop,
    qty: qty
  });
  saveCmQueue();
  refreshResults();
}

function removePack(idx) {
  calc.cmQueue.splice(idx, 1);
  saveCmQueue();
  refreshResults();
}

function setTank(v) {
  const cap = calc.getCropMachineOilCap();
  calc.__set_cmOilTank(Math.max(0, Math.min(cap, v)));
  saveCmOilTank();
  refreshResults();
}

function onClick(e) {
  const details = e.target.closest("[data-rc-details]");
  if (details) {
    detailsOpen = !detailsOpen;
    refreshResults();
    return;
  }
  const open = e.target.closest("[data-rc-open]");
  if (open && !open.disabled) {
    openPopup(open.getAttribute("data-rc-open"));
    return;
  }
  const rm = e.target.closest("[data-rcm-remove]");
  if (rm) {
    removePack(Number(rm.getAttribute("data-rcm-remove")));
    return;
  }
  const act = e.target.closest("[data-rcm-act]");
  if (act && !act.disabled) {
    const a = act.getAttribute("data-rcm-act");
    if (a === "max") {
      state.qty = 0;
      saveState();
      refreshResults();
    } else if (a === "add") addPack();
    else if (a === "fill") setTank(calc.getCropMachineOilCap());
    else if (a === "empty") setTank(0);
  }
}

function onChange(e) {
  const t = e.target;
  if (!t || !t.dataset) return;
  if (t.dataset.rcmSeed != null) {
    selectCrop(t.dataset.rcmSeed);
  } else if (t.hasAttribute("data-rcm-qty")) {
    const v = Math.floor(Number(t.value));
    state.qty = isFinite(v) && v > 0 ? Math.min(v, packMax(state.crop)) : 0;
    saveState();
    refreshResults();
  } else if (t.hasAttribute("data-rcm-tank")) {
    setTank(Math.max(0, parseFloat(t.value) || 0));
  }
}

function onDocClick(e) {
  if (!overlayEl) return;
  if (promptEl && promptEl.contains(e.target)) return;
  if (e.target === overlayEl || e.target.closest("[data-rc-close]")) {
    closePopup(false);
    return;
  }
  if (!overlayEl.contains(e.target)) return;
  const act = e.target.closest("[data-rcm-act=oilmat]");
  if (act && popup === "computation") {
    calc.setMaterialMode("Oil", act.getAttribute("data-rcm-a"), act.getAttribute("data-rcm-b"));
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

export function mountCropMachineCalculator(root) {
  host = root;
  prices.invalidateCostCache();
  state = loadState();
  detailsOpen = false;
  syncGemRatio();
  host.addEventListener("click", onClick);
  host.addEventListener("change", onChange);
  document.addEventListener("click", onDocClick);
  document.addEventListener("keydown", onKey);
  window.addEventListener("guroBoostsChanged", onBoostsChanged);
  window.addEventListener("guroGemPackChanged", onExternalChange);
  window.addEventListener("guroPricesUpdated", onExternalChange);
  listening = true;
  render();
}

export function unmountCropMachineCalculator() {
  prices.invalidateCostCache();
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
    window.removeEventListener("guroGemPackChanged", onExternalChange);
    window.removeEventListener("guroPricesUpdated", onExternalChange);
    listening = false;
  }
  host = null;
}

export function cropMachineCalculatorCanLeave() {
  if (!popup) return true;
  if (isPopupDirty()) {
    calc.toast("⚠️ Save your changes first");
    return false;
  }
  destroyPopup();
  return true;
}
