import * as calc from "./calculator.js";
import * as prices from "./prices.js";
import * as ui from "./ui.js";
import { boostsBySubjectHtml } from "./rescalc_boosts.js";
import { saveSpiceUsage, saveAnimalSicknessEstimate } from "./storage.js";


const STORE_KEY = "guro_rc_animals_v1";

const MAX_CUSTOM_CYCLES = 100000;

const BRISTLE_SPICE_KEYS = ["none", "saltLick", "honeyTreat", "truffleSeasoning"];

const SPICE_LABELS = {
  saltLick: "Salt Lick",
  honeyTreat: "Honey Treat",
  truffleSeasoning: "Truffle Seasoning"
};

const SPICE_EFFECTS = {
  saltLick: "×1.05 yield",
  honeyTreat: "×0.75 feed",
  truffleSeasoning: "×0.5 sleep"
};

const TOOL_LABELS = {
  pettingHand: "Petting Hand",
  brush: "Brush",
  musicBox: "Music Box"
};

let host = null;
let state = null;
let popup = null;
let overlayEl = null;
let promptEl = null;
let restoreFns = [];
let animalsDraft = null;
let listening = false;
let detailsOpen = false;
let bristleInfoOpen = false;

function esc(s) {
  return calc.escapeHtml(String(s));
}

function typeNames() {
  return Object.keys(calc.ANIMAL_DATA);
}

function isType(n) {
  return !!calc.ANIMAL_DATA[n];
}

function labelOf(type) {
  return calc.ANIMAL_DATA[type].label;
}

function iconOf(type) {
  return ui.getIcon(labelOf(type));
}

