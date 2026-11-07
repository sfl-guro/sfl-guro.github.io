import * as calc from "./calculator.js";

import { CONFIRM_ICON } from "./confirm_icon.js";

import { caveDayTotals, caveSkillLevel, CAVE_SKILL_RANKS } from "./cave_track.js";

const STATE_KEY = "guro_cave_data_state";

const BEETLES = [ "Green Beetle", "Blue Beetle", "Pink Beetle", "Amber Beetle" ];

const NOT_TRADABLE = [ "Wild Mushroom", "Magic Mushroom", "Mud" ];

const TOOLS = [ "Sand Shovel", "Sand Drill" ];

const MUD_CROPS = {
  Sunflower: 500,
  Potato: 80,
  Rhubarb: 40,
  Pumpkin: 20,
  Zucchini: 20,
  Carrot: 10,
  Yam: 10,
  Cabbage: 5,
  Broccoli: 5,
  Soybean: 3,
  Beetroot: 3,
  Pepper: 3,
  Cauliflower: 2,
  Parsnip: 2,
  Eggplant: 2,
  Corn: 2,
  Onion: 2,
  Wheat: 2,
  Turnip: 2,
  Radish: 2,
  Kale: 2,
  Artichoke: 2,
  Barley: 2,
  Rice: 1,
  Olive: 1
};

const FIXED_INGREDIENTS = {
  Mushroom: {
    Wood: 10
  },
  Beetle: {
    Egg: 30
  }
};

const RECIPE_LABELS = {
  Mushroom: "Mushroom Mix",
  Beetle: "Beetle Mix",
  Mud: "Mud Mix"
};

const LEAN_RANKS = [ .95, .9, .85 ];

const BOOST_DEFS = [ {
  id: "mushroom_house",
  name: "Mushroom House",
  icon: "Mushroom House",
  desc: "+0.2 Wild Mushroom",
  wild: .2
}, {
  id: "fairy_circle",
  name: "Fairy Circle",
  icon: "Fairy Circle",
  desc: "+0.2 Wild Mushroom",
  wild: .2
}, {
  id: "mushroom_hat",
  name: "Mushroom Hat",
  icon: "Mushroom Hat",
  desc: "+0.1 Wild Mushroom",
  wild: .1
} ];

const SKILL_DEFS = [ {
  name: "Fungal Harvest",
  icon: "Fungal Harvest",
  desc: v => "+" + v + " Mushroom",
  ranks: CAVE_SKILL_RANKS["Fungal Harvest"]
}, {
  name: "Muddy Bounty",
  icon: "Muddy Bounty",
  desc: v => "+" + Math.round(v * 100) + "% Mud",
  ranks: CAVE_SKILL_RANKS["Muddy Bounty"]
}, {
  name: "Twin Beetles",
  icon: "Twin Beetles",
  desc: v => v + "% extra Beetle",
  ranks: CAVE_SKILL_RANKS["Twin Beetles"]
}, {
  name: "Sturdy Shovel",
  icon: "Sturdy Shovel",
  desc: v => v + "% keep Shovel",
  ranks: CAVE_SKILL_RANKS["Sturdy Shovel"]
}, {
  name: "Sturdy Drill",
  icon: "Sturdy Drill",
  desc: v => v + "% keep Drill",
  ranks: CAVE_SKILL_RANKS["Sturdy Drill"]
}, {
  name: "Mushroom Bloom",
  icon: "Mushroom Bloom",
  desc: v => "+" + v + " Mushroom tiles",
  ranks: [ 1, 2, 3 ]
}, {
  name: "Beetle Nest",
  icon: "Beetle Nest",
  desc: v => "+" + v + " Beetle tiles",
  ranks: [ 1, 2, 3 ]
}, {
  name: "Rare Breeds",
  icon: "Rare Breeds",
  desc: () => "Rarer Beetles",
  ranks: [ 1, 2, 3 ]
} ];

