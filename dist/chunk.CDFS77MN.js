import {
  BASE_FRUITS,
  BASE_STOCK_CROPS,
  BASE_STOCK_FLOWERS,
  BASE_STOCK_FRUITS,
  BASE_STOCK_GREENHOUSE,
  BASE_STOCK_TOOLS,
  BASE_STOCK_TREASURE_TOOLS,
  BEETLE_FEED_XP,
  COIN_ICON,
  FLOWER_ICON,
  SEASON_ORDER,
  coinsToFlower,
  computeBoostedStock,
  discardSkillBoostDrafts,
  escapeHtml,
  farmPanelGameState,
  farmPanelGetMarketPriceFlower,
  farmSyncCollectEquippedAndPlacedNames,
  farmSyncExtractGameState,
  feePercent,
  findLivePriceForName,
  formatDuration,
  gemsToFlower,
  getAscensionRank,
  getBoostIconAnyFallback,
  getCropSeasons,
  getFruitSeasons,
  getIcon,
  getMaterialMode,
  getMaterialUnitCostCoins,
  getRestockGemCostIndividual,
  hasManualMaterialMode,
  invalidateCostCache,
  isBoostDraftDirty,
  isSkillActive,
  isSkillDraftDirty,
  loadBaseCropsIfNeeded,
  previewSeason,
  renderAscensionBar,
  renderSkillPanel,
  setAutoMaterialModes,
  setBeetleCollectCostProvider,
  setMaterialMode,
  setSkillCategory,
  skillCategory,
  toast,
  updateSkillSaveBarState
} from "./chunk.P5GGFQYY.js";

// src/rescalc_shared.js
var FLOWER_SEED_SEASONS = {
  Lavender: ["Spring"],
  Gladiolus: ["Summer"],
  Clover: ["Autumn"],
  Edelweiss: ["Winter"]
};
function flowerSeedSeasons(name) {
  return FLOWER_SEED_SEASONS[name] || SEASON_ORDER;
}
function normalizeSeason(season) {
  return SEASON_ORDER.includes(season) ? season : previewSeason || SEASON_ORDER[0];
}
function restockSeedsForSeason(season) {
  const s = normalizeSeason(season);
  const stocked = (bag) => Object.keys(bag).filter((n) => (bag[n] || 0) > 0);
  const crops = stocked(BASE_STOCK_CROPS).filter((n) => getCropSeasons(n).includes(s)).map((n) => ({
    name: n,
    icon: n
  }));
  const fruits = stocked(BASE_STOCK_FRUITS).filter((n) => !(BASE_FRUITS[n] && BASE_FRUITS[n].moonOnly) && getFruitSeasons(n).includes(s)).map((n) => ({
    name: n,
    icon: n
  }));
  const greenhouse = stocked(BASE_STOCK_GREENHOUSE).map((n) => ({
    name: n,
    icon: n
  }));
  const flowers = stocked(BASE_STOCK_FLOWERS).filter((n) => flowerSeedSeasons(n).includes(s)).map((n) => ({
    name: n,
    icon: `${n} Seed`
  }));
  return crops.concat(fruits, greenhouse, flowers);
}
function restockShareCount(season) {
  return Math.max(1, restockSeedsForSeason(season).length);
}
function restockSeedIconsHtml(season) {
  return `(${restockSeedsForSeason(season).map((s) => `<span class="rc-share-icon">${getIcon(s.icon)}</span>`).join("")})`;
}
function toolRestockShareCount() {
  return Math.max(1, Object.keys(BASE_STOCK_TOOLS).filter((n) => (BASE_STOCK_TOOLS[n] || 0) > 0).length);
}
function toolRestockIconsHtml() {
  const names = Object.keys(BASE_STOCK_TOOLS).filter((n) => (BASE_STOCK_TOOLS[n] || 0) > 0);
  return `(${names.map((n) => `<span class="rc-share-icon">${getIcon(n)}</span>`).join("")})`;
}

