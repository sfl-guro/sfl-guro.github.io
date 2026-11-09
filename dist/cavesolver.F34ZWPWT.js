import {
  CONFIRM_ICON
} from "./chunk.XKJMJZUJ.js";
import {
  CAVE_SKILL_RANKS,
  CAVE_WIDTH,
  FLOWER_ICON,
  caveDayTotals,
  caveMycoToggleHtml,
  caveMycoUnitCoins,
  caveSetMatMode,
  caveSkillLevel,
  caveToggleToolCosts,
  caveToolCostsOpen,
  caveToolSectionHtml,
  caveToolUnitCoins,
  caveTrackFromState,
  coinsToFlower,
  farmSyncCollectEquippedAndPlacedNames,
  feePercent,
  solveCaveBatch
} from "./chunk.VLIPRZ2Z.js";
import "./chunk.LPEVZJ4B.js";
import "./chunk.ZJUAGS4L.js";
import "./chunk.VR6FV3KR.js";
import "./chunk.AS3VMXOQ.js";

// src/goblin_merchant_icon.js
var GOBLIN_MERCHANT_ICON = "data:image/webp;base64,UklGRnABAABXRUJQVlA4TGQBAAAvE8AGEBfBJgDAJHPfvWERtA1VyeKfw+dJ2Ea2rQR3d3eogHZ+jWg5GmpkIQzbyLaVfHfDCiAkJ6NI6qAXanDIXgPozH+EaVMJGhEQgRrYuBiPSb4ahz3JUgz2niHTLJPpnJTQL7UEWXrOqwgrMVrwF8L4LG4aXCszk6fxAjMeyFhKemx7W9XfKSvGquA0BgT0ajAyOGwjSZFmbn4Pnpl5849y7zGCroj+T0Aua1rIH9a0QPdeTduj/9Eb7Vfq9hvUX4H6K9Q9+e2wtgbPUtEVAeu2xtw8E00ROGzXmCtA1mSG4chOK2bW75lLOGiemMnkkkUmXDYpYOa9gbnMtUzLYqTb1QLcfPjiIj3lgSpzaVEtZmBnkzxOqTIPXXabwWmFH45S5I5i/9gP0sA1OhQNxYjHnvHJLyowDzQa89gp+X3qFhkP0NgYjUeVS30KTuZjRpg8S4C5kkkaM8pvNuTemrfyRw==";

