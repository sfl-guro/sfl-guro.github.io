import { solveCaveBatch, CAVE_WIDTH } from "../cave_solver.js";

import { GOBLIN_MERCHANT_ICON } from "../goblin_merchant_icon.js";

import { caveDataHtml, caveDataClick, caveDataChange } from "../cave_data.js";

import { merchantCalcHtml } from "../cave_merchant_calc.js";

import { caveTrackFromState, caveDayTotals } from "../cave_track.js";

const COLS = [ "A", "B", "C", "D", "E" ];

const RECIPE_LABELS = {
  Mushroom: "Mushroom mix",
  Beetle: "Beetle mix",
  Mud: "Mud mix"
};

let rootEl = null;

let apiRef = null;

let selected = {};

let timer = null;

let listening = false;

let guideOpen = false;

let syncing = false;

let selectedBin = null;

let viewMode = "items";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getGame() {
  const state = apiRef.inprogress.farmPanelGameState;
  if (!state) return null;
  return apiRef.calc.farmSyncExtractGameState(state);
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
  const mins = Math.max(1, Math.ceil(ms / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? h + "h " + m + "m" : m + "m";
}

function formatSpan(ms) {
  const mins = Math.max(1, Math.ceil(ms / 60000));
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
    const clue = c.clue !== undefined ? `<span class="cave-clue">${c.clue}</span>` : "";
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
  return Object.keys(res.names).map(name => `<span class="dig-legend-item cave-chip">${itemIcon(name)} ×${res.names[name]}</span>`).join("");
}

function touchingCluesHtml(res, c) {
  const near = [];
  [ [ 0, -1 ], [ -1, 0 ], [ 1, 0 ], [ 0, 1 ] ].forEach(([dx, dy]) => {
    const nx = c.x + dx;
    const ny = c.y + dy;
    if (nx < 0 || ny < 0 || nx >= CAVE_WIDTH || ny >= CAVE_WIDTH) return;
    const n = res.cells[ny * CAVE_WIDTH + nx];
    if (n && n.dug && n.clue !== undefined) near.push(`<span class="cave-kind"><b>${cellLabel(n)}</b> clue ${n.clue}</span>`);
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
    const clue = c.clue !== undefined ? ` · clue ${c.clue}` : " · no clue";
    return `<div class="dig-panel-status cave-info"><b>${cellLabel(c)}</b> dug: ${itemIcon(name)} ${esc(name)}${clue}</div>`;
  }
  const parts = [];
  parts.push(`<b>${cellLabel(c)}</b> holds something: <b>${pctText(c.p)}</b>`);
  const isBeetleName = k => k === "Beetle" || /Beetle$/.test(k);
  const kinds = Object.keys(c.kinds).filter(k => k !== "Mud" && c.kinds[k] > 0).sort((a, b) => Number(isBeetleName(b)) - Number(isBeetleName(a)));
  const lines = kinds.map(k => `<span class="cave-kind">${itemIcon(k)} ${esc(k)} ${pctText(c.kinds[k])}</span>`);
  lines.push(`<span class="cave-kind">${itemIcon("Mud")} Mud ${pctText(c.kinds.Mud)}</span>`);
  return `<div class="dig-panel-status cave-info">${parts.join("")}<div class="cave-kinds">${lines.join("")}</div>${touchingCluesHtml(res, c)}</div>`;
}

function boardHtml(machineId, batch, game, now) {
  const head = `<div class="cave-board-title"><span class="cave-myco-icon">${apiRef.ui.getIcon("Myco Bin")}</span> Myco Bin ${esc(machineId)}</div>`;
  if (!batch) return `<div class="cave-board guro-frame">${head}<div class="dig-panel-status">Empty. Start a batch in this Myco Bin.</div></div>`;
  const recipe = RECIPE_LABELS[batch.recipe] || batch.recipe;
  const sub = `<div class="cave-board-sub">${esc(recipe)}</div>`;
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
  const modes = [ [ "items", "Any item" ], [ "beetle", "Beetles" ] ];
  const buttons = modes.map(m => `<button type="button" class="cave-tab${m[0] === viewMode ? " active" : ""}" data-cave-view="${m[0]}">${m[1]}</button>`).join("");
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

const STATE_LABELS = {
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
  const list = steps.map((t, i) => `<div class="cave-guide-step"><span class="cave-guide-num">${i + 1}</span><span>${esc(t)}</span></div>`).join("");
  const open = guideOpen ? " is-open" : "";
  return `<div class="cave-info-box guro-frame cave-guide${open}"><button type="button" class="cave-guide-toggle" data-cave-guide aria-expanded="${guideOpen}">Info</button><div class="cave-board-title cave-guide-title">How Myco Bins work</div><div class="cave-guide-body">${list}</div></div>`;
}

function statusHtml(cave, ids, now) {
  const tier = esc(cave.tier || ids.length);
  const rows = [];
  const counts = { growing: 0, ready: 0, idle: 0 };
  let soon = null;
  ids.forEach(id => {
    const batch = cave.machines[id] && cave.machines[id].batch;
    const st = binState(batch, now);
    counts[st] += 1;
    let detail = "Feed it to start a batch";
    if (batch && st === "growing") {
      detail = (RECIPE_LABELS[batch.recipe] || batch.recipe) + " · ready in " + formatWait(batch.readyAt - now);
      if (soon === null || batch.readyAt < soon) soon = batch.readyAt;
    } else if (batch && st === "ready") {
      detail = (RECIPE_LABELS[batch.recipe] || batch.recipe) + " · dig it now";
    }
    rows.push(`<div class="cave-bin-row"><span class="cave-bin-name">Bin ${esc(id)}</span><span class="cave-bin-state is-${st}">${STATE_LABELS[st]}</span><span class="cave-bin-detail">${esc(detail)}</span></div>`);
  });
  const total = ids.length;
  const next = soon !== null ? `<div class="cave-bin-next">Next bin ready in ${formatWait(soon - now)}</div>` : "";
  const summary = `<div class="cave-bin-count"><b>${counts.growing}</b> of ${total} running</div><div class="cave-bin-sub">${counts.ready} ready to dig · ${counts.idle} empty</div>${next}`;
  return `<div class="cave-info-box guro-frame"><div class="cave-board-title cave-running-title"><span><span class="cave-myco-icon">${apiRef.ui.getIcon("Myco Bin")}</span> Myco Bins running</span><span class="cave-tier-tag">Cave Tier ${tier}</span></div>${summary}<div class="cave-bin-list">${rows.join("")}</div></div>`;
}

function tabsHtml(ids) {
  const buttons = ids.map(id => `<button type="button" class="cave-tab${id === selectedBin ? " active" : ""}" data-cave-tab="${esc(id)}">Bin ${esc(id)}</button>`).join("");
  return `<div class="cave-tabs">${buttons}</div>`;
}

function merchantTimerText(visit, now) {
  if (now >= visit.opensAt && now < visit.closesAt) return "Leaves in " + formatSpan(visit.closesAt - now);
  if (now < visit.opensAt) return "Arrives in " + formatSpan(visit.opensAt - now);
  if (visit.nextOpensAt > now) return "Away · returns in " + formatSpan(visit.nextOpensAt - now);
  return "Away · sync to check his next visit";
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
  return `<span class="cave-offer-pl ${gain ? "is-gain" : "is-lossy"}">(${gain ? "+" : "-"}${rounded.toLocaleString(undefined, {
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
  const edge = unlocked ? `<span class="cave-offer-total${total ? "" : " is-zero"}">×${total} ${merchantItemIcon(reward.item)}${merchantProfitHtml(cost, reward, trades)}</span>` : `<span class="cave-offer-total is-zero">Tier ${offer.slot}</span>`;
  const meta = unlocked ? `${left}/${limit} left` : `Unlocks at Cave tier ${offer.slot}`;
  return `<div class="cave-offer guro-frame${unlocked ? "" : " is-locked"}"><div class="cave-offer-main"><span class="cave-offer-have ${enough ? "is-enough" : "is-short"}">${have}</span><span class="cave-offer-need">/${need}</span><span class="cave-offer-item">${merchantItemIcon(cost.item)} ${esc(cost.item)}</span><span class="cave-offer-arrow">→</span><span class="cave-offer-item">${merchantItemIcon(reward.item)} ${esc(reward.item)} ×${Number(reward.amount) || 0}</span>${edge}</div><div class="cave-offer-meta">${esc(meta)}</div></div>`;
}

function merchantHtml(cave, game, now) {
  const head = `<div class="cave-board-title"><span class="cave-myco-icon"><img src="${GOBLIN_MERCHANT_ICON}" alt="Goblin Merchant"></span> Goblin Merchant</div>`;
  const visit = cave.merchantVisit;
  if (!visit) return `<div class="cave-board guro-frame cave-merchant">${head}<div class="dig-panel-status">No merchant data yet. Sync your farm.</div></div>`;
  const timer = `<div class="cave-board-sub">${esc(merchantTimerText(visit, now))}</div>`;
  const offers = Array.isArray(visit.offers) ? visit.offers.slice().sort((a, b) => a.slot - b.slot) : [];
  if (!offers.length) return `<div class="cave-board guro-frame cave-merchant">${head}${timer}<div class="dig-panel-status">No offers right now.</div></div>`;
  const inv = game.inventory || {};
  const rows = offers.map(o => offerHtml(o, cave, visit, inv)).join("");
  return `<div class="cave-board guro-frame cave-merchant">${head}${timer}<div class="cave-offers">${rows}</div></div>`;
}

function dugTodayCounts(farmKey, now) {
  const day = caveDayTotals(farmKey, now);
  const counts = {};
  Object.keys(day.items).forEach(name => {
    const it = day.items[name];
    counts[name] = Math.round((it.b + it.x) * 1e6) / 1e6;
  });
  return counts;
}

function dugTodayHtml(counts) {
  const names = Object.keys(counts);
  const head = `<div class="cave-board-title"><span class="cave-myco-icon">${apiRef.ui.getIcon("Myco Bin")}</span> Dug from all Myco Bins</div>`;
  const sub = `<div class="cave-board-sub">Today · resets at 00:00 UTC</div>`;
  if (!names.length) return `<div class="cave-board guro-frame cave-dug-today">${head}${sub}<div class="dig-panel-status">Nothing dug yet today.</div></div>`;
  names.sort((a, b) => {
    if (a === "Mud") return -1;
    if (b === "Mud") return 1;
    return counts[b] - counts[a] || a.localeCompare(b);
  });
  const items = names.map(n => `<span class="cave-dug-item">+${Math.round(counts[n] * 100) / 100}${itemIcon(n)}</span>`).join("");
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
    card.innerHTML = `<div class="dig-panel-chapter">${esc(farmLabel)} · Sync your farm to load your Cave</div>`;
    return;
  }
  if (!cave || !cave.machines || !Object.keys(cave.machines).length) {
    card.innerHTML = `<div class="dig-panel-chapter">${esc(farmLabel)} · No Cave found. Build the Cave in game, then sync.</div>`;
    return;
  }
  const inv = game.inventory || {};
  const now = Date.now();
  const ids = Object.keys(cave.machines).sort((a, b) => Number(a) - Number(b));
  if (!selectedBin || ids.indexOf(selectedBin) === -1) selectedBin = ids[0];
  const tabs = ids.length > 1 ? tabsHtml(ids) : "";
  const boards = boardHtml(selectedBin, cave.machines[selectedBin] && cave.machines[selectedBin].batch, game, now);
  const merchant = merchantHtml(cave, game, now);
  const merchantCalc = merchantCalcHtml({
    cave: cave,
    game: game,
    icon: merchantItemIcon,
    flower: apiRef.calc.FLOWER_ICON,
    merchantIcon: `<img src="${GOBLIN_MERCHANT_ICON}" alt="Goblin Merchant">`
  });
  const farmKey = String(info && info.id ? info.id : "0");
  try {
    caveTrackFromState(game, farmKey);
  } catch (e) {}
  const dugToday = dugTodayHtml(dugTodayCounts(farmKey, now));
  const dataCard = caveDataHtml({
    api: apiRef,
    game: game,
    farmId: farmKey,
    now: now
  });
  const legend = legendHtml();
  card.innerHTML = `<div class="dig-panel-divider-solid cave-hide-on-data"></div><div class="cave-top-row cave-hide-on-data">${guideHtml()}${statusHtml(cave, ids, now)}</div><div class="cave-hide-on-data">${viewTabsHtml()}${legend}${tabs}</div><div class="cave-main"><div class="cave-boards cave-hide-on-data">${dugToday}${boards}</div><div class="cave-merchant-wrap">${dataCard}<div class="cave-hide-on-data cave-merchant-stack">${merchantCalc}${merchant}</div></div></div>`;
  const growing = ids.some(id => {
    const b = cave.machines[id] && cave.machines[id].batch;
    return b && b.readyAt > now;
  });
  const visit = cave.merchantVisit;
  const merchantTicking = !!visit && (visit.closesAt > now || visit.opensAt > now || visit.nextOpensAt > now);
  clearTimeout(timer);
  timer = growing || merchantTicking ? setTimeout(render, 30000) : null;
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
  const names = [ "Sand Shovel", "Sand Drill", "Mud" ];
  const visit = g.cave && g.cave.merchantVisit;
  if (visit && Array.isArray(visit.offers)) {
    visit.offers.forEach(o => {
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
    syncedItemNames(g).forEach(k => {
      if (g.inventory[k] != null) inv[k] = g.inventory[k]; else delete inv[k];
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
    calc.toast("Sync a Farm ID first 🔢");
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
    } catch (e) {}
    render();
    calc.toast("🍄 Cave data synced!");
  } catch (e) {
    console.error("Cave-only sync failed:", e);
    calc.toast("⚠️ Cave sync failed — " + (e && e.message ? e.message : "try again") + ".");
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

let onTitleClick = null;

export function mount(root, api) {
  rootEl = root;
  apiRef = api;
  selected = {};
  guideOpen = false;
  selectedBin = null;
  viewMode = "items";
  setDataMode(root, false);
  const bar = document.getElementById("guroPageTitle");
  if (bar) {
    onTitleClick = ev => {
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

export function unmount() {
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