// src/rescalc_beetles.js
var STORE_KEY = "guro_rc_beetles_v1";
var PATCH_TILES = 25;
var BATCH_SEC = 12 * 3600;
var MAX_BINS = 8;
var SHOVEL_COINS = 20;
var SHOVEL_MATERIALS = [{
  name: "Wood",
  qty: 2
}, {
  name: "Stone",
  qty: 1
}];
var MAGIC_CHANCE = 0.1;
var RECIPES = {
  Mushroom: {
    label: "Mushroom Mix",
    icon: "Wild Mushroom",
    mushroom: 6,
    beetle: 2,
    mudMult: 1
  },
  Beetle: {
    label: "Beetle Mix",
    icon: "Green Beetle",
    mushroom: 3,
    beetle: 5,
    mudMult: 1
  },
  Mud: {
    label: "Mud Mix",
    icon: "Mud",
    mushroom: 3,
    beetle: 2,
    mudMult: 2
  }
};
var RECIPE_ORDER = ["Mushroom", "Beetle", "Mud"];
var FIXED_INGREDIENTS = {
  Mushroom: {
    Wood: 10
  },
  Beetle: {
    Egg: 30
  }
};
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
var BEETLES = ["Green Beetle", "Blue Beetle", "Pink Beetle", "Amber Beetle"];
var BEETLE_XP_KEY = {
  "Green Beetle": "beetleGreen",
  "Blue Beetle": "beetleBlue",
  "Pink Beetle": "beetlePink",
  "Amber Beetle": "beetleAmber"
};
var BASE_WEIGHTS = [40, 30, 20, 10];
var RARE_WEIGHTS = [[35, 35, 15, 15], [30, 30, 20, 20], [25, 25, 25, 25]];
var SKILLS = {
  lean: {
    id: "skill_lean_compost",
    name: "Lean Compost",
    ranks: [0.95, 0.9, 0.85]
  },
  rapid: {
    id: "skill_rapid_mycelium",
    name: "Rapid Mycelium",
    ranks: [0.95, 0.9, 0.85]
  },
  bloom: {
    id: "skill_mushroom_bloom",
    name: "Mushroom Bloom",
    ranks: [1, 2, 3]
  },
  nest: {
    id: "skill_beetle_nest",
    name: "Beetle Nest",
    ranks: [1, 2, 3]
  },
  muddy: {
    id: "skill_muddy_bounty",
    name: "Muddy Bounty",
    ranks: [0.1, 0.2, 0.3]
  },
  fungal: {
    id: "skill_fungal_harvest",
    name: "Fungal Harvest",
    ranks: [0.2, 0.3, 0.4]
  },
  shovel: {
    id: "skill_sturdy_shovel",
    name: "Sturdy Shovel",
    ranks: [0.1, 0.2, 0.3]
  },
  rare: {
    id: "skill_rare_breeds",
    name: "Rare Breeds",
    ranks: [1, 2, 3]
  },
  twin: {
    id: "skill_twin_beetles",
    name: "Twin Beetles",
    ranks: [0.05, 0.1, 0.15]
  }
};
var DIG_MODES = [{
  id: "find",
  label: "Until Beetles Found"
}, {
  id: "full",
  label: "Clear Whole Patch"
}];
var VIEW_MODES = [{
  id: "batch",
  label: "Per Batch"
}, {
  id: "day",
  label: "Per Day"
}];
var host = null;
var state = null;
var popup = null;
var overlayEl = null;
var promptEl = null;
var restoreFns = [];
var binsDraft = null;
var listening = false;
var detailsOpen = false;
var savedSkillCategory = null;
function esc(s) {
  return escapeHtml(String(s));
}
function loadState() {
  const base = {
    view: "day",
    dig: "find",
    recipe: "Beetle",
    crop: "Carrot",
    recipeManual: false,
    cropManual: false,
    digs: 0,
    bins: 0
  };
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (raw && typeof raw === "object") {
      if (raw.view === "day" || raw.view === "batch") base.view = raw.view;
      if (raw.dig === "full" || raw.dig === "find") base.dig = raw.dig;
      if (RECIPES[raw.recipe]) base.recipe = raw.recipe;
      if (Object.prototype.hasOwnProperty.call(MUD_CROPS, raw.crop)) base.crop = raw.crop;
      base.recipeManual = raw.recipeManual === true;
      base.cropManual = raw.cropManual === true;
      const d = Math.floor(Number(raw.digs));
      if (isFinite(d) && d > 0) base.digs = Math.min(d, PATCH_TILES);
      const b = Math.floor(Number(raw.bins));
      if (isFinite(b) && b > 0) base.bins = Math.min(b, MAX_BINS);
    }
  } catch (e) {
  }
  return base;
}
function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) {
  }
}
function n2(n) {
  if (!isFinite(n)) return "\u2014";
  return n.toLocaleString(void 0, {
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
function signed(n, f) {
  const r = f(Math.abs(n));
  if (n > 0 && r !== "0") return "+" + r;
  if (n < 0 && r !== "0") return "-" + r;
  return r;
}
function flowerSigned(n) {
  return `${signed(n, fl)}${FLOWER_ICON}`;
}
function flowerHtml(n) {
  return `${fl(n)}${FLOWER_ICON}`;
}
function pct(n) {
  return `${n2(n)}%`;
}
function level(def) {
  if (!isSkillActive(def.id)) return 0;
  return Math.min(Math.max(getAscensionRank(def.id), 1), def.ranks.length);
}
function skillValue(def, fallback) {
  const l = level(def);
  return l ? def.ranks[l - 1] : fallback;
}
function priceOf(name) {
  const m = farmPanelGetMarketPriceFlower(name);
  if (m > 0) return m;
  const live = findLivePriceForName(name);
  return live != null && isFinite(live) && live > 0 ? live : 0;
}
function syncedBins() {
  try {
    if (!farmPanelGameState) return 0;
    const g = farmSyncExtractGameState(farmPanelGameState);
    const cave = g && g.cave;
    if (!cave || !cave.machines || typeof cave.machines !== "object") return 0;
    return Math.min(Object.keys(cave.machines).length, MAX_BINS);
  } catch (e) {
    return 0;
  }
}
function effectiveBins() {
  if (state.bins > 0) return Math.min(state.bins, MAX_BINS);
  return Math.max(1, syncedBins());
}
function mushroomBoosts() {
  const out = {
    wild: 0,
    list: []
  };
  try {
    if (!farmPanelGameState) return out;
    const g = farmSyncExtractGameState(farmPanelGameState);
    const placed = farmSyncCollectEquippedAndPlacedNames(g);
    if (placed.has("Mushroom House")) {
      out.wild += 0.2;
      out.list.push({
        name: "Mushroom House",
        value: "+0.2 Wild Mushroom"
      });
    }
    if (placed.has("Fairy Circle")) {
      out.wild += 0.2;
      out.list.push({
        name: "Fairy Circle",
        value: "+0.2 Wild Mushroom"
      });
    }
    const equipped = g && g.bumpkin && g.bumpkin.equipped;
    if (equipped && Object.values(equipped).includes("Mushroom Hat")) {
      out.wild += 0.1;
      out.list.push({
        name: "Mushroom Hat",
        value: "+0.1 Wild Mushroom"
      });
    }
  } catch (e) {
  }
  return out;
}
function cheaperMode(name) {
  if (name.toLowerCase() === "oil") return "collect";
  const collect = getMaterialUnitCostCoins(name, "collect");
  const buy = getMaterialUnitCostCoins(name, "buy");
  if (!(buy > 0)) return "collect";
  if (!(collect > 0)) return "collect";
  return buy < collect ? "buy" : "collect";
}
function resKey(recipe) {
  return "Cave_" + recipe;
}
function toolsKey() {
  return "Cave_Tools";
}
function fixedIngredients(recipe) {
  return FIXED_INGREDIENTS[recipe];
}
function refreshAutoModes() {
  const map = {};
  setAutoMaterialModes(map);
  invalidateCostCache();
  const add = (res, name) => {
    if (hasManualMaterialMode(res, name)) return;
    map[res + ":" + name] = cheaperMode(name);
  };
  Object.keys(FIXED_INGREDIENTS).forEach((r) => Object.keys(FIXED_INGREDIENTS[r]).forEach((n) => add(resKey(r), n)));
  Object.keys(MUD_CROPS).forEach((n) => add(resKey("Mud"), n));
  SHOVEL_MATERIALS.forEach((m) => add(toolsKey(), m.name));
  setAutoMaterialModes(map);
  invalidateCostCache();
}
function matUnit(res, name) {
  return getMaterialUnitCostCoins(name, getMaterialMode(res, name));
}
function cheapestCrop() {
  let best = null;
  let bestCost = Infinity;
  let fallback = null;
  Object.keys(MUD_CROPS).forEach((name) => {
    if (fallback == null) fallback = name;
    const cost = MUD_CROPS[name] * matUnit(resKey("Mud"), name);
    if (cost > 0 && cost < bestCost) {
      bestCost = cost;
      best = name;
    }
  });
  return best || fallback;
}
function activeCrop() {
  return state.cropManual ? state.crop : cheapestCrop();
}
function ingredientBase(recipe) {
  if (recipe === "Mud") {
    const o = {};
    const crop = activeCrop();
    o[crop] = MUD_CROPS[crop];
    return o;
  }
  return fixedIngredients(recipe);
}
function recipeBaseCost(recipe) {
  const base = ingredientBase(recipe);
  return Object.keys(base).reduce((sum, name) => sum + base[name] * matUnit(resKey(recipe), name), 0);
}
function cheapestRecipe() {
  let best = null;
  let bestCost = Infinity;
  RECIPE_ORDER.forEach((id) => {
    const cost = recipeBaseCost(id);
    if (cost > 0 && cost < bestCost) {
      bestCost = cost;
      best = id;
    }
  });
  return best || RECIPE_ORDER[0];
}
function activeRecipe() {
  return state.recipeManual ? state.recipe : cheapestRecipe();
}
function compute(forceRecipe) {
  refreshAutoModes();
  const recipeId = forceRecipe || activeRecipe();
  const rec = RECIPES[recipeId];
  const bins = effectiveBins();
  const lean = skillValue(SKILLS.lean, 1);
  const rapid = skillValue(SKILLS.rapid, 1);
  const bloom = skillValue(SKILLS.bloom, 0);
  const nest = recipeId === "Beetle" ? skillValue(SKILLS.nest, 0) : 0;
  const muddy = skillValue(SKILLS.muddy, 0);
  const fungal = skillValue(SKILLS.fungal, 0);
  const keep = skillValue(SKILLS.shovel, 0);
  const twin = skillValue(SKILLS.twin, 0);
  const rareLevel = level(SKILLS.rare);
  const weights = rareLevel ? RARE_WEIGHTS[rareLevel - 1] : BASE_WEIGHTS;
  const mush = mushroomBoosts();
  const mTiles = rec.mushroom + bloom;
  const bTiles = rec.beetle + nest;
  const uTiles = PATCH_TILES - mTiles - bTiles;
  const full = state.dig === "full";
  const estDigs = bTiles + (PATCH_TILES - bTiles) * bTiles / (bTiles + 1);
  const manualShovels = !full && state.digs > 0 ? state.digs : 0;
  const manualDigs = manualShovels ? Math.min(PATCH_TILES, Math.max(bTiles, manualShovels / (1 - keep))) : 0;
  let fracOther = bTiles / (bTiles + 1);
  let dugTiles = estDigs;
  if (full) {
    fracOther = 1;
    dugTiles = PATCH_TILES;
  } else if (manualDigs) {
    dugTiles = manualDigs;
    fracOther = PATCH_TILES > bTiles ? (manualDigs - bTiles) / (PATCH_TILES - bTiles) : 0;
  }
  const dugMushroom = mTiles * fracOther;
  const dugMud = uTiles * fracOther;
  const shovels = manualShovels ? manualShovels : Math.ceil(dugTiles * (1 - keep) - 1e-9);
  const estShovels = Math.ceil(estDigs * (1 - keep) - 1e-9);
  const beetleTotal = bTiles * (1 + twin);
  const items = [];
  BEETLES.forEach((b, i) => {
    items.push({
      name: b,
      qty: beetleTotal * weights[i] / 100,
      kind: "beetle"
    });
  });
  const wildAmt = 1 + fungal + mush.wild;
  const magicAmt = 1 + fungal;
  items.push({
    name: "Wild Mushroom",
    qty: dugMushroom * (1 - MAGIC_CHANCE) * wildAmt,
    kind: "mushroom"
  });
  items.push({
    name: "Magic Mushroom",
    qty: dugMushroom * MAGIC_CHANCE * magicAmt,
    kind: "mushroom"
  });
  items.push({
    name: "Mud",
    qty: dugMud * rec.mudMult * (1 + muddy),
    kind: "mud"
  });
  const feeRate = (feePercent || 0) / 100;
  let gross = 0;
  let feedXp = 0;
  items.forEach((it) => {
    it.price = priceOf(it.name);
    it.gross = it.qty * it.price;
    gross += it.gross;
    if (it.kind === "beetle") {
      it.xp = it.qty * (BEETLE_FEED_XP[BEETLE_XP_KEY[it.name]] || 0);
      feedXp += it.xp;
    }
  });
  const res = resKey(recipeId);
  let ingCoins = 0;
  const ingredients = Object.keys(ingredientBase(recipeId)).map((name) => {
    const qty = ingredientBase(recipeId)[name] * lean;
    const mode = getMaterialMode(res, name);
    const unitCost = getMaterialUnitCostCoins(name, mode);
    const lineCost = unitCost * qty;
    ingCoins += lineCost;
    return {
      name,
      qty,
      unitCost,
      lineCost,
      mode,
      res
    };
  });
  let shovelUnitCoins = SHOVEL_COINS;
  const toolMats = SHOVEL_MATERIALS.map((m) => {
    const mode = getMaterialMode(toolsKey(), m.name);
    const unitCost = getMaterialUnitCostCoins(m.name, mode);
    shovelUnitCoins += unitCost * m.qty;
    return {
      name: m.name,
      qty: m.qty,
      unitCost,
      mode,
      res: toolsKey()
    };
  });
  const shovelCoins = shovels * shovelUnitCoins;
  const batchSec = BATCH_SEC * rapid;
  const perDay = 86400 / batchSec;
  const scale = bins * (state.view === "day" ? perDay : 1);
  const stockQty = computeBoostedStock(BASE_STOCK_TREASURE_TOOLS["Sand Shovel"], "tool", "Sand Shovel");
  const gemPerRestock = getRestockGemCostIndividual("tool");
  const shareCount = toolRestockShareCount();
  const restockFlowerEach = stockQty > 0 ? gemsToFlower(gemPerRestock) / Math.max(1, shareCount) / stockQty : 0;
  const binRestockCost = shovels * restockFlowerEach;
  const binGross = gross;
  const binCost = coinsToFlower(ingCoins + shovelCoins) + binRestockCost;
  const out = {
    recipeId,
    rec,
    bins,
    items,
    tiles: {
      mushroom: mTiles,
      beetle: bTiles,
      mud: uTiles
    },
    full,
    manualDigs,
    manualShovels,
    estDigs,
    estShovels,
    crop: activeCrop(),
    dugTiles,
    shovels,
    keep,
    twin,
    weights,
    rareLevel,
    lean,
    rapid,
    batchSec,
    perDay,
    scale,
    view: state.view,
    feeRate,
    ingredients,
    toolMats,
    shovelUnitCoins,
    binGross,
    binCost,
    binIngCost: coinsToFlower(ingCoins),
    binShovelCost: coinsToFlower(shovelCoins),
    binRestockCost,
    stockQty,
    gemPerRestock,
    shareCount,
    restockFlowerEach,
    beetleBin: beetleTotal,
    feedXpBin: feedXp,
    mushroomBoosts: mush.list,
    muddy,
    fungal
  };
  out.gross = binGross * scale;
  out.fee = out.gross * feeRate;
  out.shovelCost = out.binShovelCost * scale;
  out.feedXp = feedXp * scale;
  out.beetles = beetleTotal * scale;
  out.shovelsTotal = Math.ceil(shovels * scale - 1e-9);
  const dayView = state.view === "day";
  out.restockQty = stockQty > 0 ? dayView ? Math.ceil(out.shovelsTotal / stockQty - 1e-9) : shovels * scale / stockQty : 0;
  out.restockGems = out.restockQty * gemPerRestock / Math.max(1, shareCount);
  out.restockCost = dayView ? gemsToFlower(out.restockGems) : binRestockCost * scale;
  out.cost = (binCost - binRestockCost) * scale + out.restockCost;
  out.ingCost = out.cost > 0 ? out.binIngCost * scale : 0;
  out.costPerBeetle = out.beetles > 0 ? out.cost / out.beetles : 0;
  out.net = out.gross - out.fee - out.cost;
  out.netBin = binGross * (1 - feeRate) - binCost;
  out.unitCostBatch = beetleTotal > 0 ? binCost / beetleTotal : 0;
  out.unpriced = items.filter((it) => it.qty > 0 && !(it.price > 0)).map((it) => it.name);
  return out;
}
var unitCostMemo = 0;
var unitCostMemoAt = 0;
var unitCostBusy = false;
function beetleCollectUnitCost() {
  if (unitCostBusy) return unitCostMemo;
  const now = Date.now();
  if (now - unitCostMemoAt < 400) return unitCostMemo;
  unitCostBusy = true;
  const loaded = !!state;
  try {
    if (!loaded) {
      loadBaseCropsIfNeeded();
      state = loadState();
    }
    unitCostMemo = compute().unitCostBatch || 0;
    unitCostMemoAt = Date.now();
    if (!host) {
      setAutoMaterialModes({});
      invalidateCostCache();
    }
  } catch (e) {
    unitCostMemo = 0;
  }
  unitCostBusy = false;
  return unitCostMemo;
}
setBeetleCollectCostProvider(beetleCollectUnitCost);
var itemCostMemo = {};
function mycoItemUnitCostFlower(name) {
  const mud = name === "Mud";
  const mushroom = name === "Wild Mushroom" || name === "Magic Mushroom";
  if (!mud && !mushroom) return 0;
  const recipe = mud ? "Mud" : "Mushroom";
  const now = Date.now();
  const memo = itemCostMemo[recipe];
  if (memo && now - memo.at < 400) return memo.value;
  let value = 0;
  const loaded = !!state;
  try {
    if (!loaded) {
      loadBaseCropsIfNeeded();
      state = loadState();
    }
    const out = compute(recipe);
    const qty = mud ? out.items.filter((it) => it.name === "Mud").reduce((a, it) => a + it.qty, 0) : out.items.filter((it) => it.kind === "mushroom").reduce((a, it) => a + it.qty, 0);
    value = qty > 0 ? out.binCost / qty : 0;
    if (!host) {
      setAutoMaterialModes({});
      invalidateCostCache();
    }
  } catch (e) {
    value = 0;
  }
  itemCostMemo[recipe] = {
    at: Date.now(),
    value
  };
  return value;
}
function costLineHtml(coins) {
  return `<span class="rc-bc-cost">${flowerHtml(coinsToFlower(coins * skillValue(SKILLS.lean, 1)))}</span>`;
}
function checkHtml(on) {
  return `<input type="checkbox" tabindex="-1" aria-hidden="true" disabled${on ? " checked" : ""}>`;
}
function recipeCellsHtml() {
  const current = activeRecipe();
  return RECIPE_ORDER.map((id) => {
    const on = current === id;
    const r = RECIPES[id];
    return `<div class="rc-crop rc-bc guro-frame${on ? " is-on" : ""}" data-rc-recipe="${id}" role="button" tabindex="0" aria-pressed="${on ? "true" : "false"}"><span class="rc-crop-icon">${getIcon(r.icon)}</span><span class="rc-crop-name">${esc(r.label)}${costLineHtml(recipeBaseCost(id))}</span>${checkHtml(on)}</div>`;
  }).join("");
}
function cropCellsHtml() {
  const current = activeCrop();
  return Object.keys(MUD_CROPS).map((name) => {
    const on = current === name;
    return `<div class="rc-crop rc-bc guro-frame${on ? " is-on" : ""}" data-rc-crop="${esc(name)}" role="button" tabindex="0" aria-pressed="${on ? "true" : "false"}"><span class="rc-crop-icon">${getIcon(name)}</span><span class="rc-crop-name">${esc(name)} \xD7${MUD_CROPS[name]}${costLineHtml(MUD_CROPS[name] * matUnit(resKey("Mud"), name))}</span>${checkHtml(on)}</div>`;
  }).join("");
}
function pickerHtml() {
  refreshAutoModes();
  const mud = activeRecipe() === "Mud";
  const cropBlock = mud ? `<div class="rc-comp-sub">Mud Mix Crop (one per batch)</div><div class="rc-crops" id="rcMudCrops">${cropCellsHtml()}</div><div class="rc-note">${state.cropManual ? "Crop picked by you. Tap it again to go back to the cheapest." : "The cheapest crop is selected automatically. Tap a crop to choose it yourself."}</div>` : "";
  const note = state.recipeManual ? "Mix picked by you. Tap it again to go back to the cheapest." : "The cheapest mix is selected automatically. Tap a mix to choose it yourself.";
  return `<section class="rc-block guro-frame" aria-label="Beetle Calculator">
    <div class="rc-block-title">Beetle Calculator</div>
    <div class="rc-crops" id="rcRecipes">${recipeCellsHtml()}</div>
    <div class="rc-note">${note}</div>
    ${cropBlock}
  </section>`;
}
function tilesHtml(r) {
  const good = r.net >= 0;
  const shown = r.items.filter((it) => it.qty > 0);
  const cells = shown.map((it) => `<div class="rc-tile rc-bc-tile guro-frame ${good ? "is-profit" : "is-loss"}"><span class="rc-tile-icon">${getIcon(it.name)}</span><span class="rc-tile-yield">${signed(it.qty * r.scale, n2)}</span><span class="rc-tile-net">${fl(it.gross * r.scale)}${FLOWER_ICON}</span>${it.kind === "beetle" ? `<span class="rc-tile-xp">${n2(it.xp * r.scale)} XP</span>` : ""}</div>`).join("");
  return `<div class="rc-tiles-wrap guro-frame"><div class="rc-tiles">${cells}</div></div>`;
}
function valueBoxHtml(label, html, extra) {
  return `<div class="rc-val guro-frame${extra ? " " + extra : ""}"><span class="rc-val-label">${label}</span><span class="rc-val-num">${html}</span></div>`;
}
function netBoxHtml(label, net, extra) {
  return valueBoxHtml(label, `<span class="${net >= 0 ? "is-profit" : "is-loss"}">${signed(net, fl)}${FLOWER_ICON}</span>`, extra);
}
function valuesHtml(r) {
  const feeBox = r.feeRate > 0 ? valueBoxHtml("Market Fee", flowerHtml(r.fee)) : "";
  return `<div class="rc-values">
    ${valueBoxHtml("Beetles (average)", `${signed(r.beetles, n2)}${getIcon("Green Beetle")}`, "rc-val-wide")}
    ${valueBoxHtml("Gross", flowerHtml(r.gross))}
    ${valueBoxHtml("Cost", flowerHtml(r.cost))}
    ${valueBoxHtml("Ingredient Cost", flowerHtml(r.ingCost))}
    ${valueBoxHtml("Shovel Cost", flowerHtml(r.shovelCost))}
    ${valueBoxHtml("Restock Cost", flowerHtml(r.restockCost))}
    ${valueBoxHtml("Sand Shovels", `${n2(r.shovelsTotal)}${getIcon("Sand Shovel")}`)}
    ${feeBox}
  </div>
  <div class="rc-net-row">
    ${netBoxHtml("Net", r.net, "rc-val-net")}
    <button type="button" class="rc-linktext" data-rc-open="computation">Computation</button>
  </div>`;
}
function modeNoteHtml(r) {
  const digText = r.full ? "Every one of the 25 tiles is dug, so you also collect every Mushroom and Mud tile." : r.manualShovels ? `You use ${n2(r.manualShovels)} shovel${r.manualShovels === 1 ? "" : "s"} per batch (the number you typed, so Sturdy Shovel is already counted) until the last Beetle is found.` : "You stop digging once the last Beetle is found (the game then lets you start a new batch). The estimate assumes tiles are dug in random order; type your own shovel count in the box to override it.";
  const viewText = r.view === "day" ? `Per Day: ${n2(r.bins)} Myco Bin${r.bins === 1 ? "" : "s"} \xD7 ${n2(r.perDay)} batches per day (${formatDuration(r.batchSec)} each).` : `Per Batch: one batch in each of your ${n2(r.bins)} Myco Bin${r.bins === 1 ? "" : "s"}.`;
  return `<div class="rc-details-row"><button type="button" class="rc-linktext" data-rc-details aria-expanded="${detailsOpen ? "true" : "false"}">Details</button></div>${detailsOpen ? `<div class="rc-note">${viewText} ${digText} Each batch grows for 12h (shortened only by Rapid Mycelium). Wild Mushroom has a 90% chance per Mushroom tile, Magic Mushroom 10%.</div>` : ""}`;
}
function resultsHtml() {
  const r = compute();
  const viewBtn = (m) => `<button type="button" class="rc-mode guro-frame${state.view === m.id ? " is-on" : ""}" data-rc-view="${m.id}" aria-pressed="${state.view === m.id ? "true" : "false"}">${m.label}</button>`;
  const digBtn = (m) => {
    const on = state.dig === m.id;
    if (m.id !== "find") return `<button type="button" class="rc-mode guro-frame${on ? " is-on" : ""}" data-rc-dig="${m.id}" aria-pressed="${on ? "true" : "false"}">${m.label}</button>`;
    return `<div class="rc-mode rc-dig-cell guro-frame${on ? " is-on" : ""}" data-rc-dig="${m.id}" role="button" tabindex="0" aria-pressed="${on ? "true" : "false"}"><span>${m.label}</span><input type="number" min="0" max="${PATCH_TILES}" step="1" inputmode="numeric" class="rc-dig-input guro-frame" value="${state.digs > 0 ? state.digs : ""}" placeholder="~${n2(r.estShovels)}" aria-label="Shovels used until all Beetles are found"></div>`;
  };
  return `<section class="rc-block guro-frame" aria-label="Beetle results">
    <div class="rc-modes" role="group" aria-label="Calculation mode">${VIEW_MODES.map(viewBtn).join("")}</div>
    <div class="rc-modes" role="group" aria-label="Digging mode">${DIG_MODES.map(digBtn).join("")}</div>
    <div class="rc-tools rc-tools-two">
      <button type="button" class="rc-tool guro-frame" data-rc-open="skills">Skills</button>
      <button type="button" class="rc-tool guro-frame" data-rc-open="bins">Myco Bins</button>
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
function matRowsHtml(list) {
  const btn = (m, mode, label) => `<button type="button" class="es-mode-btn es-toolcfg-tbtn${m.mode === mode ? " active" : ""}" data-rc-res="${esc(m.res)}" data-rc-mat="${esc(m.name)}" data-rc-matmode="${mode}">${label}</button>`;
  return list.map((m) => {
    const unit = m.mode === "buy" ? flowerHtml(coinsToFlower(m.unitCost)) : `${fl(m.unitCost)}${COIN_ICON}`;
    return `<div class="rc-tool-mat"><span class="rc-tool-mat-item"><span class="rc-tool-mat-qty">${n2(m.qty)}</span>${getIcon(m.name)}<span class="rc-kv-sub">${m.mode === "buy" ? "market" : "collect"} @ ${unit}/u</span></span><span class="es-toolcfg-tog rc-bc-tog">${btn(m, "collect", "Collect")}${btn(m, "buy", "Buy")}</span></div>`;
  }).join("");
}
function appliedSkillsHtml(r) {
  const rows = [];
  const add = (def, text) => {
    if (level(def)) rows.push(`<div class="rc-boost-row">${getBoostIconAnyFallback(def.name)}<span class="rc-boost-name">${esc(def.name)} ${level(def)}</span><span class="rc-boost-eff">${esc(text)}</span></div>`);
  };
  add(SKILLS.lean, `\xD7${r.lean} ingredients`);
  add(SKILLS.rapid, `\xD7${r.rapid} grow time`);
  add(SKILLS.bloom, `+${skillValue(SKILLS.bloom, 0)} Mushroom tiles`);
  if (r.recipeId === "Beetle") add(SKILLS.nest, `+${skillValue(SKILLS.nest, 0)} Beetle tiles`);
  add(SKILLS.muddy, `+${pct(r.muddy * 100)} Mud`);
  add(SKILLS.fungal, `+${r.fungal} Mushrooms per tile`);
  add(SKILLS.shovel, `${pct(r.keep * 100)} keep shovel`);
  add(SKILLS.rare, `Odds ${r.weights.join("/")}`);
  add(SKILLS.twin, `${pct(r.twin * 100)} extra Beetle`);
  r.mushroomBoosts.forEach((b) => rows.push(`<div class="rc-boost-row">${getBoostIconAnyFallback(b.name)}<span class="rc-boost-name">${esc(b.name)}</span><span class="rc-boost-eff">${esc(b.value)}</span></div>`));
  return `<div class="rc-group"><div class="rc-comp-sub">Applied Skills & Boosts</div>${rows.length ? rows.join("") : `<div class="rc-boost-none">No skill applied</div>`}</div>`;
}
function itemRowsHtml(r) {
  return r.items.filter((it) => it.qty > 0).map((it) => {
    const each = it.kind === "beetle" ? BEETLE_FEED_XP[BEETLE_XP_KEY[it.name]] || 0 : 0;
    const unitNet = it.price * (1 - r.feeRate) - r.costPerBeetle;
    const xpEach = it.kind === "beetle" ? `<span class="rc-kv-sub rc-yield-xp">${n2(each)} XP each</span>` : "";
    const costNet = it.kind === "beetle" ? `<span class="rc-kv-sub rc-yield-line">Cost ${flowerHtml(r.costPerBeetle)}/u \xB7 Net <span class="${unitNet >= 0 ? "is-profit" : "is-loss"}">${signed(unitNet, fl)}${FLOWER_ICON}</span>/u</span>` : "";
    return `<div class="rc-tool-mat rc-yield-row"><span class="rc-tool-mat-item"><strong class="rc-tool-mat-qty">${signed(it.qty * r.scale, n2)}</strong>${getIcon(it.name)}${xpEach}</span><strong class="rc-kv-sub rc-yield-gross">${flowerHtml(it.gross * r.scale)}</strong><span class="rc-kv-sub rc-yield-line">Market Price ${flowerHtml(it.price > 0 ? it.price : 0)}/u</span>${costNet}</div>`;
  }).join("");
}
function computationCardHtml(r) {
  const modeLabel = r.view === "day" ? "Per Day" : "Per Batch";
  return `<article class="rc-comp-card guro-frame">
    <header class="rc-comp-head"><span class="rc-comp-icon">${getIcon(r.rec.icon)}</span><span class="rc-comp-name">${esc(r.rec.label)}${r.recipeId === "Mud" ? " \xB7 " + esc(r.crop) : ""}</span><span class="rc-comp-nodes">${n2(r.bins)} Bin${r.bins === 1 ? "" : "s"}</span></header>
    <div class="rc-group"><div class="rc-comp-sub">Patch (per Myco Bin)</div><div class="rc-kv-grid">
      ${kv("Grow Time", esc(formatDuration(r.batchSec)), "rc-kv-wide")}
      ${kv("Batches / Day / Bin", n2(r.perDay))}
      ${kv("Mushroom Tiles", n2(r.tiles.mushroom))}
      ${kv("Beetle Tiles", n2(r.tiles.beetle))}
      ${kv("Mud Tiles", n2(r.tiles.mud))}
      ${kv("Tiles Dug (avg)", String(Math.round(r.dugTiles)))}
      ${kv("Shovels / Batch", n2(r.shovels))}
      ${kv("Shovel Stock / Restock", n2(r.stockQty))}
      ${kv("Beetles / Batch", n2(r.beetleBin))}
      ${kv("Beetle Odds", esc(r.weights.map((w) => w + "%").join(" / ")), "rc-kv-wide")}
    </div></div>
    <div class="rc-group"><div class="rc-comp-sub">Yield (${modeLabel})</div>${itemRowsHtml(r)}
      <div class="rc-kv-grid">
        ${kv("Gross", flowerSigned(r.gross))}
        ${kv("Cost", flowerHtml(r.cost))}
        ${kv("Ingredient Cost", flowerHtml(r.ingCost))}
        ${kv("Shovel Cost", flowerHtml(r.shovelCost))}
        ${kv("Restock Cost", flowerHtml(r.restockCost))}
        ${kv("Cost / Beetle", flowerHtml(r.costPerBeetle))}
        ${r.feeRate > 0 ? kv("Market Fee", flowerHtml(r.fee)) : ""}
        ${kv("Net", `<span class="${r.net >= 0 ? "is-profit" : "is-loss"}">${signed(r.net, fl)}${FLOWER_ICON}</span>`, "rc-kv-wide rc-kv-net")}
        ${kv("Net / Batch / Bin", `<span class="${r.netBin >= 0 ? "is-profit" : "is-loss"}">${signed(r.netBin, fl)}${FLOWER_ICON}</span>`)}
        ${kv("Shovel Cost / Batch", flowerHtml(r.binShovelCost))}
        ${kv("Restock Cost / Batch", flowerHtml(r.binRestockCost))}
        ${kv("Ingredients / Batch", flowerHtml(r.binIngCost))}
      </div>
    </div>
    ${appliedSkillsHtml(r)}
    <div class="rc-group"><div class="rc-comp-sub">${esc(r.rec.label)} Ingredients (per batch)</div>
      <div class="rc-tool-cfg">${matRowsHtml(r.ingredients)}</div></div>
    <div class="rc-group"><div class="rc-comp-sub">Tools</div>
      <div class="rc-tool-cfg">
        <div class="rc-tool-mat"><span class="rc-tool-mat-item">${getIcon("Sand Shovel")}<strong class="rc-tool-mat-name">Sand Shovel</strong></span></div>
        <div class="rc-tool-mat"><span class="rc-tool-mat-item"><strong class="rc-tool-mat-qty">${n2(SHOVEL_COINS)}</strong>${COIN_ICON}</span></div>
        ${matRowsHtml(r.toolMats)}
      </div>
      <div class="rc-comp-sub">Shovel Used</div>
      <div class="rc-tool-cfg"><div class="rc-tool-mat"><span class="rc-tool-mat-item"><strong class="rc-tool-mat-qty">${signed(-r.shovelsTotal, n2)}</strong>${getIcon("Sand Shovel")}<strong class="rc-tool-mat-name">Sand Shovel</strong></span></div></div></div>
  </article>`;
}
function computationBodyHtml() {
  return computationCardHtml(compute());
}
function binsBodyHtml() {
  const synced = syncedBins();
  const value = binsDraft == null ? effectiveBins() : binsDraft;
  return `<div class="rc-pop-hint">Enter how many Myco Bins you have (1 to ${MAX_BINS}), then press Save.${synced ? ` Your synced farm has ${synced}.` : ""}</div>
  <label class="rc-node-row guro-frame"><span class="rc-node-icon">${getIcon("Mud")}</span><span class="rc-node-text"><span class="rc-node-name">Myco Bins</span><span class="rc-node-used">Each bin grows one patch of 25 tiles</span></span><input type="number" min="1" max="${MAX_BINS}" step="1" inputmode="numeric" id="rcBinsInput" value="${value ? value : ""}" placeholder="1"></label>`;
}
function popupTitle() {
  if (popup === "skills") return "Cave Skills";
  if (popup === "bins") return "Myco Bins";
  return "Computation";
}
function popupBodyHtml() {
  if (popup === "bins") return binsBodyHtml();
  if (popup === "computation") return computationBodyHtml();
  return `<div class="rc-pop-hint">Cave skills from the Skill Tree. Changes here also change the Skill Tree. Press Save to apply them.</div><div id="rcSkillSlot"></div>`;
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
    if (next && next.parentNode === parent) parent.insertBefore(el, next);
    else parent.appendChild(el);
  });
}
function releaseBorrowed() {
  while (restoreFns.length) restoreFns.pop()();
}
function setupBorrowed() {
  if (popup === "skills") {
    savedSkillCategory = skillCategory;
    setSkillCategory("cave");
    borrow("ascensionBar", "rcAscSlot");
    borrow("skillListWrap", "rcSkillSlot");
    borrow("skillSaveBar", "rcSaveSlot");
    renderSkillPanel();
    renderAscensionBar();
    updateSkillSaveBarState();
  }
}
function teardownBorrowed() {
  releaseBorrowed();
  if (savedSkillCategory != null) {
    setSkillCategory(savedSkillCategory);
    savedSkillCategory = null;
    renderSkillPanel();
  }
}
function footerHtml() {
  if (popup === "bins") return `<button type="button" class="rc-save guro-frame" id="rcBinsSave">Save Changes</button>`;
  if (popup === "skills") return `<div id="rcSaveSlot"></div>`;
  return "";
}
function overlayHtml() {
  return `<div class="rc-pop guro-frame${popup === "computation" ? " rc-pop-comp" : ""}" role="dialog" aria-modal="true" aria-label="${popupTitle()}">
    <div class="rc-pop-head"><span class="rc-pop-title">${popupTitle()}</span><button type="button" class="rc-pop-close" data-rc-close aria-label="Close">\u2715</button></div>
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
}
function isPopupDirty() {
  if (popup === "skills") return isSkillDraftDirty() || isBoostDraftDirty();
  if (popup === "bins") return binsDraft != null && Number(binsDraft) !== effectiveBins();
  return false;
}
function openPopup(kind) {
  if (popup) return;
  popup = kind;
  binsDraft = null;
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
  binsDraft = null;
  document.body.classList.remove("rc-no-scroll");
}
function showPrompt(message, buttons) {
  if (promptEl) promptEl.remove();
  promptEl = document.createElement("div");
  promptEl.className = "rc-overlay rc-overlay-top";
  promptEl.innerHTML = `<div class="rc-prompt guro-frame" role="alertdialog" aria-modal="true"><p class="rc-prompt-text">${esc(message)}</p><div class="rc-prompt-actions">${buttons.map((b, i) => `<button type="button" class="rc-prompt-btn guro-frame" data-rc-prompt="${i}">${esc(b.label)}</button>`).join("")}</div></div>`;
  promptEl.addEventListener("click", (e) => {
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
    showPrompt("You have unsaved changes. Save them first, or discard them to close.", [{
      label: "Keep Editing"
    }, {
      label: "Discard",
      run: () => {
        discardSkillBoostDrafts();
        destroyPopup();
        refreshResults();
      }
    }]);
    return;
  }
  const wasComputation = popup === "computation";
  destroyPopup();
  if (!wasComputation) refreshResults();
}
function saveBins() {
  const raw = binsDraft == null ? effectiveBins() : binsDraft;
  const v = Math.min(MAX_BINS, Math.max(1, Math.floor(Number(raw) || 1)));
  state.bins = v;
  saveState();
  binsDraft = null;
  toast("\u2705 Myco Bins saved");
  renderOverlayBody();
  refreshResults();
}
function activate(el) {
  const recipe = el.getAttribute("data-rc-recipe");
  if (recipe) {
    if (state.recipeManual && state.recipe === recipe) {
      state.recipeManual = false;
    } else {
      state.recipe = recipe;
      state.recipeManual = true;
    }
    saveState();
    render();
    return true;
  }
  const crop = el.getAttribute("data-rc-crop");
  if (crop) {
    if (state.cropManual && state.crop === crop) {
      state.cropManual = false;
    } else {
      state.crop = crop;
      state.cropManual = true;
    }
    saveState();
    render();
    return true;
  }
  return false;
}
function refreshValues() {
  if (!host) return;
  const el = host.querySelector("#rcResults");
  if (!el) return;
  const r = compute();
  el.innerHTML = tilesHtml(r) + valuesHtml(r);
}
function onClick(e) {
  const details = e.target.closest("[data-rc-details]");
  if (details) {
    detailsOpen = !detailsOpen;
    refreshResults();
    return;
  }
  if (e.target.closest(".rc-dig-input")) {
    if (state.dig !== "find") {
      state.dig = "find";
      saveState();
      refreshResults();
      const input = host.querySelector(".rc-dig-input");
      if (input) input.focus();
    }
    return;
  }
  const cell = e.target.closest("[data-rc-recipe], [data-rc-crop]");
  if (cell && activate(cell)) return;
  const view = e.target.closest("[data-rc-view]");
  if (view) {
    state.view = view.getAttribute("data-rc-view");
    saveState();
    refreshResults();
    return;
  }
  const dig = e.target.closest("[data-rc-dig]");
  if (dig) {
    state.dig = dig.getAttribute("data-rc-dig");
    saveState();
    refreshResults();
    return;
  }
  const open = e.target.closest("[data-rc-open]");
  if (open && !open.disabled) openPopup(open.getAttribute("data-rc-open"));
}
function onHostKey(e) {
  if (e.key !== "Enter" && e.key !== " ") return;
  const cell = e.target.closest && e.target.closest("[data-rc-recipe], [data-rc-crop]");
  if (!cell) return;
  e.preventDefault();
  activate(cell);
}
function onDocClick(e) {
  if (!overlayEl) return;
  if (promptEl && promptEl.contains(e.target)) return;
  if (e.target === overlayEl || e.target.closest("[data-rc-close]")) {
    closePopup(false);
    return;
  }
  if (!overlayEl.contains(e.target)) return;
  if (e.target.closest("#rcBinsSave")) {
    saveBins();
    return;
  }
  const matBtn = e.target.closest("[data-rc-mat]");
  if (matBtn && popup === "computation") {
    setMaterialMode(matBtn.getAttribute("data-rc-res"), matBtn.getAttribute("data-rc-mat"), matBtn.getAttribute("data-rc-matmode"));
    invalidateCostCache();
    renderOverlayBody();
    refreshResults();
  }
}
function onDocInput(e) {
  if (e.target && e.target.classList && e.target.classList.contains("rc-dig-input")) {
    const v = Math.floor(Number(e.target.value));
    state.digs = isFinite(v) && v > 0 ? Math.min(v, PATCH_TILES) : 0;
    state.dig = "find";
    saveState();
    refreshValues();
    return;
  }
  if (e.target && e.target.id === "rcBinsInput") binsDraft = e.target.value === "" ? 0 : Number(e.target.value);
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
function onExternalChange() {
  unitCostMemoAt = 0;
  if (!host) return;
  invalidateCostCache();
  refreshResults();
}
function mountBeetlesCalculator(root) {
  host = root;
  loadBaseCropsIfNeeded();
  invalidateCostCache();
  state = loadState();
  detailsOpen = false;
  host.addEventListener("click", onClick);
  host.addEventListener("keydown", onHostKey);
  document.addEventListener("click", onDocClick);
  document.addEventListener("input", onDocInput);
  document.addEventListener("keydown", onKey);
  window.addEventListener("guroBoostsChanged", onExternalChange);
  window.addEventListener("guroGemPackChanged", onExternalChange);
  window.addEventListener("guroPricesUpdated", onExternalChange);
  listening = true;
  render();
}
function unmountBeetlesCalculator() {
  invalidateCostCache();
  setAutoMaterialModes({});
  invalidateCostCache();
  if (popup) destroyPopup();
  if (promptEl) {
    promptEl.remove();
    promptEl = null;
  }
  if (host) {
    host.removeEventListener("click", onClick);
    host.removeEventListener("keydown", onHostKey);
    host.innerHTML = "";
  }
  if (listening) {
    document.removeEventListener("click", onDocClick);
    document.removeEventListener("input", onDocInput);
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("guroBoostsChanged", onExternalChange);
    window.removeEventListener("guroGemPackChanged", onExternalChange);
    window.removeEventListener("guroPricesUpdated", onExternalChange);
    listening = false;
  }
  host = null;
}
function beetlesCalculatorCanLeave() {
  if (!popup) return true;
  if (isPopupDirty()) {
    toast("\u26A0\uFE0F Save your changes first");
    return false;
  }
  destroyPopup();
  return true;
}

export {
  normalizeSeason,
  restockShareCount,
  restockSeedIconsHtml,
  toolRestockShareCount,
  toolRestockIconsHtml,
  mycoItemUnitCostFlower,
  mountBeetlesCalculator,
  unmountBeetlesCalculator,
  beetlesCalculatorCanLeave
};
