import * as calc from "./calculator.js";

import * as prices from "./prices.js";

import { farmPanelGetMarketPriceFlower } from "./inprogress.js";

import { mycoItemUnitCostFlower } from "./rescalc_beetles.js";

import { WB_UPGRADE_ICON } from "./workbench.js";

const TRADABLE = new Set(["Sunflower", "Potato", "Rhubarb", "Pumpkin", "Zucchini", "Carrot", "Yam", "Cabbage", "Broccoli", "Soybean", "Beetroot", "Pepper", "Cauliflower", "Parsnip", "Eggplant", "Corn", "Onion", "Radish", "Wheat", "Turnip", "Kale", "Artichoke", "Barley", "Saltwort", "Crystal Leaf", "Tomato", "Lemon", "Blueberry", "Orange", "Apple", "Banana", "Celestine", "Lunara", "Duskberry", "Grape", "Rice", "Olive", "Wood", "Stone", "Iron", "Gold", "Crimstone", "Salt", "Egg", "Feather", "Honey", "Milk", "Leather", "Wool", "Merino Wool", "Ruffroot", "Chewed Bone", "Heart leaf", "Frost Pebble", "Wild Grass", "Ribbon", "Dewberry", "Moonfur", "Capsule Bait", "Umbrella Bait", "Crimson Baitfish", "Green Beetle", "Blue Beetle", "Pink Beetle", "Amber Beetle", "Pig Bristles", "Truffle", "Goblin Emblem", "Sunflorian Emblem", "Bumpkin Emblem", "Nightshade Emblem"]);

const COST_OWNER = "Cave_Merchant";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
  const max = a >= 1e3 ? 0 : a >= 1 ? 3 : 4;
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: max
  });
}

function marketPrice(name) {
  const m = farmPanelGetMarketPriceFlower ? Number(farmPanelGetMarketPriceFlower(name)) : 0;
  if (m > 0) return m;
  const live = prices.findLivePriceForName ? Number(prices.findLivePriceForName(name)) : 0;
  return live > 0 ? live : 0;
}

function costPerUnit(name) {
  let flower = 0;
  try {
    if (name === "Mud" || name === "Wild Mushroom" || name === "Magic Mushroom") {
      flower = mycoItemUnitCostFlower(name);
    } else if (name === "Oil") {
      flower = calc.coinsToFlower(calc.caveMycoUnitCoins(COST_OWNER, name));
    } else if (calc.cookingFindRecipeForFood(name)) {
      flower = calc.coinsToFlower(prices.cookingIngredientUnitCostCoins(name, "buy"));
    } else {
      flower = calc.coinsToFlower(prices.getMaterialUnitCostCoins(name, "collect"));
    }
  } catch (e) {
    flower = 0;
  }
  return isFinite(flower) && flower > 0 ? flower : 0;
}

function side(name, qty) {
  const tradable = TRADABLE.has(name);
  const unit = tradable ? marketPrice(name) : costPerUnit(name);
  return {
    name: name,
    qty: qty,
    tradable: tradable,
    unit: unit,
    total: unit * qty,
    priced: unit > 0
  };
}

function signed(n, flower) {
  const r = fl(Math.abs(n));
  const sign = n > 0 && r !== "0" ? "+" : n < 0 && r !== "0" ? "-" : "";
  return sign + r + flower;
}

function sideHtml(s, kind, ctx, have) {
  const tag = s.tradable ? "Market" : "Cost";
  const flower = ctx.flower;
  const value = s.priced ? `<span class="cmc-value ${kind === "cost" ? "is-loss" : "is-gain"}">${kind === "cost" ? "-" : "+"}${fl(s.total)}${flower}</span>` : `<span class="cmc-value is-none">No price</span>`;
  const unit = s.priced ? `<span class="cmc-unit"><b>${tag}</b> ${fl(s.unit)}${flower}/unit</span>` : `<span class="cmc-unit"><b>${tag}</b> —</span>`;
  const owned = kind === "cost" ? `<span class="cmc-owned ${have >= s.qty ? "is-enough" : "is-short"}">Owned ${fmt(have)}/${fmt(s.qty)}</span>` : "";
  return `<div class="cmc-side"><div class="cmc-name"><span class="cmc-ico">${ctx.icon(s.name)}</span><span class="cmc-label">${fmt(s.qty)}× ${esc(s.name)}</span></div>${value}${unit}${owned}</div>`;
}