let state = null;

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function loadState() {
  if (state) return state;
  let raw = null;
  try {
    raw = JSON.parse(localStorage.getItem(STATE_KEY) || "null");
  } catch (e) {
    raw = null;
  }
  const s = raw && typeof raw === "object" ? raw : {};
  const obj = v => v && typeof v === "object" && !Array.isArray(v) ? v : {};
  state = {
    boosts: obj(s.boosts),
    detected: obj(s.detected),
    mudCrops: obj(s.mudCrops),
    mycoOpen: s.mycoOpen === true
  };
  state.pickOpen = null;
  return state;
}

function saveState() {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(loadState()));
  } catch (e) {}
}

function boostOn(id) {
  return loadState().boosts[id] === true;
}

function applyDetected(g) {
  if (!g || typeof g !== "object" || !(g.bumpkin || g.collectibles || g.inventory)) return;
  const st = loadState();
  const placed = calc.farmSyncCollectEquippedAndPlacedNames(g);
  let changed = false;
  BOOST_DEFS.forEach(b => {
    const now = placed.has(b.name);
    if (st.detected[b.id] !== now) {
      st.detected[b.id] = now;
      st.boosts[b.id] = now;
      changed = true;
    }
  });
  if (changed) saveState();
}

function fmt(n) {
  if (!isFinite(n)) return "—";
  return (Math.round(n * 100) / 100).toLocaleString(undefined, {
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

function signedFlower(n) {
  const r = fl(Math.abs(n));
  const sign = n > 0 && r !== "0" ? "+" : n < 0 && r !== "0" ? "-" : "";
  return sign + r + calc.FLOWER_ICON;
}

function icon(api, name) {
  return `<span class="cave-ico">${api.ui.getIcon(name)}</span>`;
}

function buyPrice(api, name) {
  const ip = api.inprogress;
  const m = ip.farmPanelGetMarketPriceFlower ? Number(ip.farmPanelGetMarketPriceFlower(name)) : 0;
  if (m > 0) return m;
  const live = api.prices.findLivePriceForName ? Number(api.prices.findLivePriceForName(name)) : 0;
  return live > 0 ? live : 0;
}

function skillRank(g, name) {
  const lv = caveSkillLevel(g && g.bumpkin && g.bumpkin.skills, name);
  const ranks = CAVE_SKILL_RANKS[name];
  return lv && ranks ? ranks[lv - 1] : 0;
}

function boostGridHtml(api, g) {
  const cards = BOOST_DEFS.map(b => `<div class="betty-boost-row dig-boost-card${boostOn(b.id) ? " is-on" : ""}">
      <span class="dig-boost-icon">${api.ui.getIcon(b.icon)}</span>
      <div class="betty-boost-row-main dig-boost-main">
        <div class="betty-boost-row-name dig-boost-name">${esc(b.name)}</div>
        <div class="betty-boost-row-desc dig-boost-desc">${esc(b.desc)}</div>
      </div>
      <label class="bg-sim-check"><input type="checkbox" data-cave-boost="${b.id}" aria-label="${esc(b.name)}"${boostOn(b.id) ? " checked" : ""}></label>
    </div>`);
  SKILL_DEFS.forEach(s => {
    const lv = caveSkillLevel(g && g.bumpkin && g.bumpkin.skills, s.name);
    if (!lv) return;
    cards.push(`<div class="betty-boost-row dig-boost-card is-on cave-skill-card">
      <span class="dig-boost-icon">${api.ui.getIcon(s.icon)}</span>
      <div class="betty-boost-row-main dig-boost-main">
        <div class="betty-boost-row-name dig-boost-name">${esc(s.name)} <span class="cave-skill-lv">Lv ${lv}</span></div>
        <div class="betty-boost-row-desc dig-boost-desc">${esc(s.desc(s.ranks[lv - 1]))}</div>
      </div>
    </div>`);
  });
  return cards.join("");
}

function hasCrop(name) {
  return typeof name === "string" && Object.prototype.hasOwnProperty.call(MUD_CROPS, name);
}

function cheapestCrop(owner) {
  let best = null;
  let bestCost = Infinity;
  Object.keys(MUD_CROPS).forEach(name => {
    const cost = MUD_CROPS[name] * calc.caveMycoUnitCoins(owner, name);
    if (cost > 0 && cost < bestCost) {
      bestCost = cost;
      best = name;
    }
  });
  return best || "Carrot";
}

function mycoBins(g) {
  const cave = g && g.cave;
  const machines = cave && cave.machines && typeof cave.machines === "object" ? cave.machines : {};
  const level = caveSkillLevel(g && g.bumpkin && g.bumpkin.skills, "Lean Compost");
  const lean = level ? LEAN_RANKS[level - 1] : 1;
  const st = loadState();
  return Object.keys(machines).sort((a, b) => Number(a) - Number(b)).map(id => {
    const batch = machines[id] && machines[id].batch;
    const recipe = batch && RECIPE_LABELS[batch.recipe] ? batch.recipe : "";
    const owner = "Myco Bin " + id;
    let crop = "";
    let auto = false;
    let base = {};
    if (recipe === "Mud") {
      auto = !hasCrop(st.mudCrops[id]);
      crop = auto ? cheapestCrop(owner) : st.mudCrops[id];
      base[crop] = MUD_CROPS[crop];
    } else if (recipe) {
      base = FIXED_INGREDIENTS[recipe];
    }
    const lines = Object.keys(base).map(name => {
      const qty = base[name] * lean;
      const unitCoins = calc.caveMycoUnitCoins(owner, name);
      return {
        name: name,
        qty: qty,
        unitCoins: unitCoins,
        coins: qty * unitCoins
      };
    });
    return {
      id: id,
      owner: owner,
      recipe: recipe,
      crop: crop,
      auto: auto,
      lean: lean,
      lines: lines,
      coins: lines.reduce((a, l) => a + l.coins, 0)
    };
  });
}

function flowerOf(coins) {
  return coins > 0 ? calc.coinsToFlower(coins) : 0;
}

function mycoCardHtml(api, bin) {
  const head = `<div class="cave-myco-head">${icon(api, "Myco Bin")}<span class="cave-myco-name">Myco Bin ${esc(bin.id)}</span><span class="cave-myco-recipe">${bin.recipe ? esc(RECIPE_LABELS[bin.recipe]) : "Empty"}</span></div>`;
  if (!bin.recipe) {
    return `<div class="cave-myco-card guro-frame">${head}<div class="dig-empty">No batch fed in this bin.</div></div>`;
  }
  let pick = "";
  if (bin.recipe === "Mud") {
    const open = loadState().pickOpen === bin.id;
    const label = bin.auto ? "Cheapest (" + bin.crop + ")" : bin.crop + " ×" + MUD_CROPS[bin.crop];
    const option = (value, text, iconName, on) => `<div class="cave-myco-opt${on ? " is-on" : ""}" role="option" tabindex="0" aria-selected="${on}" data-cave-croppick="${esc(bin.id)}|${esc(value)}">${icon(api, iconName)}<span class="cave-myco-opt-name">${esc(text)}</span>${on ? CONFIRM_ICON : ""}</div>`;
    const list = open ? `<div class="cave-myco-options guro-frame" role="listbox">${option("", "Cheapest (" + bin.crop + ")", bin.crop, bin.auto)}${Object.keys(MUD_CROPS).map(name => option(name, name + " ×" + MUD_CROPS[name], name, !bin.auto && bin.crop === name)).join("")}</div>` : "";
    pick = `<div class="cave-myco-pick"><span class="cave-myco-pick-label">Mud crop</span><button type="button" class="cave-myco-select guro-frame${open ? " active" : ""}" data-cave-cropbtn="${esc(bin.id)}" aria-expanded="${open}">${icon(api, bin.crop)}<span class="cave-myco-select-text">${esc(label)}</span><span class="es-toolcfg-chev"></span></button></div>${list}<div class="dig-empty">The game does not save which crop fed a Mud batch.</div>`;
  }
  const lines = bin.lines.map(l => `<div class="cave-myco-line">
      <div class="es-toolcfg-mat"><div class="es-toolcfg-mat-name"><span class="es-toolcfg-qty">×${fmt(l.qty)}</span>${icon(api, l.name)}<span>${esc(l.name)}</span></div>${calc.caveMycoToggleHtml(bin.owner, l.name)}</div>
      <div class="es-toolcfg-mat dig-tool-unit"><span>Price/Unit</span><span class="es-toolcfg-qty dig-coin-val">${fl(flowerOf(l.unitCoins))}${calc.FLOWER_ICON}</span></div>
      <div class="es-toolcfg-mat dig-tool-unit"><span>Cost</span><span class="es-toolcfg-qty dig-coin-val">${fl(flowerOf(l.coins))}${calc.FLOWER_ICON}</span></div>
    </div>`).join("");
  const lean = bin.lean < 1 ? `<div class="dig-empty">Lean Compost ×${bin.lean} applied.</div>` : "";
  const total = `<div class="dig-totals"><div class="dig-total-row"><span class="dig-total-label">Ingredients Cost</span><span class="dig-total-val">${fl(flowerOf(bin.coins))}${calc.FLOWER_ICON}</span></div></div>`;
  return `<div class="cave-myco-card guro-frame">${head}${pick}${lines}${lean}${total}</div>`;
}

function mycoPanelHtml(api, bins) {
  if (!bins.length) return `<div class="dig-empty">No Myco Bins found — sync your farm.</div>`;
  const sum = bins.reduce((a, b) => a + b.coins, 0);
  const total = `<div class="dig-totals"><div class="dig-total-row"><span class="dig-total-label">All Myco Bins</span><span class="dig-total-val">${fl(flowerOf(sum))}${calc.FLOWER_ICON}</span></div></div>`;
  return `<div class="cave-myco-list">${bins.map(b => mycoCardHtml(api, b)).join("")}</div>${total}`;
}

function toolCostsHtml(api, g) {
  const open = calc.caveToolCostsOpen();
  const mycoOpen = loadState().mycoOpen;
  const btn = `<button type="button" class="es-mode-btn dig-toolcfg-btn${open ? " active" : ""}" id="caveToolCfgBtn" data-cave-toolcfg aria-expanded="${open}">Tool Costs<span class="es-toolcfg-chev"></span></button>`;
  const mycoBtn = `<button type="button" class="es-mode-btn dig-toolcfg-btn${mycoOpen ? " active" : ""}" id="caveMycoBtn" data-cave-myco aria-expanded="${mycoOpen}">Myco Bins<span class="es-toolcfg-chev"></span></button>`;
  const panel = open ? `<div class="es-toolcfg">${TOOLS.map(calc.caveToolSectionHtml).join("")}</div>` : "";
  const mycoPanel = mycoOpen ? mycoPanelHtml(api, mycoBins(g)) : "";
  return `<div class="dig-data-tools"><div class="cave-tools-row">${btn}${mycoBtn}</div><div id="caveToolCfgPanel">${panel}</div><div id="caveMycoPanel">${mycoPanel}</div></div>`;
}

function inventoryHtml(api, g) {
  const inv = g && g.inventory && typeof g.inventory === "object" ? g.inventory : {};
  const names = BEETLES.concat([ "Magic Mushroom", "Wild Mushroom", "Mud" ]);
  let buyTotal = 0;
  let beetleQty = 0;
  const rows = names.map(name => {
    const qty = Number(inv[name]);
    if (!isFinite(qty) || qty <= 0) return "";
    let val;
    if (NOT_TRADABLE.indexOf(name) !== -1) {
      val = `<span class="cave-na">Not tradable</span>`;
    } else {
      const price = buyPrice(api, name);
      buyTotal += qty * price;
      beetleQty += qty;
      val = price > 0 ? `<span class="dig-dug-val">${fl(qty * price)}${calc.FLOWER_ICON}</span>` : `<span class="cave-na">No price</span>`;
    }
    return `<div class="dig-dug-row"><span class="dig-dug-qty">×${fmt(qty)}</span>${icon(api, name)}<span class="dig-dug-name">${esc(name)}</span>${val}</div>`;
  }).join("");
  if (!rows) return `<div class="dig-empty">No cave items in inventory — sync your farm.</div>`;
  const totals = beetleQty > 0 ? `<div class="dig-totals"><div class="dig-total-row"><span class="dig-total-label">Beetles (Market Price)</span><span class="dig-total-val">${fmt(beetleQty)} <small>beetles</small>${buyTotal > 0 ? " · " + fl(buyTotal) + calc.FLOWER_ICON : ""}</span></div></div>` : "";
  return `<div class="dig-inv-grid">${rows}</div>${totals}`;
}

function priceHtml(api, g) {
  const rows = [];
  BEETLES.forEach(name => {
    const buy = buyPrice(api, name);
    const val = buy > 0 ? `<span class="dig-price-vals">${fl(buy)}${calc.FLOWER_ICON}</span>` : `<span class="cave-na">No price</span>`;
    rows.push(`<div class="dig-price-row">${icon(api, name)}<span class="dig-price-name">${esc(name)}</span>${val}</div>`);
  });
  NOT_TRADABLE.forEach(name => {
    rows.push(`<div class="dig-price-row">${icon(api, name)}<span class="dig-price-name">${esc(name)}</span><span class="cave-na">Not tradable</span></div>`);
  });
  return rows.join("");
}

function dugHtml(api, g, ctx) {
  const day = caveDayTotals(ctx.farmId, ctx.now);
  const order = BEETLES.concat([ "Magic Mushroom", "Wild Mushroom", "Mud" ]);
  let buyTotal = 0;
  const rows = order.filter(n => day.items[n]).map(name => {
    const it = day.items[name];
    const total = Math.round((it.b + it.x) * 1e6) / 1e6;
    const bonus = it.x > 0 ? `<span class="cave-proc">+${fmt(it.x)}</span>` : "";
    let val;
    if (NOT_TRADABLE.indexOf(name) !== -1) {
      val = `<span class="cave-na">Not tradable</span>`;
    } else {
      const price = buyPrice(api, name);
      buyTotal += total * price;
      val = price > 0 ? `<span class="dig-dug-val">${fl(total * price)}${calc.FLOWER_ICON}</span>` : `<span class="cave-na">No price</span>`;
    }
    return `<div class="dig-dug-row"><span class="dig-dug-qty">×${fmt(total)}</span>${icon(api, name)}<span class="dig-dug-name">${esc(name)}${bonus}</span>${val}</div>`;
  });
  if (!rows.length) return `<div class="dig-empty">Nothing tracked yet today — sync your farm after digging.</div>`;
  const stats = [];
  stats.push(`<div class="dig-total-row"><span class="dig-total-label">Tiles dug</span><span class="dig-total-val">${fmt(day.tiles)}</span></div>`);
  stats.push(`<div class="dig-total-row"><span class="dig-total-label">Twin Beetles procs</span><span class="dig-total-val">${fmt(day.twin)}</span></div>`);
  const shovels = day.used["Sand Shovel"];
  const drills = day.used["Sand Drill"];
  const toolRows = (tool, used) => {
    if (!used) return;
    const kept = day.kept[tool];
    const spent = Math.max(0, used - kept);
    if (kept > 0) stats.push(`<div class="dig-total-row"><span class="dig-total-label">Refunded ${tool}</span><span class="dig-total-val is-profit">+${fmt(kept)}${icon(api, tool)}</span></div>`);
    stats.push(`<div class="dig-total-row"><span class="dig-total-label">Used ${tool}</span><span class="dig-total-val is-loss">-${fmt(spent)}${icon(api, tool)}</span></div>`);
  };
  toolRows("Sand Shovel", shovels);
  toolRows("Sand Drill", drills);
  const spentShovels = Math.max(0, shovels - day.kept["Sand Shovel"]);
  const spentDrills = Math.max(0, drills - day.kept["Sand Drill"]);
  const toolCoins = spentShovels * calc.caveToolUnitCoins("Sand Shovel") + spentDrills * calc.caveToolUnitCoins("Sand Drill");
  const mycoCoins = mycoBins(g).reduce((a, b) => a + b.coins, 0);
  const cost = flowerOf(toolCoins) + flowerOf(mycoCoins);
  const feePct = Number(calc.feePercent) || 0;
  const tax = buyTotal * feePct / 100;
  const net = buyTotal - cost - tax;
  const dash = '<div class="dig-totals-sep"></div>';
  const money = (label, val, cls, title) => `<div class="dig-total-row${cls ? " " + cls : ""}"${title ? ` title="${esc(title)}"` : ""}><span class="dig-total-label">${label}</span><span class="dig-total-val">${val}</span></div>`;
  const toolParts = [];
  if (spentShovels) toolParts.push("Sand Shovel ×" + fmt(spentShovels));
  if (spentDrills) toolParts.push("Sand Drill ×" + fmt(spentDrills));
  if (mycoCoins > 0) toolParts.push("Myco Bin ingredients " + fl(flowerOf(mycoCoins)));
  const sums = money("Total Gross (before tax)", fl(buyTotal) + calc.FLOWER_ICON, "") + money("Total Cost", "-" + fl(cost) + calc.FLOWER_ICON, "", toolParts.join(", ")) + money("Tax" + (feePct > 0 ? " (" + fmt(feePct) + "%)" : ""), "-" + fl(tax) + calc.FLOWER_ICON, "") + money("Net", signedFlower(net), "dig-total-net " + (net > 0 ? "is-profit" : net < 0 ? "is-loss" : ""));
  let note = "";
  if (day.missed > 0) note += `<div class="dig-empty">${fmt(day.missed)} tile(s) were dug and cleared between syncs, so they are not counted. Sync before starting a new batch.</div>`;
  if (day.approx) note += `<div class="dig-empty">Some digs were first read from a single sync, so their procs are a best match. Later syncs are exact.</div>`;
  return `${rows.join("")}<div class="dig-totals">${stats.join("")}${dash}${sums}</div>${note}`;
}

export function caveDataHtml(ctx) {
  const api = ctx.api;
  const g = ctx.game;
  applyDetected(g);
  return `<div class="dig-data-card cave-data-card">
    <div class="dig-panel-title dig-data-title">${icon(api, "Sand Shovel")} CAVE DATA</div>
    ${toolCostsHtml(api, g)}
    <div class="dig-data-box guro-frame"><div class="dig-data-label">Boost</div><div class="dig-boost-grid">${boostGridHtml(api, g)}</div></div>
    <div class="dig-data-box guro-frame"><div class="dig-data-label">Inventory</div><div class="dig-inv-list">${inventoryHtml(api, g)}</div></div>
    <div class="dig-data-pair">
      <div class="dig-data-box guro-frame"><div class="dig-data-label">Item Price</div><div class="dig-price-list">${priceHtml(api, g)}</div></div>
      <div class="dig-data-box guro-frame"><div class="dig-data-label">Dug Today · resets 00:00 UTC</div><div class="dig-dug-list">${dugHtml(api, g, ctx)}</div></div>
    </div>
  </div>`;
}

export function caveDataClick(e) {
  const t = e.target && e.target.closest ? e.target.closest("[data-cave-toolcfg], [data-cave-myco], [data-cave-cropbtn], [data-cave-croppick], [data-dig-mat-mode]") : null;
  if (!t) return false;
  if (t.hasAttribute("data-cave-toolcfg")) {
    calc.caveToggleToolCosts();
  } else if (t.hasAttribute("data-cave-cropbtn")) {
    const st = loadState();
    const id = t.getAttribute("data-cave-cropbtn");
    st.pickOpen = st.pickOpen === id ? null : id;
  } else if (t.hasAttribute("data-cave-croppick")) {
    const st = loadState();
    const parts = t.getAttribute("data-cave-croppick").split("|");
    if (hasCrop(parts[1])) st.mudCrops[parts[0]] = parts[1]; else delete st.mudCrops[parts[0]];
    st.pickOpen = null;
    saveState();
  } else if (t.hasAttribute("data-cave-myco")) {
    const st = loadState();
    st.mycoOpen = !st.mycoOpen;
    saveState();
  } else {
    calc.caveSetMatMode(t.getAttribute("data-dig-mat-owner"), t.getAttribute("data-dig-mat-name"), t.getAttribute("data-dig-mat-mode"));
  }
  return true;
}

export function caveDataChange(e) {
  const el = e.target;
  if (!el || !el.matches) return false;
  if (!el.matches("input[data-cave-boost]")) return false;
  loadState().boosts[el.getAttribute("data-cave-boost")] = el.checked;
  saveState();
  return true;
}