function loadState() {
  const base = {
    selected: [],
    cycles: {},
    bristles: false,
    bristleBasis: "net",
    bristleOpts: {
      medicine: true,
      spice: null,
      mud: null
    }
  };
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (raw && typeof raw === "object") {
      if (Array.isArray(raw.selected)) base.selected = raw.selected.filter(isType);
      base.bristles = raw.bristles === true;
      base.bristleBasis = raw.bristleBasis === "gross" ? "gross" : "net";
      if (raw.bristleOpts && typeof raw.bristleOpts === "object") {
        base.bristleOpts.medicine = raw.bristleOpts.medicine !== false;
        base.bristleOpts.spice = BRISTLE_SPICE_KEYS.includes(raw.bristleOpts.spice) ? raw.bristleOpts.spice : raw.bristleOpts.spice === false ? "none" : null;
        base.bristleOpts.mud = typeof raw.bristleOpts.mud === "boolean" ? raw.bristleOpts.mud : null;
      }
      if (raw.cycles && typeof raw.cycles === "object") Object.keys(raw.cycles).forEach(k => {
        const v = Math.floor(Number(raw.cycles[k]));
        if (isType(k) && isFinite(v) && v > 0) base.cycles[k] = Math.min(v, MAX_CUSTOM_CYCLES);
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

function priceOf(name) {
  const m = prices.marketItems.find(x => (x.name || "").toLowerCase() === String(name).toLowerCase());
  return m ? m.flowerPrice || 0 : 0;
}

function feedCrops() {
  const set = [];
  Object.keys(calc.FEED_RECIPE).forEach(k => calc.FEED_RECIPE[k].forEach(r => {
    if (!set.includes(r.crop)) set.push(r.crop);
  }));
  if (calc.getKaleMixKaleQty() != null && !set.includes("Kale")) set.push("Kale");
  return set;
}

function compute(type) {
  const fig = calc.computeAnimalTypeFigures(type);
  const qty = fig.qty;
  const autoCycles = Math.max(1, Math.round(86400 / fig.cycleTimeSec));
  const custom = state.cycles[type] > 0 ? state.cycles[type] : 0;
  const cycles = qty > 0 ? custom || autoCycles : 0;
  const week = qty > 0 ? calc.computeAnimalWeeklyFigures(type, cycles) : null;
  const out = {
    type: type,
    label: labelOf(type),
    fig: fig,
    qty: qty,
    level: fig.level,
    autoCycles: autoCycles,
    cycles: cycles,
    cyclesCustom: custom > 0,
    week: week,
    products: fig.products,
    yields: week ? week.yieldsWeek : fig.products.map(() => 0),
    gross: 0,
    fee: 0,
    feed: 0,
    medicine: 0,
    spice: 0,
    shrine: 0,
    net: 0
  };
  out.totalYield = out.yields.reduce((a, b) => a + b, 0);
  if (week) {
    out.gross = week.grossRevenueWeekWithSpice;
    out.fee = week.grossRevenueWeekWithSpice - week.netRevenueWeekWithSpice;
    out.feed = week.feedCostFlowerWeek;
    out.medicine = week.medicineCostFlowerWeek;
    out.spice = week.consumablesCostFlowerWeek;
    out.shrine = (fig.shrineCostFlowerPerCyclePerAnimal || 0) * qty * cycles;
    out.net = week.profitWeekWithSpice;
  }
  const feeFrac = (calc.feePercent || 0) / 100;
  const prodGross = out.products.map((p, i) => out.yields[i] * priceOf(p));
  const prodGrossSum = prodGross.reduce((a, b) => a + b, 0);
  const costTotal = out.gross - out.fee - out.net;
  out.productRows = out.products.map((p, i) => {
    const share = prodGrossSum > 0 ? prodGross[i] / prodGrossSum : 1 / Math.max(1, out.products.length);
    const gross = week ? prodGross[i] : 0;
    return {
      name: p,
      qty: out.yields[i],
      gross: gross,
      net: week ? gross * (1 - feeFrac) - share * costTotal : 0
    };
  });
  const cycleGross = fig.products.reduce((s, p, i) => s + fig.yields[i] * qty * priceOf(p), 0);
  out.cycleGross = cycleGross;
  out.cycleFeed = calc.coinsToFlower(fig.feedCostCoins) * qty;
  out.cycleMedicine = fig.medicineFlowerPerLevel * qty;
  out.cycleSpice = fig.consumablesFlowerPerLevel * qty;
  out.cycleShrine = (fig.shrineCostFlowerPerCyclePerAnimal || 0) * qty;
  out.cycleNet = cycleGross * (1 - (calc.feePercent || 0) / 100) - out.cycleFeed - out.cycleMedicine - out.cycleSpice - out.cycleShrine;
  return out;
}

function computeAll() {
  prices.invalidateCostCache();
  return state.selected.filter(isType).map(compute);
}

function totalsOf(rows) {
  const t = {
    gross: 0,
    fee: 0,
    feed: 0,
    medicine: 0,
    spice: 0,
    shrine: 0,
    net: 0,
    products: []
  };
  rows.forEach(r => {
    r.productRows.forEach(pr => {
      let e = t.products.find(x => x.name === pr.name);
      if (!e) {
        e = {
          name: pr.name,
          gross: 0,
          net: 0
        };
        t.products.push(e);
      }
      e.gross += pr.gross;
      e.net += pr.net;
    });
    t.gross += r.gross;
    t.fee += r.fee;
    t.feed += r.feed;
    t.medicine += r.medicine;
    t.spice += r.spice;
    t.shrine += r.shrine;
    t.net += r.net;
  });
  return t;
}

function cropCellsHtml() {
  const animals = typeNames().map(n => {
    const on = state.selected.includes(n);
    return `<label class="rc-crop guro-frame${on ? " is-on" : ""}"><span class="rc-crop-icon">${iconOf(n)}</span><span class="rc-crop-name">${esc(labelOf(n))}</span><input type="checkbox" data-rc-crop="${esc(n)}"${on ? " checked" : ""} aria-label="${esc(labelOf(n))}"></label>`;
  }).join("");
  const bon = state.bristles;
  const bristles = `<label class="rc-crop guro-frame${bon ? " is-on" : ""}"><span class="rc-crop-icon">${ui.getIcon("Pig Bristles")}</span><span class="rc-crop-name">Bristles</span><input type="checkbox" data-rc-bristles${bon ? " checked" : ""} aria-label="Bristles"></label>`;
  return animals + bristles;
}

function focusTypes() {
  const list = state.selected.filter(isType);
  if (state.bristles && !list.includes("pig") && isType("pig")) list.push("pig");
  return list;
}

function bristleOpts() {
  return {
    medicine: state.bristleOpts.medicine,
    spice: state.bristleOpts.spice,
    mud: state.bristleOpts.mud
  };
}

function bristleMedicineHtml() {
  const r = compute("pig");
  const view = Object.assign({}, r, {
    fig: Object.assign({}, r.fig, {
      mudActive: bristleMudOn()
    })
  });
  const html = medicineConfigHtml(view);
  return html.replace('<div class="rc-tool-cfg">', '<div class="rc-tool-cfg"><div class="rc-note">Medicine only costs something when your Pig heads and sick heads are above 0 and Mud is off.</div>');
}

function bristleSpiceConfigHtml() {
  const key = bristleSpiceKey();
  const name = key === "none" ? null : SPICE_LABELS[key];
  const rows = name ? spiceIngredientRowsHtml(name) : `<div class="rc-boost-none">No consumable selected</div>`;
  return `<div class="rc-group"><div class="rc-comp-sub">Spice Rack${name ? " (" + esc(name) + ")" : ""}</div><div class="rc-tool-cfg">${rows}</div></div>`;
}

function bristleMudOn() {
  return state.bristleOpts.mud == null ? calc.isBoostActive("pig_mud") : state.bristleOpts.mud;
}

function bristleSpiceKey() {
  if (state.bristleOpts.spice != null) return state.bristleOpts.spice;
  return calc.getSpiceEffectForAnimalType("pig").activeKey || "none";
}

function bristleSpiceRowHtml() {
  const cur = bristleSpiceKey();
  const btn = (key, text) => `<button type="button" class="es-mode-btn es-toolcfg-tbtn${cur === key ? " active" : ""}" data-rc-bopt="spice:${key}">${text}</button>`;
  return `<div class="rc-tool-mat"><span class="rc-tool-mat-item"><span class="rc-tool-mat-name">Spice Rack</span></span><span class="es-toolcfg-tog">${btn("none", "None")}${btn("saltLick", "Salt Lick")}${btn("honeyTreat", "Honey Treat")}${btn("truffleSeasoning", "Truffle Seasoning")}</span></div>`;
}

function bristleToggleHtml(key, iconName, label, on) {
  const btn = (v, text, active) => `<button type="button" class="es-mode-btn es-toolcfg-tbtn${active ? " active" : ""}" data-rc-bopt="${key}:${v}">${text}</button>`;
  return `<div class="rc-tool-mat"><span class="rc-tool-mat-item">${ui.getIcon(iconName)}<span class="rc-tool-mat-name">${label}</span></span><span class="es-toolcfg-tog">${btn("off", "Off", !on)}${btn("on", "On", on)}</span></div>`;
}

function bristleOptionsHtml() {
  const rows = bristleToggleHtml("medicine", "Barn Delight", "Medicine", state.bristleOpts.medicine) + bristleToggleHtml("mud", "Mud", "Mud", bristleMudOn()) + bristleSpiceRowHtml();
  return `<div class="rc-group"><div class="rc-comp-sub">Cost Options</div><div class="rc-tool-cfg">${rows}</div></div>`;
}

function listQty(map) {
  return Object.keys(map).filter(k => map[k] > 0).map(k => `<span>${ui.getIcon(k)} ${esc(k)} ×${n2(map[k])}</span>`).join("<br>") || "—";
}

function bristleData() {
  prices.invalidateCostCache();
  const plan = calc.computePigBristlesPlan(state.bristleBasis, 0, bristleOpts());
  const feeFrac = (calc.feePercent || 0) / 100;
  const priced = plan.bristlePrice > 0;
  const seen = {};
  const rows = [];
  plan.rows.forEach(r => {
    if (seen[r.level]) return;
    seen[r.level] = true;
    const grossValue = r.valueFlower;
    const tax = grossValue * feeFrac;
    const value = grossValue - tax;
    const profit = priced ? value - r.costFlower : 0;
    rows.push(Object.assign({}, r, {
      unitPrice: plan.bristlePrice,
      grossValue: grossValue,
      tax: tax,
      value: value,
      profit: profit,
      profitPerDay: priced ? profit / Math.max(1e-9, r.days) : 0
    }));
  });
  rows.forEach((r, i) => {
    const prev = rows[i - 1];
    r.marginal = prev && r.bristles > prev.bristles ? (r.costFlower - prev.costFlower) / (r.bristles - prev.bristles) : null;
  });
  const pick = better => rows.reduce((b, r) => !b || better(r, b) ? r : b, null);
  return {
    rows: rows,
    priced: priced,
    price: plan.bristlePrice,
    buyFlower: plan.buyFlower,
    feeFrac: feeFrac,
    bestProfit: priced ? pick((r, b) => r.profit > b.profit) : null,
    cheapest: pick((r, b) => r.costPerBristle < b.costPerBristle),
    most: pick((r, b) => r.bristles > b.bristles || r.bristles === b.bristles && r.costFlower < b.costFlower),
    fastest: pick((r, b) => r.perDay > b.perDay)
  };
}

function bristleBoxHtml(label, row, subFn) {
  if (!row) return valueBoxHtml(label, "—");
  return valueBoxHtml(label, `Lv${row.level} · ${n2(row.bristles)}${ui.getIcon("Pig Bristles")}`, "", `<span class="rc-kv-sub">${subFn(row)}</span>`);
}

function bristleTileHtml(r, data) {
  const good = !data.priced || r.profit >= 0;
  const star = data.bestProfit && data.bestProfit.level === r.level ? " ★" : "";
  const profit = data.priced ? flowerSigned(r.profit) : "—";
  return `<div class="rc-tile rc-tile-animal guro-frame ${good ? "is-profit" : "is-loss"}" data-rc-level="${r.level}"><span class="rc-tile-icon">${iconOf("pig")}</span><span class="rc-tile-prods"><span class="rc-tile-prod"><span class="rc-tile-pq">Lv${r.level}${star}</span><span class="rc-tile-pn">×${n2(r.bristles)}${ui.getIcon("Pig Bristles")}</span><span class="rc-tile-pv">${profit}</span></span><span class="rc-tile-prod"><span class="rc-tile-pn">Cost ${flowerHtml(r.costFlower)}</span></span></span></div>`;
}

function bristlesBlockHtml() {
  if (!state.bristles) return "";
  const data = bristleData();
  const tools = `<div class="rc-tools"><button type="button" class="rc-tool guro-frame" data-rc-open="skills">Skills</button><button type="button" class="rc-tool guro-frame" data-rc-open="boost">Boost</button><button type="button" class="rc-tool guro-frame" data-rc-open="animals">Animals</button></div>`;
  const note = `<div class="rc-note">Medicine uses your sick heads estimate. Spice uses the consumable you picked in the Pig computation. Mud follows your Boost setting until you change it here, and with Mud on there is no sickness and feed XP is higher. Cost is the Pig, feed, medicine and Mud or spice only. Truffle sold on the way is shown separately and is not counted in the Bristles cost or profit. Each level buys a new Pig, feeds it from Lv1 with your current skills, boosts, Mud and spice settings, then trades it in at that level. Pigs run in parallel, so more Pigs cost more but not more time.</div>`;
  const infoRow = `<div class="rc-details-row"><button type="button" class="rc-linktext" data-rc-binfo aria-expanded="${bristleInfoOpen ? "true" : "false"}">Info</button></div>${bristleInfoOpen ? note : ""}${data.priced ? "" : `<div class="rc-note is-warn">Pig Bristles has no market price yet, so value and profit are not shown.</div>`}`;
  if (!data.rows.length) return `<section class="rc-block guro-frame" aria-label="Bristles results"><div class="rc-block-title">Bristles Calculator</div>${tools}${bristleOptionsHtml()}<div class="rc-empty">No tradeable Pig level found.</div></section>`;
  const boxes = `<div class="rc-values">
    ${bristleBoxHtml("Best Profit", data.bestProfit, r => `${flowerSigned(r.profit)} per pig`)}
    ${bristleBoxHtml("Cheapest / Bristle", data.cheapest, r => `${flowerHtml(r.costPerBristle)} each`)}
    ${bristleBoxHtml("Most Bristles", data.most, r => `${flowerHtml(r.costFlower)} cost`)}
    ${bristleBoxHtml("Most / Day", data.fastest, r => `${n2(r.perDay)} per day`)}
  </div>`;
  const tiles = `<div class="rc-tiles-wrap guro-frame"><div class="rc-tiles rc-tiles-animals rc-tiles-bristles">${data.rows.map(r => bristleTileHtml(r, data)).join("")}</div></div>`;
  return `<section class="rc-block guro-frame" aria-label="Bristles results">
    <div class="rc-block-title">Bristles Calculator</div>
    ${tools}
    ${bristleOptionsHtml()}
    ${infoRow}
    ${tiles}
    ${boxes}
    <div class="rc-details-row"><button type="button" class="rc-linktext" data-rc-open="bristles">Computation</button></div>
  </section>`;
}

function bristleCardHtml(r, data) {
  const icon = ui.getIcon("Pig Bristles");
  const profit = data.priced ? `<span class="${r.profit >= 0 ? "is-profit" : "is-loss"}">${signed(r.profit, fl)}${calc.FLOWER_ICON}</span>` : "—";
  const profitDay = data.priced ? `<span class="${r.profitPerDay >= 0 ? "is-profit" : "is-loss"}">${signed(r.profitPerDay, fl)}${calc.FLOWER_ICON}</span>` : "—";
  const marginal = r.marginal != null ? flowerHtml(r.marginal) : "—";
  return `<article class="rc-comp-card guro-frame">
    <header class="rc-comp-head"><span class="rc-comp-icon">${iconOf("pig")}</span><span class="rc-comp-name">Pig · Lv${r.level}</span><span class="rc-comp-nodes">${icon} ${n2(r.bristles)}</span></header>
    <div class="rc-group"><div class="rc-kv-grid">
      ${kv("Cycles", n2(r.cycles))}
      ${kv("Time", esc(calc.formatDuration(r.days * 86400)))}
      ${kv("Bristles / Trade-in", `${n2(r.bristles)}${icon}`)}
      ${kv("Bristles / Day", `${n2(r.perDay)}${icon}`)}
      ${kv("Total Feeds", n2(r.feeds))}
      ${kv("Feed Qty", n2(r.feedQty))}
      ${kv("Feed Used", listQty(r.slops), "rc-kv-wide")}
      ${kv("Slop Ingredients", listQty(r.ingredients), "rc-kv-wide")}
      ${kv("Pig Price", flowerHtml(data.buyFlower))}
      ${kv("Feed Cost", flowerHtml(r.feedFlower))}
      ${kv("Medicine Cost", flowerHtml(r.medicineFlower))}
      ${kv("Mud Used", r.mudOn ? `${ui.getIcon("Mud")} ×${n2(r.mudUnits)}` : "Off")}
      ${kv("Mud Cost", flowerHtml(r.mudFlower))}
      ${kv("Spice Used", r.spiceKey ? `${ui.getIcon(SPICE_LABELS[r.spiceKey])} ${esc(SPICE_LABELS[r.spiceKey])} ×${n2(r.spiceUnits)}` : "None")}
      ${kv("Spice Cost", flowerHtml(r.spiceFlower))}
      ${r.produceQty > 0 ? kv(`${esc(r.produceName)} Yield (${r.produceMinLv === r.produceMaxLv ? "Lv" + r.produceMinLv : "Lv" + r.produceMinLv + "-" + r.produceMaxLv})`, `+${n2(r.produceQty)}${ui.getIcon(r.produceName)} (${flowerHtml(r.produceFlower)})`, "rc-kv-wide") : ""}
      ${kv("Total Cost", flowerHtml(r.costFlower))}
      ${kv("Cost / Bristle", flowerHtml(r.costPerBristle))}
      ${kv("Extra Cost / Bristle", marginal)}
      ${kv("Market Price / Unit", data.priced ? flowerHtml(r.unitPrice) : "—")}
      ${kv("Bristles Value", data.priced ? flowerHtml(r.grossValue) : "—")}
      ${kv(`Tax${data.feeFrac > 0 ? " (" + n2(data.feeFrac * 100) + "%)" : ""}`, data.priced ? flowerHtml(r.tax) : "—")}
      ${kv("Net Value", data.priced ? flowerHtml(r.value) : "—")}
      ${kv("Profit / Day", profitDay)}
      ${kv("Profit / Pig", profit, "rc-kv-wide rc-kv-net")}
    </div></div>
  </article>`;
}

function bristlesBodyHtml() {
  const data = bristleData();
  if (!data.rows.length) return `<div class="rc-empty">No tradeable Pig level found.</div>`;
  const hint = `<div class="rc-pop-hint">Cost per Pig for every level it can be traded in at.${(data.feeFrac || 0) > 0 ? ` The ${calc.feePercent}% tax is taken from Bristles Value to get Net Value.` : ""} Profit / Pig is Net Value minus Total Cost, so a negative Total Cost is added to your profit. Extra Cost / Bristle is what you pay for each additional Bristle compared with the level before.</div>`;
  return hint + feedConfigHtml({
    type: "pig"
  }) + bristleMedicineHtml() + bristleSpiceConfigHtml() + data.rows.map(r => bristleCardHtml(r, data)).join("");
}

function tileProductHtml(pr) {
  return `<span class="rc-tile-prod"><span class="rc-tile-pq">×${n2(pr.qty)}</span><span class="rc-tile-pi">${ui.getIcon(pr.name)}</span><span class="rc-tile-pn">${esc(pr.name)}</span><span class="rc-tile-pv">${flowerHtml(pr.gross)}</span></span>`;
}

function tilesHtml(rows) {
  if (!rows.length) return `<div class="rc-empty">No animals selected yet. Tick an animal above to include it in the calculation.</div>`;
  return `<div class="rc-tiles-wrap guro-frame"><div class="rc-tiles rc-tiles-animals">${rows.map(r => {
    const good = r.net >= 0;
    return `<div class="rc-tile rc-tile-animal guro-frame ${good ? "is-profit" : "is-loss"}" data-rc-tile="${esc(r.type)}"><span class="rc-tile-icon">${iconOf(r.type)}</span><span class="rc-tile-prods">${r.productRows.map(tileProductHtml).join("")}</span></div>`;
  }).join("")}</div></div>`;
}

function valueBoxHtml(label, html, extra, splitHtml) {
  return `<div class="rc-val guro-frame${extra ? " " + extra : ""}"><span class="rc-val-label">${label}</span><span class="rc-val-num">${html}</span>${splitHtml || ""}</div>`;
}

function splitRowsHtml(list, key, signedNet) {
  if (!list.length) return "";
  return `<span class="rc-val-split">${list.map(e => `<span class="rc-val-split-row"><span class="rc-val-split-name">${ui.getIcon(e.name)}<span>${esc(e.name)}</span></span><span class="rc-val-split-num${signedNet ? (e[key] >= 0 ? " is-profit" : " is-loss") : ""}">${signedNet ? signed(e[key], fl) : fl(e[key])}${calc.FLOWER_ICON}</span></span>`).join("")}</span>`;
}

function valuesHtml(rows) {
  const t = totalsOf(rows);
  const feeBox = (calc.feePercent || 0) > 0 ? valueBoxHtml("Market Fee", flowerHtml(t.fee)) : "";
  return `<div class="rc-values">
    ${valueBoxHtml("Gross", flowerHtml(t.gross), "rc-val-wide", splitRowsHtml(t.products, "gross", false))}
    ${valueBoxHtml("Feed Cost", flowerHtml(t.feed))}
    ${valueBoxHtml("Medicine Cost", flowerHtml(t.medicine))}
    ${valueBoxHtml(spiceLabelFor(rows) + " Cost", flowerHtml(t.spice))}
    ${valueBoxHtml("Shrine Cost", flowerHtml(t.shrine))}
    ${feeBox}
  </div>
  <div class="rc-net-row">
    ${valueBoxHtml("Net", `<span class="${t.net >= 0 ? "is-profit" : "is-loss"}">${signed(t.net, fl)}${calc.FLOWER_ICON}</span>`, "rc-val-net", splitRowsHtml(t.products, "net", true))}
    <button type="button" class="rc-linktext" data-rc-open="computation"${rows.length ? "" : " disabled"}>Computation</button>
  </div>`;
}

function modeNoteHtml() {
  const heads = state.selected.reduce((s, n) => s + (calc.getAnimalCount(n).qty || 0), 0);
  const warn = state.selected.length && heads <= 0 ? `<div class="rc-note is-warn">The selected animals have 0 heads, so every result is 0. Open Animals above and enter your heads.</div>` : "";
  const text = `24Hrs Mode: every selected animal is fed, loved and collected for all the cycles that fit in 24 hours. XP left over after a level up carries into the next cycle, and the feed, affection and level change as the animals level up.`;
  return `<div class="rc-details-row"><button type="button" class="rc-linktext" data-rc-details aria-expanded="${detailsOpen ? "true" : "false"}">Details</button></div>${detailsOpen ? `<div class="rc-note">${text}</div>` : ""}${warn}`;
}

function pickerHtml() {
  return `<section class="rc-block guro-frame" aria-label="Animals Calculator">
    <div class="rc-block-title">Animals Calculator</div>
    <div class="rc-crops" id="rcCrops">${cropCellsHtml()}</div>
  </section>`;
}

function resultsHtml() {
  const rows = computeAll();
  if (state.bristles && !state.selected.length) return "";
  return `<section class="rc-block guro-frame" aria-label="Animals results">
    <div class="rc-modes rc-modes-one" role="group" aria-label="Calculation mode"><button type="button" class="rc-mode guro-frame is-on" aria-pressed="true">24Hrs Mode</button></div>
    <div class="rc-tools">
      <button type="button" class="rc-tool guro-frame" data-rc-open="skills">Skills</button>
      <button type="button" class="rc-tool guro-frame" data-rc-open="boost">Boost</button>
      <button type="button" class="rc-tool guro-frame" data-rc-open="animals">Animals</button>
    </div>
    ${modeNoteHtml()}
    <div id="rcResults">${tilesHtml(rows)}${valuesHtml(rows)}</div>
  </section>`;
}

function render() {
  if (!host) return;
  const scroller = document.scrollingElement;
  const y = scroller ? scroller.scrollTop : 0;
  host.innerHTML = pickerHtml() + resultsHtml() + bristlesBlockHtml();
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
  for (let i = blocks.length - 1; i >= 1; i--) blocks[i].remove();
  const tmp = document.createElement("div");
  tmp.innerHTML = resultsHtml() + bristlesBlockHtml();
  while (tmp.firstChild) host.appendChild(tmp.firstChild);
  if (popup === "computation" || popup === "bristles") renderOverlayBody();
}

function boostEffectParts(b, products) {
  const p = [];
  if (b.feedMult) p.push(`×${b.feedMult} feed`);
  if (b.feedMultAll) p.push(`×${b.feedMultAll} feed`);
  if (b.xpMult) p.push(`×${b.xpMult} feed XP`);
  if (b.mud) p.push("no sickness");
  if (b.truffleMult) p.push(`×${b.truffleMult} Truffle`);
  if (b.bristleMult) p.push(`×${b.bristleMult} Bristles`);
  if (b.yieldMultAll) p.push(`×${b.yieldMultAll} yield`);
  if (b.yieldAddAll) p.push(`${b.yieldAddAll > 0 ? "+" : ""}${n2(b.yieldAddAll)} all produce`);
  if (b.productIndex != null && b.yieldAdd) p.push(`${b.yieldAdd > 0 ? "+" : ""}${n2(b.yieldAdd)} ${products[b.productIndex] || "produce"}`);
  if (b.timeMult) p.push(`×${b.timeMult} time`);
  if (b.timeMultAll) p.push(`×${b.timeMultAll} time`);
  if (b.freeFeed) p.push("free feed");
  if (b.freeCure) p.push("free medicine");
  if (b.cureCostMult) p.push(`×${b.cureCostMult} medicine cost`);
  return p;
}

function appliedBoostHtml(r) {
  const rows = r.fig.activeBoosts.map(b => ({
    b: b,
    parts: boostEffectParts(b, r.products)
  })).filter(x => x.parts.length).map(x => `<div class="rc-boost-row">${ui.getBoostIconAnyFallback(x.b.name)}<span class="rc-boost-name">${esc(x.b.name)}</span><span class="rc-boost-eff">${esc(x.parts.join(", "))}</span></div>`);
  const spiceKey = r.fig.spiceActiveKey;
  if (spiceKey) rows.push(`<div class="rc-boost-row">${ui.getIcon(SPICE_LABELS[spiceKey])}<span class="rc-boost-name">${SPICE_LABELS[spiceKey]}</span><span class="rc-boost-eff">${SPICE_EFFECTS[spiceKey]}</span></div>`);
  return `<div class="rc-group"><div class="rc-comp-sub">Applied Boost</div>${rows.join("") || `<div class="rc-boost-none">No boost applied</div>`}</div>`;
}

function kv(label, html, cls) {
  return `<div class="rc-kv${cls ? " " + cls : ""}"><span class="rc-kv-label">${label}</span><span class="rc-kv-val">${html}</span></div>`;
}

function matRowHtml(icon, name, qty, value, badge) {
  return `<div class="rc-mat-row"><span class="rc-mat-main">${icon}<span class="rc-mat-name">${esc(name)}</span><span class="rc-mat-qty">×${n2(qty)}</span><span class="rc-mat-val">(${flowerHtml(value)})</span></span><span class="rc-badge">${badge}</span></div>`;
}

function tbtn(act, a, b, label, on, type) {
  return `<button type="button" class="es-mode-btn es-toolcfg-tbtn${on ? " active" : ""}" data-an-act="${act}" data-an-a="${esc(a)}" data-an-b="${esc(b)}"${type ? ` data-an-type="${esc(type)}"` : ""}>${label}</button>`;
}

function toggleRow(iconHtml, name, buttonsHtml, qty) {
  return `<div class="rc-tool-mat"><span class="rc-tool-mat-item">${qty != null ? `<span class="rc-tool-mat-qty">${n2(qty)}×</span>` : ""}${iconHtml}<span class="rc-tool-mat-name">${esc(name)}</span></span><span class="es-toolcfg-tog">${buttonsHtml}</span></div>`;
}

function collectBuy(act, name, mode) {
  return tbtn(act, name, "collect", "Collect", mode === "collect") + tbtn(act, name, "buy", "Buy", mode === "buy");
}

function slopOptionText(o) {
  return `${o.name} ×${o.qty} · ${o.cost > 0 ? fl(calc.coinsToFlower(o.cost)) + " FLOWER" : "no price"}`;
}

function slopConfigHtml() {
  const rows = calc.PIG_FEED_KEYS.map(k => {
    const chosen = calc.getPigSlopIngredientChoice(k);
    const options = prices.getPigSlopOptions(k);
    const pick = prices.resolvePigSlopIngredient(k);
    const current = chosen ? options.find(o => o.name === chosen) : null;
    const btnIcon = chosen ? ui.getIcon(chosen) : pick && pick.name ? ui.getIcon(pick.name) : "";
    const btnText = current ? slopOptionText(current) : "Auto · cheapest";
    const label = calc.PIG_FEEDS[k].label;
    const toggles = pick && pick.name ? `<div class="rc-slop-head"><span class="rc-tool-mat-item">${ui.getIcon(pick.name)}<span class="rc-tool-mat-name">${esc(pick.name)} ×${pick.qty}${pick.auto ? " · auto" : ""}</span></span><span class="es-toolcfg-tog">${collectBuy("feedmode", pick.name, calc.getMaterialMode("AnimalFeed", pick.name))}</span></div>` : "";
    return `<div class="rc-slop-row"><div class="rc-slop-head"><span class="rc-tool-mat-item">${ui.getIcon(label)}<span class="rc-tool-mat-name">${esc(label)}</span></span></div><button type="button" class="rc-dd-btn guro-frame" data-an-slop-open="${k}" aria-haspopup="listbox" aria-label="${esc(label)} ingredient"><span class="rc-dd-icon">${btnIcon}</span><span class="rc-dd-label">${esc(btnText)}</span><span class="rc-dd-chev">▾</span></button>${toggles}</div>`;
  }).join("");
  return `<div class="rc-group"><div class="rc-comp-sub">Slop Config</div><div class="rc-tool-cfg"><div class="rc-note">Each feeding uses 1 Slop. Pick the one ingredient you mix each Slop from, or leave Auto to use the cheapest priced one.</div>${rows}</div></div>`;
}

function closeSlopPicker() {
  if (promptEl) {
    promptEl.remove();
    promptEl = null;
  }
}

function openSlopPicker(k) {
  const feed = calc.PIG_FEEDS[k];
  if (!feed) return;
  closeSlopPicker();
  const chosen = calc.getPigSlopIngredientChoice(k);
  const options = prices.getPigSlopOptions(k);
  const pick = prices.resolvePigSlopIngredient(k);
  const autoIcon = pick && pick.name ? ui.getIcon(pick.name) : "";
  const optRow = (value, icon, text, on) => `<div class="rc-dd-opt${on ? " is-on" : ""}" role="option" tabindex="0" aria-selected="${on ? "true" : "false"}" data-an-slop-pick="${esc(value)}"><span class="rc-dd-icon">${icon}</span><span class="rc-dd-label">${esc(text)}</span><span class="rc-dd-chev">${on ? "✓" : ""}</span></div>`;
  const list = optRow("", autoIcon, "Auto · cheapest", !chosen) + options.map(o => optRow(o.name, ui.getIcon(o.name), slopOptionText(o), chosen === o.name)).join("");
  promptEl = document.createElement("div");
  promptEl.className = "rc-overlay rc-overlay-top";
  promptEl.innerHTML = `<div class="rc-prompt rc-slop-pop guro-frame" role="dialog" aria-modal="true" aria-label="${esc(feed.label)} ingredient"><div class="rc-slop-pop-title">${ui.getIcon(feed.label)}<span>${esc(feed.label)} Ingredient</span></div><div class="rc-slop-pop-list" role="listbox">${list}</div></div>`;
  promptEl.addEventListener("click", e => {
    if (e.target === promptEl) {
      closeSlopPicker();
      return;
    }
    const opt = e.target.closest("[data-an-slop-pick]");
    if (!opt) return;
    calc.setPigSlopIngredient(k, opt.getAttribute("data-an-slop-pick"));
    closeSlopPicker();
    prices.invalidateCostCache();
    renderOverlayBody();
    refreshResults();
  });
  promptEl.addEventListener("keydown", e => {
    if ((e.key === "Enter" || e.key === " ") && e.target.closest("[data-an-slop-pick]")) {
      e.preventDefault();
      e.target.closest("[data-an-slop-pick]").click();
    }
  });
  document.body.appendChild(promptEl);
  const on = promptEl.querySelector(".rc-dd-opt.is-on");
  if (on) on.scrollIntoView({
    block: "center"
  });
}

function beetleRowHtml() {
  const cur = calc.getBeetleFeed();
  const opts = [ [ "", "Off" ], [ "beetleGreen", "Green" ], [ "beetleBlue", "Blue" ], [ "beetlePink", "Pink" ], [ "beetleAmber", "Amber" ] ];
  const btns = opts.map(o => tbtn("beetle", "beetle", o[0], o[1], cur === o[0])).join("");
  const note = cur ? `<div class="rc-boost-none">${esc(calc.FEED_LABELS[cur])}: ${calc.BEETLE_FEED_XP[cur]} XP, 1 per feed. Chonky Feed and Pig Onesie do not apply.</div>` : "";
  return toggleRow(ui.getIcon("Green Beetle"), "Beetle", btns) + note;
}

function feedConfigHtml(r) {
  if (r && r.type === "pig") {
    const base = slopConfigHtml();
    return base.replace('<div class="rc-tool-cfg">', '<div class="rc-tool-cfg">' + beetleRowHtml());
  }
  const omni = calc.isOmnifeedEnabled();
  const omniRow = toggleRow(ui.getIcon("Omnifeed"), "Omnifeed", tbtn("omni", "omni", "off", "Off", !omni) + tbtn("omni", "omni", "on", "On", omni));
  const crops = omni ? `<div class="rc-boost-none">Omnifeed costs 1${calc.GEM_ICON} per feed, so the ingredients below are not used.</div>` : "";
  const rows = omni ? "" : feedCrops().map(c => toggleRow(ui.getIcon(c), c, collectBuy("feedmode", c, calc.getMaterialMode("AnimalFeed", c)))).join("");
  return `<div class="rc-group"><div class="rc-comp-sub">Feed Config</div><div class="rc-tool-cfg">${beetleRowHtml()}${omniRow}${crops}${rows}</div></div>`;
}

function medicineConfigHtml(r) {
  const est = calc.getSicknessEstimate(r.type);
  const recipe = calc.getBoostedMedicineRecipe();
  const free = r.fig.costPerCureFlower <= 0 && r.fig.medicineFlowerPerLevel <= 0 && r.fig.activeBoosts.some(b => b.freeCure);
  const sick = `<label class="rc-sick-row"><span class="rc-tool-mat-name">Sick heads (of ${n2(r.qty)})</span><input type="number" min="0" step="any" inputmode="decimal" class="rc-sick-input guro-frame" data-an-sick="${esc(r.type)}" value="${est.sickHeads ? est.sickHeads : ""}" placeholder="0"></label>`;
  const rows = r.type === "pig" && r.fig.mudActive ? `<div class="rc-boost-none">Mud keeps Pigs from falling sick, so no medicine is used</div>` : free ? `<div class="rc-boost-none">Free medicine</div>` : Object.keys(recipe).filter(n => recipe[n] > 0).map(n => toggleRow(ui.getIcon(n), n, collectBuy("medmode", n, calc.getMedicineIngredientMode(n)), recipe[n])).join("");
  return `<div class="rc-group"><div class="rc-comp-sub">Medicine Config (Barn Delight)</div><div class="rc-tool-cfg">${sick}${rows}</div></div>`;
}

function affectionConfigHtml(r) {
  const s = calc.computeAnimalAffectionSummary(r.type);
  const cols = Object.keys(calc.ANIMAL_LOVE_ITEM_XP).map(key => {
    const t = s.tools[key];
    const owned = !!calc.animalAffectionTools[key];
    const shown = Math.round(t.count * 100) / 100;
    const input = owned && s.qty > 0 ? `<input type="number" min="0" step="any" inputmode="decimal" class="rc-love-input guro-frame" data-an-love="${esc(r.type)}" data-an-tool="${key}" value="${shown}" aria-label="${esc(TOOL_LABELS[key])} uses per cycle">` : `<span class="rc-love-off">—</span>`;
    return `<div class="rc-love-row"><div class="rc-love-head"><span class="rc-tool-mat-name">${esc(TOOL_LABELS[key])}</span><span class="rc-kv-sub">+${n2(t.xpEach)} XP each</span></div><span class="es-toolcfg-tog">${tbtn("tool", key, "off", "Not Owned", !owned)}${tbtn("tool", key, "on", "Owned", owned)}</span><div class="rc-love-use"><span class="rc-kv-sub">Uses / cycle</span>${input}</div></div>`;
  }).join("");
  return `<div class="rc-group"><div class="rc-comp-sub">Affection Tools</div><div class="rc-tool-cfg"><div class="rc-note">${n2(s.qty)} heads × ${s.opportunities} love actions = ${n2(s.capacity)} per cycle. Leave a use field empty to go back to the automatic count.</div>${cols}</div></div>`;
}

function spiceIngredientRowsHtml(activeName) {
  const parts = [];
  const f = calc.computeSpiceFigures(activeName);
  parts.push(toggleRow(ui.getIcon(activeName), activeName + " (batch output)", "", f.output));
  f.ingredients.forEach(ing => {
    if (ing.hasToggle) {
      parts.push(toggleRow(ui.getIcon(ing.name), ing.name, collectBuy("spicemode", ing.name, calc.spiceMaterialMode(ing.name)), ing.qty));
      return;
    }
    if (ing.name === "Refined Salt") {
      const rf = calc.computeSpiceFigures("Refined Salt");
      const salt = rf.ingredients[0];
      const saltQty = ing.qty * salt.qty / rf.output;
      parts.push(`<div class="rc-tool-mat"><span class="rc-tool-mat-item"><span class="rc-tool-mat-qty">${n2(ing.qty)}×</span>${ui.getIcon(ing.name)}<span class="rc-tool-mat-name">${esc(ing.name)}</span><span class="rc-mat-val">(${n2(saltQty)}× ${ui.getIcon("Salt")})</span></span><span class="es-toolcfg-tog">${collectBuy("spicemode", "Salt", calc.spiceMaterialMode("Salt"))}</span></div>`);
      return;
    }
    parts.push(toggleRow(ui.getIcon(ing.name), ing.name, "", ing.qty));
  });
  return parts.join("");
}

function spiceConfigHtml(r) {
  const cur = r.fig.spiceActiveKey || "none";
  const choose = `<div class="rc-tool-mat"><span class="rc-tool-mat-item"><span class="rc-tool-mat-name">Consumable</span></span><span class="es-toolcfg-tog">${tbtn("spice", "spice", "none", "None", cur === "none", r.type)}${tbtn("spice", "spice", "saltLick", "Salt Lick", cur === "saltLick", r.type)}${tbtn("spice", "spice", "honeyTreat", "Honey Treat", cur === "honeyTreat", r.type)}${tbtn("spice", "spice", "truffleSeasoning", "Truffle Seasoning", cur === "truffleSeasoning", r.type)}</span></div>`;
  const activeName = cur === "none" ? null : SPICE_LABELS[cur];
  const rows = activeName ? spiceIngredientRowsHtml(activeName) : `<div class="rc-boost-none">No consumable selected</div>`;
  const dur = calc.getSpiceLickDurationHarvests();
  const sleeps = calc.getTruffleSeasoningSleeps();
  const note = `<div class="rc-note">One animal can use one consumable at a time. Salt Lick and Honey Treat last ${dur} harvests. Truffle Seasoning halves the sleep it is spent on and lasts ${sleeps} ${sleeps === 1 ? "sleep" : "sleeps"}, so it is counted as re-applied at every claim. Ingredient quantities are per one Spice Rack batch, as shown in the game. Refined Salt is made from Salt.</div>`;
  return `<div class="rc-group"><div class="rc-comp-sub">Spice Rack</div><div class="rc-tool-cfg">${choose}${rows}${note}</div></div>`;
}

function materialsHtml(r) {
  const fig = r.fig;
  const week = r.week;
  const rows = [];
  if (week && week.feedQtyWeek > 0) {
    const feedName = week.feedLabel;
    rows.push(matRowHtml(ui.getIcon(feedName), feedName, fig.effectiveFeedQty * r.qty, r.cycleFeed, "1 cycle"));
    rows.push(matRowHtml(ui.getIcon(feedName), feedName, week.feedQtyWeek, r.feed, "24hr"));
    const slopBd = r.type === "pig" && fig.feedInfo && fig.feedInfo.breakdown && fig.feedInfo.breakdown[0];
    if (slopBd) rows.push(matRowHtml(ui.getIcon(slopBd.name), slopBd.name, fig.effectiveFeedQty * r.qty * slopBd.qty, r.cycleFeed, "1 cycle"));
  }
  if (week && r.medicine > 0) {
    const recipe = calc.getBoostedMedicineRecipe();
    const cures = week.sickHeads * r.cycles;
    Object.keys(recipe).filter(n => recipe[n] > 0).forEach(n => {
      rows.push(matRowHtml(ui.getIcon(n), n, recipe[n] * cures, r.medicine * (recipe[n] / Object.keys(recipe).reduce((s, k) => s + recipe[k], 0)), "24hr"));
    });
  }
  const mudUnits24 = fig.mudActive ? calc.PIG_MUD_PER_APPLICATION * r.qty * r.cycles / fig.mudHarvestsPerCoat : 0;
  const mudValue24 = fig.mudActive ? mudUnits24 * fig.mudUnitFlower : 0;
  if (week && week.spiceActiveKey && r.spice - mudValue24 > 0) {
    const label = SPICE_LABELS[week.spiceActiveKey];
    const spiceUnits24 = week.boostedCycles * r.qty / calc.getSpiceDurationHarvests(week.spiceActiveKey);
    rows.push(matRowHtml(ui.getIcon(label), label, spiceUnits24, r.spice - mudValue24, "24hr"));
    const sf = calc.computeSpiceFigures(label);
    sf.ingredients.forEach(ing => {
      const ingQty = spiceUnits24 * ing.qty / sf.output;
      const ingValue = spiceUnits24 * ing.cost / sf.output;
      rows.push(matRowHtml(ui.getIcon(ing.name), ing.name, ingQty, ingValue, "24hr"));
      if (ing.name === "Refined Salt") {
        const rf = calc.computeSpiceFigures("Refined Salt");
        rows.push(matRowHtml(ui.getIcon("Salt"), "Salt", ingQty * rf.ingredients[0].qty / rf.output, ingValue, "24hr"));
      }
    });
  }
  if (fig.mudActive) {
    rows.push(matRowHtml(ui.getIcon("Mud"), "Mud", calc.PIG_MUD_PER_APPLICATION * r.qty / fig.mudHarvestsPerCoat, fig.mudCostFlowerPerCycle * r.qty, "1 cycle"));
    rows.push(matRowHtml(ui.getIcon("Mud"), "Mud", mudUnits24, mudValue24, "24hr"));
    const mb = fig.mudBreakdown;
    if (mb && mb.mudPerBatch > 0) {
      const mudPerCycle = calc.PIG_MUD_PER_APPLICATION * r.qty / fig.mudHarvestsPerCoat;
      [[mudPerCycle, "1 cycle"], [mudUnits24, "24hr"]].forEach(([mudQty, label]) => {
        const share = mudQty / mb.mudPerBatch;
        if (mb.crop) rows.push(matRowHtml(ui.getIcon(mb.crop.name), mb.crop.name, mb.crop.qty * share, calc.coinsToFlower(mb.cropCoins * share), label));
        rows.push(matRowHtml(ui.getIcon(mb.tool.name), mb.tool.name, mb.tool.count * share, calc.coinsToFlower(mb.tool.coins * share), label));
      });
    }
  }
  const matRows = rows.length ? rows.join("") : `<div class="rc-boost-none">No material used</div>`;
  const yieldRows = r.products.map((p, i) => matRowHtml(ui.getIcon(p), p, fig.yields[i] * r.qty, fig.yields[i] * r.qty * priceOf(p), "1 cycle") + matRowHtml(ui.getIcon(p), p, r.yields[i], r.yields[i] * priceOf(p), "24hr")).join("");
  return `<div class="rc-mat-section rc-group"><div class="rc-boost-label">Material Used</div>${matRows}</div>
    <div class="rc-mat-section rc-group"><div class="rc-boost-label">${esc(r.label)} Yield</div>${yieldRows}</div>`;
}

function totalCycleHtml(r) {
  return `<span class="rc-cycle-val"><span>${n2(r.cycles)}${r.cyclesCustom ? ` <span class="rc-kv-sub">Custom</span>` : ""}</span><button type="button" class="rc-edit-link" data-rc-edit-cycle="${esc(r.type)}">Edit</button></span>`;
}

function pigKvHtml(r) {
  if (r.type !== "pig") return "";
  const fig = r.fig;
  const bd = fig.feedInfo && fig.feedInfo.breakdown && fig.feedInfo.breakdown[0];
  const parts = [];
  if (bd) parts.push(kv("Slop Ingredient", `${ui.getIcon(bd.name)} ${esc(bd.name)} ×${n2(bd.qty)} / Slop`, "rc-kv-wide"));
  if (fig.mudActive) parts.push(kv("Mud / Cycle", flowerHtml(fig.mudCostFlowerPerCycle * r.qty)));
  return parts.join("\n      ");
}

function spiceLabelFor(rows) {
  return rows.some(r => r.type === "pig") ? "Spice & Mud" : "Spice";
}

function computationCardHtml(r) {
  const fig = r.fig;
  const yieldHead = r.products.map((p, i) => `${n2(fig.yields[i])}${ui.getIcon(p)}`).join(" ");
  const yieldTotal = r.products.map((p, i) => `${n2(r.yields[i])}${ui.getIcon(p)}`).join(" ");
  const aff = fig.affectionFigures;
  return `<article class="rc-comp-card guro-frame">
    <header class="rc-comp-head"><span class="rc-comp-icon">${iconOf(r.type)}</span><span class="rc-comp-name">${esc(r.label)} · Lv${r.level}</span><span class="rc-comp-nodes">${iconOf(r.type)} ${n2(r.qty)}</span></header>
    <div class="rc-group"><div class="rc-kv-grid">
      ${kv("Cycle Time", esc(calc.formatDuration(fig.cycleTimeSec)), "rc-kv-wide")}
      ${kv("Yield / Head", yieldHead, "rc-kv-wide")}
      ${kv("Feed Used", `${ui.getIcon(fig.feedNameUsed)} ${esc(fig.feedNameUsed)}`)}
      ${pigKvHtml(r)}
      ${kv("Feeds / Cycle", n2(fig.feedCount))}
      ${kv("Feed Qty / Feed", n2(fig.feedQtyPerFeed))}
      ${kv("XP / Feed", `${n2(fig.feedXpPerFeed)} XP`)}
      ${kv("XP Needed", `${n2(fig.expNeeded)} XP`)}
      ${kv("Affection XP / Cycle", `${n2(fig.loveXpPerCycle)} XP`)}
      ${kv("Cost / Cure", flowerHtml(fig.costPerCureFlower))}
      ${kv("Sick Heads", n2(fig.sickHeads))}
      ${kv("Gross / Cycle", flowerSigned(r.cycleGross))}
      ${kv("Feed / Cycle", flowerHtml(r.cycleFeed))}
      ${kv("Medicine / Cycle", flowerHtml(r.cycleMedicine))}
      ${kv(spiceLabelFor([ r ]) + " / Cycle", flowerHtml(r.cycleSpice))}
      ${kv("Shrine / Cycle", flowerHtml(r.cycleShrine))}
      ${kv("Net / Cycle", `<span class="${r.cycleNet >= 0 ? "is-profit" : "is-loss"}">${signed(r.cycleNet, fl)}${calc.FLOWER_ICON}</span>`, "rc-kv-wide")}
    </div></div>
    <div class="rc-group"><div class="rc-comp-sub">24Hrs Mode</div>
    <div class="rc-kv-grid">
      ${kv("Total Cycle", totalCycleHtml(r))}
      ${kv("Total Yield", yieldTotal)}
      ${kv("Total Gross", flowerSigned(r.gross))}
      ${kv("Total Feed Cost", flowerHtml(r.feed))}
      ${kv("Total Medicine Cost", flowerHtml(r.medicine))}
      ${kv("Total " + spiceLabelFor([ r ]) + " Cost", flowerHtml(r.spice))}
      ${kv("Total Shrine Cost", flowerHtml(r.shrine))}
      ${(calc.feePercent || 0) > 0 ? kv("Market Fee", flowerHtml(r.fee)) : ""}
      ${kv("Total Net", `<span class="${r.net >= 0 ? "is-profit" : "is-loss"}">${signed(r.net, fl)}${calc.FLOWER_ICON}</span>`, "rc-kv-wide rc-kv-net")}
    </div></div>
    ${appliedBoostHtml(r)}
    ${feedConfigHtml(r)}
    ${medicineConfigHtml(r)}
    ${affectionConfigHtml(r)}
    ${spiceConfigHtml(r)}
    ${materialsHtml(r)}
  </article>`;
}

function computationBodyHtml() {
  const rows = computeAll();
  if (!rows.length) return `<div class="rc-empty">No animals selected.</div>`;
  return rows.map(computationCardHtml).join("");
}

function boostBodyHtml() {
  const types = focusTypes();
  if (!types.length) return `<div class="rc-empty">Select at least one animal to see the boosts that affect it.</div>`;
  const subjects = types.map(n => ({
    name: labelOf(n),
    type: n,
    icon: iconOf(n)
  }));
  const boosts = calc.BOOSTS.filter(b => b.source !== "skill" && !b.hiddenFromOwnPanel && b.category === "animals");
  const appliesTo = (b, s) => b.scope === "animalGlobal" || b.scope === "animalType" && b.target === s.type;
  const html = boostsBySubjectHtml({
    subjects: subjects,
    boosts: boosts,
    appliesTo: appliesTo,
    unit: "heads",
    noteSkip: /AOE|expected/i,
    allLabel: "Boost for All Selected Animals"
  });
  return `<div class="rc-pop-hint">Boosts that affect ${types.length > 1 ? "your selected animals" : esc(labelOf(types[0]))}. Tap a boost to switch it on or off, then press Save.</div>${html || `<div class="rc-empty">No boosts found.</div>`}`;
}

function draftValue(type, field) {
  const key = type + ":" + field;
  if (animalsDraft && Object.prototype.hasOwnProperty.call(animalsDraft, key)) return animalsDraft[key];
  const c = calc.getAnimalCount(type);
  return parseFloat(c[field]) || 0;
}

function animalsBodyHtml() {
  const types = focusTypes();
  if (!types.length) return `<div class="rc-empty">Select at least one animal to edit its heads and level.</div>`;
  const rows = types.map(t => {
    const qty = draftValue(t, "qty");
    const level = draftValue(t, "level");
    return `<label class="rc-node-row guro-frame"><span class="rc-node-icon">${iconOf(t)}</span><span class="rc-node-text"><span class="rc-node-name">${esc(labelOf(t))} Heads</span><span class="rc-node-used">How many you own</span></span><input type="number" min="0" step="1" inputmode="numeric" data-an-draft="${esc(t)}:qty" value="${qty ? qty : ""}" placeholder="0"></label>
    <label class="rc-node-row guro-frame"><span class="rc-node-icon">${iconOf(t)}</span><span class="rc-node-text"><span class="rc-node-name">${esc(labelOf(t))} Level</span><span class="rc-node-used">Current level, 1 to 15</span></span><input type="number" min="1" max="15" step="1" inputmode="numeric" data-an-draft="${esc(t)}:level" value="${level ? level : 1}" placeholder="1"></label>`;
  }).join("");
  return `<div class="rc-pop-hint">Enter your heads and the current level of each animal, then press Save.</div>${rows}`;
}

function popupTitle() {
  if (popup === "skills") return "Animal Skills";
  if (popup === "boost") return "Animal Boosts";
  if (popup === "animals") return "Animals";
  if (popup === "bristles") return "Bristles Computation";
  return "Computation";
}

function popupBodyHtml() {
  if (popup === "boost") return boostBodyHtml();
  if (popup === "animals") return animalsBodyHtml();
  if (popup === "computation") return computationBodyHtml();
  if (popup === "bristles") return bristlesBodyHtml();
  return `<div class="rc-pop-hint">Animal skills from the Skill Tree. Changes here also change the Skill Tree. Press Save to apply them.</div><div id="rcSkillSlot"></div>`;
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
    calc.setSkillCategory("animals");
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
  if (popup === "animals") return `<button type="button" class="rc-save guro-frame" id="rcAnimalsSave">Save Changes</button>`;
  if (popup === "skills" || popup === "boost") return `<div id="rcSaveSlot"></div>`;
  return "";
}

function overlayHtml() {
  return `<div class="rc-pop guro-frame rc-pop-animals${popup === "computation" || popup === "bristles" ? " rc-pop-comp" : ""}" role="dialog" aria-modal="true" aria-label="${popupTitle()}">
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

function animalsDirty() {
  if (!animalsDraft) return false;
  return Object.keys(animalsDraft).some(k => {
    const parts = k.split(":");
    return Number(animalsDraft[k]) !== (parseFloat(calc.getAnimalCount(parts[0])[parts[1]]) || 0);
  });
}

function isPopupDirty() {
  if (popup === "skills" || popup === "boost") return calc.isSkillDraftDirty() || calc.isBoostDraftDirty();
  if (popup === "animals") return animalsDirty();
  return false;
}

function openPopup(kind) {
  if (popup) return;
  popup = kind;
  animalsDraft = null;
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
  animalsDraft = null;
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
  const wasComputation = popup === "computation" || popup === "bristles";
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

function openCycleEditor(type) {
  if (promptEl) promptEl.remove();
  const fig = calc.computeAnimalTypeFigures(type);
  const current = state.cycles[type] > 0 ? state.cycles[type] : "";
  const fallback = Math.max(1, Math.round(86400 / fig.cycleTimeSec));
  promptEl = document.createElement("div");
  promptEl.className = "rc-overlay rc-overlay-top";
  promptEl.innerHTML = `<div class="rc-prompt rc-cycle-edit guro-frame" role="dialog" aria-modal="true" aria-label="Editing Cycle"><div class="rc-cycle-edit-label">Editing Cycle</div><div class="rc-cycle-edit-row"><input type="number" min="0" max="${MAX_CUSTOM_CYCLES}" step="1" inputmode="numeric" class="rc-cycle-input guro-frame" data-rc-cycle-input value="${current}" placeholder="${fallback}" aria-label="Cycle count"><button type="button" class="rc-prompt-btn guro-frame" data-rc-cycle-save>Save</button></div></div>`;
  promptEl.addEventListener("click", e => {
    if (e.target === promptEl) {
      closeCycleEditor();
      return;
    }
    if (e.target.closest("[data-rc-cycle-save]")) saveCycleEdit(type);
  });
  promptEl.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveCycleEdit(type);
    }
  });
  document.body.appendChild(promptEl);
  const input = promptEl.querySelector("[data-rc-cycle-input]");
  if (input) {
    input.focus();
    input.select();
  }
}

function saveCycleEdit(type) {
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
    if (isFinite(value) && value > 0) state.cycles[type] = Math.min(value, MAX_CUSTOM_CYCLES); else delete state.cycles[type];
    saveState();
    closeCycleEditor();
    refreshResults();
    chip.classList.add("is-done");
    chip.innerHTML = `<span class="bg-sim-tick">✓</span><span class="bg-sim-saving-text">Saved</span>`;
    setTimeout(() => chip.remove(), 900);
  }, 700);
}

function saveAnimals() {
  const draft = animalsDraft || {};
  Object.keys(draft).forEach(k => {
    const parts = k.split(":");
    if (!isType(parts[0])) return;
    let v = Math.floor(Number(draft[k]) || 0);
    if (parts[1] === "level") v = Math.min(15, Math.max(1, v)); else v = Math.max(0, v);
    calc.setAnimalCount(parts[0], parts[1], v);
  });
  prices.invalidateCostCache();
  ui.renderAnimalsList();
  calc.updateCalcSummary();
  animalsDraft = null;
  calc.toast("✅ Animals saved");
  renderOverlayBody();
  refreshResults();
}

function setSpice(type, key) {
  Object.keys(SPICE_LABELS).forEach(k => {
    calc.spiceUsage[k][type] = k === key;
  });
  Object.keys(SPICE_LABELS).forEach(k => {
    calc.spiceUsage[k].active = calc.SPICE_ANIMAL_TYPES.some(t => calc.spiceUsage[k][t]);
  });
  saveSpiceUsage();
}

function applyAction(btn) {
  const act = btn.getAttribute("data-an-act");
  const a = btn.getAttribute("data-an-a");
  const b = btn.getAttribute("data-an-b");
  if (act === "feedmode") calc.setMaterialMode("AnimalFeed", a, b);
  else if (act === "medmode") calc.setMedicineIngredientMode(a, b);
  else if (act === "spicemode") calc.setSpiceMaterialMode(a, b);
  else if (act === "omni") calc.setOmnifeedEnabled(b === "on");
  else if (act === "beetle") calc.setBeetleFeed(b);
  else if (act === "tool") calc.setAnimalAffectionTool(a, b === "on");
  else if (act === "spice") setSpice(btn.getAttribute("data-an-type"), b === "none" ? null : b);
  else return;
  prices.invalidateCostCache();
  renderOverlayBody();
  refreshResults();
}

function toggleCrop(name, input) {
  const idx = state.selected.indexOf(name);
  if (idx >= 0) state.selected.splice(idx, 1); else state.selected.push(name);
  saveState();
  const label = input ? input.closest(".rc-crop") : null;
  if (label) label.classList.toggle("is-on", state.selected.includes(name));
  refreshResults();
}

function toggleBristles(input) {
  state.bristles = !!input.checked;
  saveState();
  const label = input.closest(".rc-crop");
  if (label) label.classList.toggle("is-on", state.bristles);
  refreshResults();
}

function onClick(e) {
  const details = e.target.closest("[data-rc-details]");
  if (details) {
    detailsOpen = !detailsOpen;
    refreshResults();
    return;
  }
  const binfo = e.target.closest("[data-rc-binfo]");
  if (binfo) {
    bristleInfoOpen = !bristleInfoOpen;
    refreshResults();
    return;
  }
  const bopt = e.target.closest("[data-rc-bopt]");
  if (bopt) {
    const parts = bopt.getAttribute("data-rc-bopt").split(":");
    state.bristleOpts[parts[0]] = parts[0] === "spice" ? parts[1] : parts[1] === "on";
    saveState();
    refreshResults();
    return;
  }
  const basis = e.target.closest("[data-rc-bbasis]");
  if (basis) {
    state.bristleBasis = basis.getAttribute("data-rc-bbasis") === "gross" ? "gross" : "net";
    saveState();
    refreshResults();
    return;
  }
  const open = e.target.closest("[data-rc-open]");
  if (open && !open.disabled) openPopup(open.getAttribute("data-rc-open"));
}

function onChange(e) {
  const t = e.target;
  if (t && t.dataset && t.dataset.rcCrop != null) toggleCrop(t.dataset.rcCrop, t);
  else if (t && t.dataset && t.dataset.rcBristles != null) toggleBristles(t);
}

function onDocChange(e) {
  const t = e.target;
  if (!t || !t.dataset || !overlayEl || !overlayEl.contains(t)) return;
  if (t.dataset.anSick != null) {
    const v = Math.max(0, parseFloat(t.value) || 0);
    calc.animalSicknessEstimate[t.dataset.anSick] = {
      sickHeads: v
    };
    saveAnimalSicknessEstimate();
    prices.invalidateCostCache();
    renderOverlayBody();
    refreshResults();
  } else if (t.dataset.anLove != null) {
    calc.setAnimalAffectionCount(t.dataset.anLove, t.dataset.anTool, t.value === "" ? -1 : parseFloat(t.value));
    prices.invalidateCostCache();
    renderOverlayBody();
    refreshResults();
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
  if (e.target.closest("#rcAnimalsSave")) {
    saveAnimals();
    return;
  }
  const editCycle = e.target.closest("[data-rc-edit-cycle]");
  if (editCycle && popup === "computation") {
    openCycleEditor(editCycle.getAttribute("data-rc-edit-cycle"));
    return;
  }
  const inComp = popup === "computation" || popup === "bristles";
  const slopOpen = e.target.closest("[data-an-slop-open]");
  if (slopOpen && inComp) {
    openSlopPicker(slopOpen.getAttribute("data-an-slop-open"));
    return;
  }
  const act = e.target.closest("[data-an-act]");
  if (act && inComp) {
    applyAction(act);
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
  if (t && t.dataset && t.dataset.anDraft != null) {
    animalsDraft = animalsDraft || {};
    animalsDraft[t.dataset.anDraft] = t.value === "" ? 0 : Number(t.value);
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

export function mountAnimalsCalculator(root) {
  host = root;
  prices.invalidateCostCache();
  state = loadState();
  detailsOpen = false;
  bristleInfoOpen = false;
  host.addEventListener("click", onClick);
  host.addEventListener("change", onChange);
  document.addEventListener("click", onDocClick);
  document.addEventListener("change", onDocChange);
  document.addEventListener("input", onDocInput);
  document.addEventListener("keydown", onKey);
  window.addEventListener("guroBoostsChanged", onBoostsChanged);
  window.addEventListener("guroGemPackChanged", onExternalChange);
  window.addEventListener("guroPricesUpdated", onExternalChange);
  listening = true;
  render();
}

export function unmountAnimalsCalculator() {
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
    document.removeEventListener("change", onDocChange);
    document.removeEventListener("input", onDocInput);
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("guroBoostsChanged", onBoostsChanged);
    window.removeEventListener("guroGemPackChanged", onExternalChange);
    window.removeEventListener("guroPricesUpdated", onExternalChange);
    listening = false;
  }
  host = null;
}

export function animalsCalculatorCanLeave() {
  if (!popup) return true;
  if (isPopupDirty()) {
    calc.toast("⚠️ Save your changes first");
    return false;
  }
  destroyPopup();
  return true;
}