function offerHtml(offer, cave, visit, inv, ctx) {
  const cost = offer.cost || {};
  const reward = offer.reward || {};
  const limit = Number(offer.limit) || 0;
  const purchases = cave.merchant && cave.merchant.purchases;
  const bought = purchases && purchases[String(visit.index)] && Number(purchases[String(visit.index)][offer.slot]) || 0;
  const left = Math.max(0, limit - bought);
  const unlocked = offer.slot <= (Number(cave.tier) || 0);
  const trades = unlocked && left > 0 ? left : Math.max(1, limit);
  const c = side(cost.item, Number(cost.amount) || 0);
  const r = side(reward.item, Number(reward.amount) || 0);
  const have = Math.floor(Number(inv[cost.item]) || 0);
  const feePct = Number(calc.feePercent) || 0;
  const gross = r.total * trades;
  const spend = c.total * trades;
  const tax = r.tradable ? gross * feePct / 100 : 0;
  const ready = c.priced && r.priced;
  const net = gross - tax - spend;
  const pct = spend > 0 ? net / spend * 100 : 0;
  const status = !unlocked ? `Locked (Tier ${offer.slot})` : left > 0 ? `${left}/${limit} left` : "Sold out";
  const head = `<div class="cmc-head"><span class="cmc-chip">Offer ${offer.slot}</span><span class="cmc-chip${unlocked && left > 0 ? "" : " is-off"}">${esc(status)}</span></div>`;
  const row = `<div class="cmc-row">${sideHtml(c, "cost", ctx, have)}<img class="cmc-arrow" src="${WB_UPGRADE_ICON}" alt="">${sideHtml(r, "reward", ctx, 0)}</div>`;
  const qtyLine = `<div class="cmc-sum"><span class="cmc-sum-label">Quantity</span><span class="cmc-sum-val">×${fmt(r.qty * trades)} <span class="cmc-ico">${ctx.icon(r.name)}</span>${trades > 1 ? `<small>${trades} trades</small>` : ""}</span></div>`;
  const taxLine = `<div class="cmc-sum"><span class="cmc-sum-label">Tax${r.tradable && feePct > 0 ? ` (${fmt(feePct)}%)` : ""}</span><span class="cmc-sum-val">${r.priced ? (tax > 0 ? "-" : "") + fl(tax) + ctx.flower : "—"}</span></div>`;
  const netCls = !ready ? "" : net > 0 ? " is-gain" : net < 0 ? " is-loss" : "";
  const netLine = `<div class="cmc-sum cmc-net${netCls}"><span class="cmc-sum-label">Net</span><span class="cmc-sum-val">${ready ? signed(net, ctx.flower) + (spend > 0 ? `<small>${net >= 0 ? "+" : ""}${(Math.round(pct * 10) / 10).toLocaleString()}%</small>` : "") : "—"}</span></div>`;
  return `<div class="cmc-offer guro-frame${unlocked ? "" : " is-locked"}">${head}${row}<div class="cmc-sums">${qtyLine}${taxLine}${netLine}</div></div>`;
}

export function merchantCalcHtml(ctx) {
  const cave = ctx.cave;
  const visit = cave && cave.merchantVisit;
  const head = `<div class="cave-board-title"><span class="cave-myco-icon">${ctx.merchantIcon}</span> Merchant Calculator</div>`;
  if (!visit) return `<div class="cave-board guro-frame cave-merchant-calc">${head}<div class="dig-panel-status">No merchant data yet. Sync your farm.</div></div>`;
  const offers = Array.isArray(visit.offers) ? visit.offers.slice().sort((a, b) => a.slot - b.slot) : [];
  if (!offers.length) return `<div class="cave-board guro-frame cave-merchant-calc">${head}<div class="dig-panel-status">No offers right now.</div></div>`;
  const sub = `<div class="cave-board-sub">Tradable items use the market price. Others use their cost, made from bought materials.</div>`;
  const inv = ctx.game.inventory || {};
  const cards = offers.map(o => offerHtml(o, cave, visit, inv, ctx)).join("");
  return `<div class="cave-board guro-frame cave-merchant-calc">${head}${sub}<div class="cmc-list">${cards}</div></div>`;
}