// src/cave_data.js
var STATE_KEY = "guro_cave_data_state";
var BEETLES = ["Green Beetle", "Blue Beetle", "Pink Beetle", "Amber Beetle"];
var NOT_TRADABLE = ["Wild Mushroom", "Magic Mushroom", "Mud"];
var TOOLS = ["Sand Shovel", "Sand Drill"];
var MUD_CROPS = {
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
var FIXED_INGREDIENTS = {
  Mushroom: {
    Wood: 10
  },
  Beetle: {
    Egg: 30
  }
};
var RECIPE_LABELS = {
  Mushroom: "Mushroom Mix",
  Beetle: "Beetle Mix",
  Mud: "Mud Mix"
};
var LEAN_RANKS = [0.95, 0.9, 0.85];
var BOOST_DEFS = [{
  id: "mushroom_house",
  name: "Mushroom House",
  icon: "Mushroom House",
  desc: "+0.2 Wild Mushroom",
  wild: 0.2
}, {
  id: "fairy_circle",
  name: "Fairy Circle",
  icon: "Fairy Circle",
  desc: "+0.2 Wild Mushroom",
  wild: 0.2
}, {
  id: "mushroom_hat",
  name: "Mushroom Hat",
  icon: "Mushroom Hat",
  desc: "+0.1 Wild Mushroom",
  wild: 0.1
}];
var SKILL_DEFS = [{
  name: "Fungal Harvest",
  icon: "Fungal Harvest",
  desc: (v) => "+" + v + " Mushroom",
  ranks: CAVE_SKILL_RANKS["Fungal Harvest"]
}, {
  name: "Muddy Bounty",
  icon: "Muddy Bounty",
  desc: (v) => "+" + Math.round(v * 100) + "% Mud",
  ranks: CAVE_SKILL_RANKS["Muddy Bounty"]
}, {
  name: "Twin Beetles",
  icon: "Twin Beetles",
  desc: (v) => v + "% extra Beetle",
  ranks: CAVE_SKILL_RANKS["Twin Beetles"]
}, {
  name: "Sturdy Shovel",
  icon: "Sturdy Shovel",
  desc: (v) => v + "% keep Shovel",
  ranks: CAVE_SKILL_RANKS["Sturdy Shovel"]
}, {
  name: "Sturdy Drill",
  icon: "Sturdy Drill",
  desc: (v) => v + "% keep Drill",
  ranks: CAVE_SKILL_RANKS["Sturdy Drill"]
}, {
  name: "Mushroom Bloom",
  icon: "Mushroom Bloom",
  desc: (v) => "+" + v + " Mushroom tiles",
  ranks: [1, 2, 3]
}, {
  name: "Beetle Nest",
  icon: "Beetle Nest",
  desc: (v) => "+" + v + " Beetle tiles",
  ranks: [1, 2, 3]
}, {
  name: "Rare Breeds",
  icon: "Rare Breeds",
  desc: () => "Rarer Beetles",
  ranks: [1, 2, 3]
}];
var state = null;
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
  const obj = (v) => v && typeof v === "object" && !Array.isArray(v) ? v : {};
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
  } catch (e) {
  }
}
function boostOn(id) {
  return loadState().boosts[id] === true;
}
function applyDetected(g) {
  if (!g || typeof g !== "object" || !(g.bumpkin || g.collectibles || g.inventory)) return;
  const st = loadState();
  const placed = farmSyncCollectEquippedAndPlacedNames(g);
  let changed = false;
  BOOST_DEFS.forEach((b) => {
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
  if (!isFinite(n)) return "\u2014";
  return (Math.round(n * 100) / 100).toLocaleString(void 0, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}
function fl(n) {
  if (!isFinite(n)) return "\u2014";
  const a = Math.abs(n);
  const max = a >= 1e3 ? 0 : a >= 1 ? 2 : 4;
  return n.toLocaleString(void 0, {
    minimumFractionDigits: 0,
    maximumFractionDigits: max
  });
}
function signedFlower(n) {
  const r = fl(Math.abs(n));
  const sign = n > 0 && r !== "0" ? "+" : n < 0 && r !== "0" ? "-" : "";
  return sign + r + FLOWER_ICON;
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
function boostGridHtml(api, g) {
  const cards = BOOST_DEFS.map((b) => `<div class="betty-boost-row dig-boost-card${boostOn(b.id) ? " is-on" : ""}">
      <span class="dig-boost-icon">${api.ui.getIcon(b.icon)}</span>
      <div class="betty-boost-row-main dig-boost-main">
        <div class="betty-boost-row-name dig-boost-name">${esc(b.name)}</div>
        <div class="betty-boost-row-desc dig-boost-desc">${esc(b.desc)}</div>
      </div>
      <label class="bg-sim-check"><input type="checkbox" data-cave-boost="${b.id}" aria-label="${esc(b.name)}"${boostOn(b.id) ? " checked" : ""}></label>
    </div>`);
  SKILL_DEFS.forEach((s) => {
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
  Object.keys(MUD_CROPS).forEach((name) => {
    const cost = MUD_CROPS[name] * caveMycoUnitCoins(owner, name);
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
  return Object.keys(machines).sort((a, b) => Number(a) - Number(b)).map((id) => {
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
    const lines = Object.keys(base).map((name) => {
      const qty = base[name] * lean;
      const unitCoins = caveMycoUnitCoins(owner, name);
      return {
        name,
        qty,
        unitCoins,
        coins: qty * unitCoins
      };
    });
    return {
      id,
      owner,
      recipe,
      crop,
      auto,
      lean,
      lines,
      coins: lines.reduce((a, l) => a + l.coins, 0)
    };
  });
}
function flowerOf(coins) {
  return coins > 0 ? coinsToFlower(coins) : 0;
}
function mycoCardHtml(api, bin) {
  const head = `<div class="cave-myco-head">${icon(api, "Myco Bin")}<span class="cave-myco-name">Myco Bin ${esc(bin.id)}</span><span class="cave-myco-recipe">${bin.recipe ? esc(RECIPE_LABELS[bin.recipe]) : "Empty"}</span></div>`;
  if (!bin.recipe) {
    return `<div class="cave-myco-card guro-frame">${head}<div class="dig-empty">No batch fed in this bin.</div></div>`;
  }
  let pick = "";
  if (bin.recipe === "Mud") {
    const open = loadState().pickOpen === bin.id;
    const label = bin.auto ? "Cheapest (" + bin.crop + ")" : bin.crop + " \xD7" + MUD_CROPS[bin.crop];
    const option = (value, text, iconName, on) => `<div class="cave-myco-opt${on ? " is-on" : ""}" role="option" tabindex="0" aria-selected="${on}" data-cave-croppick="${esc(bin.id)}|${esc(value)}">${icon(api, iconName)}<span class="cave-myco-opt-name">${esc(text)}</span>${on ? CONFIRM_ICON : ""}</div>`;
    const list = open ? `<div class="cave-myco-options guro-frame" role="listbox">${option("", "Cheapest (" + bin.crop + ")", bin.crop, bin.auto)}${Object.keys(MUD_CROPS).map((name) => option(name, name + " \xD7" + MUD_CROPS[name], name, !bin.auto && bin.crop === name)).join("")}</div>` : "";
    pick = `<div class="cave-myco-pick"><span class="cave-myco-pick-label">Mud crop</span><button type="button" class="cave-myco-select guro-frame${open ? " active" : ""}" data-cave-cropbtn="${esc(bin.id)}" aria-expanded="${open}">${icon(api, bin.crop)}<span class="cave-myco-select-text">${esc(label)}</span><span class="es-toolcfg-chev"></span></button></div>${list}<div class="dig-empty">The game does not save which crop fed a Mud batch.</div>`;
  }
  const lines = bin.lines.map((l) => `<div class="cave-myco-line">
      <div class="es-toolcfg-mat"><div class="es-toolcfg-mat-name"><span class="es-toolcfg-qty">\xD7${fmt(l.qty)}</span>${icon(api, l.name)}<span>${esc(l.name)}</span></div>${caveMycoToggleHtml(bin.owner, l.name)}</div>
      <div class="es-toolcfg-mat dig-tool-unit"><span>Price/Unit</span><span class="es-toolcfg-qty dig-coin-val">${fl(flowerOf(l.unitCoins))}${FLOWER_ICON}</span></div>
      <div class="es-toolcfg-mat dig-tool-unit"><span>Cost</span><span class="es-toolcfg-qty dig-coin-val">${fl(flowerOf(l.coins))}${FLOWER_ICON}</span></div>
    </div>`).join("");
  const lean = bin.lean < 1 ? `<div class="dig-empty">Lean Compost \xD7${bin.lean} applied.</div>` : "";
  const total = `<div class="dig-totals"><div class="dig-total-row"><span class="dig-total-label">Ingredients Cost</span><span class="dig-total-val">${fl(flowerOf(bin.coins))}${FLOWER_ICON}</span></div></div>`;
  return `<div class="cave-myco-card guro-frame">${head}${pick}${lines}${lean}${total}</div>`;
}
function mycoPanelHtml(api, bins) {
  if (!bins.length) return `<div class="dig-empty">No Myco Bins found \u2014 sync your farm.</div>`;
  const sum = bins.reduce((a, b) => a + b.coins, 0);
  const total = `<div class="dig-totals"><div class="dig-total-row"><span class="dig-total-label">All Myco Bins</span><span class="dig-total-val">${fl(flowerOf(sum))}${FLOWER_ICON}</span></div></div>`;
  return `<div class="cave-myco-list">${bins.map((b) => mycoCardHtml(api, b)).join("")}</div>${total}`;
}
function toolCostsHtml(api, g) {
  const open = caveToolCostsOpen();
  const mycoOpen = loadState().mycoOpen;
  const btn = `<button type="button" class="es-mode-btn dig-toolcfg-btn${open ? " active" : ""}" id="caveToolCfgBtn" data-cave-toolcfg aria-expanded="${open}">Tool Costs<span class="es-toolcfg-chev"></span></button>`;
  const mycoBtn = `<button type="button" class="es-mode-btn dig-toolcfg-btn${mycoOpen ? " active" : ""}" id="caveMycoBtn" data-cave-myco aria-expanded="${mycoOpen}">Myco Bins<span class="es-toolcfg-chev"></span></button>`;
  const panel = open ? `<div class="es-toolcfg">${TOOLS.map(caveToolSectionHtml).join("")}</div>` : "";
  const mycoPanel = mycoOpen ? mycoPanelHtml(api, mycoBins(g)) : "";
  return `<div class="dig-data-tools"><div class="cave-tools-row">${btn}${mycoBtn}</div><div id="caveToolCfgPanel">${panel}</div><div id="caveMycoPanel">${mycoPanel}</div></div>`;
}
function inventoryHtml(api, g) {
  const inv = g && g.inventory && typeof g.inventory === "object" ? g.inventory : {};
  const names = BEETLES.concat(["Magic Mushroom", "Wild Mushroom", "Mud"]);
  let buyTotal = 0;
  let beetleQty = 0;
  const rows = names.map((name) => {
    const qty = Number(inv[name]);
    if (!isFinite(qty) || qty <= 0) return "";
    let val;
    if (NOT_TRADABLE.indexOf(name) !== -1) {
      val = `<span class="cave-na">Not tradable</span>`;
    } else {
      const price = buyPrice(api, name);
      buyTotal += qty * price;
      beetleQty += qty;
      val = price > 0 ? `<span class="dig-dug-val">${fl(qty * price)}${FLOWER_ICON}</span>` : `<span class="cave-na">No price</span>`;
    }
    return `<div class="dig-dug-row"><span class="dig-dug-qty">\xD7${fmt(qty)}</span>${icon(api, name)}<span class="dig-dug-name">${esc(name)}</span>${val}</div>`;
  }).join("");
  if (!rows) return `<div class="dig-empty">No cave items in inventory \u2014 sync your farm.</div>`;
  const totals = beetleQty > 0 ? `<div class="dig-totals"><div class="dig-total-row"><span class="dig-total-label">Beetles (Market Price)</span><span class="dig-total-val">${fmt(beetleQty)} <small>beetles</small>${buyTotal > 0 ? " \xB7 " + fl(buyTotal) + FLOWER_ICON : ""}</span></div></div>` : "";
  return `<div class="dig-inv-grid">${rows}</div>${totals}`;
}
function priceHtml(api, g) {
  const rows = [];
  BEETLES.forEach((name) => {
    const buy = buyPrice(api, name);
    const val = buy > 0 ? `<span class="dig-price-vals">${fl(buy)}${FLOWER_ICON}</span>` : `<span class="cave-na">No price</span>`;
    rows.push(`<div class="dig-price-row">${icon(api, name)}<span class="dig-price-name">${esc(name)}</span>${val}</div>`);
  });
  NOT_TRADABLE.forEach((name) => {
    rows.push(`<div class="dig-price-row">${icon(api, name)}<span class="dig-price-name">${esc(name)}</span><span class="cave-na">Not tradable</span></div>`);
  });
  return rows.join("");
}
function dugHtml(api, g, ctx) {
  const day = caveDayTotals(ctx.farmId, ctx.now);
  const order = BEETLES.concat(["Magic Mushroom", "Wild Mushroom", "Mud"]);
  let buyTotal = 0;
  const rows = order.filter((n) => day.items[n]).map((name) => {
    const it = day.items[name];
    const total = Math.round((it.b + it.x) * 1e6) / 1e6;
    const bonus = it.x > 0 ? `<span class="cave-proc">+${fmt(it.x)}</span>` : "";
    let val;
    if (NOT_TRADABLE.indexOf(name) !== -1) {
      val = `<span class="cave-na">Not tradable</span>`;
    } else {
      const price = buyPrice(api, name);
      buyTotal += total * price;
      val = price > 0 ? `<span class="dig-dug-val">${fl(total * price)}${FLOWER_ICON}</span>` : `<span class="cave-na">No price</span>`;
    }
    return `<div class="dig-dug-row"><span class="dig-dug-qty">\xD7${fmt(total)}</span>${icon(api, name)}<span class="dig-dug-name">${esc(name)}${bonus}</span>${val}</div>`;
  });
  if (!rows.length) return `<div class="dig-empty">Nothing tracked yet today \u2014 sync your farm after digging.</div>`;
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
  const toolCoins = spentShovels * caveToolUnitCoins("Sand Shovel") + spentDrills * caveToolUnitCoins("Sand Drill");
  const mycoCoins = mycoBins(g).reduce((a, b) => a + b.coins, 0);
  const cost = flowerOf(toolCoins) + flowerOf(mycoCoins);
  const feePct = Number(feePercent) || 0;
  const tax = buyTotal * feePct / 100;
  const net = buyTotal - cost - tax;
  const dash = '<div class="dig-totals-sep"></div>';
  const money = (label, val, cls, title) => `<div class="dig-total-row${cls ? " " + cls : ""}"${title ? ` title="${esc(title)}"` : ""}><span class="dig-total-label">${label}</span><span class="dig-total-val">${val}</span></div>`;
  const toolParts = [];
  if (spentShovels) toolParts.push("Sand Shovel \xD7" + fmt(spentShovels));
  if (spentDrills) toolParts.push("Sand Drill \xD7" + fmt(spentDrills));
  if (mycoCoins > 0) toolParts.push("Myco Bin ingredients " + fl(flowerOf(mycoCoins)));
  const sums = money("Total Gross (before tax)", fl(buyTotal) + FLOWER_ICON, "") + money("Total Cost", "-" + fl(cost) + FLOWER_ICON, "", toolParts.join(", ")) + money("Tax" + (feePct > 0 ? " (" + fmt(feePct) + "%)" : ""), "-" + fl(tax) + FLOWER_ICON, "") + money("Net", signedFlower(net), "dig-total-net " + (net > 0 ? "is-profit" : net < 0 ? "is-loss" : ""));
  let note = "";
  if (day.missed > 0) note += `<div class="dig-empty">${fmt(day.missed)} tile(s) were dug and cleared between syncs, so they are not counted. Sync before starting a new batch.</div>`;
  if (day.approx) note += `<div class="dig-empty">Some digs were first read from a single sync, so their procs are a best match. Later syncs are exact.</div>`;
  return `${rows.join("")}<div class="dig-totals">${stats.join("")}${dash}${sums}</div>${note}`;
}
function caveDataHtml(ctx) {
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
      <div class="dig-data-box guro-frame"><div class="dig-data-label">Dug Today \xB7 resets 00:00 UTC</div><div class="dig-dug-list">${dugHtml(api, g, ctx)}</div></div>
    </div>
  </div>`;
}
function caveDataClick(e) {
  const t = e.target && e.target.closest ? e.target.closest("[data-cave-toolcfg], [data-cave-myco], [data-cave-cropbtn], [data-cave-croppick], [data-dig-mat-mode]") : null;
  if (!t) return false;
  if (t.hasAttribute("data-cave-toolcfg")) {
    caveToggleToolCosts();
  } else if (t.hasAttribute("data-cave-cropbtn")) {
    const st = loadState();
    const id = t.getAttribute("data-cave-cropbtn");
    st.pickOpen = st.pickOpen === id ? null : id;
  } else if (t.hasAttribute("data-cave-croppick")) {
    const st = loadState();
    const parts = t.getAttribute("data-cave-croppick").split("|");
    if (hasCrop(parts[1])) st.mudCrops[parts[0]] = parts[1];
    else delete st.mudCrops[parts[0]];
    st.pickOpen = null;
    saveState();
  } else if (t.hasAttribute("data-cave-myco")) {
    const st = loadState();
    st.mycoOpen = !st.mycoOpen;
    saveState();
  } else {
    caveSetMatMode(t.getAttribute("data-dig-mat-owner"), t.getAttribute("data-dig-mat-name"), t.getAttribute("data-dig-mat-mode"));
  }
  return true;
}
function caveDataChange(e) {
  const el = e.target;
  if (!el || !el.matches) return false;
  if (!el.matches("input[data-cave-boost]")) return false;
  loadState().boosts[el.getAttribute("data-cave-boost")] = el.checked;
  saveState();
  return true;
}

// src/pages/cavesolver.js
var COLS = ["A", "B", "C", "D", "E"];
var RECIPE_LABELS2 = {
  Mushroom: "Mushroom mix",
  Beetle: "Beetle mix",
  Mud: "Mud mix"
};
var rootEl = null;
var apiRef = null;
var selected = {};
var timer = null;
var listening = false;
var guideOpen = false;
var syncing = false;
var selectedBin = null;
var viewMode = "items";
function esc2(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function getGame() {
  const state2 = apiRef.inprogress.farmPanelGameState;
  if (!state2) return null;
  return apiRef.calc.farmSyncExtractGameState(state2);
}
function itemIcon(name) {
  if (name === "Beetle") return `<span class="cave-beetle-unknown" title="Beetle">${apiRef.ui.getIcon("Green Beetle")}</span>`;
  if (name === "Mushroom") return apiRef.ui.getIcon("Wild Mushroom");
  return apiRef.ui.getIcon(name);
}
function pctText(p) {
  const v = Math.round(p * 100);
  if (p > 0 && v < 1) return "1%";
  if (p < 1 && v > 99) return "99%";
  return v + "%";
}
function cellLabel(c) {
  return COLS[c.x] + (c.y + 1);
}
function formatWait(ms) {
  const mins = Math.max(1, Math.ceil(ms / 6e4));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? h + "h " + m + "m" : m + "m";
}
function formatSpan(ms) {
  const mins = Math.max(1, Math.ceil(ms / 6e4));
  const d = Math.floor(mins / 1440);
  const h = Math.floor(mins % 1440 / 60);
  const m = mins % 60;
  if (d > 0) return d + "d " + h + "h";
  if (h > 0) return h + "h " + m + "m";
  return m + "m";
}
function cellHtml(machineId, c, best, mode) {
  const key = machineId + ":" + c.x + "," + c.y;
  if (c.dug) {
    const t = c.tile;
    const mud = t.type === "Mud";
    const name = t.type === "Beetle" ? t.beetle : t.type === "Mushroom" ? t.mushroom : "Mud";
    const clue = c.clue !== void 0 ? `<span class="cave-clue">${c.clue}</span>` : "";
    return `<div class="dig-cell ${mud ? "is-dug-sand" : "is-dug-treasure"}" data-cave-cell="${key}">${itemIcon(name)}${clue}</div>`;
  }
  let cls = "is-possible";
  let inner = `<span class="cave-pct">${pctText(c.p)}</span>`;
  if (mode === "beetle") {
    const b = c.beetle || 0;
    if (c.none || b <= 1e-9) {
      cls = "is-empty";
      inner = `<span class="cave-pct">0%</span>`;
    } else if (b >= 1 - 1e-9) {
      cls = "is-guaranteed";
      inner = c.single ? itemIcon(c.single) : `<span class="cave-pct">100%</span>`;
    } else {
      inner = `<span class="cave-pct">${pctText(b)}</span>`;
    }
  } else if (c.none) {
    cls = "is-empty";
    inner = `<span class="cave-pct">0%</span>`;
  } else if (c.certain) {
    cls = "is-guaranteed";
    inner = c.single ? itemIcon(c.single) : `<span class="cave-pct">100%</span>`;
  }
  const star = best && best.x === c.x && best.y === c.y && !c.none && (mode !== "beetle" || best.beetle > 1e-9) ? " cave-best" : "";
  return `<div class="dig-cell ${cls}${star}" data-cave-cell="${key}">${inner}</div>`;
}
function chipsHtml(res) {
  if (!res.remaining) return `<span class="dig-legend-item">Nothing valuable left buried</span>`;
  return Object.keys(res.names).map((name) => `<span class="dig-legend-item cave-chip">${itemIcon(name)} \xD7${res.names[name]}</span>`).join("");
}
function touchingCluesHtml(res, c) {
  const near = [];
  [[0, -1], [-1, 0], [1, 0], [0, 1]].forEach(([dx, dy]) => {
    const nx = c.x + dx;
    const ny = c.y + dy;
    if (nx < 0 || ny < 0 || nx >= CAVE_WIDTH || ny >= CAVE_WIDTH) return;
    const n = res.cells[ny * CAVE_WIDTH + nx];
    if (n && n.dug && n.clue !== void 0) near.push(`<span class="cave-kind"><b>${cellLabel(n)}</b> clue ${n.clue}</span>`);
  });
  if (!near.length) return "";
  return `<div class="cave-kinds">${near.join("")}</div>`;
}
function infoHtml(res, machineId) {
  const key = selected[machineId];
  if (!key) return `<div class="dig-panel-status cave-info">Tap a tile to see what it can hold.</div>`;
  const [x, y] = key.split(",").map(Number);
  const c = res.cells[y * CAVE_WIDTH + x];
  if (!c) return "";
  if (c.dug) {
    const t = c.tile;
    const name = t.type === "Beetle" ? t.beetle : t.type === "Mushroom" ? t.mushroom : "Mud";
    const clue = c.clue !== void 0 ? ` \xB7 clue ${c.clue}` : " \xB7 no clue";
    return `<div class="dig-panel-status cave-info"><b>${cellLabel(c)}</b> dug: ${itemIcon(name)} ${esc2(name)}${clue}</div>`;
  }
  const parts = [];
  parts.push(`<b>${cellLabel(c)}</b> holds something: <b>${pctText(c.p)}</b>`);
  const isBeetleName = (k) => k === "Beetle" || /Beetle$/.test(k);
  const kinds = Object.keys(c.kinds).filter((k) => k !== "Mud" && c.kinds[k] > 0).sort((a, b) => Number(isBeetleName(b)) - Number(isBeetleName(a)));
  const lines = kinds.map((k) => `<span class="cave-kind">${itemIcon(k)} ${esc2(k)} ${pctText(c.kinds[k])}</span>`);
  lines.push(`<span class="cave-kind">${itemIcon("Mud")} Mud ${pctText(c.kinds.Mud)}</span>`);
  return `<div class="dig-panel-status cave-info">${parts.join("")}<div class="cave-kinds">${lines.join("")}</div>${touchingCluesHtml(res, c)}</div>`;
}
function boardHtml(machineId, batch, game, now) {
  const head = `<div class="cave-board-title"><span class="cave-myco-icon">${apiRef.ui.getIcon("Myco Bin")}</span> Myco Bin ${esc2(machineId)}</div>`;
  if (!batch) return `<div class="cave-board guro-frame">${head}<div class="dig-panel-status">Empty. Start a batch in this Myco Bin.</div></div>`;
  const recipe = RECIPE_LABELS2[batch.recipe] || batch.recipe;
  const sub = `<div class="cave-board-sub">${esc2(recipe)}</div>`;
  if (batch.readyAt > now) {
    return `<div class="cave-board guro-frame">${head}${sub}<div class="dig-panel-status">Growing. Ready in ${formatWait(batch.readyAt - now)}.</div></div>`;
  }
  const res = solveCaveBatch(batch);
  if (!res.ok) {
    return `<div class="cave-board guro-frame">${head}${sub}<div class="dig-panel-status">The saved digs do not fit one board, or this patch was cleared. Sync your farm again.</div></div>`;
  }
  const dugTotal = Object.keys(res.revealed).length;
  if (dugTotal >= CAVE_WIDTH * CAVE_WIDTH) {
    return `<div class="cave-board guro-frame">${head}${sub}<div class="dig-panel-status">Patch cleared. A new batch can start.</div></div>`;
  }
  let grid = `<div class="dig-grid-label"></div>`;
  for (let x = 0; x < CAVE_WIDTH; x++) grid += `<div class="dig-grid-label">${COLS[x]}</div>`;
  for (let y = 0; y < CAVE_WIDTH; y++) {
    grid += `<div class="dig-grid-label">${y + 1}</div>`;
    for (let x = 0; x < CAVE_WIDTH; x++) grid += cellHtml(machineId, res.cells[y * CAVE_WIDTH + x], res.best, viewMode);
  }
  const hints = [];
  hints.push(`Beetles found: <b>${res.beetleFound}/${res.beetleTotal}</b>`);
  if (viewMode === "beetle") {
    if (res.best && res.best.beetle > 1e-9) hints.push(`Best beetle dig: <b>${cellLabel(res.best)}</b> (${pctText(res.best.beetle)} Beetle)`);
    if (res.drill && res.drill.beetles > 1e-9) hints.push(`Best drill: <b>${COLS[res.drill.x]}${res.drill.y + 1}</b> square, about ${res.drill.beetles.toFixed(2)} beetles`);
  } else {
    if (res.best && res.best.p > 0) hints.push(`Best dig: <b>${cellLabel(res.best)}</b> (${pctText(res.best.p)})`);
    if (res.drill && res.drill.expected > 0) hints.push(`Best drill: <b>${COLS[res.drill.x]}${res.drill.y + 1}</b> square, about ${res.drill.expected.toFixed(1)} items`);
  }
  const seedNote = res.hasSeed ? "" : `<div class="dig-panel-status cave-note">Beetle species and Magic Mushrooms are not in the synced data, so kinds are shown as Mushroom and Beetle.</div>`;
  const found = res.beetleLeft === 0 ? `<div class="dig-panel-status cave-note">Every Beetle is found. You can restart this batch.</div>` : "";
  return `<div class="cave-board guro-frame">${head}${sub}<div class="dig-panel-legend cave-chips">${chipsHtml(res)}</div><div class="dig-panel-grid-wrap"><div class="dig-panel-grid cave-grid">${grid}</div></div><div class="dig-panel-status">${hints.join("<br>")}</div>${infoHtml(res, machineId)}${found}${seedNote}</div>`;
}
function viewTabsHtml() {
  const modes = [["items", "Any item"], ["beetle", "Beetles"]];
  const buttons = modes.map((m) => `<button type="button" class="cave-tab${m[0] === viewMode ? " active" : ""}" data-cave-view="${m[0]}">${m[1]}</button>`).join("");
  return `<div class="cave-tabs cave-view-tabs">${buttons}</div>`;
}
function legendHtml() {
  const red = viewMode === "beetle" ? "No Beetle" : "Only Mud";
  const yellow = viewMode === "beetle" ? "Beetle chance" : "Chance";
  const blue = viewMode === "beetle" ? "Sure Beetle" : "Sure thing";
  return `<div class="dig-panel-legend"><span class="dig-legend-item"><span class="dig-swatch dig-swatch-red"></span>${red}</span><span class="dig-legend-item"><span class="dig-swatch dig-swatch-yellow"></span>${yellow}</span><span class="dig-legend-item"><span class="dig-swatch dig-swatch-blue"></span>${blue}</span></div>`;
}
function binState(batch, now) {
  if (!batch) return "idle";
  if (batch.readyAt > now) return "growing";
  if (Object.keys(batch.dug || {}).length >= CAVE_WIDTH * CAVE_WIDTH) return "idle";
  return "ready";
}
var STATE_LABELS = {
  growing: "Growing",
  ready: "Ready to dig",
  idle: "Empty"
};
function guideHtml() {
  const steps = [
    "Each Myco Bin grows one 5x5 patch of 25 buried tiles.",
    "Feed the bin to start a batch: Mushroom mix costs 10 Wood, Beetle mix costs 30 Eggs, Mud mix costs one crop you pick.",
    "The patch needs 12 hours to grow, and your very first batch only 10 minutes. You cannot dig it until the timer ends.",
    "When it is ready, dig with a Sand Shovel, or drill a 2x2 square with a Sand Drill. Tiles hold Mushrooms, Beetles or Mud.",
    "The small number in the corner of a dug tile is a clue: how many of its four neighbours (up, down, left, right) hold a Mushroom or a Beetle. Mud does not count and Beetles show no number. The solver uses every clue to work out the odds on each tile.",
    "Clues count Beetles and Mushrooms together, so they show where something is buried, not which one. Switch to Beetles to see the exact Beetle chance on every tile. When tiles tie, Best dig prefers the one whose clue will tell you the most.",
    "Feed the bin again once the patch is fully dug or every Beetle is found. There is no limit and the cost stays the same.",
    "Every Cave upgrade adds one more Myco Bin, so more patches can grow at the same time."
  ];
  const list = steps.map((t, i) => `<div class="cave-guide-step"><span class="cave-guide-num">${i + 1}</span><span>${esc2(t)}</span></div>`).join("");
  const open = guideOpen ? " is-open" : "";
  return `<div class="cave-info-box guro-frame cave-guide${open}"><button type="button" class="cave-guide-toggle" data-cave-guide aria-expanded="${guideOpen}">Info</button><div class="cave-board-title cave-guide-title">How Myco Bins work</div><div class="cave-guide-body">${list}</div></div>`;
}
function statusHtml(cave, ids, now) {
  const tier = esc2(cave.tier || ids.length);
  const rows = [];
  const counts = { growing: 0, ready: 0, idle: 0 };
  let soon = null;
  ids.forEach((id) => {
    const batch = cave.machines[id] && cave.machines[id].batch;
    const st = binState(batch, now);
    counts[st] += 1;
    let detail = "Feed it to start a batch";
    if (batch && st === "growing") {
      detail = (RECIPE_LABELS2[batch.recipe] || batch.recipe) + " \xB7 ready in " + formatWait(batch.readyAt - now);
      if (soon === null || batch.readyAt < soon) soon = batch.readyAt;
    } else if (batch && st === "ready") {
      detail = (RECIPE_LABELS2[batch.recipe] || batch.recipe) + " \xB7 dig it now";
    }
    rows.push(`<div class="cave-bin-row"><span class="cave-bin-name">Bin ${esc2(id)}</span><span class="cave-bin-state is-${st}">${STATE_LABELS[st]}</span><span class="cave-bin-detail">${esc2(detail)}</span></div>`);
  });
  const total = ids.length;
  const next = soon !== null ? `<div class="cave-bin-next">Next bin ready in ${formatWait(soon - now)}</div>` : "";
  const summary = `<div class="cave-bin-count"><b>${counts.growing}</b> of ${total} running</div><div class="cave-bin-sub">${counts.ready} ready to dig \xB7 ${counts.idle} empty</div>${next}`;
  return `<div class="cave-info-box guro-frame"><div class="cave-board-title cave-running-title"><span><span class="cave-myco-icon">${apiRef.ui.getIcon("Myco Bin")}</span> Myco Bins running</span><span class="cave-tier-tag">Cave Tier ${tier}</span></div>${summary}<div class="cave-bin-list">${rows.join("")}</div></div>`;
}
function tabsHtml(ids) {
  const buttons = ids.map((id) => `<button type="button" class="cave-tab${id === selectedBin ? " active" : ""}" data-cave-tab="${esc2(id)}">Bin ${esc2(id)}</button>`).join("");
  return `<div class="cave-tabs">${buttons}</div>`;
}
function merchantTimerText(visit, now) {
  if (now >= visit.opensAt && now < visit.closesAt) return "Leaves in " + formatSpan(visit.closesAt - now);
  if (now < visit.opensAt) return "Arrives in " + formatSpan(visit.opensAt - now);
  if (visit.nextOpensAt > now) return "Away \xB7 returns in " + formatSpan(visit.nextOpensAt - now);
  return "Away \xB7 sync to check his next visit";
}
function merchantItemIcon(name) {
  const calc = apiRef.calc;
  const ui = apiRef.ui;
  if (ui.cookFoodIcon && calc.COOKING_FOOD_IMAGES && calc.COOKING_FOOD_IMAGES[name]) return ui.cookFoodIcon(name);
  if (ui.cookFoodIcon && calc.COOKING_FOOD_EMOJI && calc.COOKING_FOOD_EMOJI[name]) return ui.cookFoodIcon(name);
  return ui.getIcon(name);
}
function merchantFlowerPrice(name) {
  const market = apiRef.inprogress.farmPanelGetMarketPriceFlower ? Number(apiRef.inprogress.farmPanelGetMarketPriceFlower(name)) : 0;
  if (market > 0) return market;
  const live = apiRef.prices.findLivePriceForName ? Number(apiRef.prices.findLivePriceForName(name)) : 0;
  return live > 0 ? live : 0;
}
function merchantProfitHtml(cost, reward, trades) {
  const rewardAmount = Number(reward.amount) || 0;
  const costAmount = Number(cost.amount) || 0;
  const rewardPrice = merchantFlowerPrice(reward.item);
  if (!(rewardPrice > 0) || !(rewardAmount > 0)) return "";
  const untradableCost = cost.item === "Mud";
  const costPrice = untradableCost ? 0 : merchantFlowerPrice(cost.item);
  if (!untradableCost && !(costPrice > 0)) return "";
  const diff = Math.max(1, trades) * (rewardAmount * rewardPrice - costAmount * costPrice);
  const rounded = Math.round(Math.abs(diff) * 100) / 100;
  const flower = apiRef.calc.FLOWER_ICON;
  if (rounded === 0) return `<span class="cave-offer-pl is-even">(0 ${flower})</span>`;
  const gain = diff > 0;
  return `<span class="cave-offer-pl ${gain ? "is-gain" : "is-lossy"}">(${gain ? "+" : "-"}${rounded.toLocaleString(void 0, {
    maximumFractionDigits: 2
  })} ${flower})</span>`;
}
function offerHtml(offer, cave, visit, inv) {
  const getIcon = apiRef.ui.getIcon;
  const cost = offer.cost || {};
  const reward = offer.reward || {};
  const need = Number(cost.amount) || 0;
  const have = Math.floor(Number(inv[cost.item]) || 0);
  const purchases = cave.merchant && cave.merchant.purchases;
  const bought = purchases && purchases[String(visit.index)] && Number(purchases[String(visit.index)][offer.slot]) || 0;
  const limit = Number(offer.limit) || 0;
  const left = Math.max(0, limit - bought);
  const unlocked = offer.slot <= (Number(cave.tier) || 0);
  const enough = need > 0 && have >= need;
  const trades = unlocked && need > 0 ? Math.min(Math.floor(have / need), left) : 0;
  const total = trades * (Number(reward.amount) || 0);
  const edge = unlocked ? `<span class="cave-offer-total${total ? "" : " is-zero"}">\xD7${total} ${merchantItemIcon(reward.item)}${merchantProfitHtml(cost, reward, trades)}</span>` : `<span class="cave-offer-total is-zero">Tier ${offer.slot}</span>`;
  const meta = unlocked ? `${left}/${limit} left` : `Unlocks at Cave tier ${offer.slot}`;
  return `<div class="cave-offer guro-frame${unlocked ? "" : " is-locked"}"><div class="cave-offer-main"><span class="cave-offer-have ${enough ? "is-enough" : "is-short"}">${have}</span><span class="cave-offer-need">/${need}</span><span class="cave-offer-item">${merchantItemIcon(cost.item)} ${esc2(cost.item)}</span><span class="cave-offer-arrow">\u2192</span><span class="cave-offer-item">${merchantItemIcon(reward.item)} ${esc2(reward.item)} \xD7${Number(reward.amount) || 0}</span>${edge}</div><div class="cave-offer-meta">${esc2(meta)}</div></div>`;
}
function merchantHtml(cave, game, now) {
  const head = `<div class="cave-board-title"><span class="cave-myco-icon"><img src="${GOBLIN_MERCHANT_ICON}" alt="Goblin Merchant"></span> Goblin Merchant</div>`;
  const visit = cave.merchantVisit;
  if (!visit) return `<div class="cave-board guro-frame cave-merchant">${head}<div class="dig-panel-status">No merchant data yet. Sync your farm.</div></div>`;
  const timer2 = `<div class="cave-board-sub">${esc2(merchantTimerText(visit, now))}</div>`;
  const offers = Array.isArray(visit.offers) ? visit.offers.slice().sort((a, b) => a.slot - b.slot) : [];
  if (!offers.length) return `<div class="cave-board guro-frame cave-merchant">${head}${timer2}<div class="dig-panel-status">No offers right now.</div></div>`;
  const inv = game.inventory || {};
  const rows = offers.map((o) => offerHtml(o, cave, visit, inv)).join("");
  return `<div class="cave-board guro-frame cave-merchant">${head}${timer2}<div class="cave-offers">${rows}</div></div>`;
}
function dugTodayCounts(farmKey, now) {
  const day = caveDayTotals(farmKey, now);
  const counts = {};
  Object.keys(day.items).forEach((name) => {
    const it = day.items[name];
    counts[name] = Math.round((it.b + it.x) * 1e6) / 1e6;
  });
  return counts;
}
function dugTodayHtml(counts) {
  const names = Object.keys(counts);
  const head = `<div class="cave-board-title"><span class="cave-myco-icon">${apiRef.ui.getIcon("Myco Bin")}</span> Dug from all Myco Bins</div>`;
  const sub = `<div class="cave-board-sub">Today \xB7 resets at 00:00 UTC</div>`;
  if (!names.length) return `<div class="cave-board guro-frame cave-dug-today">${head}${sub}<div class="dig-panel-status">Nothing dug yet today.</div></div>`;
  names.sort((a, b) => {
    if (a === "Mud") return -1;
    if (b === "Mud") return 1;
    return counts[b] - counts[a] || a.localeCompare(b);
  });
  const items = names.map((n) => `<span class="cave-dug-item">+${Math.round(counts[n] * 100) / 100}${itemIcon(n)}</span>`).join("");
  return `<div class="cave-board guro-frame cave-dug-today">${head}${sub}<div class="cave-dug-row">${items}</div></div>`;
}
function render() {
  if (!rootEl) return;
  const card = rootEl.querySelector("#caveCard");
  if (!card) return;
  const game = getGame();
  const info = apiRef.inprogress.farmPanelGetLastInfo ? apiRef.inprogress.farmPanelGetLastInfo() : null;
  const farmLabel = info && info.id ? `Farm #${info.id}` : "No farm synced";
  const cave = game && game.cave;
  if (!game) {
    card.innerHTML = `<div class="dig-panel-chapter">${esc2(farmLabel)} \xB7 Sync your farm to load your Cave</div>`;
    return;
  }
  if (!cave || !cave.machines || !Object.keys(cave.machines).length) {
    card.innerHTML = `<div class="dig-panel-chapter">${esc2(farmLabel)} \xB7 No Cave found. Build the Cave in game, then sync.</div>`;
    return;
  }
  const inv = game.inventory || {};
  const now = Date.now();
  const ids = Object.keys(cave.machines).sort((a, b) => Number(a) - Number(b));
  if (!selectedBin || ids.indexOf(selectedBin) === -1) selectedBin = ids[0];
  const tabs = ids.length > 1 ? tabsHtml(ids) : "";
  const boards = boardHtml(selectedBin, cave.machines[selectedBin] && cave.machines[selectedBin].batch, game, now);
  const merchant = merchantHtml(cave, game, now);
  const farmKey = String(info && info.id ? info.id : "0");
  try {
    caveTrackFromState(game, farmKey);
  } catch (e) {
  }
  const dugToday = dugTodayHtml(dugTodayCounts(farmKey, now));
  const dataCard = caveDataHtml({
    api: apiRef,
    game,
    farmId: farmKey,
    now
  });
  const legend = legendHtml();
  card.innerHTML = `<div class="dig-panel-divider-solid cave-hide-on-data"></div><div class="cave-top-row cave-hide-on-data">${guideHtml()}${statusHtml(cave, ids, now)}</div><div class="cave-hide-on-data">${viewTabsHtml()}${legend}${tabs}</div><div class="cave-main"><div class="cave-boards cave-hide-on-data">${dugToday}${boards}</div><div class="cave-merchant-wrap">${dataCard}<div class="cave-hide-on-data">${merchant}</div></div></div>`;
  const growing = ids.some((id) => {
    const b = cave.machines[id] && cave.machines[id].batch;
    return b && b.readyAt > now;
  });
  const visit = cave.merchantVisit;
  const merchantTicking = !!visit && (visit.closesAt > now || visit.opensAt > now || visit.nextOpensAt > now);
  clearTimeout(timer);
  timer = growing || merchantTicking ? setTimeout(render, 3e4) : null;
}
function onChange(e) {
  if (caveDataChange(e)) render();
}
function onClick(e) {
  if (caveDataClick(e)) {
    render();
    return;
  }
  if (e.target.closest("[data-cave-guide]")) {
    guideOpen = !guideOpen;
    render();
    return;
  }
  const view = e.target.closest("[data-cave-view]");
  if (view) {
    viewMode = view.dataset.caveView === "beetle" ? "beetle" : "items";
    render();
    return;
  }
  const tab = e.target.closest("[data-cave-tab]");
  if (tab) {
    selectedBin = tab.dataset.caveTab;
    render();
    return;
  }
  const cell = e.target.closest("[data-cave-cell]");
  if (!cell) return;
  const [machineId, key] = cell.dataset.caveCell.split(":");
  selected[machineId] = selected[machineId] === key ? null : key;
  render();
}
function syncedItemNames(g) {
  const names = ["Sand Shovel", "Sand Drill", "Mud"];
  const visit = g.cave && g.cave.merchantVisit;
  if (visit && Array.isArray(visit.offers)) {
    visit.offers.forEach((o) => {
      const item = o && o.cost && o.cost.item;
      if (item && names.indexOf(item) === -1) names.push(item);
    });
  }
  return names;
}
function applyCavePatch(target, g) {
  target.cave = g.cave;
  if (g.inventory) {
    const inv = Object.assign({}, target.inventory || {});
    syncedItemNames(g).forEach((k) => {
      if (g.inventory[k] != null) inv[k] = g.inventory[k];
      else delete inv[k];
    });
    target.inventory = inv;
  }
  if (g.farmActivity && g.farmActivity["Cave Tile Dug"] != null) {
    target.farmActivity = Object.assign({}, target.farmActivity || {}, {
      "Cave Tile Dug": g.farmActivity["Cave Tile Dug"]
    });
  }
  if (g.bumpkin && g.bumpkin.skills) {
    target.bumpkin = Object.assign({}, target.bumpkin || {}, {
      skills: g.bumpkin.skills
    });
  }
}
async function performCaveOnlySync() {
  if (syncing || !apiRef) return;
  const calc = apiRef.calc;
  const farmId = calc.digGetFarmId();
  if (!farmId) {
    calc.toast("Sync a Farm ID first \u{1F522}");
    return;
  }
  syncing = true;
  const btn = document.getElementById("cavePanelSyncBtn");
  if (btn) btn.classList.add("is-syncing");
  try {
    const communityData = await calc.fetchCommunityFarmData(farmId);
    const g = calc.farmSyncExtractGameState(communityData);
    if (!g || !g.cave) {
      calc.toast("No cave data found for this farm.");
      return;
    }
    const ip = apiRef.inprogress;
    const currentRoot = ip.farmPanelGameState && typeof ip.farmPanelGameState === "object" ? ip.farmPanelGameState : {};
    const currentG = calc.farmSyncExtractGameState(currentRoot);
    if (currentG && currentG !== currentRoot) {
      applyCavePatch(currentG, g);
      ip.farmPanelSaveGameState(currentRoot);
    } else {
      const merged = Object.assign({}, currentRoot);
      applyCavePatch(merged, g);
      ip.farmPanelSaveGameState(merged);
    }
    try {
      caveTrackFromState(g, String(farmId));
    } catch (e) {
    }
    render();
    calc.toast("\u{1F344} Cave data synced!");
  } catch (e) {
    console.error("Cave-only sync failed:", e);
    calc.toast("\u26A0\uFE0F Cave sync failed \u2014 " + (e && e.message ? e.message : "try again") + ".");
  } finally {
    syncing = false;
    if (btn) btn.classList.remove("is-syncing");
  }
}
function onSaved() {
  if (rootEl) render();
}
function setDataMode(root, on) {
  root.classList.toggle("dig-show-data", on);
  const btn = document.getElementById("digDataToggleBtn");
  if (btn) btn.textContent = on ? "Cave" : "Data";
}
var onTitleClick = null;
function mount(root, api) {
  rootEl = root;
  apiRef = api;
  selected = {};
  guideOpen = false;
  selectedBin = null;
  viewMode = "items";
  setDataMode(root, false);
  const bar = document.getElementById("guroPageTitle");
  if (bar) {
    onTitleClick = (ev) => {
      if (!ev.target.closest("#digDataToggleBtn")) return;
      setDataMode(root, !root.classList.contains("dig-show-data"));
    };
    bar.addEventListener("click", onTitleClick);
  }
  const card = root.querySelector("#caveCard");
  if (card) {
    card.addEventListener("click", onClick);
    card.addEventListener("change", onChange);
  }
  const syncBtn = root.querySelector("#cavePanelSyncBtn");
  if (syncBtn) syncBtn.onclick = performCaveOnlySync;
  if (!listening) {
    listening = true;
    window.addEventListener("guroFarmSaved", onSaved);
  }
  render();
}
function unmount() {
  clearTimeout(timer);
  timer = null;
  const bar = document.getElementById("guroPageTitle");
  if (bar && onTitleClick) bar.removeEventListener("click", onTitleClick);
  onTitleClick = null;
  if (rootEl) {
    rootEl.classList.remove("dig-show-data");
    const card = rootEl.querySelector("#caveCard");
    if (card) {
      card.removeEventListener("click", onClick);
      card.removeEventListener("change", onChange);
    }
  }
  rootEl = null;
}
export {
  mount,
  unmount
};
