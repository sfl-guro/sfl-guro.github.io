import { withAnimalFeedContext, ANIMAL_FEED_CHOICES, ICONS, NPC_ICONS, ALL_ANIMAL_PRODUCTS, ANIMAL_BASE_CYCLE_SEC, ANIMAL_DATA, ANIMAL_XP_THRESHOLDS, ANIMAL_PRODUCT_LOOKUP, ASCENSION_RANK_DATA, BAIT_RECIPES, BASE_CROPS, BASE_FRUITS, BASE_GREENHOUSE, BASE_STOCK_TOOLS, BEE_SWARM_ICON, BOOSTS, CALENDAR_SEASONAL_BOOSTS, COIN_ICON, COOKING_BUILDINGS, COOKING_BUILDING_ICONS, COOKING_CAKE_DISHES, COOKING_FOOD_IMAGES, COOKING_RECIPES, CRIMSTONE_KNOWN_IDS, CROPS_GLOBAL_EXCLUDED_FROM_GREENHOUSE, CROP_AOE_RANKS, CROP_HARVEST_SEC, CROP_KNOWN_IDS, CROP_PRNG_EXCLUDE, FARM_LEVEL_NODES, FARM_PANEL_SCROLL_IDLE_MS, FEED_LABELS, FERMENTATION_BAIT_FAMILIES, FERMENTATION_SPICE_KNOWN_IDS, FERMENTATION_STATIC_RECIPES, FISH_AGING_KNOWN_IDS, FISH_SALT_DATA, FLOWER_ICON, FLOWER_SEEDS, FLOWER_VARIETIES, FOOD_KNOWN_IDS, FRUIT_KNOWN_IDS, FRUIT_PRNG_EXCLUDE, GAMESTATE_SECTION_KEYS, GEM_ICON, GOLD_KNOWN_IDS, IMAGE_ICONS, IRON_KNOWN_IDS, MUTANT_TYPE_EMOJI, OIL_BONUS_DROP_AMOUNT, OIL_SINGLE_HARVEST_BASE, PATCH_FRUIT_ONLY_GLOBAL_BOOSTS_EXCLUDED_FROM_GREENHOUSE, RCM_GREENHOUSE_ICON_HTML, REQUIRED_FOOD_QTY_MAP, RESOURCE_DATA, RESOURCE_NODE_TIERS, SALT_BASE_CHARGE_CAP, SALT_BASE_TIME_SEC, SALT_BASE_YIELD, SALT_KNOWN_ID, SPICE_RECIPES, SPICE_STATIC_RECIPES, STONE_KNOWN_IDS, SYNODIC_MONTH_DAYS, TREE_KNOWN_IDS, __farmPanelSaveGameStateHandle, __gameStateSectionLenSigs, __set___farmPanelSaveGameStateHandle, __set___gameStateSectionLenSigs, allResourceBudBoostEntries, applyFarmBoostsOnly, applyFarmSkillsOnly, coinPerFlower, coinsToFlower, computeAgedFishFigures, computeAnimalFeedFigures, computeAnimalRealProgress, computeAnimalTypeFigures, computeAnimalYieldsForLevel, computeBoostedCropStats, computeBoostedStock, computeBoostedFlowerVarietyStats, computeBoostedFruitStats, computeBoostedGreenhouseStats, computeBoostedLavaPitStats, computeBoostedResourceStats, computeComposterFigures, composterRollWorms, BASE_COMPOSTERS, previewSeason, computeDestroyedCropPlotIds, computeHiveStats, computeHoneyRestockBreakdown, computeQtyRestockGems, computeSpiceFigures, currentSeason, escapeHtml, farmIdPromptStartSync, farmSyncExtractBudTraits, farmSyncExtractGameState, farmSyncExtractPetTraits, farmSyncFindBagByNameHeuristic, farmSyncGetAnimalRecords, farmSyncGetCoords, farmSyncGetPetRecords, farmSyncPickActivePlacedInstances, feePercent, fmt, fmtAnimal, fmtAnimalCost, fullMoonSeedStockQty, getActiveAnimalBoosts, getActiveBoostsForHive, getActiveFeedInfo, getActiveSaltRechargeMult, getActiveSaltYieldBonus, getActiveSeasonGuardianName, getAnimalLevelFromXp, animalProduceMarkCount, animalNextClaimLevel, getAscensionRank, getBeeSwarmPerSwarmYield, getCurrentChapterMutantSet, getCurrentChapterName, getEffectiveYieldAdd, getNodeIconHtml, getNodeLabel, getPowerHourWindow, getSpiceLickDurationHarvests, getTruffleSeasoningSleeps, getSpiceEffectForAnimalType, isBoostActive, isCropInSeason, isOvernightGroundCrop, isSkillActive, onDeferredInitialRenderDone, parseYieldBoostAmount, resourceBuds, saltSculptureLevel, sculptureEffects, sflPrngChance, syncCookingCountsFromInventory, withBoostEvalAt } from "./calculator.js";

import { CONFIRM_ICON } from "./confirm_icon.js";

import { computeHiveSchedule, makeFlowerReadyResolver, HIVE_FULL_RAW } from "./hive_schedule.js";

import { findLivePriceForName, SFL_COMMUNITY_PROXY_BASE, SFL_NFT_PRICE_API, SFL_PROXY_BASE, computeRestockCost24h, cookingCostMode, cookingIngredientUnitCostCoins, fishSaltCostFlower, getActiveShrineDailyCostStable, getItemCostByName, getRestockGemCost, restocksForMode, getSpiceCostPerUseFlower, hasFreeSaltRakeCost, honeyCostFlowerForSpiceRack, marketItems, pickledVegCost, refinedSaltUnitCostFlower, saltCostFlowerForSpiceRack } from "./prices.js";

import { getPumpkinPeteQuest } from "./pete_quests.js";

import { farmPanelComputeFloatingIslandCard, farmPanelRenderFloatingIslandCard, floatingIslandClock, floatingIslandMiniIconHtml } from "./floating_island.js";
import { caveBuriedCounts } from "./cave_solver.js";

import { POWER_SKILL_DEFS, farmPanelComputePowerSkillCards, farmPanelRenderPowerSkillCard } from "./power_skills.js";

import { $, hiveClockText, cookFoodIcon, getBoostIcon, getIcon, renderAnimalCardProductDetailRow, renderAnimalYieldGroupsList, renderBeehiveListHtml, renderCardProductDetailRow, renderCostNetInfoTrigger, renderCrimstoneInstantMineBoostHtml, renderCrimstoneNodeYieldList, renderFarmPanelTabContent, renderFruitHarvestsLeftHtml, renderGoldInstantMineBoostHtml, renderNodeTierYieldList, renderOilNodeYieldList, renderPlantYieldNodeList, renderSaltNodeYieldList, renderSeaBlessedBoostHtml, renderTotalsBreakdown, renderTurnaroundBoostHtml } from "./ui.js";
import { potionTrackFromState, digStreakTrackFromState, farmSyncHasVipBeetleBonus, VIP_BEETLE_BONUS_CHANCE } from "./calculator.js";

import { caveTrackFromState } from "./cave_track.js";

import { farmPanelComputeCaveMerchantCard, farmPanelRenderCaveMerchantCard, caveMerchantMiniIconHtml, caveMerchantClock } from "./cave_merchant_card.js";

import { farmPanelComputeMushroomCards, farmPanelRenderMushroomCard } from "./mushroom_card.js";

import { farmPanelComputeSkillResetCard, farmPanelRenderSkillResetCard, SKILL_RESET_NAME } from "./skill_reset.js";

import { foldClock, foldStamp } from "./fold_clock.js";

import { farmPanelComputeFishingCard, farmPanelRenderFishingCard, fishingMiniIconHtml, fishTrackFromState } from "./fishing_card.js";
import { dailyHarvestTrack, dailyHarvestBadgeHtml, dailyHarvestSetYield, dailyHarvestSetResolver, dailyHarvestSetAnimalYieldProvider, dailyHarvestSetCookingProvider, dailyHarvestSetMachineProvider, dailyHarvestSetIconProvider, dailyHarvestSetToolProvider, dailyHarvestSetPriceProvider, dailyHarvestNodeToolMult } from "./daily_harvest.js";

import { harvestLogArm } from "./harvest_log.js";

import { resolveCropMachine, cropMachineFuelAt, cropMachineWindows, effectiveSpeedAt, cropPlotWindows, cropFertiliserWindows, fruitWindows, turbofruitWindows, greenhouseWindows, greenhouseGlowWindows, flowerWindows, treeWindows, mineWindows, oilWindows, animalWindows, cookingWindows, computeReadyAt, growDurationMsFor, resolveCookingQueue, placementsOf, collectibleExpiry, BOOST_EXPIRY_MS } from "./speed_windows.js";

import { craftedToolsTrack } from "./crafted_tools.js";

export function farmPanelDetectNodeTier(resourceName, node) {
  const tiers = RESOURCE_NODE_TIERS[resourceName];
  if (!tiers) return null;
  const rawLabel = node && (node.name || node.sftType || node.type) || null;
  const norm = rawLabel ? String(rawLabel).trim().toLowerCase() : null;
  const match = norm ? tiers.find(t => t.label.toLowerCase() === norm) : null;
  return match || tiers.find(t => t.key === "base");
}

function farmPanelGetSaltActiveBoosts() {
  return BOOSTS.filter(b => isBoostActive(b.id) && b.category === "salt" && b.scope === "saltGlobal").map(b => ({
    name: b.name,
    yieldAdd: b.saltYieldAdd || 0,
    timeMult: b.saltRechargeTimeMult || undefined,
    freeCost: b.freeCost || undefined
  }));
}

function farmPanelGetHoneyActiveBoosts() {
  const active = typeof getActiveBoostsForHive === "function" ? getActiveBoostsForHive() : [];
  return active.map(b => ({
    name: b.name,
    yieldAdd: b.honeyYieldAdd || 0
  }));
}

const COOKING_PANEL_TAB_ICON_HTML = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAKCAYAAABi8KSDAAAAAXNSR0IArs4c6QAAAO9JREFUGJVtkbFqwlAUhr+bRTSkxSSFULKVgNCA4CBesQ+QRcjQVyiFFvoqjsW9jlWcfQDByU0QN5EMGimZ7GA63ZjE/tPhnO9wDv8vKMmxvVTV0X4t8jNRhkbtGtJPODdDHj6mhSWhwFG7BsCrafEZH5B+QqVjAnD/8kO0XwvNsb3067mVgU9vOtJPeA8faXzfcJrH7Ia3OLaXCsf20rvKiUFf0um5aMtx9uO5GaItxwSTKqv4lwxWGvQlAF1jQTCpAuDWTWab6Bq2dAO3bpZNYraJ0K66wPYY/9e+uAGgLli6UTiv7CuYng9EKR/MH0NNTSwXCPCyAAAAAElFTkSuQmCC" style="width:14px;height:13px;image-rendering:pixelated;vertical-align:middle;">';

export let farmPanelSyncInFlight = false;

export function farmPanelGetLastInfo() {
  return {
    id: localStorage.getItem("hl_farm_panel_id") || "",
    level: localStorage.getItem("hl_farm_panel_level") || "",
    experience: parseFloat(localStorage.getItem("hl_farm_panel_experience")) || 0,
    ascensionLevel: parseInt(localStorage.getItem("hl_farm_panel_ascension_level"), 10) || 0,
    time: parseFloat(localStorage.getItem("hl_farm_panel_time")) || 0,
    vipActive: localStorage.getItem("hl_farm_panel_vip_active") === "1",
    vipExpiresAt: parseFloat(localStorage.getItem("hl_farm_panel_vip_expires")) || null,
    vipLifetime: localStorage.getItem("hl_farm_panel_vip_lifetime") === "1",
    factionName: localStorage.getItem("hl_farm_panel_faction_name") || null,
    factionIsMember: localStorage.getItem("hl_farm_panel_faction_is_member") === "1",
    factionHasPetData: localStorage.getItem("hl_farm_panel_faction_has_pet") === "1",
    factionTotalXP: parseFloat(localStorage.getItem("hl_farm_panel_faction_total_xp")) || 0,
    factionGoalXP: parseFloat(localStorage.getItem("hl_farm_panel_faction_goal_xp")) || 0,
    factionStreak: parseInt(localStorage.getItem("hl_farm_panel_faction_streak"), 10) || 0,
    factionLastWeekStreak: parseInt(localStorage.getItem("hl_farm_panel_faction_last_week_streak"), 10) || 0,
    factionQualifiesForBoost: localStorage.getItem("hl_farm_panel_faction_qualifies_for_boost") === "1",
    factionIsContributing: localStorage.getItem("hl_farm_panel_faction_is_contributing") === "1"
  };
}

export function farmPanelSaveLastInfo(id, level, vipStatus, factionInfo, experience, ascensionLevel) {
  localStorage.setItem("hl_farm_panel_id", id);
  localStorage.setItem("hl_farm_panel_level", level != null ? String(level) : "");
  localStorage.setItem("hl_farm_panel_experience", experience != null ? String(experience) : "");
  localStorage.setItem("hl_farm_panel_ascension_level", ascensionLevel != null ? String(ascensionLevel) : "0");
  localStorage.setItem("hl_farm_panel_time", String(Date.now()));
  localStorage.setItem("hl_farm_panel_vip_active", vipStatus && vipStatus.active ? "1" : "0");
  localStorage.setItem("hl_farm_panel_vip_expires", vipStatus && vipStatus.expiresAt != null ? String(vipStatus.expiresAt) : "");
  localStorage.setItem("hl_farm_panel_vip_lifetime", vipStatus && vipStatus.lifetime ? "1" : "0");
  const fi = factionInfo || {};
  localStorage.setItem("hl_farm_panel_faction_name", fi.factionName || "");
  localStorage.setItem("hl_farm_panel_faction_is_member", fi.isMember ? "1" : "0");
  localStorage.setItem("hl_farm_panel_faction_has_pet", fi.hasPetData ? "1" : "0");
  localStorage.setItem("hl_farm_panel_faction_total_xp", String(fi.totalXP || 0));
  localStorage.setItem("hl_farm_panel_faction_goal_xp", String(fi.goalXP || 0));
  localStorage.setItem("hl_farm_panel_faction_streak", String(fi.streak || 0));
  localStorage.setItem("hl_farm_panel_faction_last_week_streak", String(fi.lastWeekStreak || 0));
  localStorage.setItem("hl_farm_panel_faction_qualifies_for_boost", fi.qualifiesForBoost ? "1" : "0");
  localStorage.setItem("hl_farm_panel_faction_is_contributing", fi.isContributingMember ? "1" : "0");
}

export let farmPanelGameState = null;

export let farmPanelStateIsCached = false;

let farmPanelHoneySnapshotMs = Date.now();

export let farmPanelTabContentDirty = false;

export let farmPanelActiveTab = "inprogress";

export let farmPanelExpandedNames = new Set;

let farmPanelAnimalFeedChoice = (() => {
  try {
    const raw = JSON.parse(localStorage.getItem("fp_animal_feed_choice") || "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch (e) {
    return {};
  }
})();

const FAVOURITE_FEED_KEY = "favourite";

export function setFarmPanelAnimalFeedChoice(type, key) {
  if (!ANIMAL_FEED_CHOICES[type]) return;
  if (key && (key === FAVOURITE_FEED_KEY || ANIMAL_FEED_CHOICES[type].indexOf(key) >= 0) && farmPanelAnimalFeedChoice[type] !== key) farmPanelAnimalFeedChoice[type] = key; else delete farmPanelAnimalFeedChoice[type];
  try {
    localStorage.setItem("fp_animal_feed_choice", JSON.stringify(farmPanelAnimalFeedChoice));
  } catch (e) {}
}

function farmPanelProjectAnimalXp(type, xpNow, progress) {
  const thresholds = ANIMAL_XP_THRESHOLDS[type];
  if (!thresholds || progress.isReadyState || !(progress.xpGap > 0) || !(progress.boostedFoodXp > 0)) return null;
  const feeds = progress.noOfFeeds;
  if (!(feeds > 0)) return null;
  const xp = Math.round((xpNow + (progress.expectedLoveXp || 0) + feeds * progress.boostedFoodXp) * 1e6) / 1e6;
  const level = getAnimalLevelFromXp(type, xp, true);
  const maxXp = thresholds[15];
  let threshold;
  if (level >= 15) {
    const cycle = maxXp - thresholds[14];
    threshold = maxXp + cycle * (Math.floor((xp - maxXp) / cycle + 1e-9) + 1);
  } else {
    threshold = thresholds[level + 1];
  }
  return {
    feeds: feeds,
    xp: xp,
    level: level,
    threshold: threshold,
    claims: Math.max(0, animalProduceMarkCount(type, xp) - animalProduceMarkCount(type, xpNow))
  };
}

function farmPanelAnimalFreeFeed(type) {
  return getActiveAnimalBoosts(type).some(b => b.freeFeed);
}

function farmPanelAnimalFeedIconsHtml(card) {
  const choices = ANIMAL_FEED_CHOICES[card.typeKey];
  if (!choices || farmPanelAnimalFreeFeed(card.typeKey)) return "";
  const chosen = farmPanelAnimalFeedChoice[card.typeKey] || "";
  const used = new Set((card.animalYieldGroups || []).map(a => a.feedKeyUsed));
  const keys = chosen && chosen !== FAVOURITE_FEED_KEY ? [ chosen ] : choices.filter(key => used.has(key));
  return keys.map(key => getIcon(FEED_LABELS[key] || key)).join("");
}

function farmPanelAnimalFeedPickerHtml(card) {
  const choices = ANIMAL_FEED_CHOICES[card.typeKey];
  if (!choices || farmPanelAnimalFreeFeed(card.typeKey)) return "";
  const chosen = farmPanelAnimalFeedChoice[card.typeKey] || "";
  const used = new Set((card.animalYieldGroups || []).map(a => a.feedKeyUsed));
  const favOn = chosen === FAVOURITE_FEED_KEY;
  const buttons = choices.map(key => {
    const on = chosen ? chosen === key : used.has(key);
    const label = FEED_LABELS[key] || key;
    return `<button type="button" class="fp-feed-btn guro-frame${on ? " is-on" : ""}" data-fp-feed="${key}" data-fp-feed-type="${card.typeKey}" aria-pressed="${on ? "true" : "false"}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">${getIcon(label)}</button>`;
  }).join("");
  const favButton = `<button type="button" class="fp-feed-btn fp-fav-btn guro-frame${favOn ? " is-on" : ""}" data-fp-feed="${FAVOURITE_FEED_KEY}" data-fp-feed-type="${card.typeKey}" aria-pressed="${favOn ? "true" : "false"}" aria-label="Favourite feed of each level" title="Use the favourite feed of each level">Favourite</button>`;
  return `<div class="fp-feed-pick"><span class="label">Select Feed to Use</span><div class="fp-feed-row">${buttons}${favButton}</div></div>`;
}

export let farmPanelInProgressCategoryFilter = "all";

const FARM_PANEL_HIDDEN_CARDS_KEY = "guro_growing_hidden_cards";

const FARM_PANEL_RESOURCE_CARDS = [ "Wood", "Stone", "Iron", "Gold", "Crimstone", "Oil", "Salt", "Sunstone" ];

const farmPanelCookingCards = () => [ ...COOKING_BUILDINGS, "Fish Market", "Aging Shed", "Fermentation Rack", "Spice Rack" ];

function farmPanelLoadHiddenCards() {
  try {
    const raw = JSON.parse(localStorage.getItem(FARM_PANEL_HIDDEN_CARDS_KEY) || "[]");
    const legacy = {
      "floating:floating": "pete:floating",
      "fishing:fishing": "pete:fishing",
      "crops:Wild Mushroom": "pete:Wild Mushroom",
      "crops:Magic Mushroom": "pete:Magic Mushroom"
    };
    return new Set(Array.isArray(raw) ? raw.filter(k => typeof k === "string").map(k => legacy[k] || k) : []);
  } catch (e) {
    return new Set;
  }
}

export let farmPanelHiddenCards = farmPanelLoadHiddenCards();

export function farmPanelCardCatalog() {
  const cats = farmPanelFilterCategories().filter(c => c.id !== "all");
  const cardsFor = id => {
    if (id === "crops") return Object.keys(BASE_CROPS).map(n => ({
      id: n,
      label: n,
      icon: getIcon(n)
    })).concat([ {
      id: "Crop Machine",
      label: "Crop Machine",
      icon: getIcon("Crop Machine")
    } ]);
    if (id === "fruits") return Object.keys(BASE_FRUITS).map(n => ({
      id: n,
      label: n,
      icon: getIcon(n)
    }));
    if (id === "greenhouse") return Object.keys(BASE_GREENHOUSE).map(n => ({
      id: n,
      label: n,
      icon: getIcon(n)
    }));
    if (id === "beehive") return [ "Honey", ...Object.keys(FLOWER_VARIETIES) ].map(n => ({
      id: n,
      label: n,
      icon: getIcon(n)
    }));
    if (id === "resources") return FARM_PANEL_RESOURCE_CARDS.map(n => ({
      id: n,
      label: getNodeLabel(n),
      icon: getNodeIconHtml(n)
    }));
    if (id === "animals") return Object.keys(ANIMAL_DATA).map(n => ({
      id: n,
      label: ANIMAL_DATA[n].label,
      icon: getIcon(ANIMAL_DATA[n].label)
    }));
    if (id === "composters") return FARM_PANEL_COMPOSTER_NAMES.map(n => ({
      id: n,
      label: n,
      icon: getIcon(n)
    }));
    if (id === "cooking") return farmPanelCookingCards().map(n => ({
      id: n,
      label: n,
      icon: COOKING_BUILDING_ICONS[n] || getIcon(n)
    }));
    if (id === "myco") return [ {
      id: "myco",
      label: "Myco Bins",
      icon: getIcon("Myco Bin")
    } ];
    return [ {
      id: "pete",
      label: "Pumpkin Pete Quest",
      icon: farmPanelPeteIconHtml()
    }, {
      id: "floating",
      label: "Floating Island",
      icon: floatingIslandMiniIconHtml(16)
    }, {
      id: "fishing",
      label: "Fishing",
      icon: fishingMiniIconHtml(16)
    }, {
      id: "caveMerchant",
      label: "Cave Merchant",
      icon: caveMerchantMiniIconHtml(16)
    }, {
      id: "Wild Mushroom",
      label: "Wild Mushroom",
      icon: getIcon("Wild Mushroom")
    }, {
      id: "Magic Mushroom",
      label: "Magic Mushroom",
      icon: getIcon("Magic Mushroom")
    }, {
      id: SKILL_RESET_NAME,
      label: SKILL_RESET_NAME,
      icon: getIcon("Green Thumb")
    } ].concat(POWER_SKILL_DEFS.map(d => ({
      id: d.name,
      label: d.name,
      icon: getIcon(d.name)
    })));
  };
  return cats.map(c => ({
    id: c.id,
    label: c.label,
    cards: cardsFor(c.id).map(card => ({
      key: `${c.id}:${card.id}`,
      label: card.label,
      icon: card.icon
    }))
  }));
}

export function farmPanelSetHiddenCards(keys) {
  farmPanelHiddenCards = new Set(keys || []);
  try {
    localStorage.setItem(FARM_PANEL_HIDDEN_CARDS_KEY, JSON.stringify([ ...farmPanelHiddenCards ]));
  } catch (e) {}
  if (!farmPanelCategoryVisible(farmPanelInProgressCategoryFilter)) farmPanelInProgressCategoryFilter = "all";
}

export function farmPanelCategoryVisible(id) {
  if (id === "all") return true;
  const group = farmPanelCardCatalog().find(g => g.id === id);
  if (!group) return true;
  return group.cards.some(c => !farmPanelHiddenCards.has(c.key));
}

export function farmPanelRowCardKey(row) {
  const cat = farmPanelRowFilterCategory(row);
  let id = row.name;
  if (row.isAnimalMerged) id = row.typeKey; else if (row.isComposterCard) id = row.composterName; else if (row.isCookingCard) id = row.cookingBuilding; else if (row.isCropMachineCard) id = "Crop Machine"; else if (row.isMushroomCard) id = row.name; else if (row.isMycoCard) id = "myco"; else if (row.isPeteQuestCard) id = "pete"; else if (row.isFloatingIslandCard) id = "floating"; else if (row.isFishingCard) id = "fishing"; else if (row.isCaveMerchantCard) id = "caveMerchant";
  return `${cat}:${id}`;
}

export function farmPanelRowVisible(row) {
  return !farmPanelHiddenCards.has(farmPanelRowCardKey(row));
}

let farmPanelRenderAtMs = 0;

let farmPanelUserScrolling = false;

let farmPanelScrollIdleTimer = null;

export function farmPanelMarkScrollActivity() {
  farmPanelUserScrolling = true;
  const wrap = $("farmPanelTabContent");
  if (wrap) wrap.classList.add("is-scrolling");
  if (farmPanelScrollIdleTimer) clearTimeout(farmPanelScrollIdleTimer);
  farmPanelScrollIdleTimer = setTimeout(() => {
    farmPanelUserScrolling = false;
    if (wrap) wrap.classList.remove("is-scrolling");
  }, FARM_PANEL_SCROLL_IDLE_MS);
}

export function farmPanelField(g, key) {
  if (!g) return null;
  if (g[key] != null) return g[key];
  if (g.land && g.land[key] != null) return g.land[key];
  return null;
}

export function farmPanelGrowTimeSec(name) {
  if (BASE_CROPS[name]) return BASE_CROPS[name].timeSec;
  if (BASE_FRUITS[name]) return BASE_FRUITS[name].timeSec;
  if (BASE_GREENHOUSE[name]) return BASE_GREENHOUSE[name].timeSec;
  if (RESOURCE_DATA[name]) return RESOURCE_DATA[name].timeSec;
  if (FLOWER_SEEDS[name]) return FLOWER_SEEDS[name].timeSec;
  if (FLOWER_VARIETIES[name]) return FLOWER_SEEDS[FLOWER_VARIETIES[name].seed].timeSec;
  return null;
}

function farmPanelFormatCountdown(sec) {
  if (sec <= 0) return "Ready now";
  sec = Math.floor(sec);
  const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (h > 0 || m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ") + " left";
}

export function farmPanelGetMarketPriceFlower(name) {
  const m = marketItems.find(x => (x.name || "").toLowerCase() === (name || "").toLowerCase());
  if (m && m.flowerPrice) return m.flowerPrice;
  if (BASE_CROPS[name] && BASE_CROPS[name].marketPrice) return BASE_CROPS[name].marketPrice;
  if (BASE_FRUITS[name] && BASE_FRUITS[name].marketPrice) return BASE_FRUITS[name].marketPrice;
  if (BASE_GREENHOUSE[name] && BASE_GREENHOUSE[name].marketPrice) return BASE_GREENHOUSE[name].marketPrice;
  return 0;
}

export function farmPanelGetCostPerUnitFlower(name) {
  const coins = getItemCostByName(name);
  return (coins || 0) / (coinPerFlower || 1);
}

function farmPanelGetBaseYield(name) {
  if (name === "Obsidian") return 1;
  if (BASE_CROPS[name]) return BASE_CROPS[name].baseYield || 1;
  if (BASE_FRUITS[name]) return BASE_FRUITS[name].yieldPerHarvest || 1;
  if (BASE_GREENHOUSE[name]) return BASE_GREENHOUSE[name].baseYield || 1;
  if (RESOURCE_DATA[name]) return RESOURCE_DATA[name].yieldPer || 1;
  return 1;
}

export function farmPanelGetBoostedYieldStats(name) {
  if (name === "Obsidian") return computeBoostedLavaPitStats(259200);
  if (name === "Salt") {
    const eff = sculptureEffects();
    return {
      yieldVal: SALT_BASE_YIELD + getActiveSaltYieldBonus(),
      timeVal: SALT_BASE_TIME_SEC * eff.chargeTimeMult * getActiveSaltRechargeMult(),
      activeBoosts: []
    };
  }
  if (BASE_CROPS[name]) {
    const d = BASE_CROPS[name];
    return computeBoostedCropStats(name, d.baseYield || 1, d.timeSec, undefined, undefined, true);
  }
  if (BASE_FRUITS[name]) {
    const d = BASE_FRUITS[name];
    return computeBoostedFruitStats(name, d.yieldPerHarvest || 1, d.timeSec, d.minHarvest || 1);
  }
  if (BASE_GREENHOUSE[name]) {
    const d = BASE_GREENHOUSE[name];
    return computeBoostedGreenhouseStats(name, d.baseYield || 1, d.timeSec);
  }
  if (RESOURCE_DATA[name]) {
    const d = RESOURCE_DATA[name];
    return computeBoostedResourceStats(name, d.yieldPer, d.timeSec);
  }
  if (FLOWER_VARIETIES[name]) {
    const stats = computeBoostedFlowerVarietyStats(name);
    return {
      yieldVal: stats.expectedYield,
      timeVal: stats.timeVal,
      activeBoosts: stats.activeBoosts
    };
  }
  return {
    yieldVal: 1,
    activeBoosts: []
  };
}

export function farmPanelGetMarketId(name) {
  if (name === "Obsidian") return "resource_Obsidian";
  if (BASE_CROPS[name]) return "crop_" + name;
  if (BASE_FRUITS[name]) return "fruit_" + name;
  if (BASE_GREENHOUSE[name]) return "greenhouse_" + name;
  if (FLOWER_VARIETIES[name]) return "flower_" + name;
  if (RESOURCE_DATA[name]) return "resource_" + name;
  return null;
}

export function farmPanelComputeEconomics(name, count, totalYield) {
  const price = farmPanelGetMarketPriceFlower(name);
  let costPerUnit = farmPanelGetCostPerUnitFlower(name);
  const marketId = farmPanelGetMarketId(name);
  let restockInfo = marketId ? computeQtyRestockGems(marketId, totalYield) : null;
  if (name === "Honey") {
    const honeyRestock = computeHoneyRestockBreakdown(totalYield);
    if (honeyRestock) {
      costPerUnit = honeyRestock.baseCostPerUnit;
      restockInfo = honeyRestock.restockInfo;
    }
  }
  if (name === "Salt") {
    const yieldPerCharge = SALT_BASE_YIELD + getActiveSaltYieldBonus();
    if (!hasFreeSaltRakeCost() && yieldPerCharge > 0 && totalYield > 0) {
      const baseRakeStock = BASE_STOCK_TOOLS["Salt Rake"];
      const boostedRakeStock = baseRakeStock ? computeBoostedStock(baseRakeStock, "tool", "Salt Rake") : 0;
      if (boostedRakeStock > 0) {
        const itemsNeeded = totalYield / yieldPerCharge;
        const restocksNeeded = restocksForMode(itemsNeeded / boostedRakeStock);
        const gemCostPerRestock = typeof getRestockGemCost === "function" ? getRestockGemCost("tool", "Salt Rake") : 10;
        const gemsTotal = restocksNeeded * gemCostPerRestock;
        const flowerCost = computeRestockCost24h(baseRakeStock, "tool", itemsNeeded, 1, 1, null, "Salt Rake");
        restockInfo = {
          name: "Salt Rake",
          stockKind: "tool",
          itemsNeeded: itemsNeeded,
          boostedStock: boostedRakeStock,
          restocksNeeded: restocksNeeded,
          gemCostPerRestock: gemCostPerRestock,
          gemsTotal: gemsTotal,
          flowerCost: flowerCost
        };
      }
    }
  }
  const seedCost = costPerUnit * totalYield;
  const restockCost = restockInfo ? restockInfo.flowerCost : 0;
  const totalCost = seedCost + restockCost;
  const grossRevenue = price * totalYield;
  const feeAmount = grossRevenue * ((feePercent || 0) / 100);
  const netRevenue = grossRevenue - feeAmount;
  const profit = netRevenue - totalCost;
  return {
    name: name,
    count: count,
    totalYield: totalYield,
    price: price,
    costPerUnit: costPerUnit,
    seedCost: seedCost,
    restockInfo: restockInfo,
    restockCost: restockCost,
    totalCost: totalCost,
    grossRevenue: grossRevenue,
    feeAmount: feeAmount,
    netRevenue: netRevenue,
    profit: profit
  };
}

function farmPanelJobMutantReward(job) {
  const name = farmPanelJobMutantRewardName(job);
  if (!name) return null;
  const first = job.reward.items[0];
  const amount = first && typeof first.amount === "number" && first.amount > 0 ? first.amount : 1;
  return {
    name: name,
    amount: amount
  };
}

function farmPanelJobMutantRewardName(job) {
  if (!job) return null;
  const reward = job.reward;
  if (!reward || !Array.isArray(reward.items) || !reward.items.length) return null;
  const first = reward.items[0];
  return first && first.name ? first.name : null;
}

export function farmPanelDetectActiveMutants(json) {
  const g = farmSyncExtractGameState(json);
  const results = [];
  const flowersField = farmPanelField(g, "flowers");
  const flowerBeds = flowersField && flowersField.flowerBeds;
  const flowerCounts = {};
  if (flowerBeds && typeof flowerBeds === "object") {
    Object.values(flowerBeds).forEach(bed => {
      const name = farmPanelJobMutantRewardName(bed && bed.flower);
      if (name) flowerCounts[name] = (flowerCounts[name] || 0) + 1;
    });
  }
  Object.keys(flowerCounts).forEach(name => {
    results.push({
      type: "Flower",
      name: name,
      count: flowerCounts[name]
    });
  });
  [ "Chicken", "Sheep", "Cow" ].forEach(typeLabel => {
    const animalKey = typeLabel.toLowerCase();
    const bag = farmSyncGetAnimalRecords(g, animalKey);
    const counts = {};
    if (bag && typeof bag === "object") {
      Object.values(bag).forEach(animal => {
        const name = farmPanelJobMutantRewardName(animal);
        if (name) counts[name] = (counts[name] || 0) + 1;
      });
    }
    Object.keys(counts).forEach(name => {
      results.push({
        type: typeLabel,
        name: name,
        count: counts[name]
      });
    });
  });
  return results;
}

export function farmPanelRenderMutantAlertCard(entry) {
  const icon = IMAGE_ICONS[entry.name] ? getIcon(entry.name) : `<span style="font-size:calc(24px * var(--fs-desk,1));">${MUTANT_TYPE_EMOJI[entry.type] || "✨"}</span>`;
  const countNote = entry.count > 1 ? ` ×${entry.count}` : "";
  return `\n  <div class="mutant-alert-card" data-search="mutant-${entry.type.toLowerCase()}">\n    <div class="mutant-alert-shine"></div>\n    <div class="mutant-alert-icon">${icon}</div>\n    <div class="mutant-alert-text">\n      <div class="mutant-alert-title">You have a Mutant! <span class="mutant-alert-type">[${escapeHtml(entry.type)}]</span></div>\n      <div class="mutant-alert-name">${escapeHtml(entry.name)}${countNote}</div>\n    </div>\n  </div>`;
}

function farmPanelTreeTypeForNode(node) {
  return node && typeof node.name === "string" && TREE_KNOWN_IDS[node.name] ? node.name : "Tree";
}

function farmPanelPredictTreeTypeRoll(json, treeType, criticalHitName, chance) {
  if (!(chance > 0)) return null;
  const lastInfo = farmPanelGetLastInfo();
  const farmId = Number(lastInfo.id);
  if (!Number.isFinite(farmId) || farmId <= 0) return null;
  const g = farmSyncExtractGameState(json);
  const farmActivity = farmPanelField(g, "farmActivity");
  if (!farmActivity || typeof farmActivity !== "object") return null;
  const itemId = TREE_KNOWN_IDS[treeType];
  if (!itemId) return null;
  const activityKey = `${treeType === "Tree" ? "Basic Tree" : treeType} Chopped`;
  const counter = typeof farmActivity[activityKey] === "number" ? farmActivity[activityKey] : 0;
  return sflPrngChance({
    farmId: farmId,
    itemId: itemId,
    counter: counter,
    chance: chance,
    criticalHitName: criticalHitName
  });
}

function farmPanelSimulateSeaBlessedChain(g, nodeStates, maxCharges, saltYield, intervalMs, now) {
  if (!isSkillActive("skill_sea_blessed")) return null;
  const values = ASCENSION_RANK_DATA.skill_sea_blessed.values;
  const chance = values[Math.min(Math.max(getAscensionRank("skill_sea_blessed"), 1), values.length) - 1];
  if (!(chance > 0)) return null;
  const farmId = Number(farmPanelGetLastInfo().id);
  if (!Number.isFinite(farmId) || farmId <= 0) return null;
  const farmActivity = farmPanelField(g, "farmActivity");
  if (!farmActivity || typeof farmActivity !== "object") return null;
  const rawCounter = farmActivity["Salt Harvested"];
  const baseCounter = typeof rawCounter === "number" && Number.isFinite(rawCounter) ? rawCounter : 0;
  const NODES_PER_PROC = 4;
  const MAX_HARVESTS = 5000;
  const HORIZON_MS = 30 * 864e5;
  const MAX_FUTURE_PROCS = 3;
  const nodes = nodeStates.map(s => ({
    stored: s.storedCharges,
    next: s.nextChargeAt
  }));
  const restoredPerNode = nodes.map(() => 0);
  const windowRestoredPerNode = nodes.map(() => 0);
  const harvestsPerNode = nodes.map(() => 0);
  const windowEndMs = nodeStates.reduce((m, s) => s.storedCharges < maxCharges && Number.isFinite(s.nextChargeAt) ? Math.max(m, s.nextChargeAt) : m, now);
  let windowRestoredTotal = 0;
  const nodeLabel = i => nodeStates[i] && typeof nodeStates[i].nodeIdx === "number" ? nodeStates[i].nodeIdx + 1 : i + 1;
  const nowProcs = [];
  const nowProcCounters = [];
  const futureProcs = [];
  let harvests = 0;
  let nowHarvests = 0;
  let nowRestored = 0;
  const harvestReady = (t, isNowPhase) => {
    while (harvests < MAX_HARVESTS) {
      const idx = nodes.findIndex(n => n.stored >= 1);
      if (idx === -1) break;
      const node = nodes[idx];
      if (node.stored === maxCharges) node.next = t + intervalMs;
      node.stored -= 1;
      if (isNowPhase) harvestsPerNode[idx] += 1;
      const counter = baseCounter + harvests;
      harvests++;
      const hit = sflPrngChance({
        farmId: farmId,
        itemId: SALT_KNOWN_ID,
        counter: counter,
        chance: chance,
        criticalHitName: "Sea Blessed"
      });
      if (!hit) continue;
      let remaining = NODES_PER_PROC;
      let restored = 0;
      const targets = [];
      for (let i = 0; i < nodes.length && remaining > 0; i++) {
        if (nodes[i].stored < maxCharges) {
          nodes[i].stored += 1;
          if (nodes[i].stored === maxCharges) nodes[i].next = t + intervalMs;
          if (isNowPhase) restoredPerNode[i] += 1;
          else if (t <= windowEndMs) {
            windowRestoredPerNode[i] += 1;
            windowRestoredTotal += 1;
          }
          restored += 1;
          targets.push(nodeLabel(i));
          remaining -= 1;
        }
      }
      if (isNowPhase) {
        nowProcCounters.push(counter);
        nowRestored += restored;
        nowProcs.push({
          counter: counter,
          harvestNumber: harvests,
          nodeIndex: nodeLabel(idx),
          targets: targets,
          restored: restored
        });
      } else {
        futureProcs.push({
          counter: counter,
          harvestNumber: harvests,
          nodeIndex: nodeLabel(idx),
          targets: targets,
          inSec: Math.max(0, (t - now) / 1e3),
          restored: restored,
          inWindow: t <= windowEndMs
        });
      }
    }
  };
  harvestReady(now, true);
  nowHarvests = harvests;
  while (harvests < MAX_HARVESTS) {
    let tNext = Infinity;
    nodes.forEach(n => {
      if (n.stored < maxCharges && n.next < tNext) tNext = n.next;
    });
    if (!(tNext <= now + HORIZON_MS)) break;
    if (tNext > windowEndMs && futureProcs.length >= MAX_FUTURE_PROCS) break;
    nodes.forEach(n => {
      while (n.stored < maxCharges && n.next <= tNext) {
        n.stored += 1;
        n.next += intervalMs;
      }
    });
    harvestReady(tNext, false);
  }
  return {
    chance: chance,
    startCounter: baseCounter,
    harvests: nowHarvests,
    procCount: nowProcCounters.length,
    procCounters: nowProcCounters,
    restoredTotal: nowRestored,
    restoredPerNode: restoredPerNode,
    harvestsPerNode: harvestsPerNode,
    nowProcs: nowProcs,
    nodeLabels: nodes.map((n, i) => nodeLabel(i)),
    bonusSalt: nowRestored * saltYield,
    futureProcs: futureProcs,
    windowEndMs: windowEndMs,
    windowRestoredTotal: windowRestoredTotal,
    windowRestoredPerNode: windowRestoredPerNode,
    windowBonusSalt: windowRestoredTotal * saltYield
  };
}

function farmPanelBuildSequentialWoodRolls(json, treeType, count) {
  const lastInfo = farmPanelGetLastInfo();
  const farmId = Number(lastInfo.id);
  if (!Number.isFinite(farmId) || farmId <= 0) return null;
  const g = farmSyncExtractGameState(json);
  const farmActivity = farmPanelField(g, "farmActivity");
  if (!farmActivity || typeof farmActivity !== "object") return null;
  const itemId = TREE_KNOWN_IDS[treeType];
  if (!itemId) return null;
  if (count <= 0) return [];
  const activityKey = `${treeType === "Tree" ? "Basic Tree" : treeType} Chopped`;
  const baseCounter = typeof farmActivity[activityKey] === "number" ? farmActivity[activityKey] : 0;
  const toughTreeOwned = isSkillActive("skill_tough_tree");
  const toughTreeChance = toughTreeOwned ? [ 10, 20, 30 ][Math.min(Math.max(getAscensionRank("skill_tough_tree"), 1), 3) - 1] : 0;
  const turnaroundOwned = isSkillActive("skill_tree_turnaround");
  const turnaroundChance = turnaroundOwned ? ASCENSION_RANK_DATA.skill_tree_turnaround.values[Math.min(Math.max(getAscensionRank("skill_tree_turnaround"), 1), 3) - 1] : 0;
  const rolls = [];
  for (let i = 0; i < count; i++) {
    const counter = baseCounter + i;
    const toughTreeCrit = toughTreeOwned && sflPrngChance({
      farmId: farmId,
      itemId: itemId,
      counter: counter,
      chance: toughTreeChance,
      criticalHitName: "Tough Tree"
    });
    const nativeHit = sflPrngChance({
      farmId: farmId,
      itemId: itemId,
      counter: counter,
      chance: 20,
      criticalHitName: "Native"
    });
    const turnaroundHit = turnaroundOwned && sflPrngChance({
      farmId: farmId,
      itemId: itemId,
      counter: counter,
      chance: turnaroundChance,
      criticalHitName: "Tree Turnaround"
    });
    rolls.push({
      toughTreeCrit: toughTreeCrit,
      nativeHit: nativeHit,
      turnaroundHit: turnaroundHit
    });
  }
  return rolls;
}

function farmPanelPredictWoodCritRolls(json, treeType) {
  const rolls = farmPanelBuildSequentialWoodRolls(json, treeType, 1);
  return rolls && rolls.length ? rolls[0] : null;
}

function farmPanelBuildSequentialWoodRollChains(json, treeType, count) {
  const lastInfo = farmPanelGetLastInfo();
  const farmId = Number(lastInfo.id);
  if (!Number.isFinite(farmId) || farmId <= 0) return null;
  const g = farmSyncExtractGameState(json);
  const farmActivity = farmPanelField(g, "farmActivity");
  if (!farmActivity || typeof farmActivity !== "object") return null;
  const itemId = TREE_KNOWN_IDS[treeType];
  if (!itemId) return null;
  if (count <= 0) return [];
  const activityKey = `${treeType === "Tree" ? "Basic Tree" : treeType} Chopped`;
  const baseCounter = typeof farmActivity[activityKey] === "number" ? farmActivity[activityKey] : 0;
  const toughTreeOwned = isSkillActive("skill_tough_tree");
  const toughTreeChance = toughTreeOwned ? [ 10, 20, 30 ][Math.min(Math.max(getAscensionRank("skill_tough_tree"), 1), 3) - 1] : 0;
  const turnaroundOwned = isSkillActive("skill_tree_turnaround");
  const turnaroundChance = turnaroundOwned ? ASCENSION_RANK_DATA.skill_tree_turnaround.values[Math.min(Math.max(getAscensionRank("skill_tree_turnaround"), 1), 3) - 1] : 0;
  const rollAt = counter => {
    const toughTreeCrit = toughTreeOwned && sflPrngChance({
      farmId: farmId,
      itemId: itemId,
      counter: counter,
      chance: toughTreeChance,
      criticalHitName: "Tough Tree"
    });
    const nativeHit = sflPrngChance({
      farmId: farmId,
      itemId: itemId,
      counter: counter,
      chance: 20,
      criticalHitName: "Native"
    });
    const turnaroundHit = turnaroundOwned && sflPrngChance({
      farmId: farmId,
      itemId: itemId,
      counter: counter,
      chance: turnaroundChance,
      criticalHitName: "Tree Turnaround"
    });
    return {
      counter: counter,
      toughTreeCrit: toughTreeCrit,
      nativeHit: nativeHit,
      turnaroundHit: turnaroundHit
    };
  };
  const MAX_CHAIN_LENGTH = 500;
  let counter = baseCounter;
  const chains = [];
  for (let i = 0; i < count; i++) {
    const chain = [];
    let roll = rollAt(counter);
    chain.push(roll);
    counter++;
    while (roll.turnaroundHit && chain.length < MAX_CHAIN_LENGTH) {
      roll = rollAt(counter);
      chain.push(roll);
      counter++;
    }
    chains.push(chain);
  }
  return chains;
}

function farmPanelGetBudYieldEntriesForResource(resourceName) {
  const entries = typeof allResourceBudBoostEntries === "function" ? allResourceBudBoostEntries() : [];
  const perBud = {};
  entries.forEach(e => {
    if (!e || !e.yieldAdd) return;
    const applies = e.scope === "resource" ? e.target === resourceName : e.scope === "resourceList" ? Array.isArray(e.resources) && e.resources.includes(resourceName) : false;
    if (!applies) return;
    const key = e.budId || e.id;
    if (!perBud[key]) perBud[key] = {
      total: 0,
      entries: []
    };
    perBud[key].total += e.yieldAdd;
    perBud[key].entries.push(e);
  });
  const groups = Object.values(perBud);
  if (!groups.length) return {
    total: 0,
    entries: []
  };
  return groups.reduce((best, g) => g.total > best.total ? g : best, groups[0]);
}

function farmPanelGetBudYieldForResource(resourceName) {
  return farmPanelGetBudYieldEntriesForResource(resourceName).total;
}

function farmPanelBoostNameById(id) {
  const b = BOOSTS.find(x => x && x.id === id);
  return b && b.name ? b.name : id;
}

function farmPanelMakeGainRecorder(rec) {
  const gains = rec ? new Map : null;
  return {
    note: (name, delta) => {
      if (gains && delta) gains.set(name, (gains.get(name) || 0) + delta);
    },
    flush: scale => {
      if (gains) gains.forEach((delta, name) => rec.set(name, (rec.get(name) || 0) + delta * scale));
    }
  };
}

function farmPanelRecordBudGains(resourceName, recorder) {
  const bud = farmPanelGetBudYieldEntriesForResource(resourceName);
  bud.entries.forEach(e => recorder.note(e.name, e.yieldAdd));
  return bud.total;
}

function farmPanelMakeMultTrackingList(getAmount) {
  const list = [];
  const nativePush = list.push.bind(list);
  let last = 1;
  list.push = (...items) => {
    const cur = getAmount();
    items.forEach(it => {
      if (it && it.amount === undefined && typeof it.valueText === "string" && it.valueText.charAt(0) === "×") it.amount = cur - last;
    });
    last = cur;
    return nativePush(...items);
  };
  return list;
}

function farmPanelGenericBoostEntry(b, multDelta, totalMult) {
  const parts = [];
  if (typeof b.yieldAdd === "number" && b.yieldAdd) parts.push(`+${fmt(b.yieldAdd)} yield`);
  if (typeof b.yieldMult === "number" && b.yieldMult !== 1) parts.push(`×${b.yieldMult} yield`);
  if (!parts.length) return null;
  let gain = typeof b.yieldAdd === "number" ? b.yieldAdd : 0;
  if (typeof b.yieldMult === "number" && b.yieldMult !== 1 && totalMult !== 1) gain += multDelta * Math.log(b.yieldMult) / Math.log(totalMult);
  return {
    name: b.name,
    amount: gain,
    valueText: parts.join(", ")
  };
}

function farmPanelGainsToBoosts(rec) {
  return Array.from(rec.entries()).filter(([, amt]) => amt > 1e-9).map(([name, amt]) => ({
    name: name,
    amount: amt,
    valueText: `+${fmt(amt)} yield`
  }));
}

function farmPanelComputeExactWoodYieldForNode(node, treeType, critRolls, rec) {
  if (!critRolls) return null;
  const R = farmPanelMakeGainRecorder(rec);
  let amount = 1;
  const mulStep = (name, m) => {
    const before = amount;
    amount *= m;
    R.note(name, amount - before);
  };
  const addStep = (name, v) => {
    amount += v;
    R.note(name, v);
  };
  if (isBoostActive("foreman_beaver")) mulStep(farmPanelBoostNameById("foreman_beaver"), 1.2); else if (isBoostActive("apprentice_beaver")) mulStep(farmPanelBoostNameById("apprentice_beaver"), 1.2); else if (isBoostActive("woody_the_beaver")) mulStep(farmPanelBoostNameById("woody_the_beaver"), 1.2);
  if (isBoostActive("discord_mod")) mulStep(farmPanelBoostNameById("discord_mod"), 1.35);
  if (isBoostActive("lumberjack")) mulStep(farmPanelBoostNameById("lumberjack"), 1.1);
  if (critRolls.toughTreeCrit) mulStep(farmPanelBoostNameById("skill_tough_tree"), 3);
  if (isSkillActive("skill_lumberjacks_extra")) {
    const rank = getAscensionRank("skill_lumberjacks_extra");
    const values = ASCENSION_RANK_DATA.skill_lumberjacks_extra.values;
    addStep(farmPanelBoostNameById("skill_lumberjacks_extra"), values[Math.min(Math.max(rank, 1), values.length) - 1]);
  }
  if (isBoostActive("wood_nymph_wendy")) addStep(farmPanelBoostNameById("wood_nymph_wendy"), .2);
  if (isBoostActive("tiki_totem")) addStep(farmPanelBoostNameById("tiki_totem"), .1);
  if (isBoostActive("squirrel")) addStep(farmPanelBoostNameById("squirrel"), .1);
  if (isBoostActive("faction_shield_res")) addStep(farmPanelBoostNameById("faction_shield_res"), .25);
  if (critRolls.nativeHit) addStep(farmPanelBoostNameById("native_boost"), 1);
  if (isBoostActive("legendary_shrine_res")) addStep(farmPanelBoostNameById("legendary_shrine_res"), 1);
  amount += farmPanelRecordBudGains("Wood", R);
  const multiplier = node && typeof node.multiplier === "number" ? node.multiplier : 1;
  amount *= multiplier;
  R.flush(multiplier);
  const tier = node && typeof node.tier === "number" ? node.tier : treeType === "Sacred Tree" ? 3 : treeType === "Ancient Tree" ? 2 : 1;
  if (tier === 2) amount += .5;
  if (tier === 3) amount += 2.5;
  return amount;
}

function farmPanelRockNameForNode(node, knownIds, defaultName) {
  return node && typeof node.name === "string" && knownIds[node.name] ? node.name : defaultName;
}

function farmPanelGetMiningPrngContext(json, knownIds, rockName) {
  const lastInfo = farmPanelGetLastInfo();
  const farmId = Number(lastInfo.id);
  if (!Number.isFinite(farmId) || farmId <= 0) return null;
  const g = farmSyncExtractGameState(json);
  const farmActivity = farmPanelField(g, "farmActivity");
  if (!farmActivity || typeof farmActivity !== "object") return null;
  const itemId = knownIds[rockName];
  if (!itemId) return null;
  const counter = typeof farmActivity[`${rockName} Mined`] === "number" ? farmActivity[`${rockName} Mined`] : 0;
  return {
    farmId: farmId,
    itemId: itemId,
    counter: counter
  };
}

export function farmPanelGetCollectiblePosition(g, name) {
  const collectibles = farmPanelField(g, "collectibles");
  const arr = collectibles && collectibles[name];
  const active = farmSyncPickActivePlacedInstances(arr);
  const placed = active[0];
  if (!placed) return null;
  return {
    x: placed.coordinates.x,
    y: placed.coordinates.y
  };
}

export function farmPanelGnomeComboPresent() {
  if (!farmPanelGameState) return false;
  const g = farmSyncExtractGameState(farmPanelGameState);
  const gnomePos = farmPanelGetCollectiblePosition(g, "Gnome");
  const cobaltPos = farmPanelGetCollectiblePosition(g, "Cobalt");
  const clementinePos = farmPanelGetCollectiblePosition(g, "Clementine");
  if (!gnomePos || !cobaltPos || !clementinePos) return false;
  return cobaltPos.y === gnomePos.y && cobaltPos.x + 1 === gnomePos.x && clementinePos.y === gnomePos.y && clementinePos.x - 1 === gnomePos.x;
}

export function farmPanelIsWithinTurtleAOE(turtlePos, rockPos) {
  const dx = turtlePos.x - rockPos.x;
  const dy = turtlePos.y - rockPos.y;
  return Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && (dx !== 0 || dy !== 0);
}

function farmPanelCropCycleStartedAt(crop) {
  if (!crop) return 0;
  if (typeof crop.cycleStartedAt === "number") return crop.cycleStartedAt;
  return typeof crop.plantedAt === "number" ? crop.plantedAt : 0;
}

function farmPanelRockCycleStartedAt(node) {
  const stone = node && node.stone;
  if (stone && typeof stone.cycleStartedAt === "number") return stone.cycleStartedAt;
  const minedAt = stone && typeof stone.minedAt === "number" ? stone.minedAt : 0;
  if (minedAt) return minedAt;
  return node && typeof node.createdAt === "number" ? node.createdAt : 0;
}

export function farmPanelCheckTurtleAOEBonus(g, turtleName, node) {
  if (!node || typeof node.x !== "number" || typeof node.y !== "number") return false;
  const turtlePos = farmPanelGetCollectiblePosition(g, turtleName);
  if (!turtlePos) return false;
  if (!farmPanelIsWithinTurtleAOE(turtlePos, {
    x: node.x,
    y: node.y
  })) return false;
  const aoeState = farmPanelField(g, "aoe") || {};
  const dx = node.x - turtlePos.x;
  const dy = node.y - turtlePos.y;
  const lastUsed = aoeState[turtleName] && aoeState[turtleName][dx] && typeof aoeState[turtleName][dx][dy] === "number" ? aoeState[turtleName][dx][dy] : 0;
  return lastUsed <= farmPanelRockCycleStartedAt(node);
}

function farmPanelBuildSequentialStoneRolls(json, rockName, count) {
  const ctx = farmPanelGetMiningPrngContext(json, STONE_KNOWN_IDS, rockName);
  if (!ctx) return null;
  if (count <= 0) return [];
  const {farmId: farmId, itemId: itemId, counter: baseCounter} = ctx;
  const rockGolemOwned = isBoostActive("rock_golem");
  const rolls = [];
  for (let i = 0; i < count; i++) {
    const counter = baseCounter + i;
    const rockGolemCrit = rockGolemOwned && sflPrngChance({
      farmId: farmId,
      itemId: itemId,
      counter: counter,
      chance: 10,
      criticalHitName: "Rock Golem"
    });
    const nativeHit = sflPrngChance({
      farmId: farmId,
      itemId: itemId,
      counter: counter,
      chance: 20,
      criticalHitName: "Native"
    });
    rolls.push({
      rockGolemCrit: rockGolemCrit,
      nativeHit: nativeHit
    });
  }
  return rolls;
}

function farmPanelPredictStoneCritRolls(json, rockName) {
  const rolls = farmPanelBuildSequentialStoneRolls(json, rockName, 1);
  return rolls && rolls.length ? rolls[0] : null;
}

function farmPanelComputeExactStoneYieldForNode(json, node, rockName, critRolls, atTime, rec) {
  if (!critRolls) return null;
  const g = farmSyncExtractGameState(json);
  const R = farmPanelMakeGainRecorder(rec);
  let amount = 1;
  const addStep = (name, v) => {
    amount += v;
    R.note(name, v);
  };
  if (critRolls.rockGolemCrit) addStep(farmPanelBoostNameById("rock_golem"), 2);
  if (isBoostActive("prospector")) addStep(farmPanelBoostNameById("prospector"), .2);
  if (isBoostActive("tunnel_mole")) addStep(farmPanelBoostNameById("tunnel_mole"), .25);
  if (isBoostActive("stone_beetle")) addStep(farmPanelBoostNameById("stone_beetle"), .1);
  if (isSkillActive("skill_rocknroll")) {
    const rank = getAscensionRank("skill_rocknroll");
    const values = ASCENSION_RANK_DATA.skill_rocknroll.values;
    addStep(farmPanelBoostNameById("skill_rocknroll"), values[Math.min(Math.max(rank, 1), values.length) - 1]);
  }
  if (isSkillActive("skill_rocky_favor")) {
    const rank = getAscensionRank("skill_rocky_favor");
    const values = ASCENSION_RANK_DATA.skill_rocky_favor.values["resourceEffects.Stone"];
    addStep(farmPanelBoostNameById("skill_rocky_favor"), values[Math.min(Math.max(rank, 1), values.length) - 1]);
  }
  if (isSkillActive("skill_ferrous_favor")) {
    const rank = getAscensionRank("skill_ferrous_favor");
    const values = ASCENSION_RANK_DATA.skill_ferrous_favor.values["resourceEffects.Stone"];
    addStep(farmPanelBoostNameById("skill_ferrous_favor"), values[Math.min(Math.max(rank, 1), values.length) - 1]);
  }
  if (critRolls.nativeHit) addStep(farmPanelBoostNameById("native_boost"), 1);
  if (isBoostActive("emerald_turtle") && farmPanelCheckTurtleAOEBonus(g, "Emerald Turtle", node)) addStep(farmPanelBoostNameById("emerald_turtle"), .5);
  if (isBoostActive("tin_turtle") && farmPanelCheckTurtleAOEBonus(g, "Tin Turtle", node)) addStep(farmPanelBoostNameById("tin_turtle"), .1);
  if (isBoostActive("faction_shield_res")) addStep(farmPanelBoostNameById("faction_shield_res"), .25);
  if (isBoostActive("legendary_shrine_res")) addStep(farmPanelBoostNameById("legendary_shrine_res"), 1);
  amount += farmPanelRecordBudGains("Stone", R);
  if (isBoostActive("volcano_gnome")) addStep(farmPanelBoostNameById("volcano_gnome"), .1);
  const multiplier = node && typeof node.multiplier === "number" ? node.multiplier : 1;
  amount *= multiplier;
  R.flush(multiplier);
  const tier = node && typeof node.tier === "number" ? node.tier : rockName === "Reinforced Stone Rock" ? 3 : rockName === "Fused Stone Rock" ? 2 : 1;
  if (tier === 2) amount += .5;
  if (tier === 3) amount += 2.5;
  return amount;
}

function farmPanelBuildSequentialIronRolls(json, rockName, count) {
  const ctx = farmPanelGetMiningPrngContext(json, IRON_KNOWN_IDS, rockName);
  if (!ctx) return null;
  if (count <= 0) return [];
  const {farmId: farmId, itemId: itemId, counter: baseCounter} = ctx;
  const rolls = [];
  for (let i = 0; i < count; i++) {
    const counter = baseCounter + i;
    const nativeHit = sflPrngChance({
      farmId: farmId,
      itemId: itemId,
      counter: counter,
      chance: 20,
      criticalHitName: "Native"
    });
    rolls.push({
      nativeHit: nativeHit
    });
  }
  return rolls;
}

function farmPanelPredictIronCritRolls(json, rockName) {
  const rolls = farmPanelBuildSequentialIronRolls(json, rockName, 1);
  return rolls && rolls.length ? rolls[0] : null;
}

function farmPanelComputeExactIronYieldForNode(json, node, rockName, critRolls, atTime, rec) {
  if (!critRolls) return null;
  const g = farmSyncExtractGameState(json);
  const R = farmPanelMakeGainRecorder(rec);
  let amount = 1;
  const addStep = (name, v) => {
    amount += v;
    R.note(name, v);
  };
  if (isBoostActive("rocky_the_mole")) addStep(farmPanelBoostNameById("rocky_the_mole"), .25);
  if (isBoostActive("radiant_ray")) addStep(farmPanelBoostNameById("radiant_ray"), .1);
  if (isBoostActive("iron_idol")) addStep(farmPanelBoostNameById("iron_idol"), 1);
  if (isBoostActive("iron_beetle")) addStep(farmPanelBoostNameById("iron_beetle"), .1);
  if (isSkillActive("skill_iron_bumpkin")) {
    const rank = getAscensionRank("skill_iron_bumpkin");
    const values = ASCENSION_RANK_DATA.skill_iron_bumpkin.values;
    addStep(farmPanelBoostNameById("skill_iron_bumpkin"), values[Math.min(Math.max(rank, 1), values.length) - 1]);
  }
  if (isSkillActive("skill_rocky_favor")) {
    const rank = getAscensionRank("skill_rocky_favor");
    const values = ASCENSION_RANK_DATA.skill_rocky_favor.values["resourceEffects.Iron"];
    addStep(farmPanelBoostNameById("skill_rocky_favor"), values[Math.min(Math.max(rank, 1), values.length) - 1]);
  }
  if (isSkillActive("skill_ferrous_favor")) {
    const rank = getAscensionRank("skill_ferrous_favor");
    const values = ASCENSION_RANK_DATA.skill_ferrous_favor.values["resourceEffects.Iron"];
    addStep(farmPanelBoostNameById("skill_ferrous_favor"), values[Math.min(Math.max(rank, 1), values.length) - 1]);
  }
  if (critRolls.nativeHit) addStep(farmPanelBoostNameById("native_boost"), 1);
  if (isBoostActive("emerald_turtle") && farmPanelCheckTurtleAOEBonus(g, "Emerald Turtle", node)) addStep(farmPanelBoostNameById("emerald_turtle"), .5);
  if (isBoostActive("faction_shield_res")) addStep(farmPanelBoostNameById("faction_shield_res"), .25);
  amount += farmPanelRecordBudGains("Iron", R);
  if (isBoostActive("volcano_gnome")) addStep(farmPanelBoostNameById("volcano_gnome"), .1);
  const multiplier = node && typeof node.multiplier === "number" ? node.multiplier : 1;
  amount *= multiplier;
  R.flush(multiplier);
  const tier = node && typeof node.tier === "number" ? node.tier : rockName === "Tempered Iron Rock" ? 3 : rockName === "Refined Iron Rock" ? 2 : 1;
  if (tier === 2) amount += .5;
  if (tier === 3) amount += 2.5;
  return amount;
}

function farmPanelPredictGoldInstantMineForType(json, rockName) {
  if (!isBoostActive("pickaxe_shark")) return null;
  const ctx = farmPanelGetMiningPrngContext(json, GOLD_KNOWN_IDS, rockName);
  if (!ctx) return null;
  const {farmId: farmId, itemId: itemId, counter: counter} = ctx;
  return sflPrngChance({
    farmId: farmId,
    itemId: itemId,
    counter: counter,
    chance: 10,
    criticalHitName: "Pickaxe Shark"
  });
}

function farmPanelBuildSequentialGoldRolls(json, rockName, count) {
  const ctx = farmPanelGetMiningPrngContext(json, GOLD_KNOWN_IDS, rockName);
  if (!ctx) return null;
  if (count <= 0) return [];
  const {farmId: farmId, itemId: itemId, counter: baseCounter} = ctx;
  const pickaxeSharkOwned = isBoostActive("pickaxe_shark");
  const rolls = [];
  for (let i = 0; i < count; i++) {
    const counter = baseCounter + i;
    const nativeHit = sflPrngChance({
      farmId: farmId,
      itemId: itemId,
      counter: counter,
      chance: 20,
      criticalHitName: "Native"
    });
    const instantMineHit = pickaxeSharkOwned && sflPrngChance({
      farmId: farmId,
      itemId: itemId,
      counter: counter,
      chance: 10,
      criticalHitName: "Pickaxe Shark"
    });
    rolls.push({
      nativeHit: nativeHit,
      instantMineHit: instantMineHit
    });
  }
  return rolls;
}

function farmPanelPredictGoldCritRolls(json, rockName) {
  const rolls = farmPanelBuildSequentialGoldRolls(json, rockName, 1);
  return rolls && rolls.length ? rolls[0] : null;
}

function farmPanelBuildSequentialGoldRollChains(json, rockName, count) {
  const ctx = farmPanelGetMiningPrngContext(json, GOLD_KNOWN_IDS, rockName);
  if (!ctx) return null;
  if (count <= 0) return [];
  const {farmId: farmId, itemId: itemId, counter: baseCounter} = ctx;
  const pickaxeSharkOwned = isBoostActive("pickaxe_shark");
  const rollAt = counter => {
    const nativeHit = sflPrngChance({
      farmId: farmId,
      itemId: itemId,
      counter: counter,
      chance: 20,
      criticalHitName: "Native"
    });
    const instantMineHit = pickaxeSharkOwned && sflPrngChance({
      farmId: farmId,
      itemId: itemId,
      counter: counter,
      chance: 10,
      criticalHitName: "Pickaxe Shark"
    });
    return {
      counter: counter,
      nativeHit: nativeHit,
      instantMineHit: instantMineHit
    };
  };
  const MAX_CHAIN_LENGTH = 500;
  let counter = baseCounter;
  const chains = [];
  for (let i = 0; i < count; i++) {
    const chain = [];
    let roll = rollAt(counter);
    chain.push(roll);
    counter++;
    while (roll.instantMineHit && chain.length < MAX_CHAIN_LENGTH) {
      roll = rollAt(counter);
      chain.push(roll);
      counter++;
    }
    chains.push(chain);
  }
  return chains;
}

function farmPanelComputeExactGoldYieldForNode(json, node, rockName, critRolls, atTime, rec) {
  if (!critRolls) return null;
  const g = farmSyncExtractGameState(json);
  const R = farmPanelMakeGainRecorder(rec);
  let amount = 1;
  const addStep = (name, v) => {
    amount += v;
    R.note(name, v);
  };
  if (isBoostActive("gold_rush")) addStep(farmPanelBoostNameById("gold_rush"), .5);
  if (isSkillActive("skill_golden_touch")) {
    const rank = getAscensionRank("skill_golden_touch");
    const values = ASCENSION_RANK_DATA.skill_golden_touch.values;
    addStep(farmPanelBoostNameById("skill_golden_touch"), values[Math.min(Math.max(rank, 1), values.length) - 1]);
  }
  if (critRolls.nativeHit) addStep(farmPanelBoostNameById("native_boost"), 1);
  if (isBoostActive("nugget")) addStep(farmPanelBoostNameById("nugget"), .25);
  if (isBoostActive("gilded_swordfish")) addStep(farmPanelBoostNameById("gilded_swordfish"), .1);
  if (isBoostActive("gold_beetle")) addStep(farmPanelBoostNameById("gold_beetle"), .1);
  if (isBoostActive("emerald_turtle") && farmPanelCheckTurtleAOEBonus(g, "Emerald Turtle", node)) addStep(farmPanelBoostNameById("emerald_turtle"), .5);
  if (isBoostActive("faction_shield_res")) addStep(farmPanelBoostNameById("faction_shield_res"), .25);
  amount += farmPanelRecordBudGains("Gold", R);
  if (isBoostActive("volcano_gnome")) addStep(farmPanelBoostNameById("volcano_gnome"), .1);
  const multiplier = node && typeof node.multiplier === "number" ? node.multiplier : 1;
  amount *= multiplier;
  R.flush(multiplier);
  const tier = node && typeof node.tier === "number" ? node.tier : rockName === "Prime Gold Rock" ? 3 : rockName === "Pure Gold Rock" ? 2 : 1;
  if (tier === 2) amount += .5;
  if (tier === 3) amount += 2.5;
  return amount;
}

function farmPanelGetCrimstonePrngContext(json) {
  const lastInfo = farmPanelGetLastInfo();
  const farmId = Number(lastInfo.id);
  if (!Number.isFinite(farmId) || farmId <= 0) return null;
  const g = farmSyncExtractGameState(json);
  const farmActivity = farmPanelField(g, "farmActivity");
  if (!farmActivity || typeof farmActivity !== "object") return null;
  const itemId = CRIMSTONE_KNOWN_IDS["Crimstone Rock"];
  const counter = typeof farmActivity["Crimstone Mined"] === "number" ? farmActivity["Crimstone Mined"] : 0;
  return {
    farmId: farmId,
    itemId: itemId,
    counter: counter
  };
}

function farmPanelBuildSequentialCrimstoneRollChains(json, count) {
  const ctx = farmPanelGetCrimstonePrngContext(json);
  if (!ctx) return null;
  if (count <= 0) return [];
  const {farmId: farmId, itemId: itemId, counter: baseCounter} = ctx;
  const clamOwned = isBoostActive("crimstone_clam");
  const rollAt = counter => {
    const instantHit = clamOwned && sflPrngChance({
      farmId: farmId,
      itemId: itemId,
      counter: counter,
      chance: 10,
      criticalHitName: "Crimstone Clam"
    });
    return {
      counter: counter,
      instantHit: instantHit
    };
  };
  const MAX_CHAIN_LENGTH = 500;
  let counter = baseCounter;
  const chains = [];
  for (let i = 0; i < count; i++) {
    const chain = [];
    let roll = rollAt(counter);
    chain.push(roll);
    counter++;
    while (roll.instantHit && chain.length < MAX_CHAIN_LENGTH) {
      roll = rollAt(counter);
      chain.push(roll);
      counter++;
    }
    chains.push(chain);
  }
  return chains;
}

export function farmPanelCropTierLabel(cropName) {
  const sec = CROP_HARVEST_SEC[cropName];
  if (sec == null) return null;
  if (sec <= CROP_HARVEST_SEC.Pumpkin) return "Basic";
  if (sec >= CROP_HARVEST_SEC.Eggplant) return "Advanced";
  return "Medium";
}

function farmPanelSumCatalogBoosts(matchFn, excludeIds) {
  let add = 0, mult = 1;
  const boosts = [];
  const budGroups = {};
  BOOSTS.forEach(b => {
    if (!b || excludeIds.has(b.id) || !matchFn(b)) return;
    const active = b.skillTier ? isSkillActive(b.id) : isBoostActive(b.id);
    if (!active) return;
    if (typeof b.yieldMult === "number") {
      mult *= b.yieldMult;
      boosts.push(b);
    }
    if (typeof b.yieldAdd !== "number") return;
    if (b.isBud && b.budId) {
      if (!budGroups[b.budId]) budGroups[b.budId] = {
        total: 0,
        entries: []
      };
      budGroups[b.budId].total += b.yieldAdd;
      budGroups[b.budId].entries.push(b);
    } else {
      add += b.yieldAdd;
      boosts.push(b);
    }
  });
  const budGroupList = Object.values(budGroups);
  if (budGroupList.length) {
    const winner = budGroupList.reduce((best, g) => g.total > best.total ? g : best, budGroupList[0]);
    add += winner.total;
    boosts.push(...winner.entries);
  }
  return {
    add: add,
    mult: mult,
    boosts: boosts
  };
}

export function farmPanelComputeExactCrimstoneYield(g, rock, minesLeftOverride, allowStreakBonus) {
  let amount = 1;
  const boosts = [];
  if (isBoostActive("crimson_carp")) {
    amount += .05;
    boosts.push({
      name: "Crimson Carp",
      valueText: "+0.05 yield"
    });
  }
  if (isBoostActive("crim_peckster")) {
    amount += .1;
    boosts.push({
      name: "Crim Peckster",
      valueText: "+0.1 yield"
    });
  }
  if (isBoostActive("crimstone_armor")) {
    amount += .1;
    boosts.push({
      name: "Crimstone Armor",
      valueText: "+0.1 yield"
    });
  }
  const minesLeft = minesLeftOverride != null ? minesLeftOverride : rock && typeof rock.minesLeft === "number" ? rock.minesLeft : 5;
  if (minesLeft === 1 && allowStreakBonus !== false) {
    if (isBoostActive("crimstone_hammer")) {
      amount += 2;
      boosts.push({
        name: "Crimstone Hammer",
        valueText: "+2 yield (5th mine)"
      });
    }
    if (isSkillActive("skill_fire_kissed")) {
      const rank = getAscensionRank("skill_fire_kissed");
      const values = ASCENSION_RANK_DATA.skill_fire_kissed && ASCENSION_RANK_DATA.skill_fire_kissed.values || [ 1, 1.35, 1.75 ];
      const v = values[Math.min(Math.max(rank, 1), values.length) - 1];
      amount += v;
      boosts.push({
        name: "Fire Kissed",
        valueText: `+${fmt(v)} yield (5th mine)`
      });
    }
    if (isBoostActive("mushroom_chicken")) {
      amount += .5;
      boosts.push({
        name: "Mushroom Chicken",
        valueText: "+0.5 yield (5th mine)"
      });
    }
    amount += 2;
    boosts.push({
      name: "5th Mine Streak",
      valueText: "+2 yield (guaranteed)"
    });
  }
  return {
    amount: amount,
    boosts: boosts
  };
}

function farmPanelComputeExactOilYield(hasBonus) {
  let amount = OIL_SINGLE_HARVEST_BASE;
  const boosts = [];
  if (hasBonus) {
    amount += OIL_BONUS_DROP_AMOUNT;
    boosts.push({
      name: "Bonus Drill (3rd Mine)",
      valueText: `+${fmt(OIL_BONUS_DROP_AMOUNT)} yield (guaranteed)`
    });
    if (isBoostActive("stag_shrine")) {
      amount += 15;
      boosts.push({
        name: "Stag Shrine",
        valueText: "+15 yield (3rd mine)"
      });
    }
  }
  if (isBoostActive("battle_fish")) {
    amount += .05;
    boosts.push({
      name: "Battle Fish",
      valueText: "+0.05 yield"
    });
  }
  if (isBoostActive("ladybug_cow")) {
    amount += 1;
    boosts.push({
      name: "Ladybug Cow",
      valueText: "+1 yield"
    });
  }
  if (isBoostActive("knight_chicken")) {
    amount += .1;
    boosts.push({
      name: "Knight Chicken",
      valueText: "+0.1 yield"
    });
  }
  if (isBoostActive("oil_can")) {
    amount += 2;
    boosts.push({
      name: "Oil Can",
      valueText: "+2 yield"
    });
  }
  if (isBoostActive("oil_overalls")) {
    amount += 10;
    boosts.push({
      name: "Oil Overalls",
      valueText: "+10 yield"
    });
  }
  if (isBoostActive("oil_gallon")) {
    amount += 5;
    boosts.push({
      name: "Oil Gallon",
      valueText: "+5 yield"
    });
  }
  if (isSkillActive("skill_oil_extraction")) {
    const rank = getAscensionRank("skill_oil_extraction");
    const values = ASCENSION_RANK_DATA.skill_oil_extraction && ASCENSION_RANK_DATA.skill_oil_extraction.values || [ 1, 1.5, 2 ];
    const v = values[Math.min(Math.max(rank, 1), values.length) - 1];
    amount += v;
    boosts.push({
      name: "Oil Extraction",
      valueText: `+${fmt(v)} yield`
    });
  }
  return {
    amount: amount,
    boosts: boosts
  };
}

export function farmPanelComputeExactFlowerYield(flowerJob) {
  let amount = 1;
  const boosts = [];
  const crit = flowerJob && flowerJob.criticalHit || {};
  if (isBoostActive("humming_bird") && crit["Humming Bird"]) {
    amount += 1;
    boosts.push({
      name: "Humming Bird",
      valueText: "+1 yield (crit)"
    });
  }
  if (isBoostActive("butterfly") && crit["Butterfly"]) {
    amount += 1;
    boosts.push({
      name: "Butterfly",
      valueText: "+1 yield (crit)"
    });
  }
  if (isBoostActive("desert_rose") && crit["Desert Rose"]) {
    amount += 1;
    boosts.push({
      name: "Desert Rose",
      valueText: "+1 yield (crit)"
    });
  }
  if (isBoostActive("chicory") && crit["Chicory"]) {
    amount += 1;
    boosts.push({
      name: "Chicory",
      valueText: "+1 yield (crit)"
    });
  }
  if (isBoostActive("salt_crystal_flower") && crit["Salt Crystal Flower"]) {
    amount += 1;
    boosts.push({
      name: "Salt Crystal Flower",
      valueText: "+1 yield (crit)"
    });
  }
  if (isBoostActive("moth_shrine") && crit["Moth Shrine"]) {
    amount += 1;
    boosts.push({
      name: "Moth Shrine",
      valueText: "+1 yield (crit)"
    });
  }
  if (isSkillActive("skill_petalled_perk") && crit["Petalled Perk"]) {
    amount += 1;
    boosts.push({
      name: "Petalled Perk",
      valueText: "+1 yield (crit)"
    });
  }
  if (isBoostActive("legendary_shrine_flower")) {
    amount += 1;
    boosts.push({
      name: "Legendary Shrine Flower",
      valueText: "+1 yield"
    });
  }
  return {
    amount: amount,
    boosts: boosts
  };
}

export function farmPanelAOEExtent(rankSkillId) {
  if (rankSkillId && isSkillActive(rankSkillId)) {
    const rank = getAscensionRank(rankSkillId);
    return CROP_AOE_RANKS[Math.min(Math.max(rank, 1), 3) - 1];
  }
  return {
    xLeft: 1,
    xRight: 1,
    depth: 3
  };
}

export function farmPanelGnomeAOEBonus(g, plot) {
  const plotCoords = farmSyncGetCoords(plot);
  if (!plotCoords) return false;
  const gnomePos = farmPanelGetCollectiblePosition(g, "Gnome");
  const cobaltPos = farmPanelGetCollectiblePosition(g, "Cobalt");
  const clementinePos = farmPanelGetCollectiblePosition(g, "Clementine");
  if (!gnomePos || !cobaltPos || !clementinePos) return false;
  const isCobaltLeftOfGnome = cobaltPos.y === gnomePos.y && cobaltPos.x + 1 === gnomePos.x;
  const isClementineRightOfGnome = clementinePos.y === gnomePos.y && clementinePos.x - 1 === gnomePos.x;
  if (!isCobaltLeftOfGnome || !isClementineRightOfGnome) return false;
  const isPlotDirectlyAboveGnome = plotCoords.x === gnomePos.x && plotCoords.y === gnomePos.y - 1;
  if (!isPlotDirectlyAboveGnome) return false;
  const aoeState = farmPanelField(g, "aoe") || {};
  const lastUsed = aoeState["Gnome"] && aoeState["Gnome"][0] && typeof aoeState["Gnome"][0][1] === "number" ? aoeState["Gnome"][0][1] : 0;
  return lastUsed <= farmPanelCropCycleStartedAt(plot && plot.crop);
}

function farmPanelCropAOEBonus(g, collectibleName, plot, dims, rankSkillId, aoeKey) {
  const plotCoords = farmSyncGetCoords(plot);
  if (!plotCoords) return false;
  const pos = farmPanelGetCollectiblePosition(g, collectibleName);
  if (!pos) return false;
  const {width: width, height: height} = dims;
  const px = plotCoords.x, py = plotCoords.y;
  let within = false;
  if (collectibleName === "Basic Scarecrow" || collectibleName === "Scary Mike" || collectibleName === "Laurie the Chuckle Crow") {
    const e = farmPanelAOEExtent(rankSkillId);
    within = px >= pos.x - e.xLeft && px <= pos.x + e.xRight && py <= pos.y - height && py >= pos.y - height - (e.depth - 1);
  } else if (collectibleName === "Sir Goldensnout") {
    const drx = px - pos.x, dry = py - pos.y;
    within = drx >= -1 && drx <= width && dry <= 1 && dry >= -height;
  } else if (collectibleName === "Queen Cornelia") {
    within = px >= pos.x - 1 && px <= pos.x + width && py <= pos.y + 1 && py >= pos.y - height;
  }
  if (!within) return false;
  const dx = px - pos.x, dy = py - pos.y;
  const aoeState = farmPanelField(g, "aoe") || {};
  const key = aoeKey || collectibleName;
  const lastUsed = aoeState[key] && aoeState[key][dx] && typeof aoeState[key][dx][dy] === "number" ? aoeState[key][dx][dy] : 0;
  return lastUsed <= farmPanelCropCycleStartedAt(plot && plot.crop);
}

function farmPanelIsPlanted(job, kind) {
  if (!job || !job.name) return false;
  if (kind === "crop" || kind === "fruit") return typeof job.plantedAt === "number";
  return !!job.plantedAt;
}

function farmPanelWindowedRemainingSec(g, kind, job, plot, refTime, now) {
  if (!g || !job || typeof job.baseDurationMs !== "number") return null;
  let windowsFn;
  if (kind === "crop") windowsFn = set => cropPlotWindows(g, set).concat(cropFertiliserWindows(plot && plot.fertiliser)); else if (kind === "fruit") windowsFn = set => fruitWindows(g, set).concat(turbofruitWindows(plot && plot.fertiliser)); else if (kind === "greenhouse") windowsFn = set => greenhouseWindows(g, job.name, set).concat(greenhouseGlowWindows(plot && plot.fertiliser)); else if (kind === "flower") windowsFn = set => flowerWindows(g, set); else return null;
  const readyAt = fpLimitedReadyAt(kind, refTime, job.baseDurationMs, windowsFn);
  return Math.max(0, (readyAt - now) / 1e3);
}

let farmPanelCropYieldExcludedSet = null;

function farmPanelCropYieldExcluded() {
  if (!farmPanelCropYieldExcludedSet) farmPanelCropYieldExcludedSet = new Set([ ...CROP_PRNG_EXCLUDE, "power_hour", "power_hour_greenhouse" ]);
  return farmPanelCropYieldExcludedSet;
}

function farmPanelPowerHourYieldAt(atTime, isGreenhouse) {
  if (!isBoostActive(isGreenhouse ? "power_hour_greenhouse" : "power_hour")) return false;
  const win = getPowerHourWindow();
  if (!win) return true;
  const nowMs = Date.now();
  const t = Math.max(typeof atTime === "number" ? atTime : nowMs, nowMs);
  return t >= win.startedAt && t < win.expiresAt;
}

function farmPanelTruncate4(x) {
  const str = String(x);
  if (/e/i.test(str)) return Math.floor(x * 1e4) / 1e4;
  const dot = str.indexOf(".");
  if (dot < 0) return x;
  return Number(str.slice(0, dot + 5));
}

const FARM_PANEL_GAME_YIELD_ORDER = [ "Power hour", "Peeled Potato", "Potent Potato", "Stellar Sunflower", "Radical Radish", "Cabbage Boy", "Cabbage Girl", "Karkinos", "Pablo The Bunny", "Foliant", "Purple Trail", "Maximus", "Eggplant Onesie", "Giant Artichoke", "Giant Yam", "Tofu Mask", "Corn Onesie", "Corn Silk Hair", "Sickle", "Sheaf of Plenty", "Giant Kale", "Blossom Ward", "Frozen Heart", "Infernal Pitchfork", "Legendary Shrine", "Faction Wings", "Bud", "Resource BUD", "Hoot", "Poppy", "Freya Fox", "Lab Grown Carrot", "Lab Grown Pumpkin", "Lab Grown Radish", "Soybliss", "Young Farmer", "Experienced Farmer", "Old Farmer", "Acre Farm", "Hectare Farm", "Giant Onion" ];

export function farmPanelComputeExactCropYield(json, g, cropName, plot, counter, isGreenhouse, atTime, opts) {
  const critRoll = args => opts && opts.crits ? !!opts.crits[args.criticalHitName] : sflPrngChance(args);
  const lastInfo = farmPanelGetLastInfo();
  const farmId = opts && opts.farmId ? Number(opts.farmId) : Number(lastInfo.id);
  const tierLabel = farmPanelCropTierLabel(cropName);
  const itemId = CROP_KNOWN_IDS[cropName];
  let amount = 1;
  const boosts = farmPanelMakeMultTrackingList(() => amount);
  const steps = opts && opts.machine ? [] : null;
  const stepAdd = v => {
    if (steps) steps.push({
      v: v,
      idx: boosts.length
    }); else amount += v;
  };
  if (Number.isFinite(farmId) && farmId > 0 && itemId) {
    if (isBoostActive("green_amulet") && critRoll({
      farmId: farmId,
      itemId: itemId,
      counter: counter,
      chance: 10,
      criticalHitName: "Green Amulet"
    })) {
      amount *= 10;
      boosts.push({
        name: "Green Amulet",
        valueText: "×10 yield (crit)"
      });
    }
  }
  if (cropName === "Cauliflower" && isBoostActive("golden_cauliflower")) {
    amount *= 2;
    boosts.push({
      name: "Golden Cauliflower",
      valueText: "×2 yield"
    });
  }
  if (cropName === "Carrot" && isBoostActive("easter_bunny")) {
    amount *= 1.2;
    boosts.push({
      name: "Easter Bunny",
      valueText: "×1.2 yield"
    });
  }
  if (cropName === "Pumpkin" && isBoostActive("victoria_sisters")) {
    amount *= 1.2;
    boosts.push({
      name: "Victoria Sisters",
      valueText: "×1.2 yield"
    });
  }
  if (cropName === "Beetroot" && isBoostActive("beetroot_amulet")) {
    amount *= 1.2;
    boosts.push({
      name: "Beetroot Amulet",
      valueText: "×1.2 yield"
    });
  }
  if (cropName === "Sunflower" && isBoostActive("sunflower_amulet")) {
    amount *= 1.1;
    boosts.push({
      name: "Sunflower Amulet",
      valueText: "×1.1 yield"
    });
  }
  if (isBoostActive("scarecrow") || isBoostActive("kuebiko")) {
    amount *= 1.2;
    boosts.push({
      name: isBoostActive("scarecrow") ? "Scarecrow" : "Kuebiko",
      valueText: "×1.2 yield"
    });
  }
  if (isBoostActive("coder")) {
    amount *= 1.2;
    boosts.push({
      name: "Coder",
      valueText: "×1.2 yield"
    });
  }
  const generic = farmPanelSumCatalogBoosts(b => (b.scope === "crop" && b.target === cropName || b.scope === "tier" && b.target === tierLabel || b.scope === "global" && b.category === "crops" && (b.target === null || b.target === undefined)) && !(isGreenhouse && CROPS_GLOBAL_EXCLUDED_FROM_GREENHOUSE.has(b.id)) && (b.id !== "hoot" || !isGreenhouse || cropName === "Rice"), farmPanelCropYieldExcluded());
  const cropGenericMultDelta = amount * (generic.mult - 1);
  if (generic.mult !== 1) amount *= generic.mult;
  generic.boosts.forEach(b => {
    const entry = farmPanelGenericBoostEntry(b, cropGenericMultDelta, generic.mult);
    if (entry) boosts.push(entry);
  });
  if (Number.isFinite(farmId) && farmId > 0 && itemId) {
    if (cropName === "Potato" && isBoostActive("peeled_potato") && critRoll({
      farmId: farmId,
      itemId: itemId,
      counter: counter,
      chance: 20,
      criticalHitName: "Peeled Potato"
    })) {
      stepAdd(1);
      boosts.push({
        name: "Peeled Potato",
        valueText: "+1 yield (crit)"
      });
    }
    if (cropName === "Potato" && isBoostActive("potent_potato") && critRoll({
      farmId: farmId,
      itemId: itemId,
      counter: counter,
      chance: 10 / 3,
      criticalHitName: "Potent Potato"
    })) {
      stepAdd(10);
      boosts.push({
        name: "Potent Potato",
        valueText: "+10 yield (crit)"
      });
    }
    if (cropName === "Sunflower" && isBoostActive("stellar_sunflower") && critRoll({
      farmId: farmId,
      itemId: itemId,
      counter: counter,
      chance: 10 / 3,
      criticalHitName: "Stellar Sunflower"
    })) {
      stepAdd(10);
      boosts.push({
        name: "Stellar Sunflower",
        valueText: "+10 yield (crit)"
      });
    }
    if (cropName === "Radish" && isBoostActive("radical_radish") && critRoll({
      farmId: farmId,
      itemId: itemId,
      counter: counter,
      chance: 10 / 3,
      criticalHitName: "Radical Radish"
    })) {
      stepAdd(10);
      boosts.push({
        name: "Radical Radish",
        valueText: "+10 yield (crit)"
      });
    }
  }
  if (isSkillActive("skill_chonky_scarecrow") && tierLabel === "Basic" && farmPanelCropAOEBonus(g, "Basic Scarecrow", plot, {
    width: 1,
    height: 1
  }, "skill_chonky_scarecrow", "Chonky Scarecrow")) {
    const rank = getAscensionRank("skill_chonky_scarecrow");
    const bonuses = ASCENSION_RANK_DATA.skill_chonky_scarecrow && ASCENSION_RANK_DATA.skill_chonky_scarecrow.values || [ 0, .05, .1 ];
    const v = bonuses[Math.min(Math.max(rank, 1), 3) - 1];
    stepAdd(v);
    boosts.push({
      name: "Basic Scarecrow",
      valueText: `+${fmt(v)} yield (AOE)`
    });
  }
  if (tierLabel === "Medium" && isBoostActive("scary_mike") && farmPanelCropAOEBonus(g, "Scary Mike", plot, {
    width: 1,
    height: 1
  }, "skill_horror_mike")) {
    const v = isSkillActive("skill_horror_mike") ? .2 + (ASCENSION_RANK_DATA.skill_horror_mike && ASCENSION_RANK_DATA.skill_horror_mike.values || [ .1, .15, .2 ])[Math.min(Math.max(getAscensionRank("skill_horror_mike"), 1), 3) - 1] : .2;
    stepAdd(v);
    boosts.push({
      name: "Scary Mike",
      valueText: `+${fmt(v)} yield (AOE)`
    });
  }
  if (isBoostActive("sir_goldensnout") && farmPanelCropAOEBonus(g, "Sir Goldensnout", plot, {
    width: 2,
    height: 2
  }, null)) {
    stepAdd(.5);
    boosts.push({
      name: "Sir Goldensnout",
      valueText: "+0.5 yield (AOE)"
    });
  }
  if (tierLabel === "Advanced" && isBoostActive("laurie_chuckle_crow") && farmPanelCropAOEBonus(g, "Laurie the Chuckle Crow", plot, {
    width: 1,
    height: 1
  }, "skill_lauries_gains")) {
    const v = isSkillActive("skill_lauries_gains") ? .2 + (ASCENSION_RANK_DATA.skill_lauries_gains && ASCENSION_RANK_DATA.skill_lauries_gains.values || [ .1, .15, .2 ])[Math.min(Math.max(getAscensionRank("skill_lauries_gains"), 1), 3) - 1] : .2;
    stepAdd(v);
    boosts.push({
      name: "Laurie the Chuckle Crow",
      valueText: `+${fmt(v)} yield (AOE)`
    });
  }
  if (cropName === "Corn" && isBoostActive("queen_cornelia") && farmPanelCropAOEBonus(g, "Queen Cornelia", plot, {
    width: 1,
    height: 2
  }, null)) {
    stepAdd(1);
    boosts.push({
      name: "Queen Cornelia",
      valueText: "+1 yield (AOE)"
    });
  }
  if ((tierLabel === "Medium" || tierLabel === "Advanced") && farmPanelGnomeAOEBonus(g, plot)) {
    stepAdd(10);
    boosts.push({
      name: "Gnome",
      valueText: "+10 yield (AOE combo)"
    });
  }
  if (steps) {
    let budSum = 0;
    generic.boosts.forEach(gb => {
      if (typeof gb.yieldAdd !== "number" || !gb.yieldAdd) return;
      if (gb.isBud) budSum += gb.yieldAdd; else steps.push({
        v: gb.yieldAdd,
        name: gb.name
      });
    });
    if (budSum) steps.push({
      v: budSum,
      name: "Bud"
    });
  } else amount += generic.add;
  if (farmPanelPowerHourYieldAt(atTime, isGreenhouse)) {
    stepAdd(.2);
    boosts.push({
      name: "Power hour",
      valueText: "+0.2 yield"
    });
  }
  const plotFertiliserName = plot && plot.fertiliser && plot.fertiliser.name;
  const cropFertBoostDef = plotFertiliserName ? BOOSTS.find(b => b.fertilizer === plotFertiliserName && b.composterFertilizer) : null;
  const cropFertTimeMult = cropFertBoostDef && typeof cropFertBoostDef.timeMult === "number" ? cropFertBoostDef.timeMult : 1;
  if (plotFertiliserName === "Sprout Mix" || plotFertiliserName === "Sproutroot Surprise") {
    stepAdd(.2);
    boosts.push({
      name: plotFertiliserName,
      valueText: "+0.2 yield (fertiliser)",
      timeMult: cropFertTimeMult !== 1 ? cropFertTimeMult : undefined
    });
    if (isBoostActive("knowledge_crab")) {
      stepAdd(.2);
      boosts.push({
        name: "Knowledge Crab",
        valueText: "+0.2 yield (doubles fertiliser)"
      });
    }
  } else if (plotFertiliserName === "Rapid Root" && cropFertTimeMult !== 1) {
    boosts.push({
      name: plotFertiliserName,
      valueText: "no yield change (fertiliser)",
      timeMult: cropFertTimeMult
    });
  }
  if (plot && plot.beeSwarm && typeof plot.beeSwarm.count === "number" && plot.beeSwarm.count > 0) {
    const perSwarm = getBeeSwarmPerSwarmYield();
    const total = perSwarm * plot.beeSwarm.count;
    stepAdd(total);
    boosts.push({
      name: "Bee Swarm",
      valueText: `+${fmt(total)} yield (${plot.beeSwarm.count} swarm${plot.beeSwarm.count === 1 ? "" : "s"} on this plot${isSkillActive("skill_pollen_power_up") ? " · incl. Pollen Power Up" : ""})`
    });
  }
  if (tierLabel) {
    if (isSkillActive("skill_acre_farm")) {
      const rank = getAscensionRank("skill_acre_farm");
      const data = ASCENSION_RANK_DATA.skill_acre_farm.values;
      const idx = Math.min(Math.max(rank, 1), 3) - 1;
      const v = tierLabel === "Advanced" ? data["tierEffects.Advanced"][idx] : data["tierEffects." + tierLabel][idx];
      stepAdd(v);
      boosts.push({
        name: "Acre Farm",
        valueText: `${v > 0 ? "+" : ""}${fmt(v)} yield`
      });
    }
    if (isSkillActive("skill_hectare_farm")) {
      const rank = getAscensionRank("skill_hectare_farm");
      const data = ASCENSION_RANK_DATA.skill_hectare_farm.values;
      const idx = Math.min(Math.max(rank, 1), 3) - 1;
      const v = tierLabel === "Advanced" ? data["tierEffects.Advanced"][idx] : data["tierEffects." + tierLabel][idx];
      stepAdd(v);
      boosts.push({
        name: "Hectare Farm",
        valueText: `${v > 0 ? "+" : ""}${fmt(v)} yield`
      });
    }
  }
  if (isOvernightGroundCrop(cropName) && isBoostActive("hoot")) {
    stepAdd(.5);
    boosts.push({
      name: "Hoot",
      valueText: "+0.5 yield"
    });
  }
  if (!isGreenhouse && currentSeason === "Spring" && isCropInSeason(cropName, "Spring") && isBoostActive("blossom_ward")) {
    stepAdd(1);
    boosts.push({
      name: "Blossom Ward",
      valueText: "+1 yield"
    });
  }
  if (!isGreenhouse && currentSeason === "Winter" && isCropInSeason(cropName, "Winter") && isBoostActive("frozen_heart")) {
    stepAdd(1);
    boosts.push({
      name: "Frozen Heart",
      valueText: "+1 yield"
    });
  }
  const budAdd = farmPanelGetBudYieldForResource(cropName) || 0;
  if (budAdd) {
    stepAdd(budAdd);
    boosts.push({
      name: "Resource BUD",
      valueText: `+${fmt(budAdd)} yield`
    });
  }
  if (steps) {
    const rank = st => {
      const nm = st.name || boosts[st.idx] && boosts[st.idx].name;
      const i = FARM_PANEL_GAME_YIELD_ORDER.indexOf(nm);
      return i < 0 ? FARM_PANEL_GAME_YIELD_ORDER.length : i;
    };
    steps.map((st, i) => ({
      st: st,
      i: i,
      r: rank(st)
    })).sort((x, y) => x.r - y.r || x.i - y.i).forEach(x => {
      amount += x.st.v;
    });
  }
  if (isBoostActive("insect_plague")) {
    amount *= .5;
    boosts.push({
      name: "Insect Plague",
      valueText: "×0.5 yield"
    });
  }
  if (isBoostActive("bountiful_harvest")) {
    const bountifulDoubled = !!getActiveSeasonGuardianName();
    if (steps) {
      amount += 1;
      if (bountifulDoubled) amount += 1;
    } else amount += bountifulDoubled ? 2 : 1;
    boosts.push({
      name: "Bountiful Harvest",
      valueText: bountifulDoubled ? "+2 yield" : "+1 yield"
    });
  }
  let seedReward = null;
  if (!isGreenhouse && !(opts && opts.noSeedDrop) && Number.isFinite(farmId) && farmId > 0 && itemId) {
    const gotSeedDrop = sflPrngChance({
      farmId: farmId,
      itemId: itemId,
      counter: counter,
      chance: 5,
      criticalHitName: cropName
    });
    if (gotSeedDrop) {
      const seedName = cropName + " Seed";
      const isTwoSeeds = sflPrngChance({
        farmId: farmId,
        itemId: itemId,
        counter: counter,
        chance: 50,
        criticalHitName: seedName
      });
      seedReward = {
        seedName: seedName,
        amount: isTwoSeeds ? 2 : 3
      };
    }
  }
  return {
    amount: opts && opts.machine ? farmPanelTruncate4(amount) : Math.round(amount * 1e4) / 1e4,
    boosts: boosts,
    seedReward: seedReward
  };
}

export function farmPanelComputeExactFruitYield(json, g, fruitName, counter, isGreenhouse, patchFertiliserName) {
  const lastInfo = farmPanelGetLastInfo();
  const farmId = Number(lastInfo.id);
  const itemId = FRUIT_KNOWN_IDS[fruitName];
  let amount = 1;
  const boosts = [];
  if (Number.isFinite(farmId) && farmId > 0 && itemId && !isGreenhouse && isSkillActive("skill_generous_orchard")) {
    const rank = getAscensionRank("skill_generous_orchard");
    const chances = [ 20, 30, 50 ];
    const chance = chances[Math.min(Math.max(rank, 1), 3) - 1];
    if (sflPrngChance({
      farmId: farmId,
      itemId: itemId,
      counter: counter,
      chance: chance,
      criticalHitName: "Generous Orchard"
    })) {
      amount += 1;
      boosts.push({
        name: "Generous Orchard",
        valueText: "+1 yield (crit)"
      });
    }
  }
  const fruitExcludeIds = isGreenhouse ? new Set([ ...FRUIT_PRNG_EXCLUDE, ...PATCH_FRUIT_ONLY_GLOBAL_BOOSTS_EXCLUDED_FROM_GREENHOUSE ]) : FRUIT_PRNG_EXCLUDE;
  const generic = farmPanelSumCatalogBoosts(b => b.scope === "fruit" && b.target === fruitName || b.category === "fruits" && b.scope === "global" || b.category === "fruits" && b.scope === "fruitList" && Array.isArray(b.fruits) && b.fruits.includes(fruitName), fruitExcludeIds);
  amount += generic.add;
  const genericMultDelta = amount * (generic.mult - 1);
  amount *= generic.mult;
  generic.boosts.forEach(b => {
    const entry = farmPanelGenericBoostEntry(b, genericMultDelta, generic.mult);
    if (entry) boosts.push(entry);
  });
  if (!isGreenhouse && (patchFertiliserName === "Fruitful Blend" || patchFertiliserName === "Turbofruit Mix")) {
    let fertBonus = .1;
    let fruitfulBountyMult = 1;
    if (isSkillActive("skill_fruitful_bounty")) {
      const rank = getAscensionRank("skill_fruitful_bounty");
      const values = ASCENSION_RANK_DATA.skill_fruitful_bounty.values;
      fruitfulBountyMult = values[Math.min(Math.max(rank, 1), values.length) - 1];
      fertBonus *= fruitfulBountyMult;
    }
    amount += fertBonus;
    const fertBoostDef = BOOSTS.find(b => b.fertilizer === patchFertiliserName && b.composterFertilizer);
    const fertTimeMult = fertBoostDef && typeof fertBoostDef.timeMult === "number" ? fertBoostDef.timeMult : 1;
    boosts.push({
      name: patchFertiliserName,
      valueText: `+${fmt(fertBonus)} yield (fertiliser${isSkillActive("skill_fruitful_bounty") ? ` · ×${fmt(fruitfulBountyMult)} by Fruitful Bounty` : ""})`,
      timeMult: fertTimeMult !== 1 ? fertTimeMult : undefined
    });
  }
  const budAdd = farmPanelGetBudYieldForResource(fruitName) || 0;
  if (budAdd) {
    amount += budAdd;
    boosts.push({
      name: "Resource BUD",
      valueText: `+${fmt(budAdd)} yield`
    });
  }
  if (isBoostActive("bountiful_harvest")) {
    const bountifulDoubled = !!getActiveSeasonGuardianName();
    amount += bountifulDoubled ? 2 : 1;
    boosts.push({
      name: "Bountiful Harvest",
      valueText: bountifulDoubled ? "+2 yield" : "+1 yield"
    });
  }
  return {
    amount: Math.round(amount * 1e4) / 1e4,
    boosts: boosts
  };
}

export function farmPanelComputeExactGreenhouseYield(json, g, plantName, counter, potFertiliserName, atTime) {
  const isFruit = plantName === "Grape";
  const base = isFruit ? farmPanelComputeExactFruitYield(json, g, plantName, counter, true) : farmPanelComputeExactCropYield(json, g, plantName, null, counter, true, atTime);
  let amount = base.amount;
  const boosts = base.boosts.slice();
  const generic = farmPanelSumCatalogBoosts(b => b.scope === "greenhouse" && b.target === plantName || b.category === "greenhouse" && b.scope === "global", new Set([ "skill_greenhouse_gamble", "antique_dress", "apply_greenhouse_goodie", "power_hour_greenhouse" ]));
  amount += generic.add;
  const genericMultDelta = amount * (generic.mult - 1);
  amount *= generic.mult;
  generic.boosts.forEach(b => {
    const entry = farmPanelGenericBoostEntry(b, genericMultDelta, generic.mult);
    if (entry) boosts.push(entry);
  });
  if (isSkillActive("skill_greenhouse_gamble")) {
    const lastInfo = farmPanelGetLastInfo();
    const farmId = Number(lastInfo.id);
    const itemId = CROP_KNOWN_IDS[plantName] || FRUIT_KNOWN_IDS[plantName];
    if (Number.isFinite(farmId) && farmId > 0 && itemId) {
      const rank = getAscensionRank("skill_greenhouse_gamble");
      const chances = [ 30, 40, 50 ];
      if (sflPrngChance({
        farmId: farmId,
        itemId: itemId,
        counter: counter,
        chance: chances[Math.min(Math.max(rank, 1), 3) - 1],
        criticalHitName: "Greenhouse Gamble"
      })) {
        amount += 1;
        boosts.push({
          name: "Greenhouse Gamble",
          valueText: "+1 yield (crit)"
        });
      }
    }
  }
  if (plantName === "Grape" && isBoostActive("antique_dress")) {
    const lastInfo = farmPanelGetLastInfo();
    const farmId = Number(lastInfo.id);
    const itemId = FRUIT_KNOWN_IDS[plantName];
    if (Number.isFinite(farmId) && farmId > 0 && itemId) {
      if (sflPrngChance({
        farmId: farmId,
        itemId: itemId,
        counter: counter,
        chance: 10,
        criticalHitName: "Antique Dress"
      })) {
        amount += 10;
        boosts.push({
          name: "Antique Dress",
          valueText: "+10 yield (crit)"
        });
      }
    }
  }
  if (potFertiliserName === "Greenhouse Goodie") {
    amount += .2;
    boosts.push({
      name: "Greenhouse Goodie",
      valueText: "+0.2 yield (fertiliser)"
    });
  } else if (potFertiliserName === "Greenhouse Glow") {
    const glowBoostDef = BOOSTS.find(b => b.fertilizer === "Greenhouse Glow" && b.composterFertilizer);
    const glowTimeMult = glowBoostDef && typeof glowBoostDef.timeMult === "number" ? glowBoostDef.timeMult : 1;
    if (glowTimeMult !== 1) {
      boosts.push({
        name: "Greenhouse Glow",
        valueText: "no yield change (fertiliser)",
        timeMult: glowTimeMult
      });
    }
  }
  return {
    amount: Math.round(amount * 1e4) / 1e4,
    boosts: boosts
  };
}

function farmPanelPredictTreeTurnaroundForType(json, treeType) {
  if (!isSkillActive("skill_tree_turnaround")) return null;
  const rank = getAscensionRank("skill_tree_turnaround");
  const values = ASCENSION_RANK_DATA.skill_tree_turnaround.values;
  const chance = values[Math.min(Math.max(rank, 1), values.length) - 1];
  return farmPanelPredictTreeTypeRoll(json, treeType, "Tree Turnaround", chance);
}

function farmPanelPredictMoneyTreeForType(json, treeType) {
  if (!isSkillActive("skill_money_tree")) return null;
  const rank = getAscensionRank("skill_money_tree");
  const values = ASCENSION_RANK_DATA.skill_money_tree.values;
  const chance = values[Math.min(Math.max(rank, 1), values.length) - 1];
  return farmPanelPredictTreeTypeRoll(json, treeType, "Money Tree", chance);
}

function farmPanelPredictMoneyTreeBatchForType(json, treeType, count, multiplier) {
  if (!isSkillActive("skill_money_tree")) return null;
  const mult = typeof multiplier === "number" && multiplier > 0 ? multiplier : 1;
  if (!(count > 0)) return {
    procCount: 0,
    coins: 0
  };
  const lastInfo = farmPanelGetLastInfo();
  const farmId = Number(lastInfo.id);
  if (!Number.isFinite(farmId) || farmId <= 0) return null;
  const g = farmSyncExtractGameState(json);
  const farmActivity = farmPanelField(g, "farmActivity");
  if (!farmActivity || typeof farmActivity !== "object") return null;
  const itemId = TREE_KNOWN_IDS[treeType];
  if (!itemId) return null;
  const rank = getAscensionRank("skill_money_tree");
  const values = ASCENSION_RANK_DATA.skill_money_tree.values;
  const chance = values[Math.min(Math.max(rank, 1), values.length) - 1];
  const activityKey = `${treeType === "Tree" ? "Basic Tree" : treeType} Chopped`;
  const baseCounter = typeof farmActivity[activityKey] === "number" ? farmActivity[activityKey] : 0;
  let procCount = 0;
  for (let i = 0; i < count; i++) {
    if (sflPrngChance({
      farmId: farmId,
      itemId: itemId,
      counter: baseCounter + i,
      chance: chance,
      criticalHitName: "Money Tree"
    })) procCount++;
  }
  return {
    procCount: procCount,
    coins: procCount * 200 * mult
  };
}

export function farmPanelDetectMoneyTreeBonus(json) {
  const g = farmSyncExtractGameState(json);
  const trees = farmPanelField(g, "trees");
  if (!trees || typeof trees !== "object") return {
    totalCoins: 0,
    count: 0,
    predictedTypes: [],
    predictedCoins: 0,
    batchPredictions: []
  };
  let totalCoins = 0, count = 0;
  const nodeCountByType = {};
  const multiplierByType = {};
  Object.values(trees).forEach(node => {
    const nodeMultiplier = node && typeof node.multiplier === "number" ? node.multiplier : 1;
    const reward = node && node.wood && node.wood.reward;
    const coins = reward && typeof reward.coins === "number" ? reward.coins : 0;
    if (coins > 0) {
      totalCoins += coins * nodeMultiplier;
      count++;
    }
    const type = farmPanelTreeTypeForNode(node);
    nodeCountByType[type] = (nodeCountByType[type] || 0) + 1;
    if (!(type in multiplierByType)) multiplierByType[type] = nodeMultiplier;
  });
  const predictedTypes = [];
  const batchPredictions = [];
  Object.keys(nodeCountByType).forEach(type => {
    if (farmPanelPredictMoneyTreeForType(json, type) === true) predictedTypes.push(type);
    const batch = farmPanelPredictMoneyTreeBatchForType(json, type, nodeCountByType[type], multiplierByType[type]);
    if (batch && batch.procCount > 0) {
      batchPredictions.push({
        type: type,
        nodeCount: nodeCountByType[type],
        procCount: batch.procCount,
        coins: batch.coins,
        multiplier: multiplierByType[type]
      });
    }
  });
  const predictedCoins = predictedTypes.reduce((sum, type) => sum + 200 * (multiplierByType[type] || 1), 0);
  return {
    totalCoins: totalCoins,
    count: count,
    predictedTypes: predictedTypes,
    predictedCoins: predictedCoins,
    batchPredictions: batchPredictions
  };
}

export function farmPanelRenderMoneyTreeBonusCard(data) {
  const hasBatch = data && data.batchPredictions && data.batchPredictions.length > 0;
  if (!data || !(data.totalCoins > 0 || data.predictedCoins > 0 || hasBatch)) return "";
  const parts = [];
  if (data.totalCoins > 0) {
    const nodeNote = ` on ${data.count} tree node${data.count === 1 ? "" : "s"}`;
    parts.push(`+${fmt(data.totalCoins)} coins confirmed${nodeNote}`);
  }
  if (hasBatch) {
    data.batchPredictions.forEach(b => {
      const multNote = b.multiplier > 1 ? ` (×${fmt(b.multiplier)} node)` : "";
      parts.push(`~${b.procCount}/${b.nodeCount} ${b.type} node${b.nodeCount === 1 ? "" : "s"}${multNote} predicted to proc as you chop through them (+${fmt(b.coins)} coins)`);
    });
  } else if (data.predictedCoins > 0) {
    const typeList = data.predictedTypes.join(", ");
    parts.push(`+${fmt(data.predictedCoins)} coins predicted on your next ${typeList} chop${data.predictedTypes.length === 1 ? "" : "es (one per type)"}`);
  }
  return `\n  <div class="money-tree-alert-card" data-search="money-tree-bonus">\n    <div class="money-tree-alert-shine"></div>\n    <div class="money-tree-alert-icon">${COIN_ICON}</div>\n    <div class="money-tree-alert-text">\n      <div class="money-tree-alert-title">💰 Money Tree Bonus Pending!</div>\n      <div class="money-tree-alert-name">${parts.join(" — ")}</div>\n    </div>\n  </div>`;
}

function farmPanelMapPos(id, node, defW, defH) {
  if (!node || typeof node.x !== "number" || typeof node.y !== "number") return null;
  return {
    id: id == null ? null : String(id),
    x: node.x,
    y: node.y,
    w: typeof node.width === "number" ? node.width : defW,
    h: typeof node.height === "number" ? node.height : defH
  };
}

function farmPanelNodeWindowedRemainingSec(g, resourceName, job, ts, now) {
  if (!g || !job || typeof job.baseDurationMs !== "number" || !ts) return null;
  const family = String(resourceName).toLowerCase();
  const scope = resourceName === "Wood" ? "wood" : resourceName === "Oil" ? "oil" : family;
  const windowsFn = set => resourceName === "Wood" ? treeWindows(g, set) : resourceName === "Oil" ? oilWindows(g, set) : mineWindows(g, family, set);
  const readyAt = fpLimitedReadyAt(scope, ts, job.baseDurationMs, windowsFn);
  return Math.max(0, (readyAt - now) / 1e3);
}

function farmPanelIsNodeReadyNow(resourceName, node, subKey, now, g) {
  const job = node && node[subKey];
  const ts = job && (job.minedAt || job.choppedAt || job.harvestedAt || job.stoneMinedAt || job.recoveredAt) || node && (node.minedAt || node.choppedAt || node.harvestedAt);
  if (!ts) {
    const amountVal = job && typeof job.amount === "number" ? job.amount : node && typeof node.amount === "number" ? node.amount : null;
    return amountVal !== 0;
  }
  const windowed = farmPanelNodeWindowedRemainingSec(g, resourceName, job, ts, now);
  if (windowed != null) return windowed <= 0;
  const growSec = farmPanelGrowTimeSec(resourceName);
  const elapsedSec = (now - ts) / 1e3;
  const remainingSec = growSec != null ? Math.max(0, growSec - elapsedSec) : null;
  return remainingSec != null ? remainingSec <= 0 : false;
}

let farmPanelAnimalYieldGroupsByType = {};

let farmPanelAnimalBuffTrackingByType = {};

function farmPanelAssignMapPositions(entries, out, picks, pickNoOut, procAt, autoNoOut) {
  const ready = entries.filter(e => !(e.waitSec > 0));
  const waiting = entries.filter(e => e.waitSec > 0).sort((a, b) => a.waitSec - b.waitSec || a.order - b.order);
  const picked = [];
  (Array.isArray(picks) ? picks : []).forEach(id => {
    const e = ready.find(r => r.id === id);
    if (e && !picked.includes(e)) picked.push(e);
  });
  const rest = ready.filter(e => !picked.includes(e)).sort((a, b) => a.order - b.order);
  const setAuto = (e, slot) => {
    out.set(e.key, slot);
    if (autoNoOut) autoNoOut.set(e.id, slot + 1);
  };
  picked.forEach((e, i) => {
    out.set(e.key, i);
    if (pickNoOut) pickNoOut.set(e.id, i + 1);
  });
  if (typeof procAt === "function") {
    const slots = rest.map((e, i) => picked.length + i);
    const procSlots = slots.filter(i => procAt(i));
    const plainSlots = slots.filter(i => !procAt(i));
    const byValue = rest.slice().sort((a, b) => b.mult - a.mult || a.order - b.order);
    const procNodes = byValue.slice(0, procSlots.length);
    const plainNodes = byValue.slice(procSlots.length).sort((a, b) => a.order - b.order);
    procSlots.forEach((slot, k) => setAuto(procNodes[k], slot));
    plainSlots.forEach((slot, k) => setAuto(plainNodes[k], slot));
  } else {
    rest.forEach((e, i) => setAuto(e, picked.length + i));
  }
  waiting.forEach((e, i) => setAuto(e, ready.length + i));
}

function farmPanelCollectMapProcs(rolls) {
  const list = Array.isArray(rolls) ? rolls : rolls ? [ rolls ] : [];
  const out = [];
  [ [ "nativeHit", "Native" ], [ "toughTreeCrit", "Tough Tree" ], [ "rockGolemCrit", "Rock Golem" ], [ "turnaroundHit", "Tree Turnaround" ], [ "instantMineHit", "Pickaxe Shark" ], [ "instantHit", "Crimstone Clam" ] ].forEach(([prop, label]) => {
    const n = list.filter(r => r && r[prop]).length;
    if (n) out.push(n > 1 ? `${label} x${n}` : label);
  });
  return out;
}

function farmPanelComputeInProgressRaw(json, opts) {
  const mapMode = !!(opts && opts.mapMode);
  const mapPicks = opts && Array.isArray(opts.mapPicks) ? opts.mapPicks : [];
  const mapPickNo = new Map;
  const mapAutoNo = new Map;
  const g = farmSyncExtractGameState(json);
  const now = Date.now();
  const rows = [];
  farmPanelAnimalYieldGroupsByType = {};
  farmPanelAnimalBuffTrackingByType = {};
  const farmActivity = farmPanelField(g, "farmActivity") || {};
  const cropWeatherDestruction = computeDestroyedCropPlotIds(g);
  const cropWeatherDestructionLabel = cropWeatherDestruction.activeEvent ? (CALENDAR_SEASONAL_BOOSTS.find(e => e.calendarKey === cropWeatherDestruction.activeEvent) || {}).name || null : null;
  const addPlanted = (bag, subKey, kind) => {
    if (!bag || typeof bag !== "object") return;
    const sequentialCounterBaseByName = {};
    const sequentialIndexByName = {};
    const plotIndexByName = {};
    if (kind === "crop" || kind === "fruit" || kind === "greenhouse") {
      Object.values(bag).forEach(plot => {
        const job = plot && plot[subKey];
        const name = job && job.name;
        const plantedAt = job && job.plantedAt;
        if (!name || !farmPanelIsPlanted(job, kind)) return;
        const refTime = job.harvestedAt && job.harvestedAt > plantedAt ? job.harvestedAt : plantedAt;
        const growSec = farmPanelGrowTimeSec(name);
        const elapsedSec = (now - refTime) / 1e3;
        const remainingSec = growSec != null ? Math.max(0, growSec - elapsedSec) : null;
        const isReadyNow = remainingSec != null ? remainingSec <= 0 : false;
        const storedAmount = typeof job.amount === "number" ? job.amount : null;
        if (storedAmount == null && !(name in sequentialCounterBaseByName)) {
          sequentialCounterBaseByName[name] = farmActivity[`${name} Harvested`] || 0;
          sequentialIndexByName[name] = 0;
        }
      });
    }
    const mapPlotPositions = new Map;
    if (mapMode && (kind === "crop" || kind === "fruit")) {
      const groups = {};
      Object.entries(bag).forEach(([plotId, plot], order) => {
        const job = plot && plot[subKey];
        const name = job && job.name;
        const plantedAt = job && job.plantedAt;
        if (!name || !farmPanelIsPlanted(job, kind)) return;
        if (kind === "crop" && cropWeatherDestruction.activeEvent && cropWeatherDestruction.destroyedIds.has(plotId)) return;
        const refTime = job.harvestedAt && job.harvestedAt > plantedAt ? job.harvestedAt : plantedAt;
        const growSec = farmPanelGrowTimeSec(name);
        const windowedWait = farmPanelWindowedRemainingSec(g, kind, job, plot, refTime, now);
        const waitSec = windowedWait != null ? windowedWait : growSec != null ? Math.max(0, growSec - (now - refTime) / 1e3) : 0;
        (groups[name] = groups[name] || []).push({
          key: plotId,
          id: `${kind}:${plotId}`,
          waitSec: waitSec,
          order: order
        });
      });
      Object.values(groups).forEach(list => farmPanelAssignMapPositions(list, mapPlotPositions, mapPicks, mapPickNo, null, mapAutoNo));
    }
    Object.entries(bag).forEach(([plotId, plot]) => {
      const job = plot && plot[subKey];
      const name = job && job.name;
      const plantedAt = job && job.plantedAt;
      if (!name || !farmPanelIsPlanted(job, kind)) return;
      const isWeatherDestroyedPlot = kind === "crop" && !!cropWeatherDestruction.activeEvent && cropWeatherDestruction.destroyedIds.has(plotId);
      const refTime = job.harvestedAt && job.harvestedAt > plantedAt ? job.harvestedAt : plantedAt;
      const growSec = farmPanelGrowTimeSec(name);
      const elapsedSec = (now - refTime) / 1e3;
      const windowedRemaining = farmPanelWindowedRemainingSec(g, kind, job, plot, refTime, now);
      const remainingSec = windowedRemaining != null ? windowedRemaining : growSec != null ? Math.max(0, growSec - elapsedSec) : null;
      const isReadyNow = isWeatherDestroyedPlot ? false : remainingSec != null ? remainingSec <= 0 : false;
      const storedAmount = typeof job.amount === "number" ? job.amount : null;
      const plotIdx = (plotIndexByName[name] || 0) + 1;
      plotIndexByName[name] = plotIdx;
      let exactAmount = null;
      let exactBoosts = null;
      let seedReward = null;
      if (isWeatherDestroyedPlot) {
        exactAmount = 0;
        exactBoosts = [ {
          name: cropWeatherDestructionLabel || "Weather Event",
          valueText: "Plot destroyed — cannot be harvested"
        } ];
      } else if (kind === "flower") {
        try {
          const r = fpYieldAt("flower", remainingSec != null ? now + remainingSec * 1e3 : now, () => farmPanelComputeExactFlowerYield(job));
          exactAmount = r.amount;
          exactBoosts = r.boosts;
        } catch (e) {
          exactAmount = null;
          exactBoosts = null;
        }
      } else if (kind === "crop" || kind === "fruit" || kind === "greenhouse") {
        try {
          const idx = mapMode ? mapPlotPositions.get(plotId) || 0 : sequentialIndexByName[name] || 0;
          const counter = (sequentialCounterBaseByName[name] || 0) + idx;
          sequentialIndexByName[name] = idx + 1;
          let r = null;
          if (kind === "crop") {
            const predictedReadyAt = remainingSec != null ? now + remainingSec * 1e3 : now;
            r = fpYieldAt("crop", predictedReadyAt, () => farmPanelComputeExactCropYield(json, g, name, plot, counter, false, predictedReadyAt));
          } else if (kind === "fruit") {
            r = fpYieldAt("fruit", remainingSec != null ? now + remainingSec * 1e3 : now, () => farmPanelComputeExactFruitYield(json, g, name, counter, false, plot && plot.fertiliser && plot.fertiliser.name));
          } else if (kind === "greenhouse") {
            r = fpYieldAt("greenhouse", remainingSec != null ? now + remainingSec * 1e3 : now, () => farmPanelComputeExactGreenhouseYield(json, g, name, counter, plot && plot.fertiliser && plot.fertiliser.name, remainingSec != null ? now + remainingSec * 1e3 : now));
          }
          if (r) {
            exactAmount = r.amount;
            exactBoosts = r.boosts;
            if (kind === "crop" && r.seedReward) seedReward = r.seedReward;
          }
        } catch (e) {
          exactAmount = null;
          exactBoosts = null;
        }
      }
      const actualAmount = exactAmount != null ? exactAmount : storedAmount;
      const actualBoosts = exactAmount != null ? exactBoosts : null;
      const harvestsLeft = kind === "fruit" && job && typeof job.harvestsLeft === "number" ? job.harvestsLeft : undefined;
      rows.push({
        name: name,
        qty: actualAmount,
        ready: isWeatherDestroyedPlot ? false : remainingSec != null ? remainingSec <= 0 : null,
        remainingSec: remainingSec,
        isActualYield: actualAmount != null,
        isDeterministicYield: kind === "flower",
        exactBoosts: actualAmount != null ? actualBoosts || [] : null,
        harvestsLeft: harvestsLeft,
        plotIndex: plotIdx,
        seedReward: seedReward,
        mutantReward: kind === "flower" ? farmPanelJobMutantReward(job) : null,
        mapKey: kind === "crop" || kind === "fruit" ? `${kind}:${plotId}` : null,
        mapPickNo: kind === "crop" || kind === "fruit" ? mapPickNo.get(`${kind}:${plotId}`) || null : null,
        mapAutoNo: kind === "crop" || kind === "fruit" ? mapAutoNo.get(`${kind}:${plotId}`) || null : null,
        mapPos: kind === "greenhouse" ? null : farmPanelMapPos(plotId, plot, kind === "fruit" ? 2 : kind === "flower" ? 3 : 1, kind === "fruit" ? 2 : 1),
        weatherDestroyed: isWeatherDestroyedPlot,
        weatherDestroyedEvent: isWeatherDestroyedPlot ? cropWeatherDestructionLabel : null
      });
    });
  };
  addPlanted(farmPanelField(g, "crops"), "crop", "crop");
  addPlanted(farmPanelField(g, "fruitPatches"), "fruit", "fruit");
  const greenhouse = farmPanelField(g, "greenhouse");
  if (greenhouse && greenhouse.pots) addPlanted(greenhouse.pots, "plant", "greenhouse");
  const flowers = farmPanelField(g, "flowers");
  if (flowers && flowers.flowerBeds) addPlanted(flowers.flowerBeds, "flower", "flower");
  [ [ "stones", "stone", "Stone" ], [ "iron", "stone", "Iron" ], [ "gold", "stone", "Gold" ], [ "crimstones", "stone", "Crimstone" ], [ "trees", "wood", "Wood" ] ].forEach(([bagKey, subKey, resourceName]) => {
    const bag = farmPanelField(g, bagKey);
    if (!bag || typeof bag !== "object") return;
    const tiers = RESOURCE_NODE_TIERS[resourceName] || null;
    const boostedForResource = tiers ? farmPanelGetBoostedYieldStats(resourceName) : null;
    const woodSequentialRollsByType = {};
    const stoneSequentialRollsByType = {};
    const ironSequentialRollsByType = {};
    const goldSequentialRollsByType = {};
    const sequentialIndexByType = {};
    if ([ "Wood", "Stone", "Iron", "Gold" ].includes(resourceName)) {
      const allCountByType = {};
      Object.values(bag).forEach(node => {
        const type = resourceName === "Wood" ? farmPanelTreeTypeForNode(node) : resourceName === "Stone" ? farmPanelRockNameForNode(node, STONE_KNOWN_IDS, "Stone Rock") : resourceName === "Iron" ? farmPanelRockNameForNode(node, IRON_KNOWN_IDS, "Iron Rock") : farmPanelRockNameForNode(node, GOLD_KNOWN_IDS, "Gold Rock");
        allCountByType[type] = (allCountByType[type] || 0) + 1;
      });
      if (resourceName === "Wood") {
        Object.keys(TREE_KNOWN_IDS).forEach(t => {
          woodSequentialRollsByType[t] = farmPanelBuildSequentialWoodRollChains(json, t, allCountByType[t] || 0);
          sequentialIndexByType[t] = 0;
        });
      }
      if (resourceName === "Stone") {
        Object.keys(STONE_KNOWN_IDS).forEach(t => {
          stoneSequentialRollsByType[t] = farmPanelBuildSequentialStoneRolls(json, t, allCountByType[t] || 0);
          sequentialIndexByType[t] = 0;
        });
      }
      if (resourceName === "Iron") {
        Object.keys(IRON_KNOWN_IDS).forEach(t => {
          ironSequentialRollsByType[t] = farmPanelBuildSequentialIronRolls(json, t, allCountByType[t] || 0);
          sequentialIndexByType[t] = 0;
        });
      }
      if (resourceName === "Gold") {
        Object.keys(GOLD_KNOWN_IDS).forEach(t => {
          goldSequentialRollsByType[t] = farmPanelBuildSequentialGoldRollChains(json, t, allCountByType[t] || 0);
          sequentialIndexByType[t] = 0;
        });
      }
    }
    let crimstoneRollChains = null;
    if (resourceName === "Crimstone") {
      crimstoneRollChains = farmPanelBuildSequentialCrimstoneRollChains(json, Object.values(bag).length);
    }
    const mapNodePositions = new Map;
    if (mapMode) {
      const groups = {};
      Object.entries(bag).forEach(([nodeId, node], order) => {
        const job = node && node[subKey];
        const ts = job && (job.minedAt || job.choppedAt || job.harvestedAt || job.stoneMinedAt || job.recoveredAt) || node && (node.minedAt || node.choppedAt || node.harvestedAt);
        const growSec = farmPanelGrowTimeSec(resourceName);
        let waitSec = 0;
        if (!ts) {
          const amountVal = job && typeof job.amount === "number" ? job.amount : node && typeof node.amount === "number" ? node.amount : null;
          waitSec = amountVal === 0 ? growSec != null ? growSec : 0 : 0;
        } else {
          const windowedWait = farmPanelNodeWindowedRemainingSec(g, resourceName, job, ts, now);
          if (windowedWait != null) waitSec = windowedWait; else if (growSec != null) waitSec = Math.max(0, growSec - (now - ts) / 1e3);
        }
        const type = resourceName === "Wood" ? farmPanelTreeTypeForNode(node) : resourceName === "Stone" ? farmPanelRockNameForNode(node, STONE_KNOWN_IDS, "Stone Rock") : resourceName === "Iron" ? farmPanelRockNameForNode(node, IRON_KNOWN_IDS, "Iron Rock") : resourceName === "Gold" ? farmPanelRockNameForNode(node, GOLD_KNOWN_IDS, "Gold Rock") : "Crimstone";
        (groups[type] = groups[type] || []).push({
          key: node,
          id: `${bagKey}:${nodeId}`,
          mult: node && typeof node.multiplier === "number" ? node.multiplier : 1,
          waitSec: waitSec,
          order: order
        });
      });
      const rollsByTypeForMap = resourceName === "Wood" ? woodSequentialRollsByType : resourceName === "Stone" ? stoneSequentialRollsByType : resourceName === "Iron" ? ironSequentialRollsByType : resourceName === "Gold" ? goldSequentialRollsByType : resourceName === "Crimstone" ? {
        Crimstone: crimstoneRollChains
      } : null;
      Object.keys(groups).forEach(type => {
        const typeRolls = rollsByTypeForMap ? rollsByTypeForMap[type] : null;
        const procAt = typeRolls ? idx => !!(typeRolls[idx] && farmPanelCollectMapProcs(typeRolls[idx]).length) : null;
        farmPanelAssignMapPositions(groups[type], mapNodePositions, mapPicks, mapPickNo, procAt, mapAutoNo);
      });
    }
    let crimstoneSequentialIndex = 0;
    Object.entries(bag).forEach(([nodeId, node]) => {
      const job = node && node[subKey];
      const ts = job && (job.minedAt || job.choppedAt || job.harvestedAt || job.stoneMinedAt || job.recoveredAt) || node && (node.minedAt || node.choppedAt || node.harvestedAt);
      const nodeMapKey = `${bagKey}:${nodeId}`;
      const tierMatch = tiers ? farmPanelDetectNodeTier(resourceName, node) : null;
      const tierLabel = tierMatch && tierMatch.key !== "base" ? tierMatch.label : null;
      const treeType = resourceName === "Wood" ? farmPanelTreeTypeForNode(node) : null;
      const stoneRockName = resourceName === "Stone" ? farmPanelRockNameForNode(node, STONE_KNOWN_IDS, "Stone Rock") : null;
      const ironRockName = resourceName === "Iron" ? farmPanelRockNameForNode(node, IRON_KNOWN_IDS, "Iron Rock") : null;
      const goldRockName = resourceName === "Gold" ? farmPanelRockNameForNode(node, GOLD_KNOWN_IDS, "Gold Rock") : null;
      const isReadyNow = farmPanelIsNodeReadyNow(resourceName, node, subKey, now, g);
      const storedAmount = job && typeof job.amount === "number" ? job.amount : null;
      const growSecForNode = farmPanelGrowTimeSec(resourceName);
      const windowedNodeRemaining = farmPanelNodeWindowedRemainingSec(g, resourceName, job, ts, now);
      const remainingSecForNode = windowedNodeRemaining != null ? windowedNodeRemaining : ts && growSecForNode != null ? Math.max(0, growSecForNode - (now - ts) / 1e3) : null;
      const predictedMineAt = remainingSecForNode != null ? now + remainingSecForNode * 1e3 : now;
      let exactAmount = null;
      let exactBoosts = null;
      let woodCritRollsForNode = null;
      let woodChainForNode = null;
      let goldCritRollsForNode = null;
      let goldChainForNode = null;
      let crimstoneChainForNode = null;
      let crimstoneNodeIndexForRow = null;
      let crimstoneRockMinesLeftForRow = null;
      let mapProcsForRow = null;
      if (storedAmount == null && resourceName === "Crimstone") {
        const idx = mapMode ? mapNodePositions.get(node) || 0 : crimstoneSequentialIndex++;
        crimstoneNodeIndexForRow = idx + 1;
        const chain = crimstoneRollChains && crimstoneRollChains[idx] ? crimstoneRollChains[idx] : null;
        crimstoneChainForNode = chain;
        mapProcsForRow = farmPanelCollectMapProcs(chain);
        const rockMinesLeftStart = node && typeof node.minesLeft === "number" ? node.minesLeft : 5;
        crimstoneRockMinesLeftForRow = rockMinesLeftStart;
        if (chain && chain.length > 1) {
          let minesLeftCursor = rockMinesLeftStart;
          let total = 0;
          const chainBoostTotals = new Map;
          chain.forEach((roll, i) => {
            const r = farmPanelComputeExactCrimstoneYield(g, node, minesLeftCursor, i === 0);
            total += r.amount;
            (r.boosts || []).forEach(b => {
              const amt = parseYieldBoostAmount(b.valueText);
              chainBoostTotals.set(b.name, (chainBoostTotals.get(b.name) || 0) + amt);
            });
            if (i > 0) chainBoostTotals.set("Crimstone Clam", (chainBoostTotals.get("Crimstone Clam") || 0) + 1);
            minesLeftCursor = minesLeftCursor === 1 ? 5 : minesLeftCursor - 1;
          });
          exactAmount = total;
          exactBoosts = Array.from(chainBoostTotals.entries()).map(([name, amt]) => ({
            name: name,
            valueText: `+${fmt(amt)} yield`
          }));
        } else {
          const r = farmPanelComputeExactCrimstoneYield(g, node, rockMinesLeftStart);
          exactAmount = r.amount;
          exactBoosts = r.boosts;
        }
      } else if (storedAmount == null && resourceName === "Wood" && treeType) {
        const idx = mapMode ? mapNodePositions.get(node) || 0 : sequentialIndexByType[treeType] || 0;
        const rolls = woodSequentialRollsByType[treeType];
        const chain = rolls && rolls[idx] ? rolls[idx] : null;
        if (chain) sequentialIndexByType[treeType] = idx + 1;
        const critRolls = chain && chain.length ? chain[0] : null;
        woodCritRollsForNode = critRolls;
        woodChainForNode = chain;
        mapProcsForRow = farmPanelCollectMapProcs(chain);
        const woodGainRec = new Map;
        if (chain && chain.length) {
          exactAmount = fpYieldAt("wood", predictedMineAt, () => chain.reduce((sum, roll) => sum + farmPanelComputeExactWoodYieldForNode(node, treeType, roll, woodGainRec), 0));
        } else {
          exactAmount = fpYieldAt("wood", predictedMineAt, () => farmPanelComputeExactWoodYieldForNode(node, treeType, critRolls, woodGainRec));
        }
        if (exactAmount != null) exactBoosts = farmPanelGainsToBoosts(woodGainRec);
      } else if (storedAmount == null && resourceName === "Stone" && stoneRockName) {
        const idx = mapMode ? mapNodePositions.get(node) || 0 : sequentialIndexByType[stoneRockName] || 0;
        const rolls = stoneSequentialRollsByType[stoneRockName];
        const critRolls = rolls && rolls[idx] ? rolls[idx] : null;
        if (critRolls) sequentialIndexByType[stoneRockName] = idx + 1;
        mapProcsForRow = farmPanelCollectMapProcs(critRolls);
        const stoneGainRec = new Map;
        exactAmount = fpYieldAt("stone", predictedMineAt, () => farmPanelComputeExactStoneYieldForNode(json, node, stoneRockName, critRolls, predictedMineAt, stoneGainRec));
        if (exactAmount != null) exactBoosts = farmPanelGainsToBoosts(stoneGainRec);
      } else if (storedAmount == null && resourceName === "Iron" && ironRockName) {
        const idx = mapMode ? mapNodePositions.get(node) || 0 : sequentialIndexByType[ironRockName] || 0;
        const rolls = ironSequentialRollsByType[ironRockName];
        const critRolls = rolls && rolls[idx] ? rolls[idx] : null;
        if (critRolls) sequentialIndexByType[ironRockName] = idx + 1;
        mapProcsForRow = farmPanelCollectMapProcs(critRolls);
        const ironGainRec = new Map;
        exactAmount = farmPanelComputeExactIronYieldForNode(json, node, ironRockName, critRolls, predictedMineAt, ironGainRec);
        if (exactAmount != null) exactBoosts = farmPanelGainsToBoosts(ironGainRec);
      } else if (storedAmount == null && resourceName === "Gold" && goldRockName) {
        const idx = mapMode ? mapNodePositions.get(node) || 0 : sequentialIndexByType[goldRockName] || 0;
        const rolls = goldSequentialRollsByType[goldRockName];
        const chain = rolls && rolls[idx] ? rolls[idx] : null;
        if (chain) sequentialIndexByType[goldRockName] = idx + 1;
        const critRolls = chain && chain.length ? chain[0] : null;
        goldCritRollsForNode = critRolls;
        goldChainForNode = chain;
        mapProcsForRow = farmPanelCollectMapProcs(chain);
        const goldGainRec = new Map;
        if (chain && chain.length) {
          exactAmount = chain.reduce((sum, roll, i) => sum + farmPanelComputeExactGoldYieldForNode(json, node, goldRockName, roll, predictedMineAt, i === 0 ? goldGainRec : null), 0);
        } else {
          exactAmount = farmPanelComputeExactGoldYieldForNode(json, node, goldRockName, critRolls, predictedMineAt, goldGainRec);
        }
        if (exactAmount != null) exactBoosts = farmPanelGainsToBoosts(goldGainRec);
      }
      const actualAmount = storedAmount != null ? storedAmount : exactAmount;
      const tierGroupLabel = tierMatch ? tierMatch.displayLabel || tierMatch.label : resourceName === "Crimstone" ? "Crimstone Rock" : null;
      const tierAverageYield = tierMatch ? (boostedForResource.perTierYield && boostedForResource.perTierYield[tierMatch.key] != null ? boostedForResource.perTierYield[tierMatch.key] : boostedForResource.yieldVal) * tierMatch.mult + tierMatch.yieldAdd : null;
      const qty = actualAmount != null ? actualAmount : tierAverageYield;
      const turnaroundPredicted = treeType ? Boolean(woodChainForNode && woodChainForNode.length > 1) : null;
      const turnaroundBonusEstimate = turnaroundPredicted ? woodChainForNode.slice(1).reduce((sum, roll) => sum + farmPanelComputeExactWoodYieldForNode(node, treeType, roll), 0) : null;
      const turnaroundChainLength = woodChainForNode ? woodChainForNode.length : null;
      const goldInstantMinePredicted = goldRockName ? Boolean(goldChainForNode && goldChainForNode.length > 1) : null;
      const goldInstantMineBonusEstimate = goldInstantMinePredicted ? goldChainForNode.slice(1).reduce((sum, roll) => sum + farmPanelComputeExactGoldYieldForNode(json, node, goldRockName, roll, predictedMineAt), 0) : null;
      const goldInstantMineChainLength = goldChainForNode ? goldChainForNode.length : null;
      const crimstoneInstantMinePredicted = resourceName === "Crimstone" ? Boolean(crimstoneChainForNode && crimstoneChainForNode.length > 1) : null;
      let crimstoneInstantMineBonusEstimate = null;
      if (crimstoneInstantMinePredicted) {
        const rockMinesLeftStart = node && typeof node.minesLeft === "number" ? node.minesLeft : 5;
        let minesLeftCursor = rockMinesLeftStart;
        let bonus = 0;
        crimstoneChainForNode.forEach((roll, i) => {
          if (i > 0) bonus += farmPanelComputeExactCrimstoneYield(g, node, minesLeftCursor, false).amount;
          minesLeftCursor = minesLeftCursor === 1 ? 5 : minesLeftCursor - 1;
        });
        crimstoneInstantMineBonusEstimate = bonus;
      }
      const crimstoneInstantMineChainLength = crimstoneChainForNode ? crimstoneChainForNode.length : null;
      const crimstoneClamActiveForRow = resourceName === "Crimstone" ? isBoostActive("crimstone_clam") : false;
      if (!ts) {
        const amountVal = job && typeof job.amount === "number" ? job.amount : node && typeof node.amount === "number" ? node.amount : null;
        const looksDepleted = amountVal === 0;
        const growSecFallback = farmPanelGrowTimeSec(resourceName);
        rows.push({
          name: resourceName,
          qty: qty,
          ready: !looksDepleted,
          remainingSec: looksDepleted ? growSecFallback ?? 0 : 0,
          tierLabel: tierLabel,
          tierGroupLabel: tierGroupLabel,
          isActualYield: actualAmount != null,
          isDeterministicYield: resourceName === "Crimstone" ? !crimstoneClamActiveForRow : false,
          treeType: treeType,
          turnaroundPredicted: turnaroundPredicted,
          turnaroundBonusEstimate: turnaroundBonusEstimate,
          turnaroundChainLength: turnaroundChainLength,
          goldRockName: goldRockName,
          goldInstantMinePredicted: goldInstantMinePredicted,
          goldInstantMineBonusEstimate: goldInstantMineBonusEstimate,
          goldInstantMineChainLength: goldInstantMineChainLength,
          crimstoneInstantMinePredicted: crimstoneInstantMinePredicted,
          crimstoneInstantMineBonusEstimate: crimstoneInstantMineBonusEstimate,
          crimstoneInstantMineChainLength: crimstoneInstantMineChainLength,
          crimstoneNodeIndex: crimstoneNodeIndexForRow,
          crimstoneMinesLeft: crimstoneRockMinesLeftForRow,
          mapProcs: mapProcsForRow,
          mapKey: nodeMapKey,
          mapPickNo: mapPickNo.get(nodeMapKey) || null,
          mapAutoNo: mapAutoNo.get(nodeMapKey) || null,
          mapPos: farmPanelMapPos(null, node, resourceName === "Wood" || resourceName === "Crimstone" ? 2 : 1, resourceName === "Wood" || resourceName === "Crimstone" ? 2 : 1),
          exactBoosts: exactBoosts
        });
        return;
      }
      const growSec = farmPanelGrowTimeSec(resourceName);
      const elapsedSec = (now - ts) / 1e3;
      const remainingSec = windowedNodeRemaining != null ? windowedNodeRemaining : growSec != null ? Math.max(0, growSec - elapsedSec) : null;
      rows.push({
        name: resourceName,
        qty: qty,
        ready: remainingSec != null ? remainingSec <= 0 : null,
        remainingSec: remainingSec,
        tierLabel: tierLabel,
        tierGroupLabel: tierGroupLabel,
        isActualYield: actualAmount != null,
        isDeterministicYield: resourceName === "Crimstone" ? !crimstoneClamActiveForRow : false,
        treeType: treeType,
        turnaroundPredicted: turnaroundPredicted,
        turnaroundBonusEstimate: turnaroundBonusEstimate,
        turnaroundChainLength: turnaroundChainLength,
        goldRockName: goldRockName,
        goldInstantMinePredicted: goldInstantMinePredicted,
        goldInstantMineBonusEstimate: goldInstantMineBonusEstimate,
        goldInstantMineChainLength: goldInstantMineChainLength,
        crimstoneInstantMinePredicted: crimstoneInstantMinePredicted,
        crimstoneInstantMineBonusEstimate: crimstoneInstantMineBonusEstimate,
        crimstoneInstantMineChainLength: crimstoneInstantMineChainLength,
        crimstoneNodeIndex: crimstoneNodeIndexForRow,
        crimstoneMinesLeft: crimstoneRockMinesLeftForRow,
        mapProcs: mapProcsForRow,
        mapKey: nodeMapKey,
        mapPickNo: mapPickNo.get(nodeMapKey) || null,
        mapAutoNo: mapAutoNo.get(nodeMapKey) || null,
        mapPos: farmPanelMapPos(null, node, resourceName === "Wood" || resourceName === "Crimstone" ? 2 : 1, resourceName === "Wood" || resourceName === "Crimstone" ? 2 : 1),
        exactBoosts: exactBoosts
      });
    });
  });
  const oilReserves = farmPanelField(g, "oilReserves");
  if (oilReserves && typeof oilReserves === "object") {
    Object.values(oilReserves).forEach(node => {
      const job = node && node.oil;
      const ts = job && job.drilledAt;
      const drilledCount = typeof node?.drilled === "number" ? node.drilled : null;
      const hasBonus = drilledCount != null ? (drilledCount + 1) % 3 === 0 : null;
      let oilQtyPerNode, exactOilBoosts, oilMinesUntilBonus;
      if (hasBonus == null) {
        oilQtyPerNode = computeBoostedResourceStats("Oil", RESOURCE_DATA.Oil.yieldPer, RESOURCE_DATA.Oil.timeSec).yieldVal;
        exactOilBoosts = null;
        oilMinesUntilBonus = null;
      } else {
        const oilYieldTs = job && job.drilledAt;
        const oilYieldWait = oilYieldTs ? farmPanelNodeWindowedRemainingSec(g, "Oil", job, oilYieldTs, now) : null;
        const exact = fpYieldAt("oil", oilYieldWait != null ? now + oilYieldWait * 1e3 : now, () => farmPanelComputeExactOilYield(hasBonus));
        oilQtyPerNode = exact.amount;
        exactOilBoosts = exact.boosts;
        oilMinesUntilBonus = (2 - drilledCount % 3 + 3) % 3 + 1;
      }
      if (!ts) {
        rows.push({
          name: "Oil",
          qty: oilQtyPerNode,
          ready: true,
          remainingSec: 0,
          isActualYield: hasBonus != null,
          isDeterministicYield: hasBonus != null,
          exactBoosts: exactOilBoosts,
          oilMinesUntilBonus: oilMinesUntilBonus,
          mapPos: farmPanelMapPos(null, node, 2, 2)
        });
        return;
      }
      const growSec = farmPanelGrowTimeSec("Oil");
      const elapsedSec = (now - ts) / 1e3;
      const windowedOilRemaining = farmPanelNodeWindowedRemainingSec(g, "Oil", job, ts, now);
      const remainingSec = windowedOilRemaining != null ? windowedOilRemaining : growSec != null ? Math.max(0, growSec - elapsedSec) : null;
      rows.push({
        name: "Oil",
        qty: oilQtyPerNode,
        ready: remainingSec != null ? remainingSec <= 0 : null,
        remainingSec: remainingSec,
        isActualYield: hasBonus != null,
        isDeterministicYield: hasBonus != null,
        exactBoosts: exactOilBoosts,
        oilMinesUntilBonus: oilMinesUntilBonus,
          mapPos: farmPanelMapPos(null, node, 2, 2)
      });
    });
  }
  const lavaPits = farmPanelField(g, "lavaPits");
  if (lavaPits && typeof lavaPits === "object" && typeof computeBoostedLavaPitStats === "function") {
    const boostedLava = computeBoostedLavaPitStats(259200);
    Object.values(lavaPits).forEach(pit => {
      if (!pit || pit.x === undefined || pit.y === undefined) return;
      const readyAt = typeof pit.readyAt === "number" ? pit.readyAt : null;
      const createdAt = typeof pit.createdAt === "number" ? pit.createdAt : null;
      if (readyAt == null) return;
      if (createdAt != null && readyAt <= createdAt) return;
      const collectedAt = typeof pit.collectedAt === "number" ? pit.collectedAt : null;
      if (collectedAt != null && collectedAt >= readyAt) return;
      const remainingSec = Math.max(0, (readyAt - now) / 1e3);
      rows.push({
        name: "Obsidian",
        qty: boostedLava.yieldVal,
        ready: remainingSec <= 0,
        remainingSec: remainingSec,
        mapPos: farmPanelMapPos(null, pit, 2, 2)
      });
    });
  }
  const sunstoneRocks = farmPanelField(g, "sunstones");
  if (sunstoneRocks && typeof sunstoneRocks === "object") {
    const sunstoneRecoverySec = 3 * 24 * 60 * 60;
    Object.entries(sunstoneRocks).forEach(([rockId, rock]) => {
      if (!rock || typeof rock !== "object") return;
      const minedAt = rock.stone && typeof rock.stone.minedAt === "number" ? rock.stone.minedAt : 0;
      const remainingSec = minedAt > 0 ? Math.max(0, sunstoneRecoverySec - (now - minedAt) / 1e3) : 0;
      rows.push({
        name: "Sunstone",
        qty: 1,
        ready: remainingSec <= 0,
        remainingSec: remainingSec,
        isActualYield: true,
        isDeterministicYield: true,
        sunstoneMinesLeft: typeof rock.minesLeft === "number" ? rock.minesLeft : null,
        mapPos: farmPanelMapPos(rockId, rock, 2, 2)
      });
    });
  }
  {
    const saltFarmObj = farmPanelField(g, "saltFarm");
    const saltLevelRaw = saltFarmObj && saltFarmObj.level;
    const saltLevel = typeof saltLevelRaw === "number" ? saltLevelRaw : typeof saltLevelRaw === "string" && saltLevelRaw.trim() && !isNaN(Number(saltLevelRaw)) ? Number(saltLevelRaw) : null;
    const saltYieldBonus = typeof getActiveSaltYieldBonus === "function" ? getActiveSaltYieldBonus() : 0;
    const saltYield = typeof SALT_BASE_YIELD === "number" ? SALT_BASE_YIELD + saltYieldBonus : null;
    const saltNodes = saltFarmObj && typeof saltFarmObj.nodes === "object" ? saltFarmObj.nodes : null;
    if (saltNodes && Object.keys(saltNodes).length) {
      const rechargeMult = typeof getActiveSaltRechargeMult === "function" ? getActiveSaltRechargeMult() : 1;
      const sculptureChargeMult = typeof sculptureEffects === "function" ? sculptureEffects().chargeTimeMult : 1;
      const intervalMs = SALT_BASE_TIME_SEC * 1e3 * sculptureChargeMult * rechargeMult;
      const sculptLvl = typeof saltSculptureLevel === "number" ? saltSculptureLevel : 0;
      const maxCharges = SALT_BASE_CHARGE_CAP + (sculptLvl >= 3 ? 1 : 0) + (sculptLvl >= 6 ? 1 : 0);
      const physicalNodeCount = Object.keys(saltNodes).length;
      const saltNodeKeysSorted = Object.keys(saltNodes).sort();
      const saltNodeStates = [];
      saltNodeKeysSorted.forEach((nodeKey, nodeIdx) => {
        const node = saltNodes[nodeKey];
        const salt = node && node.salt;
        if (!salt) return;
        let storedCharges = Math.max(0, Math.min(typeof salt.storedCharges === "number" ? salt.storedCharges : 0, maxCharges));
        let nextChargeAt = Number.isFinite(salt.nextChargeAt) ? salt.nextChargeAt : now + intervalMs;
        while (now >= nextChargeAt && storedCharges < maxCharges) {
          storedCharges += 1;
          nextChargeAt += intervalMs;
        }
        if (nextChargeAt < now) {
          const missedIntervals = Math.ceil((now - nextChargeAt) / intervalMs);
          nextChargeAt += missedIntervals * intervalMs;
        }
        saltNodeStates.push({
          nodeIdx: nodeIdx,
          storedCharges: storedCharges,
          nextChargeAt: nextChargeAt
        });
      });
      const seaBlessedChain = farmPanelSimulateSeaBlessedChain(g, saltNodeStates, maxCharges, saltYield, intervalMs, now);
      saltNodeStates.forEach((state, stateIdx) => {
        const storedCharges = state.storedCharges;
        const seaBlessedRestored = seaBlessedChain ? seaBlessedChain.restoredPerNode[stateIdx] : 0;
        const saltNodeMeta = {
          saltNodeIndex: state.nodeIdx + 1,
          saltNodeStoredCharges: storedCharges,
          saltNodeMaxCharges: maxCharges,
          saltYieldPerCharge: saltYield,
          saltNodeSeaBlessedRestored: seaBlessedRestored,
          saltNodeSeaBlessedHarvests: seaBlessedChain ? seaBlessedChain.harvestsPerNode[stateIdx] : 0,
          saltNodeSeaBlessedProcs: seaBlessedChain ? seaBlessedChain.nowProcs.filter(pr => pr.nodeIndex === state.nodeIdx + 1) : [],
          saltNodeSeaBlessedFuture: seaBlessedChain ? seaBlessedChain.futureProcs.filter(pr => pr.nodeIndex === state.nodeIdx + 1) : [],
          saltNodeSeaBlessedWindowRestored: seaBlessedChain ? seaBlessedChain.windowRestoredPerNode[stateIdx] : 0,
          seaBlessedChain: seaBlessedChain
        };
        for (let i = 0; i < storedCharges; i++) {
          rows.push({
            name: "Salt",
            qty: saltYield,
            ready: true,
            remainingSec: 0,
            physicalNodes: physicalNodeCount,
            ...saltNodeMeta
          });
        }
        if (storedCharges < maxCharges) {
          const remainingSec = Math.max(0, (state.nextChargeAt - now) / 1e3);
          rows.push({
            name: "Salt",
            qty: 0,
            ready: false,
            remainingSec: remainingSec,
            physicalNodes: physicalNodeCount,
            ...saltNodeMeta
          });
        }
      });
      if (seaBlessedChain && seaBlessedChain.restoredTotal > 0) {
        for (let i = 0; i < seaBlessedChain.restoredTotal; i++) {
          rows.push({
            name: "Salt",
            qty: saltYield,
            ready: true,
            remainingSec: 0,
            physicalNodes: physicalNodeCount,
            seaBlessedBonus: true,
            seaBlessedChain: seaBlessedChain
          });
        }
      }
    } else if (saltLevel != null && typeof FARM_LEVEL_NODES !== "undefined" && FARM_LEVEL_NODES.length) {
      const clampedLevel = Math.max(1, Math.min(FARM_LEVEL_NODES.length, saltLevel));
      const slots = FARM_LEVEL_NODES[clampedLevel - 1] || 0;
      for (let i = 0; i < slots; i++) {
        rows.push({
          name: "Salt",
          qty: saltYield,
          ready: true,
          remainingSec: 0,
          estimated: true
        });
      }
    }
  }
  const hiveBag = farmPanelField(g, "beehives");
  if (hiveBag && typeof hiveBag === "object" && typeof computeHiveStats === "function") {
    const hiveStats = computeHiveStats();
    const hiveEntries = Object.entries(hiveBag).filter(([, hive]) => hive && hive.honey && typeof hive.honey.produced === "number");
    hiveEntries.sort((a, b) => a[0].localeCompare(b[0], undefined, {
      numeric: true
    }));
    const honeyNow = Math.min(now, farmPanelHoneySnapshotMs);
    const flowerReadyAt = makeFlowerReadyResolver(g, farmPanelField(g, "flowers"), name => {
      const v = FLOWER_VARIETIES[name];
      const seed = v && FLOWER_SEEDS[v.seed];
      return seed ? seed.timeSec * 1e3 : null;
    });
    hiveEntries.forEach(([hiveId, hive], hiveIndex) => {
      const schedule = computeHiveSchedule(hive, honeyNow, flowerReadyAt);
      const produced = schedule.produced;
      const ready = schedule.ready;
      const remainingSec = ready ? 0 : schedule.readyAtMs != null ? Math.max(0, (schedule.readyAtMs - honeyNow) / 1e3) : null;
      const fillFraction = Math.max(0, Math.min(1, produced / HIVE_FULL_RAW));
      const currentHoneyQty = fillFraction * hiveStats.honeyPerFill;
      rows.push({
        name: "Honey",
        qty: currentHoneyQty,
        maxHoneyPerFill: hiveStats.honeyPerFill,
        fillFraction: fillFraction,
        hiveIndex: hiveIndex,
        hiveId: hiveId,
        willSwarm: hive.swarm === true,
        isActualYield: true,
        ready: ready,
        remainingSec: remainingSec,
        readyAtMs: !ready && schedule.readyAtMs != null ? schedule.readyAtMs : null,
        stallAtMs: !ready && schedule.stallAtMs != null ? schedule.stallAtMs : null,
        mapPos: farmPanelMapPos(hiveId, hive, 1, 1)
      });
    });
  }
  if (typeof computeAnimalTypeFigures === "function" && typeof computeAnimalYieldsForLevel === "function") {
    [ "chicken", "sheep", "cow", "pig" ].forEach(type => withAnimalFeedContext(type, farmPanelAnimalFreeFeed(type) ? "" : farmPanelAnimalFeedChoice[type] || "", () => {
      const bag = farmSyncGetAnimalRecords(g, type);
      if (!bag || typeof bag !== "object") return;
      const cycleSec = computeAnimalTypeFigures(type).cycleTimeSec || ANIMAL_BASE_CYCLE_SEC;
      const typeBoosts = getActiveAnimalBoosts(type);
      let baseFeedMultTotal = 1;
      let freeFeed = false;
      typeBoosts.forEach(b => {
        if (b.feedMult) baseFeedMultTotal *= b.feedMult;
        if (b.feedMultAll) baseFeedMultTotal *= b.feedMultAll;
        if (b.freeFeed) freeFeed = true;
      });
      const requiredQtyPerFeed = REQUIRED_FOOD_QTY_MAP[type];
      Object.entries(bag).forEach(([animalId, animal]) => {
        if (!animal || typeof animal !== "object") return;
        const toTs = v => typeof v === "number" ? v : typeof v === "string" && v.trim() && !isNaN(Number(v)) ? Number(v) : null;
        const asleepAt = toTs(animal.asleepAt ?? animal.sleepAt ?? animal.wentToSleepAt);
        const animalTypeName = String(animal.type || type).replace(/^./, c => c.toUpperCase());
        const awakeAt = typeof animal.baseDurationMs === "number" && asleepAt != null ? fpLimitedReadyAt(animalTypeName.toLowerCase(), asleepAt, animal.baseDurationMs, set => animalWindows(g, animalTypeName, set)) : toTs(animal.awakeAt);
        const stateStr = typeof animal.state === "string" ? animal.state.toLowerCase() : "";
        const sick = animal.sick === true || stateStr === "sick" || typeof animal.sickenedAt === "number";
        const xpRaw = animal.experience ?? animal.exp ?? animal.xp;
        const xp = typeof xpRaw === "number" ? xpRaw : typeof xpRaw === "string" && xpRaw.trim() && !isNaN(Number(xpRaw)) ? Number(xpRaw) : null;
        const lovedAt = toTs(animal.lovedAt);
        const readyAtMs = awakeAt != null ? awakeAt : asleepAt != null ? asleepAt + cycleSec * 1e3 : null;
        const claimedXpRaw = animal.claimedExperience;
        const claimedXp = typeof claimedXpRaw === "number" ? claimedXpRaw : typeof claimedXpRaw === "string" && claimedXpRaw.trim() && !isNaN(Number(claimedXpRaw)) ? Number(claimedXpRaw) : undefined;
        const progress = computeAnimalRealProgress(type, {
          xp: xp,
          claimedExperience: claimedXp,
          state: stateStr,
          item: animal.item,
          asleepAt: asleepAt,
          lovedAt: lovedAt,
          lovesThisSleep: typeof animal.lovesThisSleep === "number" ? animal.lovesThisSleep : undefined,
          freeFeed: freeFeed,
          muddy: type === "pig" ? !!(animal.mud && animal.mud.harvestsRemaining > 0) : undefined
        }, now, readyAtMs);
        const level = progress.shownLevel;
        const realFeedBuffName = animal.feedBuff && typeof animal.feedBuff === "object" && animal.feedBuff.name && (typeof animal.feedBuff.harvestsRemaining !== "number" || animal.feedBuff.harvestsRemaining > 0) ? animal.feedBuff.name : null;
        const feedProjection = farmPanelProjectAnimalXp(type, progress.xp, progress);
        const yieldLevel = progress.claimLevel;
        const fig = computeAnimalYieldsForLevel(type, yieldLevel, realFeedBuffName, animal.multiplier);
        const feedInfo = getActiveFeedInfo(progress.costFeedKey);
        let animalFeedMultTotal = baseFeedMultTotal;
        if (realFeedBuffName === "Honey Treat") animalFeedMultTotal *= .75;
        const animalFeedQty = freeFeed ? 0 : Math.max(0, progress.costFeeds * requiredQtyPerFeed * animalFeedMultTotal);
        const remainingFeedQty = freeFeed ? 0 : Math.max(0, progress.noOfFeeds * requiredQtyPerFeed * animalFeedMultTotal);
        const animalFeedCostFlower = animalFeedQty * feedInfo.cost / (coinPerFlower || 1);
        const animalConsumableCostFlower = realFeedBuffName === "Salt Lick" ? getSpiceCostPerUseFlower("saltLick") / getSpiceLickDurationHarvests() : realFeedBuffName === "Honey Treat" ? getSpiceCostPerUseFlower("honeyTreat") / getSpiceLickDurationHarvests() : realFeedBuffName === "Truffle Seasoning" ? getSpiceCostPerUseFlower("truffleSeasoning") / getTruffleSeasoningSleeps() : 0;
        let ready, remainingSec;
        if (sick) {
          ready = false;
          remainingSec = null;
        } else if (awakeAt != null) {
          remainingSec = Math.max(0, (awakeAt - now) / 1e3);
          ready = remainingSec <= 0;
        } else if (asleepAt != null) {
          const elapsedSec = (now - asleepAt) / 1e3;
          remainingSec = Math.max(0, cycleSec - elapsedSec);
          ready = remainingSec <= 0;
        } else {
          ready = false;
          remainingSec = cycleSec;
        }
        if (realFeedBuffName === "Salt Lick" || realFeedBuffName === "Honey Treat" || realFeedBuffName === "Truffle Seasoning") {
          const isSeasoningBuff = realFeedBuffName === "Truffle Seasoning";
          const harvestsRemaining = typeof animal.feedBuff.harvestsRemaining === "number" ? animal.feedBuff.harvestsRemaining : isSeasoningBuff ? getTruffleSeasoningSleeps() : getSpiceLickDurationHarvests();
          const buffCycleSec = isSeasoningBuff ? cycleSec / getSpiceEffectForAnimalType(type).timeMultAll * .5 : cycleSec;
          const bankedExtraClaims = realFeedBuffName === "Honey Treat" ? Math.max(0, progress.pendingClaims - 1) : 0;
          const buffRemainingSec = remainingSec != null ? Math.max(0, harvestsRemaining + bankedExtraClaims - 1) * buffCycleSec + remainingSec : null;
          if (!farmPanelAnimalBuffTrackingByType[type]) farmPanelAnimalBuffTrackingByType[type] = {
            saltLick: [],
            honeyTreat: [],
            truffleSeasoning: []
          };
          const bucket = realFeedBuffName === "Salt Lick" ? "saltLick" : isSeasoningBuff ? "truffleSeasoning" : "honeyTreat";
          farmPanelAnimalBuffTrackingByType[type][bucket].push({
            animalId: animalId,
            harvestsRemaining: harvestsRemaining,
            remainingSec: buffRemainingSec,
            feedQtySaved: realFeedBuffName === "Honey Treat" ? animalFeedQty / 3 : 0
          });
        }
        fig.products.forEach((pname, idx) => {
          rows.push({
            name: pname,
            qty: fig.yields[idx],
            ready: ready,
            remainingSec: remainingSec,
            sick: sick,
            animalId: animalId,
            feedBuffName: realFeedBuffName,
            feedCostFlowerShare: animalFeedCostFlower / fig.products.length,
            consumableCostFlowerShare: animalConsumableCostFlower / fig.products.length
          });
        });
        if (!farmPanelAnimalYieldGroupsByType[type]) farmPanelAnimalYieldGroupsByType[type] = [];
        const feedLabelUsed = FEED_LABELS[progress.costFeedKey] || progress.costFeedKey;
        const remainingFeedLabel = FEED_LABELS[progress.feedKeyUsed] || progress.feedKeyUsed;
        const feedQtyToNext = remainingFeedQty;
        farmPanelAnimalYieldGroupsByType[type].push({
          animalId: animalId,
          level: level,
          xp: typeof xp === "number" ? xp : 0,
          isReadyState: progress.isReadyState,
          pendingClaims: progress.pendingClaims,
          products: fig.products,
          yields: fig.yields,
          feedQty: animalFeedQty,
          feedName: feedLabelUsed,
          nextThreshold: progress.nextThreshold,
          nextLevelLabel: progress.nextLevelLabel,
          isMaxCycle: progress.isMaxCycle,
          feedsToNextCount: progress.noOfFeeds,
          feedQtyToNext: feedQtyToNext,
          feedToNextName: remainingFeedLabel,
          feedKeyUsed: progress.feedKeyUsed,
          shortId: String(animalId).slice(0, 8),
          xpNow: progress.xp,
          xpGap: progress.xpGap,
          xpPerFeed: progress.boostedFoodXp,
          projection: feedProjection,
          claimLevel: yieldLevel,
          loveXp: progress.expectedLoveXp,
          loveItem: progress.loveItem || animal.item || "",
          loveSlots: progress.loveSlots,
          isReady: ready,
          fedThisCycle: !sick && !ready && !progress.isReadyState && (stateStr === "happy" || stateStr === "sad" || stateStr === "" && (awakeAt != null || asleepAt != null))
        });
      });
    }));
  }
  rows.sort((a, b) => (a.remainingSec ?? 0) - (b.remainingSec ?? 0));
  if (mapMode) {
    const numberGroups = new Map;
    rows.forEach(r => {
      if (!r || !r.mapPos || r.mapAutoNo || r.mapPickNo) return;
      if (!numberGroups.has(r.name)) numberGroups.set(r.name, []);
      numberGroups.get(r.name).push(r);
    });
    numberGroups.forEach(list => {
      const isReady = r => !(r.ready === false || r.remainingSec > 0);
      const readyList = list.filter(isReady);
      const waitList = list.filter(r => !isReady(r)).sort((a, b) => (a.remainingSec || 0) - (b.remainingSec || 0));
      readyList.concat(waitList).forEach((r, i) => {
        r.mapAutoNo = i + 1;
      });
    });
  }
  return rows;
}

function farmPanelBuildAnimalProductStats(rows) {
  const count = rows.length;
  const readyCount = rows.filter(r => r.ready === true).length;
  const sickCount = rows.filter(r => r.sick === true).length;
  const soonestSec = rows.reduce((min, r) => {
    if (r.remainingSec == null) return min;
    return min == null ? r.remainingSec : Math.min(min, r.remainingSec);
  }, null);
  const noEtaCount = rows.filter(r => r.ready === false && r.remainingSec == null).length;
  const totalYield = rows.reduce((sum, r) => sum + (typeof r.qty === "number" ? r.qty : 0), 0);
  const econ = farmPanelComputeEconomics(rows[0].name, count, totalYield);
  const hasRealFeedCost = rows.some(r => typeof r.feedCostFlowerShare === "number");
  const realFeedCostFlower = hasRealFeedCost ? rows.reduce((s, r) => s + (r.feedCostFlowerShare || 0) + (r.consumableCostFlowerShare || 0), 0) : econ.totalCost;
  const realCostPerUnit = totalYield > 0 ? realFeedCostFlower / totalYield : 0;
  const realProfit = econ.netRevenue - realFeedCostFlower;
  return {
    ...econ,
    totalCost: realFeedCostFlower,
    costPerUnit: realCostPerUnit,
    profit: realProfit,
    count: count,
    readyCount: readyCount,
    sickCount: sickCount,
    soonestSec: soonestSec,
    noEtaCount: noEtaCount,
    totalYield: totalYield
  };
}

function farmPanelComputeAnimalYieldGroups(type, meta) {
  const list = farmPanelAnimalYieldGroupsByType[type] || [];
  if (!list.length) return [];
  const sorted = list.slice().sort((a, b) => b.level - a.level || b.xp - a.xp);
  return sorted.map((a, i) => {
    const yields = (meta.products || []).map(() => 0);
    a.products.forEach((pname, idx) => {
      const productIdx = meta.products.indexOf(pname);
      if (productIdx >= 0) yields[productIdx] += a.yields[idx] || 0;
    });
    return {
      ...a,
      number: i + 1,
      yields: yields
    };
  });
}

function farmPanelFormatSpiceDuration(sec) {
  if (sec == null) return "—";
  sec = Math.max(0, Math.round(sec));
  const d = Math.floor(sec / 86400);
  sec -= d * 86400;
  const h = Math.floor(sec / 3600);
  sec -= h * 3600;
  const m = Math.floor(sec / 60);
  if (d > 0) return `${d}D ${h}hr`;
  if (h > 0) return `${h}hr ${m}m`;
  return `${m}m`;
}

function farmPanelRenderSpiceBuffCard(key, tracking, yieldData, meta) {
  const isSaltLick = key === "saltLick";
  const isSeasoning = key === "truffleSeasoning";
  const label = isSaltLick ? "Salt Lick" : isSeasoning ? "Truffle Seasoning" : "Honey Treat";
  const icon = getBoostIcon(label);
  const headsAffected = tracking.length;
  const knownDurations = tracking.map(t => t.remainingSec).filter(v => v != null);
  const durationLeftSec = knownDurations.length ? Math.min(...knownDurations) : null;
  const durationHarvests = isSeasoning ? getTruffleSeasoningSleeps() : getSpiceLickDurationHarvests();
  const perUseCost = getSpiceCostPerUseFlower(key);
  const totalCost = perUseCost * headsAffected;
  const costPerCycle = totalCost / durationHarvests;
  let yieldLineHtml = "";
  let valueFlower = 0;
  if (isSaltLick || isSeasoning) {
    valueFlower = Object.entries(yieldData || {}).reduce((sum, [pname, amt]) => {
      const m = marketItems.find(x => (x.name || "").toLowerCase() === pname.toLowerCase());
      return sum + amt * (m ? m.flowerPrice || 0 : 0);
    }, 0);
    const chips = Object.entries(yieldData || {}).filter(([, amt]) => amt > 1e-9).map(([pname, amt]) => `<span class="spice-yield-chip">${getIcon(pname)}+${fmtAnimal(amt)}</span>`).join("");
    yieldLineHtml = `<div class="spice-buff-stat"><span class="label">${isSeasoning ? "Extra produce (per sleep)" : "Yield contributed (cycle)"}</span><span class="value">${chips || "—"}</span></div>`;
  } else {
    const feedsSaved = tracking.reduce((s, t) => s + (t.feedQtySaved || 0), 0);
    yieldLineHtml = `<div class="spice-buff-stat"><span class="label">Feeds saved</span><span class="value">${fmtAnimal(feedsSaved)}</span></div>`;
    valueFlower = typeof yieldData === "number" ? yieldData : 0;
  }
  const html = `\n      <div class="spice-buff-card ${isSaltLick ? "is-salt-lick" : "is-honey-treat"}${isSeasoning ? " is-truffle-seasoning" : ""}">\n        <div class="spice-buff-head">${icon}<b>${label}</b> <span class="spice-buff-heads">${headsAffected} head${headsAffected === 1 ? "" : "s"}</span></div>\n        <div class="spice-buff-stat"><span class="label">Duration left</span><span class="value">${farmPanelFormatSpiceDuration(durationLeftSec)}</span></div>\n        ${yieldLineHtml}\n        <div class="spice-buff-stat"><span class="label">Value in ${FLOWER_ICON} ${isSaltLick ? "added yield" : isSeasoning ? "extra produce" : "saved"}</span><span class="value">${fmtAnimal(valueFlower)} ${FLOWER_ICON}</span></div>\n      </div>`;
  return {
    category: isSaltLick || isSeasoning ? "yield" : "cost",
    html: html
  };
}

function farmPanelComputeAnimalCards(rawRows) {
  const byType = new Map;
  rawRows.forEach(r => {
    const info = ANIMAL_PRODUCT_LOOKUP[r.name];
    if (!info) return;
    if (!byType.has(info.type)) byType.set(info.type, []);
    byType.get(info.type).push(r);
  });
  const cards = [];
  byType.forEach((rows, type) => {
    const meta = ANIMAL_DATA[type];
    if (!meta) return;
    const byProduct = new Map;
    rows.forEach(r => {
      if (!byProduct.has(r.name)) byProduct.set(r.name, []);
      byProduct.get(r.name).push(r);
    });
    const products = meta.products.filter(p => byProduct.has(p)).map(p => farmPanelBuildAnimalProductStats(byProduct.get(p)));
    if (!products.length) return;
    const gross = products.reduce((s, p) => s + p.grossRevenue, 0);
    const sellFee = products.reduce((s, p) => s + p.feeAmount, 0);
    const cost = products.reduce((s, p) => s + p.totalCost, 0);
    const totalYieldAll = products.reduce((s, p) => s + p.totalYield, 0);
    const avgPricePerUnit = totalYieldAll > 0 ? gross / totalYieldAll : 0;
    const avgCostPerUnit = totalYieldAll > 0 ? cost / totalYieldAll : 0;
    const activeAnimalBoosts = getActiveAnimalBoosts(type);
    const yieldBoosts = activeAnimalBoosts.filter(b => b.yieldAdd || b.yieldMultAll || b.yieldAddAll || b.truffleMult);
    const timeBoosts = activeAnimalBoosts.filter(b => b.timeMult || b.timeMultAll);
    const freeFeedBoosts = activeAnimalBoosts.filter(b => b.freeFeed);
    const costBoosts = freeFeedBoosts.length ? freeFeedBoosts : activeAnimalBoosts.filter(b => b.feedMult || b.feedMultAll || b.xpMult);
    const saltLickYieldByProduct = {};
    const truffleSeasoningYieldByProduct = {};
    let honeyTreatSavingsFlower = 0;
    rows.forEach(r => {
      if (r.feedBuffName === "Truffle Seasoning" && typeof r.qty === "number") {
        truffleSeasoningYieldByProduct[r.name] = (truffleSeasoningYieldByProduct[r.name] || 0) + r.qty * .5;
      }
      if (r.feedBuffName === "Salt Lick" && typeof r.qty === "number") {
        saltLickYieldByProduct[r.name] = (saltLickYieldByProduct[r.name] || 0) + Math.max(0, r.qty - animalFlatYield(activeAnimalBoosts, meta.products.indexOf(r.name))) * (1 - 1 / 1.05);
      }
      if (r.feedBuffName === "Honey Treat" && typeof r.feedCostFlowerShare === "number") {
        honeyTreatSavingsFlower += r.feedCostFlowerShare / 3;
      }
    });
    const buffTracking = Object.assign({
      saltLick: [],
      honeyTreat: [],
      truffleSeasoning: []
    }, farmPanelAnimalBuffTrackingByType[type] || {});
    const spiceBuffCards = [];
    if (buffTracking.saltLick.length) {
      spiceBuffCards.push(farmPanelRenderSpiceBuffCard("saltLick", buffTracking.saltLick, saltLickYieldByProduct, meta));
    }
    if (buffTracking.honeyTreat.length) {
      spiceBuffCards.push(farmPanelRenderSpiceBuffCard("honeyTreat", buffTracking.honeyTreat, honeyTreatSavingsFlower, meta));
    }
    if (buffTracking.truffleSeasoning.length) {
      spiceBuffCards.push(farmPanelRenderSpiceBuffCard("truffleSeasoning", buffTracking.truffleSeasoning, truffleSeasoningYieldByProduct, meta));
    }
    let timeMultTotal = 1;
    activeAnimalBoosts.forEach(b => {
      if (b.timeMult) timeMultTotal *= b.timeMult;
      if (b.timeMultAll) timeMultTotal *= b.timeMultAll;
    });
    const cycleTimeSec = Math.max(1, ANIMAL_BASE_CYCLE_SEC * timeMultTotal);
    const cyclesPerDay = 86400 / cycleTimeSec;
    const shrineInfo = getActiveShrineDailyCostStable(activeAnimalBoosts);
    const shrineCost = shrineInfo.total > 0 ? shrineInfo.total / cyclesPerDay : 0;
    const net = gross - sellFee - cost - shrineCost;
    const first = products[0];
    const animalYieldGroups = farmPanelComputeAnimalYieldGroups(type, meta);
    cards.push({
      isAnimalMerged: true,
      typeKey: type,
      typeLabel: meta.label,
      searchKey: type.toLowerCase(),
      products: products,
      productNames: meta.products,
      count: first.count,
      readyCount: first.readyCount,
      sickCount: first.sickCount,
      soonestSec: first.soonestSec,
      noEtaCount: first.noEtaCount,
      gross: gross,
      sellFee: sellFee,
      cost: cost,
      shrineCost: shrineCost,
      shrineNames: shrineInfo.shrines.map(x => x.name),
      shrineDetails: shrineInfo.shrines.map(x => ({
        name: x.name,
        totalCost: x.totalCost,
        durationDays: x.durationDays,
        dailyCostPreShare: x.dailyCostPreShare,
        shareCount: x.shareCount,
        dailyCostPostShare: x.dailyCost,
        perCycleContribution: cyclesPerDay ? x.dailyCost / cyclesPerDay : x.dailyCost
      })),
      net: net,
      totalYieldAll: totalYieldAll,
      avgPricePerUnit: avgPricePerUnit,
      avgCostPerUnit: avgCostPerUnit,
      yieldBoosts: yieldBoosts,
      timeBoosts: timeBoosts,
      costBoosts: costBoosts,
      freeFeed: freeFeedBoosts.length > 0,
      spiceBuffCards: spiceBuffCards,
      cycleTimeSec: cycleTimeSec,
      animalYieldGroups: animalYieldGroups,
      profit: net
    });
  });
  return cards;
}

const DOUBLE_NOM_FOOD_BONUS = [ 1, 2, 3 ];

const DOUBLE_NOM_INGREDIENT_MULT = [ 2, 3, 4 ];

const COOKING_TIME_BOOST_DEFS = [ {
  name: "Luna's Hat",
  id: "lunas_hat"
}, {
  name: "Master Chef's Cleaver",
  id: "master_chefs_cleaver"
}, {
  name: "Legendary Shrine",
  id: "legendary_shrine_cook"
}, {
  name: "Boar Shrine",
  id: "boar_shrine"
}, {
  name: "Super Totem",
  id: "super_totem_cook",
  group: "totem"
}, {
  name: "Time Warp Totem",
  id: "time_warp_totem_cook",
  group: "totem"
}, {
  name: "Gourmet Hourglass",
  id: "gourmet_hourglass"
}, {
  name: "Desert Gnome",
  id: "desert_gnome"
}, {
  name: "Faction Medallion",
  id: "faction_medallion_cook"
} ];

const COOKING_OIL_SKILL_BY_BUILDING = {
  "Fire Pit": "skill_swift_sizzle",
  Kitchen: "skill_turbo_fry",
  Deli: "skill_fry_frenzy"
};

const COOKING_OIL_BASE_PCT = {
  "Smoothie Shack": 30,
  Bakery: 35
};

const COOKING_DAILY_OIL = {
  "Fire Pit": 1,
  Kitchen: 5,
  "Smoothie Shack": 8,
  Bakery: 10,
  Deli: 12
};

function cookingSkillRankValue(skillId) {
  if (!isSkillActive(skillId)) return null;
  const data = ASCENSION_RANK_DATA[skillId];
  if (!data || !data.values) return null;
  const rank = Math.min(Math.max(getAscensionRank(skillId), 1), 3);
  return data.values[rank - 1];
}

function cookingActiveTimeBoostMults(building) {
  const list = [];
  let totemUsed = false;
  COOKING_TIME_BOOST_DEFS.forEach(b => {
    if (!isBoostActive(b.id)) return;
    if (b.group === "totem") {
      if (totemUsed) return;
      totemUsed = true;
    }
    list.push(b.name);
  });
  if (building === "Fire Pit" || building === "Kitchen") {
    const v = cookingSkillRankValue("skill_fast_feasts");
    if (v != null) list.push("Fast Feasts");
  }
  return list;
}

function cookingOilBoostPct(building) {
  const skillId = COOKING_OIL_SKILL_BY_BUILDING[building];
  const skillVal = skillId ? cookingSkillRankValue(skillId) : null;
  if (skillVal != null) return skillVal;
  return COOKING_OIL_BASE_PCT[building] || 0;
}

function cookingOilBoostName(building) {
  const skillId = COOKING_OIL_SKILL_BY_BUILDING[building];
  if (skillId && isSkillActive(skillId)) {
    if (skillId === "skill_swift_sizzle") return "Swift Sizzle";
    if (skillId === "skill_turbo_fry") return "Turbo Fry";
    if (skillId === "skill_fry_frenzy") return "Fry Frenzy";
  }
  return "Building Oil";
}

function cookingOilConsumptionForItem(building, cookingSeconds) {
  const daily = COOKING_DAILY_OIL[building] || 0;
  return daily * (cookingSeconds / 86400);
}

function cookingStampedDoubleNomLevel(recipe) {
  const stored = recipe && recipe.skills && recipe.skills["Double Nom"];
  if (stored === true) return 1;
  if (typeof stored === "number" && stored >= 1) return Math.min(Math.max(Math.round(stored), 1), 3);
  return 0;
}

function cookingComputeTimeBoostRows(building, foodName, oilRemaining) {
  const rows = cookingActiveTimeBoostMults(building).map(name => ({
    name: name,
    kind: "flat"
  }));
  if (COOKING_CAKE_DISHES.has(foodName)) {
    const v = cookingSkillRankValue("skill_frosted_cakes");
    if (v != null) rows.push({
      name: "Frosted Cakes",
      kind: "flat"
    });
  }
  const oilPct = cookingOilBoostPct(building);
  if (oilPct > 0) {
    const rec = COOKING_RECIPES[building] && COOKING_RECIPES[building][foodName];
    const cookingSeconds = rec ? rec.time : 0;
    const oilNeeded = cookingOilConsumptionForItem(building, cookingSeconds);
    if (oilNeeded > 0 && oilRemaining > 0) {
      const covered = Math.max(0, Math.min(1, oilRemaining / oilNeeded));
      const effectivePct = oilPct * covered;
      if (effectivePct > 0) rows.push({
        name: cookingOilBoostName(building),
        kind: "oil",
        pct: effectivePct
      });
    }
  }
  return rows;
}

function cookingComputeQueueYields(building, craftingArr, farmActivity) {
  const lastInfo = farmPanelGetLastInfo();
  const farmId = Number(lastInfo.id);
  const validFarmId = Number.isFinite(farmId) && farmId > 0;
  const fa = farmActivity && typeof farmActivity === "object" ? farmActivity : {};
  const counters = {};
  const fieryJackpotChance = building === "Fire Pit" ? cookingSkillRankValue("skill_fiery_jackpot") : null;
  const masterChefActive = isBoostActive("master_chefs_cleaver");
  return craftingArr.map(recipe => {
    const name = recipe.name;
    if (counters[name] === undefined) {
      const raw = Number(fa[`${name} Cooked`]);
      counters[name] = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
    }
    const counter = counters[name];
    counters[name] = counter + 1;
    const doubleNomLevel = cookingStampedDoubleNomLevel(recipe);
    const doubleNomBonus = doubleNomLevel ? DOUBLE_NOM_FOOD_BONUS[doubleNomLevel - 1] : 0;
    let amount = 1 + doubleNomBonus;
    const boostsUsed = [];
    if (doubleNomBonus) boostsUsed.push({
      name: "Double Nom",
      amount: doubleNomBonus
    });
    const itemId = FOOD_KNOWN_IDS[name];
    if (validFarmId && itemId) {
      if (fieryJackpotChance != null && fieryJackpotChance > 0) {
        const hit = sflPrngChance({
          farmId: farmId,
          itemId: itemId,
          counter: counter,
          chance: fieryJackpotChance,
          criticalHitName: "Fiery Jackpot"
        });
        if (hit) {
          amount += 1;
          boostsUsed.push({
            name: "Fiery Jackpot",
            amount: 1
          });
        }
      }
      if (masterChefActive) {
        const hit = sflPrngChance({
          farmId: farmId,
          itemId: itemId,
          counter: counter,
          chance: 10,
          criticalHitName: "Master Chef's Cleaver"
        });
        if (hit) {
          amount += 1;
          boostsUsed.push({
            name: "Master Chef's Cleaver",
            amount: 1
          });
        }
      }
    }
    return {
      recipe: recipe,
      name: name,
      amount: amount,
      boostsUsed: boostsUsed,
      doubleNomLevel: doubleNomLevel
    };
  });
}

function cookingSlotIngredientCostFlower(building, name, doubleNomLevel) {
  const rec = COOKING_RECIPES[building] && COOKING_RECIPES[building][name];
  if (!rec) return 0;
  const mult = doubleNomLevel ? DOUBLE_NOM_INGREDIENT_MULT[doubleNomLevel - 1] : 1;
  let totalCoins = 0;
  Object.keys(rec.ingredients).forEach(ing => {
    totalCoins += rec.ingredients[ing] * mult * cookingIngredientUnitCostCoins(ing, cookingCostMode);
  });
  return totalCoins / (coinPerFlower || 1);
}

function cookingIsWearableEquipped(g, wearableName) {
  const checkEquipped = equipped => !!equipped && typeof equipped === "object" && Object.values(equipped).some(v => typeof v === "string" && v.trim() === wearableName);
  const bumpkin = g && g.bumpkin;
  if (checkEquipped(bumpkin && bumpkin.equipped)) return true;
  const farmHands = g && g.farmHands && g.farmHands.bumpkins;
  if (farmHands && typeof farmHands === "object") {
    for (const fh of Object.values(farmHands)) {
      if (checkEquipped(fh && fh.equipped)) return true;
    }
  }
  return false;
}

let farmPanelCookingExtend = (() => {
  try {
    const v = JSON.parse(localStorage.getItem("fp_cooking_extend") || "{}");
    return v && typeof v === "object" ? v : {};
  } catch (e) {
    return {};
  }
})();

let farmPanelCookingLimitedOpen = (() => {
  try {
    const v = JSON.parse(localStorage.getItem("fp_cooking_limited_open") || "{}");
    return v && typeof v === "object" ? v : {};
  } catch (e) {
    return {};
  }
})();

export function toggleFarmPanelCookingExtend(key) {
  if (!key) return;
  if (farmPanelCookingExtend[key]) delete farmPanelCookingExtend[key]; else farmPanelCookingExtend[key] = true;
  try {
    localStorage.setItem("fp_cooking_extend", JSON.stringify(farmPanelCookingExtend));
  } catch (e) {}
}

export function toggleFarmPanelCookingLimitedOpen(building) {
  if (!building) return;
  if (farmPanelCookingLimitedOpen[building]) delete farmPanelCookingLimitedOpen[building]; else farmPanelCookingLimitedOpen[building] = true;
  try {
    localStorage.setItem("fp_cooking_limited_open", JSON.stringify(farmPanelCookingLimitedOpen));
  } catch (e) {}
}

const COOKING_LIMITED_BOOSTS = [ {
  name: "Time Warp Totem",
  cost: {
    "Time Warp Totem": 1
  }
}, {
  name: "Super Totem",
  cost: {
    "Super Totem": 1
  }
}, {
  name: "Gourmet Hourglass",
  cost: {
    "Gourmet Hourglass": 1
  }
}, {
  name: "Legendary Shrine",
  cost: {
    Obsidian: 1,
    Moonfur: 10,
    Acorn: 15
  }
}, {
  name: "Boar Shrine",
  cost: {
    Acorn: 15
  }
} ];

function cookingInventoryCount(g, name) {
  const inv = farmPanelField(g, "inventory");
  const raw = inv && typeof inv === "object" ? Number(inv[name]) : 0;
  const owned = Number.isFinite(raw) && raw > 0 ? raw : 0;
  if (BOOST_EXPIRY_MS[name]) {
    const placed = placementsOf(g, name).filter(p => p && p.coordinates).length;
    return Math.max(0, owned - placed);
  }
  return owned;
}

function cookingProjectBuilding(g, building, instances, extendSet, extendOil) {
  const windows = cookingWindows(g, extendSet);
  const out = [];
  instances.forEach((inst, instIdx) => {
    const crafting = Array.isArray(inst.crafting) ? inst.crafting : [];
    if (!crafting.length) return;
    const hasOil = inst.oilSettledAt !== undefined;
    const tank = typeof inst.oil === "number" ? inst.oil : 0;
    const report = {};
    const resolved = resolveCookingQueue({
      crafting: crafting,
      windows: windows,
      oil: hasOil ? {
        tank: tank,
        settledAt: inst.oilSettledAt
      } : undefined,
      buildingName: building,
      extendOil: !!extendOil && hasOil,
      report: report
    });
    out.push({
      instIdx: instIdx,
      readyAts: resolved.map(t => t.readyAt),
      oilUsed: report.oilUsed || 0,
      oilEmptyAt: report.oilEmptyAt,
      tank: tank,
      hasOil: hasOil
    });
  });
  return out;
}

function cookingExtendSetFromState() {
  const set = new Set;
  COOKING_LIMITED_BOOSTS.forEach(b => {
    if (farmPanelCookingExtend[b.name]) set.add(b.name);
  });
  return set;
}

function cookingOilExtendFor(building) {
  return !!farmPanelCookingExtend[`Oil|${building}`];
}

function cookingQueueHorizon(g, extendSet) {
  const buildings = farmPanelField(g, "buildings");
  let horizon = 0;
  COOKING_BUILDINGS.forEach(b => {
    const instances = buildings && Array.isArray(buildings[b]) ? buildings[b] : null;
    if (!instances || !instances.length) return;
    cookingProjectBuilding(g, b, instances, extendSet, cookingOilExtendFor(b)).forEach(p => {
      p.readyAts.forEach(t => {
        if (typeof t === "number" && t > horizon) horizon = t;
      });
    });
  });
  return horizon;
}

const FP_SHRINE_EXTENSION_COST = {
  "Legendary Shrine": {
    coins: 0,
    items: {
      Acorn: 15,
      Moonfur: 10,
      Obsidian: 1
    }
  },
  "Obsidian Shrine": {
    coins: 0,
    items: {
      Acorn: 15,
      Moonfur: 3,
      Obsidian: 1
    }
  },
  "Trading Shrine": {
    coins: 0,
    items: {
      Acorn: 15,
      Moonfur: 5,
      Obsidian: 3
    }
  },
  "Bear Shrine": {
    coins: 0,
    items: {
      Acorn: 15,
      "Chewed Bone": 10,
      Ruffroot: 10
    }
  },
  "Moth Shrine": {
    coins: 0,
    items: {
      Acorn: 15,
      "Frost Pebble": 10,
      Ribbon: 10
    }
  },
  "Tortoise Shrine": {
    coins: 0,
    items: {
      Acorn: 15,
      "Wild Grass": 10,
      "Chewed Bone": 10
    }
  },
  "Toucan Shrine": {
    coins: 0,
    items: {
      Acorn: 15,
      "Heart leaf": 10,
      "Frost Pebble": 10
    }
  },
  "Stag Shrine": {
    coins: 0,
    items: {
      Acorn: 15,
      "Heart leaf": 10,
      "Wild Grass": 10
    }
  },
  "Mole Shrine": {
    coins: 0,
    items: {
      Acorn: 15,
      Dewberry: 10,
      Ribbon: 10
    }
  },
  "Sparrow Shrine": {
    coins: 0,
    items: {
      Acorn: 15,
      "Wild Grass": 10,
      Ruffroot: 10
    }
  },
  "Badger Shrine": {
    coins: 0,
    items: {
      Acorn: 15,
      Dewberry: 10,
      "Heart leaf": 10
    }
  },
  "Boar Shrine": {
    coins: 0,
    items: {
      Acorn: 15
    }
  },
  "Hound Shrine": {
    coins: 0,
    items: {
      Acorn: 50
    }
  },
  "Bantam Shrine": {
    coins: 0,
    items: {
      Acorn: 15,
      Ruffroot: 10,
      Dewberry: 10
    }
  },
  "Collie Shrine": {
    coins: 0,
    items: {
      Acorn: 15,
      "Frost Pebble": 10,
      "Chewed Bone": 10
    }
  }
};

const FP_SHRINE_MAX_ACTIVE_MS = 30 * 24 * 60 * 60 * 1e3;

const FP_TOTEM_PAIR = {
  "Super Totem": "Time Warp Totem",
  "Time Warp Totem": "Super Totem"
};

function fpCoinsHave(g) {
  const raw = Number(farmPanelField(g, "coins"));
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
}

function cookingCollectibleEntry(g, def, extendSet, horizonFn) {
  const now = Date.now();
  const duration = BOOST_EXPIRY_MS[def.name];
  const placed = placementsOf(g, def.name).filter(p => p && typeof p.createdAt === "number" && p.coordinates && typeof p.removedAt !== "number");
  let expiresAt = 0;
  placed.forEach(p => {
    expiresAt = Math.max(expiresAt, collectibleExpiry(def.name, p));
  });
  const status = !placed.length ? "missing" : expiresAt > now ? "active" : "expired";
  let requiredMs = 0;
  if (status === "active") {
    const probe = new Set(extendSet);
    probe.add(def.name);
    const horizon = horizonFn ? horizonFn(probe) : cookingQueueHorizon(g, probe);
    requiredMs = horizon > expiresAt ? horizon - expiresAt : 0;
  }
  const shrine = FP_SHRINE_EXTENSION_COST[def.name] || null;
  const otherTotem = FP_TOTEM_PAIR[def.name] || null;
  let needed = requiredMs > 0 ? Math.ceil(requiredMs / duration) : 0;
  let costItems;
  let capHit = false;
  if (otherTotem) {
    const haveOwn = cookingInventoryCount(g, def.name);
    const haveOther = cookingInventoryCount(g, otherTotem);
    const durOther = BOOST_EXPIRY_MS[otherTotem];
    const useOwn = Math.min(needed, haveOwn);
    const remaining = requiredMs - useOwn * duration;
    const useOther = remaining > 0 ? Math.ceil(remaining / durOther) : 0;
    needed = useOwn + useOther;
    costItems = [ {
      item: def.name,
      qty: useOwn,
      unit: 1,
      have: haveOwn
    } ];
    if (useOther > 0) costItems.push({
      item: otherTotem,
      qty: useOther,
      unit: 1,
      have: haveOther
    });
  } else if (shrine) {
    costItems = Object.keys(shrine.items).map(item => ({
      item: item,
      qty: shrine.items[item] * needed,
      unit: shrine.items[item],
      have: cookingInventoryCount(g, item)
    }));
    if (shrine.coins > 0) costItems.push({
      item: "Coins",
      qty: shrine.coins * needed,
      unit: shrine.coins,
      have: fpCoinsHave(g)
    });
    capHit = needed > 0 && expiresAt + needed * duration - now > FP_SHRINE_MAX_ACTIVE_MS;
  } else {
    costItems = Object.keys(def.cost).map(item => ({
      item: item,
      qty: def.cost[item] * needed,
      unit: def.cost[item],
      have: cookingInventoryCount(g, item)
    }));
  }
  const short = costItems.filter(c => c.qty > 0 && c.have < c.qty);
  let canExtend = status === "active" && !short.length && !capHit;
  let reason = "";
  if (status === "missing") reason = "Not placed on your farm"; else if (status === "expired") reason = "Expired — renew it in game first"; else if (capHit) reason = "Shrines can only run 30 days ahead — extend again later"; else if (short.length) reason = `Missing ${short.map(c => `${fmt(c.qty - c.have)} ${c.item}`).join(", ")}`; else if (needed === 0) reason = "Already covers everything here"; else reason = `Uses ${costItems.filter(c => c.qty > 0).map(c => `${fmt(c.qty)} ${c.item}`).join(" + ")}`;
  return {
    key: def.name,
    name: def.name,
    kind: "collectible",
    status: status,
    expiresAt: expiresAt,
    remainingSec: status === "active" ? (expiresAt - now) / 1e3 : 0,
    needed: needed,
    costItems: costItems,
    canExtend: canExtend,
    reason: reason
  };
}

function cookingOilEntry(g, building, instances, extendSet) {
  const now = Date.now();
  const base = cookingProjectBuilding(g, building, instances, extendSet, false);
  const full = cookingProjectBuilding(g, building, instances, extendSet, true);
  const supported = base.length > 0 && base.every(p => p.hasOil);
  let needed = 0;
  full.forEach(p => {
    needed += Math.max(0, p.oilUsed - p.tank);
  });
  needed = Math.ceil(needed * 100) / 100;
  const tankTotal = base.reduce((sum, p) => sum + p.tank, 0);
  let emptyAt = 0;
  base.forEach(p => {
    if (typeof p.oilEmptyAt === "number" && (!emptyAt || p.oilEmptyAt < emptyAt)) emptyAt = p.oilEmptyAt;
  });
  const have = cookingInventoryCount(g, "Oil");
  let status;
  if (!supported) status = "missing"; else if (emptyAt > now) status = "active"; else if (tankTotal > 0 && !emptyAt) status = "enough"; else status = "empty";
  const canExtend = supported && needed <= have + 1e-9;
  let reason;
  if (!supported) reason = "Oil is not tracked for this building yet"; else if (!canExtend) reason = `Missing ${fmt(Math.ceil((needed - have) * 100) / 100)} Oil`; else if (needed <= 0) reason = "Tank already covers the whole queue"; else reason = `Uses ${fmt(needed)} Oil`;
  return {
    key: `Oil|${building}`,
    name: "Oil",
    kind: "oil",
    status: status,
    expiresAt: emptyAt,
    remainingSec: status === "active" ? (emptyAt - now) / 1e3 : 0,
    needed: needed,
    costItems: [ {
      item: "Oil",
      qty: needed,
      unit: 1,
      have: have
    } ],
    canExtend: canExtend,
    reason: reason
  };
}

function cookingLimitedEntries(g, building, instances, extendSet) {
  const entries = COOKING_LIMITED_BOOSTS.map(def => cookingCollectibleEntry(g, def, extendSet));
  entries.push(cookingOilEntry(g, building, instances, extendSet));
  return entries;
}

const FP_LIMITED_SCOPES = {
  crop: [ "Sparrow Shrine", "Harvest Hourglass", "Legendary Shrine", "Super Totem", "Time Warp Totem" ],
  fruit: [ "Orchard Hourglass", "Toucan Shrine", "Legendary Shrine", "Super Totem", "Time Warp Totem" ],
  greenhouse: [ "Tortoise Shrine", "Harvest Hourglass", "Orchard Hourglass", "Legendary Shrine", "Super Totem", "Time Warp Totem" ],
  flower: [ "Blossom Hourglass", "Moth Shrine", "Legendary Shrine" ],
  wood: [ "Timber Hourglass", "Badger Shrine", "Legendary Shrine", "Super Totem", "Time Warp Totem" ],
  stone: [ "Ore Hourglass", "Badger Shrine", "Legendary Shrine", "Super Totem", "Time Warp Totem" ],
  iron: [ "Ore Hourglass", "Mole Shrine", "Super Totem", "Time Warp Totem" ],
  gold: [ "Ore Hourglass", "Mole Shrine", "Super Totem", "Time Warp Totem" ],
  crimstone: [ "Mole Shrine" ],
  oil: [ "Stag Shrine" ],
  chicken: [ "Bantam Shrine" ],
  cow: [ "Collie Shrine" ],
  sheep: [ "Collie Shrine" ],
  cropmachine: [ "Tortoise Shrine", "Legendary Shrine" ]
};

let fpLimitedJobs = {};

let fpLimitedEffective = {};

let fpLimitedEntries = {};

function fpLimitedStoredSet(scope) {
  const set = new Set;
  (FP_LIMITED_SCOPES[scope] || []).forEach(name => {
    if (farmPanelCookingExtend[name]) set.add(name);
  });
  return set;
}

function fpLimitedExt(scope) {
  return fpLimitedEffective[scope] || fpLimitedStoredSet(scope);
}

function fpLimitedLog(scope, job) {
  if (!FP_LIMITED_SCOPES[scope]) return;
  if (!fpLimitedJobs[scope]) fpLimitedJobs[scope] = [];
  fpLimitedJobs[scope].push(job);
}

function fpYieldAt(scope, atMs, fn) {
  const now = Date.now();
  return withBoostEvalAt(typeof atMs === "number" && atMs > now ? atMs : now, fpLimitedExt(scope), fn);
}

function fpLimitedReadyAt(scope, startedAt, baseDurationMs, windowsFn) {
  fpLimitedLog(scope, {
    startedAt: startedAt,
    baseDurationMs: baseDurationMs,
    windowsFn: windowsFn
  });
  return computeReadyAt({
    startedAt: startedAt,
    baseDurationMs: baseDurationMs,
    windows: windowsFn(fpLimitedExt(scope))
  });
}

function fpLimitedHorizon(scope, set) {
  let horizon = 0;
  (fpLimitedJobs[scope] || []).forEach(j => {
    const t = j.horizonFn ? j.horizonFn(set) : computeReadyAt({
      startedAt: j.startedAt,
      baseDurationMs: j.baseDurationMs,
      windows: j.windowsFn(set)
    });
    if (typeof t === "number" && t > horizon) horizon = t;
  });
  return horizon;
}

function fpLimitedDef(name) {
  return {
    name: name,
    cost: {
      [name]: 1
    }
  };
}

function fpLimitedBuildEntries(g, scope, set) {
  return (FP_LIMITED_SCOPES[scope] || []).map(name => cookingCollectibleEntry(g, fpLimitedDef(name), set, probe => fpLimitedHorizon(scope, probe)));
}

function fpLimitedSameSet(a, b) {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

function fpLimitedResolve(json) {
  let g;
  try {
    g = farmSyncExtractGameState(json);
  } catch (e) {
    return false;
  }
  if (!g) return false;
  let changed = false;
  const entries = {};
  Object.keys(fpLimitedJobs).forEach(scope => {
    const stored = fpLimitedStoredSet(scope);
    const current = fpLimitedEffective[scope] || stored;
    const probeEntries = fpLimitedBuildEntries(g, scope, current);
    const next = new Set;
    probeEntries.forEach(e => {
      if (stored.has(e.name) && e.canExtend) next.add(e.name);
    });
    if (!fpLimitedSameSet(current, next)) changed = true;
    fpLimitedEffective[scope] = next;
    entries[scope] = fpLimitedBuildEntries(g, scope, next).map(e => ({
      ...e,
      extended: next.has(e.name)
    }));
  });
  fpLimitedEntries = entries;
  return changed;
}

function fpLimitedScopeOfRow(row) {
  if (!row) return "";
  if (row.isCropMachineCard) return "cropmachine";
  if (row.isAnimalMerged) return String(row.typeKey || "").toLowerCase();
  if (row.isComposterCard || row.isHoneyCard || row.isCookingCard || row.isMycoCard || row.isMushroomCard || row.isPeteQuestCard || row.isFloatingIslandCard || row.isFishingCard || row.isCaveMerchantCard || row.isPowerSkillCard || row.isSkillResetCard) return "";
  const name = row.name;
  if (name === "Wood") return "wood";
  if (name === "Oil") return "oil";
  if (name === "Stone") return "stone";
  if (name === "Iron") return "iron";
  if (name === "Gold") return "gold";
  if (name === "Crimstone") return "crimstone";
  if (BASE_GREENHOUSE[name]) return "greenhouse";
  if (FLOWER_VARIETIES[name]) return "flower";
  if (BASE_CROPS[name]) return "crop";
  if (BASE_FRUITS[name]) return "fruit";
  return "";
}

function fpLimitedBlockHtml(row) {
  const scope = fpLimitedScopeOfRow(row);
  const list = scope ? fpLimitedEntries[scope] : null;
  if (!list || !list.length) return "";
  return farmPanelRenderLimitedBlock(list, `ltd:${scope}`, "until everything here finishes");
}

function farmPanelBuildCookingBuildingCard(building, instances, farmActivity, g) {
  const storedSet = cookingExtendSetFromState();
  const storedEntries = cookingLimitedEntries(g, building, instances, storedSet);
  const effectiveSet = new Set;
  storedEntries.forEach(e => {
    if (e.kind === "collectible" && farmPanelCookingExtend[e.key] && e.canExtend) effectiveSet.add(e.name);
  });
  const limitedBoosts = cookingLimitedEntries(g, building, instances, effectiveSet).map(e => ({
    ...e,
    extended: !!farmPanelCookingExtend[e.key] && e.canExtend
  }));
  const oilEntry = limitedBoosts.find(e => e.kind === "oil");
  const extendOil = !!oilEntry && oilEntry.extended;
  const projection = cookingProjectBuilding(g, building, instances, effectiveSet, extendOil);
  const allSlots = [];
  instances.forEach((inst, instIdx) => {
    const crafting = Array.isArray(inst.crafting) ? inst.crafting : [];
    if (!crafting.length) return;
    const yields = cookingComputeQueueYields(building, crafting, farmActivity);
    const proj = projection.find(p => p.instIdx === instIdx);
    const windowedReadyAts = proj ? proj.readyAts : [];
    yields.forEach((y, yi) => {
      const readyAt = typeof windowedReadyAts[yi] === "number" ? windowedReadyAts[yi] : typeof y.recipe.readyAt === "number" ? y.recipe.readyAt : 0;
      allSlots.push({
        buildingIndex: instIdx,
        name: y.name,
        amount: y.amount,
        boostsUsed: y.boostsUsed,
        doubleNomLevel: y.doubleNomLevel,
        readyAt: readyAt,
        oilAtSlot: typeof inst.oil === "number" ? inst.oil : 0
      });
    });
  });
  if (!allSlots.length) return null;
  allSlots.sort((a, b) => a.readyAt - b.readyAt);
  const now = Date.now();
  const readyCount = allSlots.filter(s => s.readyAt <= now).length;
  const soonestSec = allSlots.reduce((min, s) => {
    if (s.readyAt <= now) return min;
    const sec = Math.max(0, Math.round((s.readyAt - now) / 1e3));
    return min == null ? sec : Math.min(min, sec);
  }, null);
  let totalCostFlower = 0;
  const yieldBoostTotals = new Map;
  const timeBoostSeen = new Map;
  allSlots.forEach(s => {
    totalCostFlower += cookingSlotIngredientCostFlower(building, s.name, s.doubleNomLevel);
    (s.boostsUsed || []).forEach(b => {
      yieldBoostTotals.set(b.name, (yieldBoostTotals.get(b.name) || 0) + b.amount);
    });
    cookingComputeTimeBoostRows(building, s.name, s.oilAtSlot).forEach(b => {
      if (!timeBoostSeen.has(b.name)) timeBoostSeen.set(b.name, b);
    });
  });
  const nameCounts = new Map;
  allSlots.forEach(s => nameCounts.set(s.name, (nameCounts.get(s.name) || 0) + s.amount));
  const productGroups = [];
  const seenNames = new Set;
  allSlots.forEach(s => {
    if (seenNames.has(s.name)) return;
    seenNames.add(s.name);
    productGroups.push({
      name: s.name,
      amount: nameCounts.get(s.name) || 0
    });
  });
  return {
    isCookingCard: true,
    cookingBuilding: building,
    cookingKind: "recipe",
    slots: allSlots,
    slotCount: allSlots.length,
    readyCount: readyCount,
    soonestSec: soonestSec,
    totalCostFlower: totalCostFlower,
    yieldBoostTotals: Array.from(yieldBoostTotals.entries()).map(([name, total]) => ({
      name: name,
      total: total
    })),
    timeBoosts: Array.from(timeBoostSeen.values()),
    productGroups: productGroups,
    limitedBoosts: limitedBoosts,
    profit: -totalCostFlower
  };
}

function farmPanelBuildFishMarketCard(g, instances, farmActivity) {
  const allSlots = [];
  instances.forEach((inst, instIdx) => {
    const processing = Array.isArray(inst.processing) ? inst.processing : [];
    processing.forEach(p => {
      allSlots.push({
        buildingIndex: instIdx,
        name: p.name,
        readyAt: typeof p.readyAt === "number" ? p.readyAt : 0
      });
    });
  });
  if (!allSlots.length) return null;
  const lastInfo = farmPanelGetLastInfo();
  const farmId = Number(lastInfo.id);
  const validFarmId = Number.isFinite(farmId) && farmId > 0;
  const bubbleAuraActive = cookingIsWearableEquipped(g, "Bubble Aura");
  const fa = farmActivity && typeof farmActivity === "object" ? farmActivity : {};
  const counters = {};
  const resolvedSlots = allSlots.map(s => {
    if (counters[s.name] === undefined) {
      const raw = Number(fa[`${s.name} Processed`]);
      counters[s.name] = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
    }
    const counter = counters[s.name];
    counters[s.name] = counter + 1;
    let amount = 1;
    const boostsUsed = [];
    const itemId = FOOD_KNOWN_IDS[s.name];
    if (validFarmId && itemId && bubbleAuraActive) {
      const hit = sflPrngChance({
        farmId: farmId,
        itemId: itemId,
        counter: counter,
        chance: 20,
        criticalHitName: "Bubble Aura"
      });
      if (hit) {
        amount += 1;
        boostsUsed.push({
          name: "Bubble Aura",
          amount: 1
        });
      }
    }
    return {
      ...s,
      amount: amount,
      boostsUsed: boostsUsed
    };
  });
  resolvedSlots.sort((a, b) => a.readyAt - b.readyAt);
  const now = Date.now();
  const readyCount = resolvedSlots.filter(s => s.readyAt <= now).length;
  const soonestSec = resolvedSlots.reduce((min, s) => {
    if (s.readyAt <= now) return min;
    const sec = Math.max(0, Math.round((s.readyAt - now) / 1e3));
    return min == null ? sec : Math.min(min, sec);
  }, null);
  const yieldBoostTotals = new Map;
  resolvedSlots.forEach(s => (s.boostsUsed || []).forEach(b => yieldBoostTotals.set(b.name, (yieldBoostTotals.get(b.name) || 0) + b.amount)));
  const timeBoosts = bubbleAuraActive ? [ {
    name: "Bubble Aura",
    kind: "oil",
    pct: 20
  } ] : [];
  let totalCostFlower = 0;
  resolvedSlots.forEach(s => {
    const coinsPerUnit = getItemCostByName(s.name) || 0;
    totalCostFlower += coinsPerUnit / (coinPerFlower || 1);
  });
  const nameCounts = new Map;
  resolvedSlots.forEach(s => nameCounts.set(s.name, (nameCounts.get(s.name) || 0) + s.amount));
  const productGroups = [];
  const seenNames = new Set;
  resolvedSlots.forEach(s => {
    if (seenNames.has(s.name)) return;
    seenNames.add(s.name);
    productGroups.push({
      name: s.name,
      amount: nameCounts.get(s.name) || 0
    });
  });
  return {
    isCookingCard: true,
    cookingBuilding: "Fish Market",
    cookingKind: "processing",
    slots: resolvedSlots,
    slotCount: resolvedSlots.length,
    readyCount: readyCount,
    soonestSec: soonestSec,
    totalCostFlower: totalCostFlower,
    yieldBoostTotals: Array.from(yieldBoostTotals.entries()).map(([name, total]) => ({
      name: name,
      total: total
    })),
    timeBoosts: timeBoosts,
    productGroups: productGroups,
    profit: -totalCostFlower
  };
}

function farmPanelBuildAgingShedCard(agingShed, farmActivity) {
  const racks = agingShed && agingShed.racks;
  const agingSlots = racks && Array.isArray(racks.aging) ? racks.aging : [];
  if (!agingSlots.length) return null;
  const lastInfo = farmPanelGetLastInfo();
  const farmId = Number(lastInfo.id);
  const validFarmId = Number.isFinite(farmId) && farmId > 0;
  const fa = farmActivity && typeof farmActivity === "object" ? farmActivity : {};
  const fishSmokingMult = cookingSkillRankValue("skill_fish_smoking");
  const sculptureLvl = typeof saltSculptureLevel === "number" ? saltSculptureLevel : 0;
  let primeChance = 10 * (fishSmokingMult != null ? fishSmokingMult : 1);
  const chanceBoosts = [];
  if (fishSmokingMult != null) chanceBoosts.push({
    name: "Fish Smoking",
    note: `×${fishSmokingMult}`
  });
  if (sculptureLvl >= 2) {
    primeChance += 4;
    chanceBoosts.push({
      name: "Salt Sculpture",
      note: "+4%"
    });
  }
  if (isBoostActive("winged_vase")) {
    primeChance += 14;
    chanceBoosts.push({
      name: "Winged Vase",
      note: "+14%"
    });
  }
  const speedyAgingMult = cookingSkillRankValue("skill_speedy_aging");
  if (speedyAgingMult != null) chanceBoosts.push({
    name: "Speedy Aging",
    note: "faster"
  });
  const counters = {};
  const slots = agingSlots.map(slot => {
    const fish = slot.fish;
    const agedName = `Aged ${fish}`;
    const primeName = `Prime Aged ${fish}`;
    if (counters[fish] === undefined) {
      const rawAged = Number(fa[`${agedName} Collected`]);
      const rawPrime = Number(fa[`${primeName} Collected`]);
      counters[fish] = (Number.isFinite(rawAged) && rawAged > 0 ? Math.floor(rawAged) : 0) + (Number.isFinite(rawPrime) && rawPrime > 0 ? Math.floor(rawPrime) : 0);
    }
    const counter = counters[fish];
    counters[fish] = counter + 1;
    let isPrime = false;
    const agedItemId = FISH_AGING_KNOWN_IDS[agedName];
    if (validFarmId && agedItemId) {
      isPrime = sflPrngChance({
        farmId: farmId,
        itemId: agedItemId,
        counter: counter,
        chance: primeChance,
        criticalHitName: primeName
      });
    }
    const stampedAgerLevel = (() => {
      const stored = slot.skills && slot.skills.Ager;
      if (stored === true) return 1;
      if (typeof stored === "number") {
        if (stored === 0) return 0;
        return Math.min(Math.max(Math.round(stored), 1), 3);
      }
      return 0;
    })();
    const outputMult = stampedAgerLevel ? ASCENSION_RANK_DATA.skill_ager.values[stampedAgerLevel - 1] : 1;
    const outputName = isPrime ? primeName : agedName;
    let costFlower = 0;
    if (typeof computeAgedFishFigures === "function") {
      const figures = computeAgedFishFigures(fish, "collect");
      if (figures && typeof figures.costCoins === "number") costFlower = figures.costCoins / (coinPerFlower || 1);
    }
    return {
      fish: fish,
      outputName: outputName,
      isPrime: isPrime,
      amount: outputMult,
      readyAt: typeof slot.readyAt === "number" ? slot.readyAt : 0,
      stampedAgerLevel: stampedAgerLevel,
      costFlower: costFlower
    };
  });
  slots.sort((a, b) => a.readyAt - b.readyAt);
  const now = Date.now();
  const readyCount = slots.filter(s => s.readyAt <= now).length;
  const soonestSec = slots.reduce((min, s) => {
    if (s.readyAt <= now) return min;
    const sec = Math.max(0, Math.round((s.readyAt - now) / 1e3));
    return min == null ? sec : Math.min(min, sec);
  }, null);
  const totalCostFlower = slots.reduce((sum, s) => sum + (s.costFlower || 0), 0);
  const nameCounts = new Map;
  slots.forEach(s => nameCounts.set(s.outputName, (nameCounts.get(s.outputName) || 0) + s.amount));
  const productGroups = [];
  const seenNames = new Set;
  slots.forEach(s => {
    if (seenNames.has(s.outputName)) return;
    seenNames.add(s.outputName);
    productGroups.push({
      name: s.outputName,
      amount: nameCounts.get(s.outputName) || 0
    });
  });
  return {
    isCookingCard: true,
    cookingBuilding: "Aging Shed",
    cookingKind: "aging",
    slots: slots,
    slotCount: slots.length,
    readyCount: readyCount,
    soonestSec: soonestSec,
    totalCostFlower: totalCostFlower,
    yieldBoostTotals: [],
    chanceBoosts: chanceBoosts,
    primeChance: primeChance,
    timeBoosts: [],
    productGroups: productGroups,
    profit: -totalCostFlower
  };
}

function farmPanelStampedAgerLevel(skills) {
  const stored = skills && skills.Ager;
  if (stored === true) return 1;
  if (typeof stored === "number") {
    if (stored === 0) return 0;
    return Math.min(Math.max(Math.round(stored), 1), 3);
  }
  return 0;
}

function fermentationResolveRecipe(recipeName) {
  const staticRec = FERMENTATION_STATIC_RECIPES[recipeName];
  if (staticRec) return {
    outputName: staticRec.outputName,
    baseAmount: staticRec.baseAmount,
    fishName: null,
    vegName: null
  };
  const family = FERMENTATION_BAIT_FAMILIES.find(f => recipeName.indexOf(f + " (") === 0);
  if (!family) return null;
  const rec = BAIT_RECIPES[family];
  if (!rec) return null;
  const isPrime = recipeName.indexOf("Prime Aged") !== -1;
  const baitMatch = recipeName.match(/^.+? \((?:Aged|Prime Aged) (.+?), Pickled (.+?)\)$/);
  return {
    outputName: family,
    baseAmount: isPrime ? rec.outputPrime : rec.outputAged,
    fishName: baitMatch ? baitMatch[1] : null,
    vegName: baitMatch ? baitMatch[2] : null,
    fishTier: rec.fishTier
  };
}

function farmPanelBuildFermentationCard(agingShed, farmActivity) {
  const racks = agingShed && agingShed.racks;
  const jobs = racks && Array.isArray(racks.fermentation) ? racks.fermentation : [];
  if (!jobs.length) return null;
  const lastInfo = farmPanelGetLastInfo();
  const farmId = Number(lastInfo.id);
  const validFarmId = Number.isFinite(farmId) && farmId > 0;
  const fa = farmActivity && typeof farmActivity === "object" ? farmActivity : {};
  const astrolabeActive = isBoostActive("astrolabe");
  const bacalhauLevel = cookingSkillRankValue("skill_bacalhau");
  const counters = {};
  const yieldBoostTotals = new Map;
  const slots = jobs.map(job => {
    const resolved = fermentationResolveRecipe(job.recipe);
    if (!resolved) return null;
    const outputName = resolved.outputName;
    if (counters[outputName] === undefined) {
      const raw = Number(fa[`${outputName} Fermented`]);
      counters[outputName] = Number.isFinite(raw) && raw > 0 ? raw : 0;
    }
    const counter = counters[outputName];
    const stampedAgerLevel = farmPanelStampedAgerLevel(job.skills);
    const agerMult = stampedAgerLevel ? ASCENSION_RANK_DATA.skill_ager.values[stampedAgerLevel - 1] : 1;
    let amount = resolved.baseAmount * agerMult;
    const itemId = FERMENTATION_SPICE_KNOWN_IDS[outputName];
    if (validFarmId && itemId && astrolabeActive) {
      const hit = sflPrngChance({
        farmId: farmId,
        itemId: itemId,
        counter: counter,
        chance: 15,
        criticalHitName: "Astrolabe"
      });
      if (hit) {
        yieldBoostTotals.set("Astrolabe", (yieldBoostTotals.get("Astrolabe") || 0) + amount);
        amount *= 2;
      }
    }
    const isBait = FERMENTATION_BAIT_FAMILIES.includes(outputName);
    if (isBait && bacalhauLevel) {
      amount += bacalhauLevel;
      yieldBoostTotals.set("Bacalhau", (yieldBoostTotals.get("Bacalhau") || 0) + bacalhauLevel);
    }
    counters[outputName] = counter + amount;
    let costFlower = 0;
    if (isBait) {
      let fishCost = 0;
      if (resolved.fishTier && Array.isArray(FISH_SALT_DATA[resolved.fishTier])) {
        const fishObj = FISH_SALT_DATA[resolved.fishTier].find(f => f.name === resolved.fishName);
        if (fishObj) fishCost = fishSaltCostFlower(fishObj);
      }
      const vegEntry = resolved.vegName ? pickledVegCost(resolved.vegName) : null;
      costFlower = fishCost + (vegEntry ? vegEntry.cost : 0);
    } else if (job.recipe.indexOf("Pickled ") === 0) {
      const veg = job.recipe.slice("Pickled ".length);
      const vegEntry = pickledVegCost(veg);
      costFlower = vegEntry ? vegEntry.cost : 0;
    } else if (job.recipe.indexOf("Greenhouse Glow: Pickled ") === 0 || job.recipe.indexOf("Greenhouse Goodie: Pickled ") === 0) {
      const veg = job.recipe.slice(job.recipe.indexOf("Pickled ") + "Pickled ".length);
      const vegEntry = pickledVegCost(veg);
      costFlower = (vegEntry ? vegEntry.cost : 0) + refinedSaltUnitCostFlower() * 1;
    } else if (job.recipe === "Sproutroot Surprise") {
      costFlower = coinsToFlower(computeComposterFigures("Compost Bin").costPerUnitCoins) * 5 + coinsToFlower(computeComposterFigures("Premium Composter").costPerUnitCoins) * 5 + refinedSaltUnitCostFlower() * 2;
    } else if (job.recipe === "Turbofruit Mix") {
      costFlower = coinsToFlower(computeComposterFigures("Premium Composter").costPerUnitCoins) * 5 + coinsToFlower(computeComposterFigures("Turbo Composter").costPerUnitCoins) * 5 + refinedSaltUnitCostFlower() * 2;
    }
    return {
      name: outputName,
      amount: amount,
      readyAt: typeof job.readyAt === "number" ? job.readyAt : 0,
      stampedAgerLevel: stampedAgerLevel,
      costFlower: costFlower
    };
  }).filter(Boolean);
  if (!slots.length) return null;
  slots.sort((a, b) => a.readyAt - b.readyAt);
  const now = Date.now();
  const readyCount = slots.filter(s => s.readyAt <= now).length;
  const soonestSec = slots.reduce((min, s) => {
    if (s.readyAt <= now) return min;
    const sec = Math.max(0, Math.round((s.readyAt - now) / 1e3));
    return min == null ? sec : Math.min(min, sec);
  }, null);
  const totalCostFlower = slots.reduce((sum, s) => sum + (s.costFlower || 0), 0);
  const nameCounts = new Map;
  slots.forEach(s => nameCounts.set(s.name, (nameCounts.get(s.name) || 0) + s.amount));
  const productGroups = [];
  const seenNames = new Set;
  slots.forEach(s => {
    if (seenNames.has(s.name)) return;
    seenNames.add(s.name);
    productGroups.push({
      name: s.name,
      amount: nameCounts.get(s.name) || 0
    });
  });
  const chanceBoosts = [];
  if (astrolabeActive) chanceBoosts.push({
    name: "Astrolabe",
    note: "15% chance to double output"
  });
  if (bacalhauLevel) chanceBoosts.push({
    name: "Bacalhau",
    note: `+${bacalhauLevel} bait (flat)`
  });
  return {
    isCookingCard: true,
    cookingBuilding: "Fermentation Rack",
    cookingKind: "fermentation",
    slots: slots,
    slotCount: slots.length,
    readyCount: readyCount,
    soonestSec: soonestSec,
    totalCostFlower: totalCostFlower,
    yieldBoostTotals: Array.from(yieldBoostTotals.entries()).map(([name, total]) => ({
      name: name,
      total: total
    })),
    chanceBoosts: chanceBoosts,
    timeBoosts: [],
    productGroups: productGroups,
    profit: -totalCostFlower
  };
}

function farmPanelBuildSpiceCard(agingShed, farmActivity) {
  const racks = agingShed && agingShed.racks;
  const jobs = racks && Array.isArray(racks.spice) ? racks.spice : [];
  if (!jobs.length) return null;
  const lastInfo = farmPanelGetLastInfo();
  const farmId = Number(lastInfo.id);
  const validFarmId = Number.isFinite(farmId) && farmId > 0;
  const fa = farmActivity && typeof farmActivity === "object" ? farmActivity : {};
  const astrolabeActive = isBoostActive("astrolabe");
  const refinerChancePct = cookingSkillRankValue("skill_refiner");
  const onesieOn = isBoostActive("salt_bottle_onesie");
  const counters = {};
  const yieldBoostTotals = new Map;
  const slots = jobs.map(job => {
    const rec = SPICE_STATIC_RECIPES[job.recipe];
    if (!rec) return null;
    const outputName = rec.outputName;
    if (counters[job.recipe] === undefined) {
      const raw = Number(fa[`${job.recipe} Spiced`]);
      counters[job.recipe] = Number.isFinite(raw) && raw > 0 ? raw : 0;
    }
    const counter = counters[job.recipe];
    const stampedAgerLevel = farmPanelStampedAgerLevel(job.skills);
    const agerMult = stampedAgerLevel ? ASCENSION_RANK_DATA.skill_ager.values[stampedAgerLevel - 1] : 1;
    let amount = rec.baseAmount * agerMult;
    const itemId = FERMENTATION_SPICE_KNOWN_IDS[outputName];
    if (validFarmId && itemId && astrolabeActive) {
      const hit = sflPrngChance({
        farmId: farmId,
        itemId: itemId,
        counter: counter,
        chance: 15,
        criticalHitName: "Astrolabe"
      });
      if (hit) {
        yieldBoostTotals.set("Astrolabe", (yieldBoostTotals.get("Astrolabe") || 0) + amount);
        amount *= 2;
      }
    }
    if (validFarmId && itemId && outputName === "Refined Salt" && refinerChancePct) {
      const hit = sflPrngChance({
        farmId: farmId,
        itemId: itemId,
        counter: counter,
        chance: refinerChancePct,
        criticalHitName: "Refiner"
      });
      if (hit) {
        amount += 1;
        yieldBoostTotals.set("Refiner", (yieldBoostTotals.get("Refiner") || 0) + 1);
      }
    }
    if (onesieOn) {
      amount += 1;
      yieldBoostTotals.set("Salt Bottle Onesie", (yieldBoostTotals.get("Salt Bottle Onesie") || 0) + 1);
    }
    counters[job.recipe] = counter + 1;
    let costFlower = 0;
    if (job.recipe === "Refined Salt") costFlower = saltCostFlowerForSpiceRack() * SPICE_RECIPES["Refined Salt"].saltQty; else if (job.recipe === "Salt Lick") costFlower = refinedSaltUnitCostFlower() * SPICE_RECIPES["Salt Lick"].refinedSaltQty; else if (job.recipe === "Honey Treat") costFlower = refinedSaltUnitCostFlower() * SPICE_RECIPES["Honey Treat"].refinedSaltQty + honeyCostFlowerForSpiceRack() * SPICE_RECIPES["Honey Treat"].honeyQty;
    return {
      name: outputName,
      recipe: job.recipe,
      amount: amount,
      readyAt: typeof job.readyAt === "number" ? job.readyAt : 0,
      stampedAgerLevel: stampedAgerLevel,
      costFlower: costFlower
    };
  }).filter(Boolean);
  if (!slots.length) return null;
  slots.sort((a, b) => a.readyAt - b.readyAt);
  const now = Date.now();
  const readyCount = slots.filter(s => s.readyAt <= now).length;
  const soonestSec = slots.reduce((min, s) => {
    if (s.readyAt <= now) return min;
    const sec = Math.max(0, Math.round((s.readyAt - now) / 1e3));
    return min == null ? sec : Math.min(min, sec);
  }, null);
  const totalCostFlower = slots.reduce((sum, s) => sum + (s.costFlower || 0), 0);
  const nameCounts = new Map;
  slots.forEach(s => nameCounts.set(s.name, (nameCounts.get(s.name) || 0) + s.amount));
  const productGroups = [];
  const seenNames = new Set;
  slots.forEach(s => {
    if (seenNames.has(s.name)) return;
    seenNames.add(s.name);
    productGroups.push({
      name: s.name,
      amount: nameCounts.get(s.name) || 0
    });
  });
  const chanceBoosts = [];
  if (astrolabeActive) chanceBoosts.push({
    name: "Astrolabe",
    note: "15% chance to double output"
  });
  if (refinerChancePct) chanceBoosts.push({
    name: "Refiner",
    note: `${refinerChancePct}% chance of +1 Refined Salt`
  });
  if (onesieOn) chanceBoosts.push({
    name: "Salt Bottle Onesie",
    note: "+1 flat (worn)"
  });
  return {
    isCookingCard: true,
    cookingBuilding: "Spice Rack",
    cookingKind: "spice",
    slots: slots,
    slotCount: slots.length,
    readyCount: readyCount,
    soonestSec: soonestSec,
    totalCostFlower: totalCostFlower,
    yieldBoostTotals: Array.from(yieldBoostTotals.entries()).map(([name, total]) => ({
      name: name,
      total: total
    })),
    chanceBoosts: chanceBoosts,
    timeBoosts: [],
    productGroups: productGroups,
    profit: -totalCostFlower
  };
}

const FARM_PANEL_COMPOSTER_NAMES = [ "Compost Bin", "Turbo Composter", "Premium Composter" ];

const FARM_PANEL_COMPOSTER_CHAIN_LENGTH = 5;

function fmtCompost(n) {
  if (!isFinite(n)) return "—";
  return (Math.round(n * 100) / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function farmPanelComposterFarmId(json) {
  const fromInfo = Number(farmPanelGetLastInfo().id);
  if (Number.isFinite(fromInfo) && fromInfo > 0) return fromInfo;
  const fromJson = Number(json && json.id);
  return Number.isFinite(fromJson) && fromJson > 0 ? fromJson : null;
}

function farmPanelComposterBoostParts(fig, count) {
  const base = BASE_COMPOSTERS[fig.name];
  const fertParts = [];
  const wormParts = [];
  const timeParts = [];
  fig.activeBoosts.forEach(b => {
    if (b.fertMult) {
      fertParts.push({
        name: b.name,
        note: `×${b.fertMult} base`,
        total: base.output * (b.fertMult - 1) * count
      });
    }
    if (b.fertAdd) {
      fertParts.push({
        name: b.name,
        note: null,
        total: b.fertAdd * count
      });
    }
    if (b.wormBaseMult) {
      wormParts.push({
        name: b.name,
        note: `×${b.wormBaseMult} base`,
        total: null
      });
    }
    if (b.wormAdd) {
      wormParts.push({
        name: b.name,
        note: null,
        total: b.wormAdd * count
      });
    }
    if (b.timeMult) {
      const pct = (1 - b.timeMult) * 100;
      timeParts.push({
        name: b.name,
        pct: pct
      });
    }
  });
  return {
    fertParts: fertParts,
    wormParts: wormParts,
    timeParts: timeParts
  };
}

function farmPanelComputeComposterCards(json) {
  const g = farmSyncExtractGameState(json);
  const buildings = farmPanelField(g, "buildings");
  if (!buildings || typeof buildings !== "object") return [];
  const farmActivity = farmPanelField(g, "farmActivity") || {};
  const farmId = farmPanelComposterFarmId(json);
  const now = Date.now();
  const cards = [];
  FARM_PANEL_COMPOSTER_NAMES.forEach(name => {
    const base = BASE_COMPOSTERS[name];
    const instances = Array.isArray(buildings[name]) ? buildings[name] : [];
    const active = instances.filter(b => b && b.coordinates && b.producing && typeof b.producing.readyAt === "number");
    if (!base || !active.length) return;
    const fig = computeComposterFigures(name);
    fig.name = name;
    const fertilizer = base.fertilizer;
    const wormName = base.wormName;
    const sorted = active.slice().sort((a, b) => a.producing.readyAt - b.producing.readyAt);
    const counterKey = `${wormName} Collected`;
    const startCounter = typeof farmActivity[counterKey] === "number" ? farmActivity[counterKey] : 0;
    const cycles = sorted.map((inst, idx) => {
      const items = inst.producing.items || {};
      const fertQty = typeof items[fertilizer] === "number" ? items[fertilizer] : Number(items[fertilizer]) || fig.outputQty;
      const remainingSec = Math.max(0, (inst.producing.readyAt - now) / 1e3);
      const roll = farmId != null ? composterRollWorms(name, farmId, startCounter + idx, fig) : null;
      return {
        fertQty: fertQty,
        readyAt: inst.producing.readyAt,
        startedAt: inst.producing.startedAt,
        remainingSec: remainingSec,
        ready: inst.producing.readyAt <= now,
        roll: roll
      };
    });
    const count = cycles.length;
    const readyCount = cycles.filter(c => c.ready).length;
    const growing = cycles.filter(c => !c.ready);
    const soonestSec = growing.length ? Math.min(...growing.map(c => c.remainingSec)) : null;
    const fertTotal = cycles.reduce((s, c) => s + c.fertQty, 0);
    const wormExact = farmId != null;
    const wormTotal = wormExact ? cycles.reduce((s, c) => s + c.roll.worms, 0) : fig.wormAvg * count;
    const chain = [];
    if (wormExact) {
      for (let i = 0; i < FARM_PANEL_COMPOSTER_CHAIN_LENGTH; i++) {
        const r = composterRollWorms(name, farmId, startCounter + i, fig);
        chain.push(r);
      }
    }
    const costFlower = coinsToFlower(fig.ingredientCostCoins) * count;
    const expectedFert = fig.outputQty * count;
    const parts = farmPanelComposterBoostParts(fig, count);
    cards.push({
      isComposterCard: true,
      composterName: name,
      searchKey: name.toLowerCase().replace(/\s+/g, "-"),
      fertilizer: fertilizer,
      wormName: wormName,
      count: count,
      readyCount: readyCount,
      soonestSec: soonestSec,
      noEtaCount: 0,
      fertTotal: fertTotal,
      expectedFert: expectedFert,
      fertMismatch: Math.abs(expectedFert - fertTotal) > 1e-9,
      wormTotal: wormTotal,
      wormExact: wormExact,
      wormMin: fig.wormMin * count,
      wormMax: fig.wormMax * count,
      wormAvg: fig.wormAvg * count,
      wormCounterKey: counterKey,
      wormCounterStart: startCounter,
      wormChain: chain,
      cycles: cycles,
      cycleTimeSec: fig.timeVal,
      baseCycleTimeSec: base.timeSec,
      reqs: fig.reqs,
      costFlower: costFlower,
      unitCostFlower: fertTotal > 0 ? costFlower / fertTotal : 0,
      boostParts: parts,
      activeBoosts: fig.activeBoosts,
      profit: -costFlower
    });
  });
  return cards;
}

function farmPanelComputeCookingCards(json) {
  return farmPanelComputeCookingCardsFromState(farmSyncExtractGameState(json));
}

function farmPanelCookingCounterKeys(building, sl) {
  if (building === "Fish Market") return [ `${sl.name} Processed` ];
  if (building === "Aging Shed") return sl.fish ? [ `Aged ${sl.fish} Collected`, `Prime Aged ${sl.fish} Collected` ] : [];
  if (building === "Fermentation Rack") return [ `${sl.name} Fermented` ];
  if (building === "Spice Rack") return sl.recipe ? [ `${sl.recipe} Spiced` ] : [];
  return [ `${sl.name} Cooked` ];
}

const COOKING_INSTANT_RECIPES = {
  "Furikake Sprinkle": "Fire Pit",
  "Surimi Rice Bowl": "Kitchen",
  "Creamy Crab Bite": "Kitchen",
  "Crimstone Infused Fish Oil": "Kitchen"
};

function farmPanelInstantCookEntries(g, buildings) {
  const farmId = Number(farmPanelGetLastInfo().id);
  if (!Number.isFinite(farmId) || farmId <= 0) return [];
  const bumpkin = farmPanelField(g, "bumpkin");
  const nomRaw = Math.floor(Number(bumpkin && bumpkin.skills ? bumpkin.skills["Double Nom"] : 0));
  const nom = Number.isFinite(nomRaw) ? Math.min(Math.max(nomRaw, 0), 3) : 0;
  const masterChefActive = isBoostActive("master_chefs_cleaver");
  const fieryChance = cookingSkillRankValue("skill_fiery_jackpot");
  const out = [];
  Object.keys(COOKING_INSTANT_RECIPES).forEach(name => {
    const building = COOKING_INSTANT_RECIPES[name];
    if (!Array.isArray(buildings[building])) return;
    const itemId = FOOD_KNOWN_IDS[name];
    if (!itemId) return;
    out.push({
      building: building,
      name: name,
      key: `${name} Cooked`,
      price: farmPanelGetMarketPriceFlower(name) || 0,
      feeRate: (feePercent || 0) / 100,
      amountAt: counter => {
        let amount = 1 + (nom ? DOUBLE_NOM_FOOD_BONUS[nom - 1] : 0);
        if (building === "Fire Pit" && fieryChance != null && fieryChance > 0 && sflPrngChance({
          farmId: farmId,
          itemId: itemId,
          counter: counter,
          chance: fieryChance,
          criticalHitName: "Fiery Jackpot"
        })) amount += 1;
        if (masterChefActive && sflPrngChance({
          farmId: farmId,
          itemId: itemId,
          counter: counter,
          chance: 10,
          criticalHitName: "Master Chef's Cleaver"
        })) amount += 1;
        return amount;
      }
    });
  });
  return out;
}

function farmPanelCookingLogSlots(g) {
  const buildings = farmPanelField(g, "buildings");
  if (!buildings || typeof buildings !== "object") return null;
  const present = [];
  COOKING_BUILDINGS.forEach(b => {
    if (Array.isArray(buildings[b])) present.push(b);
  });
  if (Array.isArray(buildings["Fish Market"])) present.push("Fish Market");
  const agingShed = farmPanelField(g, "agingShed");
  if (agingShed && typeof agingShed === "object") present.push("Aging Shed", "Fermentation Rack", "Spice Rack");
  const slots = [];
  farmPanelComputeCookingCardsFromState(g).forEach(card => {
    (card.slots || []).forEach(sl => {
      const name = sl.outputName || sl.name;
      if (!name || !(sl.amount > 0)) return;
      slots.push({
        building: card.cookingBuilding,
        name: name,
        amount: sl.amount,
        readyAt: typeof sl.readyAt === "number" ? sl.readyAt : 0,
        price: farmPanelGetMarketPriceFlower(name) || 0,
        feeRate: (feePercent || 0) / 100,
        keys: farmPanelCookingCounterKeys(card.cookingBuilding, sl)
      });
    });
  });
  const worms = {};
  const composterFarmId = farmPanelComposterFarmId(farmPanelGameState);
  FARM_PANEL_COMPOSTER_NAMES.forEach(name => {
    const base = BASE_COMPOSTERS[name];
    const instances = Array.isArray(buildings[name]) ? buildings[name] : null;
    if (!base || !instances) return;
    present.push(name);
    const fig = computeComposterFigures(name);
    if (composterFarmId != null) worms[name] = counter => {
      const roll = composterRollWorms(name, composterFarmId, counter, fig);
      return roll ? roll.worms : 0;
    };
    instances.forEach(inst => {
      if (!inst || !inst.coordinates || !inst.producing || typeof inst.producing.readyAt !== "number") return;
      const items = inst.producing.items || {};
      const fertQty = typeof items[base.fertilizer] === "number" ? items[base.fertilizer] : Number(items[base.fertilizer]) || fig.outputQty;
      if (!(fertQty > 0)) return;
      slots.push({
        building: name,
        name: base.fertilizer,
        amount: fertQty,
        readyAt: inst.producing.readyAt,
        price: farmPanelGetMarketPriceFlower(base.fertilizer) || 0,
        feeRate: (feePercent || 0) / 100,
        keys: [ `${name} Collected` ],
        worm: {
          name: base.wormName,
          counterKey: `${base.wormName} Collected`,
          price: farmPanelGetMarketPriceFlower(base.wormName) || 0,
          feeRate: (feePercent || 0) / 100
        }
      });
    });
  });
  const activity = farmPanelField(g, "farmActivity");
  return {
    slots: slots,
    present: present,
    worms: worms,
    activity: activity && typeof activity === "object" ? activity : null,
    instant: farmPanelInstantCookEntries(g, buildings)
  };
}

function farmPanelComputeCookingCardsFromState(g) {
  const buildings = farmPanelField(g, "buildings");
  const farmActivity = farmPanelField(g, "farmActivity") || {};
  const cards = [];
  COOKING_BUILDINGS.forEach(building => {
    const instances = buildings && Array.isArray(buildings[building]) ? buildings[building] : null;
    if (!instances || !instances.length) return;
    const card = farmPanelBuildCookingBuildingCard(building, instances, farmActivity, g);
    if (card) cards.push(card);
  });
  const fishMarketInstances = buildings && Array.isArray(buildings["Fish Market"]) ? buildings["Fish Market"] : null;
  if (fishMarketInstances && fishMarketInstances.length) {
    const fmCard = farmPanelBuildFishMarketCard(g, fishMarketInstances, farmActivity);
    if (fmCard) cards.push(fmCard);
  }
  const agingShed = farmPanelField(g, "agingShed");
  if (agingShed) {
    const asCard = farmPanelBuildAgingShedCard(agingShed, farmActivity);
    if (asCard) cards.push(asCard);
    const fmtCard = farmPanelBuildFermentationCard(agingShed, farmActivity);
    if (fmtCard) cards.push(fmtCard);
    const spCard = farmPanelBuildSpiceCard(agingShed, farmActivity);
    if (spCard) cards.push(spCard);
  }
  return cards;
}

export function farmPanelComputeMapNodes(json, picks) {
  if (!json) return [];
  try {
    applyFarmSkillsOnly(json, json);
  } catch (e) {}
  try {
    applyFarmBoostsOnly(json);
  } catch (e) {}
  const raw = farmPanelComputeInProgressRaw(json, {
    mapMode: true,
    mapPicks: picks
  });
  const nodes = [];
  raw.forEach(row => {
    if (!row || !row.mapPos) return;
    let badge = null;
    if (row.harvestsLeft != null) badge = String(row.harvestsLeft);
    else if (row.crimstoneMinesLeft != null) badge = String(row.crimstoneMinesLeft);
    else if (row.oilMinesUntilBonus != null) badge = String(row.oilMinesUntilBonus);
    else if (row.sunstoneMinesLeft != null) badge = String(row.sunstoneMinesLeft);
    else if (row.willSwarm === true) badge = "S";
    const yieldVal = row.qty;
    nodes.push({
      name: row.name,
      x: row.mapPos.x,
      y: row.mapPos.y,
      w: row.mapPos.w,
      h: row.mapPos.h,
      badge: badge,
      yieldVal: typeof yieldVal === "number" ? yieldVal : null,
      procs: Array.isArray(row.mapProcs) ? row.mapProcs : [],
      mapKey: row.mapKey || null,
      pickNo: row.mapPickNo || null,
      autoNo: row.mapAutoNo || null,
      ready: row.ready,
      remainingSec: row.remainingSec
    });
  });
  return nodes;
}

export function farmPanelComputeInProgress(json) {
  fpLimitedEffective = {};
  fpLimitedEntries = {};
  let cards = [];
  for (let pass = 0; pass < 3; pass++) {
    fpLimitedJobs = {};
    cards = farmPanelComputeInProgressOnce(json);
    if (!fpLimitedResolve(json)) break;
  }
  return cards;
}

function farmPanelComputeInProgressOnce(json) {
  try {
    applyFarmSkillsOnly(json, json);
  } catch (e) {}
  try {
    applyFarmBoostsOnly(json);
  } catch (e) {}
  const raw = farmPanelComputeInProgressRaw(json);
  const animalRows = raw.filter(row => ALL_ANIMAL_PRODUCTS.includes(row.name));
  const otherRows = raw.filter(row => !ALL_ANIMAL_PRODUCTS.includes(row.name));
  const animalCards = farmPanelComputeAnimalCards(animalRows);
  const groups = new Map;
  otherRows.forEach(row => {
    if (!groups.has(row.name)) groups.set(row.name, {
      name: row.name,
      nodes: []
    });
    groups.get(row.name).nodes.push(row);
  });
  const cards = Array.from(groups.values()).map(g => {
    const count = g.nodes.length;
    const readyCount = g.nodes.filter(n => n.ready === true).length;
    const sickCount = g.nodes.filter(n => n.sick === true).length;
    const weatherDestroyedCount = g.nodes.filter(n => n.weatherDestroyed === true).length;
    const weatherDestroyedEvent = g.nodes.find(n => n.weatherDestroyed === true && n.weatherDestroyedEvent)?.weatherDestroyedEvent || null;
    const soonestSec = g.nodes.reduce((min, n) => {
      if (n.remainingSec == null) return min;
      return min == null ? n.remainingSec : Math.min(min, n.remainingSec);
    }, null);
    const noEtaCount = g.nodes.filter(n => n.ready === false && n.remainingSec == null).length;
    const actualYieldCount = g.nodes.filter(n => n.isActualYield).length;
    const boostTrackedCount = g.nodes.filter(n => n.exactBoosts != null).length;
    const isDeterministicYield = g.nodes.some(n => n.isDeterministicYield);
    const turnaroundTypesPredicted = [ ...new Set(g.nodes.filter(n => n.turnaroundPredicted === true).map(n => n.treeType)) ];
    const turnaroundCountsByType = {};
    g.nodes.forEach(n => {
      if (n.turnaroundPredicted === true && n.treeType) {
        const chainLen = typeof n.turnaroundChainLength === "number" && n.turnaroundChainLength > 1 ? n.turnaroundChainLength : 2;
        const triggers = chainLen - 1;
        turnaroundCountsByType[n.treeType] = (turnaroundCountsByType[n.treeType] || 0) + triggers;
      }
    });
    const mutantRewardTotals = {};
    g.nodes.forEach(n => {
      if (n.mutantReward) mutantRewardTotals[n.mutantReward.name] = (mutantRewardTotals[n.mutantReward.name] || 0) + n.mutantReward.amount;
    });
    const mutantRewards = Object.keys(mutantRewardTotals).map(name => ({
      name: name,
      amount: mutantRewardTotals[name]
    }));
    const turnaroundBonusYieldEstimate = g.nodes.reduce((sum, n) => sum + (typeof n.turnaroundBonusEstimate === "number" ? n.turnaroundBonusEstimate : 0), 0);
    const seaBlessedChainInfo = g.name === "Salt" ? g.nodes.map(n => n.seaBlessedChain).find(Boolean) || null : null;
    const goldInstantMineTypesPredicted = [ ...new Set(g.nodes.filter(n => n.goldInstantMinePredicted === true).map(n => n.goldRockName)) ];
    const goldInstantMineBonusYieldEstimate = g.nodes.reduce((sum, n) => sum + (typeof n.goldInstantMineBonusEstimate === "number" ? n.goldInstantMineBonusEstimate : 0), 0);
    const crimstoneInstantMinePredicted = g.nodes.some(n => n.crimstoneInstantMinePredicted === true);
    const crimstoneInstantMineBonusYieldEstimate = g.nodes.reduce((sum, n) => sum + (typeof n.crimstoneInstantMineBonusEstimate === "number" ? n.crimstoneInstantMineBonusEstimate : 0), 0);
    const tierCounts = {};
    g.nodes.forEach(n => {
      if (n.tierLabel) tierCounts[n.tierLabel] = (tierCounts[n.tierLabel] || 0) + 1;
    });
    let oilNodeGroups = null;
    if (g.name === "Oil") {
      const oilNodesList = g.nodes.filter(n => typeof n.oilMinesUntilBonus === "number").map((n, idx) => ({
        index: idx + 1,
        minesUntilBonus: n.oilMinesUntilBonus,
        qty: typeof n.qty === "number" ? n.qty : 0
      }));
      if (oilNodesList.length) oilNodeGroups = oilNodesList;
    }
    let saltNodeGroups = null;
    if (g.name === "Salt") {
      const seen = new Map;
      g.nodes.forEach(n => {
        if (typeof n.saltNodeIndex !== "number") return;
        if (seen.has(n.saltNodeIndex)) return;
        seen.set(n.saltNodeIndex, {
          index: n.saltNodeIndex,
          storedCharges: n.saltNodeStoredCharges || 0,
          maxCharges: n.saltNodeMaxCharges || 0,
          qty: ((n.saltNodeStoredCharges || 0) + (n.saltNodeSeaBlessedRestored || 0)) * (n.saltYieldPerCharge || 0),
          yieldPerCharge: n.saltYieldPerCharge || 0,
          seaBlessedRestored: n.saltNodeSeaBlessedRestored || 0,
          seaBlessedHarvests: n.saltNodeSeaBlessedHarvests || 0,
          seaBlessedProcs: n.saltNodeSeaBlessedProcs || [],
          seaBlessedFuture: n.saltNodeSeaBlessedFuture || [],
          seaBlessedWindowRestored: n.saltNodeSeaBlessedWindowRestored || 0
        });
      });
      if (seen.size) saltNodeGroups = Array.from(seen.values()).sort((a, b) => a.index - b.index);
    }
    let crimstoneNodeGroups = null;
    if (g.name === "Crimstone") {
      const seen = new Map;
      g.nodes.forEach(n => {
        if (typeof n.crimstoneNodeIndex !== "number") return;
        if (seen.has(n.crimstoneNodeIndex)) return;
        const minesLeft = typeof n.crimstoneMinesLeft === "number" ? n.crimstoneMinesLeft : 5;
        seen.set(n.crimstoneNodeIndex, {
          index: n.crimstoneNodeIndex,
          streakPosition: Math.min(5, Math.max(1, 6 - minesLeft)),
          qty: typeof n.qty === "number" ? n.qty : 0
        });
      });
      if (seen.size) crimstoneNodeGroups = Array.from(seen.values()).sort((a, b) => a.index - b.index);
    }
    let plantYieldLabel = null;
    let plantYieldGroups = null;
    if (BASE_CROPS[g.name] || BASE_GREENHOUSE[g.name] || FLOWER_VARIETIES[g.name]) {
      plantYieldLabel = BASE_CROPS[g.name] ? "Crops Yield" : BASE_GREENHOUSE[g.name] ? "Greenhouse Yield" : "Flower Bed Yield";
      plantYieldGroups = g.nodes.map((n, idx) => ({
        index: typeof n.plotIndex === "number" ? n.plotIndex : idx + 1,
        qty: typeof n.qty === "number" ? (Array.isArray(n.exactBoosts) ? n.qty - n.exactBoosts.reduce((sum, b) => b.timeMult && b.timeMult !== 1 ? sum : sum + Math.max(0, typeof b.amount === "number" ? b.amount : parseYieldBoostAmount(b.valueText)), 0) : n.qty) : null,
        seedReward: n.seedReward || null
      }));
    }
    const boostedStats = farmPanelGetBoostedYieldStats(g.name);
    if (g.name === "Salt") boostedStats.activeBoosts = farmPanelGetSaltActiveBoosts();
    if (g.name === "Honey") boostedStats.activeBoosts = farmPanelGetHoneyActiveBoosts();
    const boostedPerUnit = boostedStats.yieldVal;
    const basePerUnit = farmPanelGetBaseYield(g.name);
    const usedBoostFallback = g.nodes.some(n => typeof n.qty !== "number");
    const tierYields = {};
    g.nodes.forEach(n => {
      if (!n.tierGroupLabel) return;
      let y = typeof n.qty === "number" ? n.qty : boostedPerUnit;
      if (typeof n.qty === "number" && Array.isArray(n.exactBoosts)) {
        n.exactBoosts.forEach(b => {
          if (typeof b.amount === "number") y -= b.amount;
        });
        if (g.name === "Gold" && typeof n.goldInstantMineBonusEstimate === "number") y -= n.goldInstantMineBonusEstimate;
      }
      tierYields[n.tierGroupLabel] = (tierYields[n.tierGroupLabel] || 0) + y;
    });
    const rawTotalYield = g.nodes.reduce((sum, n) => sum + (typeof n.qty === "number" ? n.qty : boostedPerUnit), 0);
    const totalYield = rawTotalYield;
    const baseTotalYield = basePerUnit * count;
    const avgYieldNodeCount = g.name === "Salt" && typeof g.nodes[0]?.physicalNodes === "number" ? g.nodes[0].physicalNodes : count;
    const avgYieldPerCycle = boostedPerUnit * avgYieldNodeCount;
    const isBoosted = usedBoostFallback && boostedStats.activeBoosts && boostedStats.activeBoosts.length > 0 && totalYield !== baseTotalYield;
    const exactBoostsSeen = new Map;
    g.nodes.forEach(n => {
      (n.exactBoosts || []).forEach(b => {
        const key = b.name + "|" + b.valueText;
        if (!exactBoostsSeen.has(key)) exactBoostsSeen.set(key, b);
      });
    });
    const exactBoosts = Array.from(exactBoostsSeen.values());
    const exactBoostTotalsSeen = new Map;
    g.nodes.forEach(n => {
      (n.exactBoosts || []).forEach(b => {
        const amt = typeof b.amount === "number" ? b.amount : parseYieldBoostAmount(b.valueText);
        if (!amt) return;
        if (!exactBoostTotalsSeen.has(b.name)) exactBoostTotalsSeen.set(b.name, 0);
        exactBoostTotalsSeen.set(b.name, exactBoostTotalsSeen.get(b.name) + amt);
      });
    });
    const exactBoostTotals = Array.from(exactBoostTotalsSeen.entries()).map(([name, total]) => ({
      name: name,
      total: total
    }));
    const exactTimeBoostsSeen = new Map;
    g.nodes.forEach(n => {
      (n.exactBoosts || []).forEach(b => {
        if (!b.timeMult || b.timeMult === 1) return;
        if (!exactTimeBoostsSeen.has(b.name)) exactTimeBoostsSeen.set(b.name, b.timeMult);
      });
    });
    const exactTimeBoosts = Array.from(exactTimeBoostsSeen.entries()).map(([name, timeMult]) => ({
      name: name,
      timeMult: timeMult
    }));
    const econ = farmPanelComputeEconomics(g.name, count, totalYield);
    const displayNodeCount = typeof g.nodes[0]?.physicalNodes === "number" ? g.nodes[0].physicalNodes : count;
    const cycleTimeSec = boostedStats.timeVal || farmPanelGrowTimeSec(g.name);
    const cyclesPerDay = cycleTimeSec ? g.name === "Salt" ? Math.round(86400 / cycleTimeSec) : 86400 / cycleTimeSec : null;
    const shrineInfo = getActiveShrineDailyCostStable(boostedStats.activeBoosts);
    const shrineCostPerCycle = shrineInfo.total > 0 ? cyclesPerDay ? shrineInfo.total / cyclesPerDay : shrineInfo.total : 0;
    let fruitWood = null;
    let harvestsLeftCounts = null;
    let fruitWoodPerTree = null;
    const fruitDef = BASE_FRUITS[g.name];
    if (fruitDef && g.nodes.some(n => typeof n.harvestsLeft === "number")) {
      harvestsLeftCounts = {};
      g.nodes.forEach(n => {
        if (typeof n.harvestsLeft !== "number") return;
        harvestsLeftCounts[n.harvestsLeft] = (harvestsLeftCounts[n.harvestsLeft] || 0) + 1;
      });
      const treesAtFinalHarvest = harvestsLeftCounts[1] || 0;
      const boostedFruit = computeBoostedFruitStats(g.name, fruitDef.yieldPerHarvest, fruitDef.timeSec, fruitDef.minHarvest);
      fruitWoodPerTree = Math.max(0, (fruitDef.woodReturnQty || 0) - (boostedFruit.woodReturnPenalty || 0) + (boostedFruit.woodReturnAdd || 0));
      if (treesAtFinalHarvest > 0) {
        const woodTotalYield = fruitWoodPerTree * treesAtFinalHarvest;
        if (woodTotalYield > 0) {
          const woodEcon = farmPanelComputeEconomics("Wood", treesAtFinalHarvest, woodTotalYield);
          if (boostedFruit.noWoodCost) {
            woodEcon.costPerUnit = 0;
            woodEcon.seedCost = 0;
            woodEcon.restockInfo = null;
            woodEcon.restockCost = 0;
            woodEcon.totalCost = 0;
            woodEcon.profit = woodEcon.netRevenue;
          }
          fruitWood = {
            treesAtFinalHarvest: treesAtFinalHarvest,
            perTreeQty: fruitWoodPerTree,
            noWoodCost: boostedFruit.noWoodCost,
            econ: woodEcon
          };
        }
      }
    }
    const profitWithShrine = econ.profit - shrineCostPerCycle + (fruitWood ? fruitWood.econ.profit : 0);
    let moneyTreeBonus = null;
    if (g.name === "Wood") {
      const mtData = farmPanelDetectMoneyTreeBonus(json);
      const mtBatchCoins = (mtData.batchPredictions || []).reduce((sum, b) => sum + (b.coins || 0), 0);
      const mtCoins = (mtData.totalCoins || 0) + (mtBatchCoins > 0 ? mtBatchCoins : mtData.predictedCoins || 0);
      if (mtCoins > 0) {
        moneyTreeBonus = {
          coins: mtCoins
        };
      }
    }
    let isHoneyCard = false;
    let honeyHiveDetails = null;
    let honeySwarmCount = 0;
    let honeyMaxPerFill = null;
    if (g.name === "Honey") {
      isHoneyCard = true;
      const sortedHives = g.nodes.slice().sort((a, b) => (a.hiveIndex ?? 0) - (b.hiveIndex ?? 0));
      honeyMaxPerFill = sortedHives.length && typeof sortedHives[0].maxHoneyPerFill === "number" ? sortedHives[0].maxHoneyPerFill : null;
      honeySwarmCount = sortedHives.filter(n => n.willSwarm === true).length;
      honeyHiveDetails = sortedHives.map((n, i) => ({
        label: `Beehive ${i + 1}`,
        currentQty: typeof n.qty === "number" ? n.qty : 0,
        maxQty: typeof n.maxHoneyPerFill === "number" ? n.maxHoneyPerFill : honeyMaxPerFill,
        fillPct: n.maxHoneyPerFill > 0 ? Math.max(0, Math.min(100, n.qty / n.maxHoneyPerFill * 100)) : 0,
        willSwarm: n.willSwarm === true,
        ready: n.ready === true,
        remainingSec: typeof n.remainingSec === "number" ? n.remainingSec : null,
        readyAtMs: typeof n.readyAtMs === "number" ? n.readyAtMs : null,
        stallAtMs: typeof n.stallAtMs === "number" ? n.stallAtMs : null
      }));
    }
    return {
      ...econ,
      profit: profitWithShrine,
      fruitWood: fruitWood,
      harvestsLeftCounts: harvestsLeftCounts,
      fruitWoodPerTree: fruitWoodPerTree,
      readyCount: readyCount,
      sickCount: sickCount,
      weatherDestroyedCount: weatherDestroyedCount,
      weatherDestroyedEvent: weatherDestroyedEvent,
      soonestSec: soonestSec,
      noEtaCount: noEtaCount,
      actualYieldCount: actualYieldCount,
      boostTrackedCount: boostTrackedCount,
      isDeterministicYield: isDeterministicYield,
      mutantRewards: mutantRewards,
      turnaroundTypesPredicted: turnaroundTypesPredicted,
      turnaroundCountsByType: turnaroundCountsByType,
      turnaroundBonusYieldEstimate: turnaroundBonusYieldEstimate,
      seaBlessedChain: seaBlessedChainInfo,
      moneyTreeBonus: moneyTreeBonus,
      isHoneyCard: isHoneyCard,
      honeyHiveDetails: honeyHiveDetails,
      honeySwarmCount: honeySwarmCount,
      honeyMaxPerFill: honeyMaxPerFill,
      goldInstantMineTypesPredicted: goldInstantMineTypesPredicted,
      goldInstantMineBonusYieldEstimate: goldInstantMineBonusYieldEstimate,
      crimstoneInstantMinePredicted: crimstoneInstantMinePredicted,
      crimstoneInstantMineBonusYieldEstimate: crimstoneInstantMineBonusYieldEstimate,
      baseTotalYield: baseTotalYield,
      avgYieldPerCycle: avgYieldPerCycle,
      isBoosted: isBoosted,
      cycleTimeSec: cycleTimeSec,
      activeBoosts: boostedStats.activeBoosts,
      exactBoosts: exactBoosts,
      exactBoostTotals: exactBoostTotals,
      exactTimeBoosts: exactTimeBoosts,
      nodeYields: g.nodes.filter(n => typeof n.mapKey === "string" && typeof n.qty === "number").map(n => ({
        key: n.mapKey,
        qty: n.qty
      })),
      tierCounts: tierCounts,
      tierYields: tierYields,
      oilNodeGroups: oilNodeGroups,
      saltNodeGroups: saltNodeGroups,
      crimstoneNodeGroups: crimstoneNodeGroups,
      plantYieldLabel: plantYieldLabel,
      plantYieldGroups: plantYieldGroups,
      displayNodeCount: displayNodeCount,
      cyclesPerDay: cyclesPerDay,
      shrineCostPerCycle: shrineCostPerCycle,
      shrineNames: shrineInfo.shrines.map(x => x.name),
      shrineDetails: shrineInfo.shrines.map(x => ({
        name: x.name,
        totalCost: x.totalCost,
        durationDays: x.durationDays,
        dailyCostPreShare: x.dailyCostPreShare,
        shareCount: x.shareCount,
        dailyCostPostShare: x.dailyCost,
        perCycleContribution: cyclesPerDay ? x.dailyCost / cyclesPerDay : x.dailyCost
      }))
    };
  });
  const cookingCards = farmPanelComputeCookingCards(json);
  const composterCards = farmPanelComputeComposterCards(json);
  const allCards = cards.concat(animalCards).concat(composterCards).concat(cookingCards);
  allCards.sort((a, b) => b.profit - a.profit);
  farmPanelComputeCropMachineCards(json).forEach(card => allCards.push(card));
  farmPanelComputeMushroomCards(json, farmPanelComputeEconomics).forEach(card => allCards.push(card));
  farmPanelComputeMycoCard(json).forEach(card => allCards.push(card));
  const peteQuestCard = farmPanelComputePeteQuestCard(json);
  if (peteQuestCard) allCards.push(peteQuestCard);
  const floatingIslandCard = farmPanelComputeFloatingIslandCard(json);
  if (floatingIslandCard) allCards.push(floatingIslandCard);
  const fishingCard = farmPanelComputeFishingCard(json, String(json && json.id || farmPanelGetLastInfo().id || ""));
  if (fishingCard) allCards.push(fishingCard);
  const caveMerchantCard = farmPanelComputeCaveMerchantCard(json);
  if (caveMerchantCard) allCards.push(caveMerchantCard);
  farmPanelComputePowerSkillCards(json).forEach(card => allCards.push(card));
  const skillResetCard = farmPanelComputeSkillResetCard(json);
  if (skillResetCard) allCards.push(skillResetCard);
  return allCards;
}

const PETE_QUEST_LINK = "https://github.com/01101010110/Pumpkin-Pete-Quests/blob/main/Quests.md";

const PETE_REWARD_ALIASES = {
  coin: "Coins",
  coins: "Coins",
  gem: "Gem",
  gems: "Gem",
  axes: "Axe",
  pickaxes: "Pickaxe",
  rods: "Rod",
  "love charms": "Love Charm",
  "wild mushrooms": "Wild Mushroom",
  mushrooms: "Wild Mushroom",
  mushroom: "Wild Mushroom",
  "kale seeds": "Kale Seed"
};

function farmPanelPeteIconHtml() {
  const src = NPC_ICONS && NPC_ICONS["pumpkin' pete"];
  if (!src) return "🎃";
  return `<img src="${src}" alt="Pumpkin Pete" style="width:14px;height:14px;image-rendering:pixelated;vertical-align:middle;">`;
}

function peteTitleCase(text) {
  return String(text || "").trim().replace(/\S+/g, w => w.charAt(0).toUpperCase() + w.slice(1));
}

function peteNormalizeItemName(raw) {
  const lower = String(raw || "").trim().toLowerCase();
  if (PETE_REWARD_ALIASES[lower]) return PETE_REWARD_ALIASES[lower];
  const titled = peteTitleCase(lower);
  const hasIcon = n => !!(IMAGE_ICONS[n] || ICONS[n]);
  if (hasIcon(titled)) return titled;
  if (lower.endsWith("es") && hasIcon(peteTitleCase(lower.slice(0, -2)))) return peteTitleCase(lower.slice(0, -2));
  if (lower.endsWith("s") && hasIcon(peteTitleCase(lower.slice(0, -1)))) return peteTitleCase(lower.slice(0, -1));
  return titled;
}

function peteRewardIconHtml(name) {
  if (name === "Coins") return COIN_ICON;
  const hasIcon = n => !!(IMAGE_ICONS[n] || ICONS[n]);
  if (hasIcon(name)) return getIcon(name);
  if (/ Seed$/.test(name)) {
    const base = name.replace(/ Seed$/, "");
    if (hasIcon(base)) return getIcon(base);
  }
  if (/mushroom/i.test(name)) return '<span style="font-size:calc(16px * var(--fs-desk,1));line-height:1;">🍄</span>';
  return "";
}

function peteParseReward(text) {
  const raw = String(text || "").trim();
  return raw.split(/\s+and\s+/i).map(p => p.trim()).filter(Boolean).map(part => {
    const m = part.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
    if (!m) return {
      label: peteTitleCase(part),
      icon: ""
    };
    const itemName = peteNormalizeItemName(m[2]);
    return {
      label: `${m[1]} ${peteTitleCase(m[2])}`,
      icon: peteRewardIconHtml(itemName)
    };
  });
}

const MYCO_RECIPE_LABELS = {
  Mushroom: "Mushroom mix",
  Beetle: "Beetle mix",
  Mud: "Mud mix"
};

function farmPanelComputeMycoCard(json) {
  try {
    const g = farmSyncExtractGameState(json);
    const cave = farmPanelField(g, "cave");
    if (!cave || typeof cave !== "object" || !cave.machines || typeof cave.machines !== "object") return [];
    const ids = Object.keys(cave.machines).sort((a, b) => Number(a) - Number(b));
    const now = Date.now();
    return ids.map(id => {
      const machine = cave.machines[id];
      const batch = machine && machine.batch;
      const readyAtMs = batch ? Number(batch.readyAt) || 0 : 0;
      const dugCount = batch && batch.dug ? Object.keys(batch.dug).length : 0;
      let state = "idle";
      if (batch) {
        if (readyAtMs > now) state = "growing"; else if (dugCount < 25) state = "ready";
      }
      let buried = null;
      if (batch && state !== "idle") {
        try {
          buried = caveBuriedCounts(batch);
        } catch (e) {
          buried = null;
        }
      }
      const remainingSec = state === "growing" ? (readyAtMs - now) / 1e3 : 0;
      const skillMap = g && g.bumpkin && g.bumpkin.skills && typeof g.bumpkin.skills === "object" ? g.bumpkin.skills : {};
      const skillLevel = skillName => {
        const key = Object.keys(skillMap).find(k => k.trim().toLowerCase() === skillName.toLowerCase());
        if (!key) return 0;
        return Math.min(Math.max(Math.round(Number(skillMap[key])) || 1, 1), 3);
      };
      return {
        isMycoCard: true,
        batchSkills: batch && batch.skills ? batch.skills : null,
        fungalLevel: skillLevel("Fungal Harvest"),
        muddyLevel: skillLevel("Muddy Bounty"),
        twinLevel: skillLevel("Twin Beetles"),
        vipBeetle: farmSyncHasVipBeetleBonus(g, Date.now()) ? VIP_BEETLE_BONUS_CHANCE / 100 : 0,
        binId: id,
        name: "Myco Bin " + id,
        searchKey: "myco-bin-" + id,
        profit: 0,
        count: 1,
        state: state,
        recipe: batch ? MYCO_RECIPE_LABELS[batch.recipe] || String(batch.recipe) : "",
        readyAtMs: readyAtMs,
        remainingSec: remainingSec,
        dugCount: dugCount,
        buried: buried,
        readyCount: state === "ready" ? 1 : 0,
        growingCount: state === "growing" ? 1 : 0,
        idleCount: state === "idle" ? 1 : 0,
        soonestSec: state === "growing" ? remainingSec : null
      };
    });
  } catch (e) {
    return [];
  }
}

function farmPanelMachineList(g) {
  const buildings = farmPanelField(g, "buildings");
  const list = buildings && typeof buildings === "object" && Array.isArray(buildings["Crop Machine"]) ? buildings["Crop Machine"] : [];
  return list.filter(m => m && typeof m === "object" && m.coordinates);
}

function farmPanelMachineResolvePacks(m, windows, now) {
  const queue = Array.isArray(m.queue) ? m.queue.filter(p => p && typeof p === "object") : [];
  const windowed = typeof m.oilSettledAt === "number";
  const timing = windowed ? resolveCropMachine({
    machine: Object.assign({}, m, {
      queue: queue
    }),
    windows: windows
  }) : null;
  const packs = queue.map((pack, index) => {
    const t = timing ? timing.packs[index] : null;
    let readyAt, startsAt, growsUntil;
    if (t) {
      readyAt = t.readyAt;
      startsAt = t.startsAt;
      growsUntil = t.growsUntil;
    } else {
      readyAt = typeof pack.readyAt === "number" ? pack.readyAt : undefined;
      startsAt = typeof pack.startTime === "number" ? pack.startTime : undefined;
      growsUntil = typeof pack.growsUntil === "number" ? pack.growsUntil : undefined;
    }
    let status;
    if (readyAt !== undefined && readyAt <= now) status = "ready"; else if (readyAt !== undefined) status = startsAt !== undefined && startsAt <= now ? "growing" : "queued"; else if (growsUntil !== undefined) status = growsUntil <= now ? "stalled" : "growing"; else status = "idle";
    const seeds = Math.max(0, Math.floor(Number(pack.seeds) || 0));
    return {
      index: index,
      crop: pack.crop,
      seeds: seeds,
      pack: pack,
      status: status,
      readyAt: readyAt,
      growsUntil: growsUntil,
      remainingSec: readyAt !== undefined ? Math.max(0, (readyAt - now) / 1e3) : null,
      key: `${m.id}|${pack.crop}|${seeds}|${Math.round(Number(pack.totalGrowTime) || 0)}`
    };
  });
  const fuelMs = windowed ? cropMachineFuelAt({
    machine: Object.assign({}, m, {
      queue: queue
    }),
    windows: windows,
    at: now
  }) : Math.max(0, Number(m.unallocatedOilTime) || 0);
  return {
    packs: packs,
    windowed: windowed,
    fuelMs: fuelMs,
    fuelOutAt: timing && typeof timing.fuelRunsOutAt === "number" ? timing.fuelRunsOutAt : null
  };
}

function farmPanelMachineCritInfo(cropName, farmId) {
  const itemId = CROP_KNOWN_IDS[cropName];
  const list = [];
  if (isBoostActive("green_amulet")) list.push({
    name: "Green Amulet",
    chance: 10
  });
  if (cropName === "Potato" && isBoostActive("peeled_potato")) list.push({
    name: "Peeled Potato",
    chance: 20
  });
  if (cropName === "Potato" && isBoostActive("potent_potato")) list.push({
    name: "Potent Potato",
    chance: 10 / 3
  });
  if (cropName === "Sunflower" && isBoostActive("stellar_sunflower")) list.push({
    name: "Stellar Sunflower",
    chance: 10 / 3
  });
  if (cropName === "Radish" && isBoostActive("radical_radish")) list.push({
    name: "Radical Radish",
    chance: 10 / 3
  });
  const resolvable = !!(farmId && itemId);
  return {
    list: resolvable ? list : [],
    itemId: itemId,
    unresolved: !resolvable && list.length > 0
  };
}

export function farmPanelCropMachinePackYield(g, pack, startCounter, atTime, farmId) {
  const seeds = Math.max(0, Math.floor(Number(pack.seeds) || 0));
  if (typeof pack.amount === "number" && isFinite(pack.amount)) return {
    amount: pack.amount,
    seeds: seeds,
    crits: {},
    gains: null,
    exact: true
  };
  const fid = Number.isFinite(Number(farmId)) && Number(farmId) > 0 ? Number(farmId) : null;
  const info = farmPanelMachineCritInfo(pack.crop, fid);
  const crits = {};
  const cache = {};
  const gains = {};
  let total = 0;
  for (let i = 0; i < seeds; i++) {
    const fired = {};
    let key = "";
    info.list.forEach(c => {
      const hit = !!sflPrngChance({
        farmId: fid,
        itemId: info.itemId,
        counter: startCounter + i,
        chance: c.chance,
        criticalHitName: c.name
      });
      fired[c.name] = hit;
      key += hit ? "1" : "0";
      if (hit) crits[c.name] = (crits[c.name] || 0) + 1;
    });
    let v = cache[key];
    if (v === undefined) {
      const r = fpYieldAt("cropmachine", atTime, () => farmPanelComputeExactCropYield(null, g, pack.crop, null, startCounter + i, false, atTime, {
        noSeedDrop: true,
        machine: true,
        crits: fired,
        farmId: fid
      }));
      v = {
        amount: r.amount,
        gains: (r.boosts || []).filter(b => !(b.timeMult && b.timeMult !== 1)).map(b => ({
          name: b.name,
          value: typeof b.amount === "number" ? b.amount : parseYieldBoostAmount(b.valueText)
        })).filter(b => b.value > 1e-9)
      };
      cache[key] = v;
    }
    total += v.amount;
    v.gains.forEach(b => {
      gains[b.name] = (gains[b.name] || 0) + b.value;
    });
  }
  return {
    amount: Math.round(total * 1e8) / 1e8,
    seeds: seeds,
    crits: crits,
    gains: gains,
    exact: !info.unresolved
  };
}

function farmPanelCropMachineLogProvider(g, fid) {
  const machines = farmPanelMachineList(g);
  if (!machines.length) return null;
  const now = Date.now();
  const windows = cropMachineWindows(g, fpLimitedExt("cropmachine"));
  const packs = [];
  machines.forEach(m => {
    farmPanelMachineResolvePacks(m, windows, now).packs.forEach(p => {
      if (!p.crop) return;
      const e = {
        key: p.key,
        crop: p.crop,
        seeds: p.seeds,
        readyAt: p.readyAt
      };
      if (typeof p.pack.amount === "number") e.amount = p.pack.amount;
      packs.push(e);
    });
  });
  return {
    packs: packs,
    yieldOf: (crop, seeds, counter, atTime, amt) => typeof amt === "number" ? {
      amount: amt,
      exact: true
    } : farmPanelCropMachinePackYield(g, {
      crop: crop,
      seeds: seeds
    }, counter, atTime, fid)
  };
}

export function farmPanelComputeCropMachineCards(json) {
  try {
    const g = farmSyncExtractGameState(json);
    const machines = farmPanelMachineList(g).filter(m => Array.isArray(m.queue) && m.queue.length);
    if (!machines.length) return [];
    const now = Date.now();
    const windows = cropMachineWindows(g, fpLimitedExt("cropmachine"));
    fpLimitedLog("cropmachine", {
      horizonFn: set => {
        const w = cropMachineWindows(g, set);
        let latest = 0;
        machines.forEach(m => farmPanelMachineResolvePacks(m, w, now).packs.forEach(p => {
          if (typeof p.readyAt === "number" && p.readyAt > latest) latest = p.readyAt;
        }));
        return latest;
      }
    });
    const farmId = Number(farmPanelGetLastInfo().id);
    const farmIdOk = Number.isFinite(farmId) && farmId > 0;
    const activity = farmPanelField(g, "farmActivity") || {};
    const resolved = machines.map(m => Object.assign({
      m: m
    }, farmPanelMachineResolvePacks(m, windows, now)));
    const order = [];
    resolved.forEach(r => r.packs.forEach(p => order.push(p)));
    order.sort((a, b) => (a.status === "ready" ? 0 : 1) - (b.status === "ready" ? 0 : 1));
    const counters = {};
    order.forEach(p => {
      if (!p.crop) return;
      if (counters[p.crop] === undefined) {
        const raw = Number(activity[`${p.crop} Harvested`]);
        counters[p.crop] = Number.isFinite(raw) && raw > 0 ? raw : 0;
      }
      p.startCounter = counters[p.crop];
      const at = p.status === "ready" || p.readyAt === undefined ? now : Math.max(now, p.readyAt);
      p.yield = farmPanelCropMachinePackYield(g, p.pack, p.startCounter, at, farmIdOk ? farmId : null);
      counters[p.crop] = p.startCounter + p.seeds;
    });
    const feeRate = (feePercent || 0) / 100;
    return resolved.map((r, mi) => {
      const groups = {};
      r.packs.forEach(p => {
        if (!p.crop || !p.yield) return;
        const grp = groups[p.crop] || (groups[p.crop] = {
          name: p.crop,
          seeds: 0,
          packs: 0,
          amount: 0,
          readyAmount: 0,
          readyPacks: 0,
          crits: {},
          gains: {},
          gainsExact: true,
          exact: true,
          startCounter: p.startCounter
        });
        grp.seeds += p.seeds;
        grp.packs += 1;
        grp.amount += p.yield.amount;
        if (p.status === "ready") {
          grp.readyAmount += p.yield.amount;
          grp.readyPacks += 1;
        }
        Object.keys(p.yield.crits || {}).forEach(k => {
          grp.crits[k] = (grp.crits[k] || 0) + p.yield.crits[k];
        });
        if (p.yield.gains) Object.keys(p.yield.gains).forEach(k => {
          grp.gains[k] = (grp.gains[k] || 0) + p.yield.gains[k];
        }); else grp.gainsExact = false;
        if (!p.yield.exact) grp.exact = false;
        grp.startCounter = Math.min(grp.startCounter, p.startCounter);
      });
      const cropRows = Object.keys(groups).map(name => {
        const grp = groups[name];
        const price = farmPanelGetMarketPriceFlower(name);
        const gross = grp.amount * price;
        let boosts = [];
        try {
          boosts = farmPanelComputeExactCropYield(null, g, name, null, grp.startCounter, false, now, {
            noSeedDrop: true,
            crits: {},
            farmId: farmIdOk ? farmId : null
          }).boosts;
        } catch (e) {
          boosts = [];
        }
        return Object.assign(grp, {
          amount: Math.round(grp.amount * 1e4) / 1e4,
          price: price,
          gross: gross,
          fee: gross * feeRate,
          boosts: boosts
        });
      });
      cropRows.sort((a, b) => b.gross - a.gross || a.name.localeCompare(b.name));
      const readyCount = r.packs.filter(p => p.status === "ready").length;
      const waiting = r.packs.filter(p => p.status !== "ready" && p.remainingSec != null);
      const soonestSec = waiting.length ? Math.min(...waiting.map(p => p.remainingSec)) : null;
      const label = resolved.length > 1 ? `Crop Machine ${mi + 1}` : "Crop Machine";
      const gross = cropRows.reduce((s, c) => s + c.gross, 0);
      const fee = cropRows.reduce((s, c) => s + c.fee, 0);
      const growingNow = r.packs.some(p => p.status === "growing");
      const speed = r.windowed && growingNow ? effectiveSpeedAt(now, windows) : 1;
      return {
        isCropMachineCard: true,
        name: label,
        searchKey: label.toLowerCase().replace(/\s+/g, "-"),
        profit: 0,
        count: r.packs.length,
        readyCount: readyCount,
        growingCount: r.packs.length - readyCount,
        soonestSec: soonestSec,
        packs: r.packs,
        crops: cropRows,
        gross: gross,
        fee: fee,
        fuelMs: r.fuelMs,
        fuelOutAt: r.fuelOutAt,
        windowed: r.windowed,
        speed: speed,
        farmIdOk: farmIdOk,
        isReady: readyCount > 0
      };
    });
  } catch (e) {
    return [];
  }
}

function farmPanelCropMachineStatusText(p) {
  if (p.status === "ready") return "✅ Ready";
  if (p.status === "growing" && p.remainingSec == null) {
    const stallSec = p.growsUntil !== undefined ? Math.max(0, (p.growsUntil - Date.now()) / 1e3) : 0;
    return `⛽ Oil runs out in <span class="farm-countdown" data-base="${stallSec}">${guroCountdownText(stallSec)}</span>`;
  }
  if (p.status === "growing") return `⏳ <span class="farm-countdown" data-base="${p.remainingSec}">${guroCountdownText(p.remainingSec)}</span>`;
  if (p.status === "queued") return `🕒 Queued${p.remainingSec != null ? ` · <span class="farm-countdown" data-base="${p.remainingSec}">${guroCountdownText(p.remainingSec)}</span>` : ""}`;
  if (p.status === "stalled") return "⛽ Out of oil";
  return "⛽ Waiting for oil";
}

function farmPanelCropMachineBoostHtml(row) {
  const blocks = row.crops.map(c => {
    const rows = [];
    const cropIcon = getIcon(c.name);
    if (c.gainsExact && c.gains) {
      Object.keys(c.gains).filter(name => c.gains[name] > 1e-9).sort((a, b) => c.gains[b] - c.gains[a]).forEach(name => {
        rows.push(`<div class="boost-applied-row is-yield">${getBoostIcon(name)}<b>${escapeHtml(name)}</b> <span class="boost-total-value">+${fmt(c.gains[name])}</span>${cropIcon}</div>`);
      });
      (c.boosts || []).filter(b => b.timeMult && b.timeMult !== 1 && !(c.gains[b.name] > 1e-9)).forEach(b => {
        rows.push(`<div class="boost-applied-row is-yield">${getBoostIcon(b.name)}<b>${escapeHtml(b.name)}</b> <span class="boost-total-value">${escapeHtml(b.valueText || "")}</span></div>`);
      });
    } else {
      (c.boosts || []).forEach(b => {
        rows.push(`<div class="boost-applied-row is-yield">${getBoostIcon(b.name)}<b>${escapeHtml(b.name)}</b> <span class="boost-total-value">${escapeHtml(b.valueText || "")}</span></div>`);
      });
      Object.keys(c.crits || {}).forEach(name => {
        rows.push(`<div class="boost-applied-row is-yield">${getBoostIcon(name)}<b>${escapeHtml(name)}</b> <span class="boost-total-value">${c.crits[name]}× crit procs</span></div>`);
      });
    }
    if (!rows.length) return "";
    return `<div class="lib-section-title" style="margin-top:10px;">${escapeHtml(c.name.toUpperCase())}</div>${rows.join("")}`;
  }).join("");
  if (!blocks) return "";
  return `<div class="section-badge is-boost-label">⚡ Applied Boost</div>${blocks}`;
}

export function farmPanelRenderCropMachineCard(row) {
  const expandedCls = farmPanelExpandedNames.has(row.searchKey) ? " expanded" : "";
  const statusBadgeHtml = farmPanelStatusBadgeHtml(row.readyCount, row.growingCount, "Growing");
  const statusFoldHtml = guroStatusFoldHtml("Ready", row.readyCount < row.count ? row.soonestSec : null);
  const machineIcon = getIcon("Crop Machine");
  const dailyBadgeHtml = dailyHarvestBadgeHtml("Crop Machine", "cropmachine", machineIcon, farmPanelDailyFarmId());
  const chipsHtml = row.crops.map(c => `\n      <span class="animal-produce-chip">\n        <span class="produce-yield">${c.exact ? "+" : "~+"}${fmtCompost(c.amount)}</span>\n        <span class="produce-icon">${getIcon(c.name)}</span>\n      </span>`).join("");
  const valueBlockHtml = row.gross > 0 ? guroValueBlockHtml(row.gross, row.fee, fmt) : "";
  const cropRowsHtml = row.crops.map(c => {
    const counterRow = `<div class="animal-detail-stat"><span class="label">${escapeHtml(c.name)} Harvested</span><span class="value">${c.startCounter}</span></div>`;
    const seedRow = `<div class="animal-detail-stat"><span class="label">${escapeHtml(c.name)} Seeds</span><span class="value">${fmtCompost(c.seeds)} in ${c.packs} pack${c.packs === 1 ? "" : "s"}</span></div>`;
    const readyRow = c.readyPacks > 0 && c.readyPacks < c.packs ? `<div class="animal-detail-stat"><span class="label">${escapeHtml(c.name)} Ready now</span><span class="value">${fmtCompost(c.readyAmount)} ${getIcon(c.name)}</span></div>` : "";
    return renderAnimalCardProductDetailRow(getIcon(c.name), c.name, c.amount, c.gross, c.fee) + seedRow + readyRow + counterRow;
  }).join("");
  const packRowsHtml = row.packs.map(p => `<div class="animal-detail-stat"><span class="label">Pack ${p.index + 1} · ${fmtCompost(p.seeds)} ${getIcon(p.crop)}</span><span class="value">${p.yield ? `${p.yield.exact ? "+" : "~+"}${fmtCompost(p.yield.amount)} · ` : ""}${farmPanelCropMachineStatusText(p)}</span></div>`).join("");
  let fuelText;
  if (row.fuelMs > 0) {
    fuelText = `⛽ ${farmPanelFormatSpiceDuration(row.fuelMs / 1e3)} of oil`;
    if (row.fuelOutAt != null && row.fuelOutAt > Date.now()) fuelText += ` · runs dry in ${farmPanelFormatSpiceDuration((row.fuelOutAt - Date.now()) / 1e3)}`;
  } else {
    fuelText = "⛽ Out of oil";
  }
  const speedText = row.speed > 1 ? ` · ⚡ ×${Math.round(row.speed * 1e3) / 1e3} speed` : "";
  const fuelRow = `<div class="animal-detail-stat"><span class="label">Oil</span><span class="value">${fuelText}${speedText}</span></div>`;
  const totalsHtml = row.gross > 0 ? `\n        <div class="animal-detail-stat"><span class="label">Market Value</span><span class="value">${fmt(row.gross)} ${FLOWER_ICON}</span></div>\n        <div class="animal-detail-stat"><span class="label">Tax</span><span class="value">${row.fee > 0 ? `-${fmt(row.fee)}` : "0"} ${FLOWER_ICON}</span></div>` : "";
  const netHtml = row.gross > 0 ? `<div class="animal-net-row2"><span class="label">Net</span><span class="value is-profit">${fmt(row.gross - row.fee)} ${FLOWER_ICON}</span></div>` : "";
  const inexact = row.crops.some(c => !c.exact);
  const noteText = inexact ? "Enter your Farm ID and sync to resolve crit procs; amounts marked ~ exclude them." : "Yields are exact for the current harvest counter: ready packs are harvested first, in queue order, and each seed uses its own counter position. Harvesting the same crop from plots first shifts the counter.";
  const boostHtml = farmPanelCropMachineBoostHtml(row);
  return `
  <div class="card animal-merged-card${row.readyCount > 0 ? " is-profit" : ""}${expandedCls}" data-search="${row.searchKey}" data-fp-category="crops">
    <div class="card-toggle">
      <div class="card-name-row">
        <span class="card-icon">${machineIcon}</span>
        <div>
          <div class="card-name">${escapeHtml(row.name)}</div>
          <div class="card-type-row">
            <span class="card-type">${row.count} pack${row.count === 1 ? "" : "s"} · ${row.crops.length} crop${row.crops.length === 1 ? "" : "s"}</span>
          </div>
          <div class="animal-fold-row">${chipsHtml}</div>${valueBlockHtml}
        </div>
      </div>
      <div class="card-collapsed-profit">
        <span class="harvest-stack">${dailyBadgeHtml}${statusBadgeHtml}</span>
        <span class="chev">▾</span>
      </div>
      ${statusFoldHtml}
    </div>
    <div class="card-details">
      <div class="animal-detail-grid">
        ${fuelRow}
        ${packRowsHtml}
        ${cropRowsHtml}
        ${totalsHtml}
      </div>
      ${netHtml}
      ${boostHtml}
      ${fpLimitedBlockHtml(row)}
      <div class="boost-mult-note" style="margin-top:8px;">${noteText}</div>
    </div>
  </div>`;
}

function farmPanelComputePeteQuestCard(json) {
  try {
    const g = farmSyncExtractGameState(json);
    const telegram = farmPanelField(g, "telegram");
    const quest = telegram && typeof telegram === "object" ? telegram.quest : null;
    if (!quest || typeof quest.name !== "string" || !quest.name.trim()) return null;
    const startAt = Number(quest.startAt);
    const readyAtMs = Number.isFinite(startAt) && startAt > 0 ? startAt : 0;
    const remainingSec = readyAtMs > Date.now() ? (readyAtMs - Date.now()) / 1e3 : 0;
    const questKey = quest.name.trim();
    const info = getPumpkinPeteQuest(questKey);
    return {
      isPeteQuestCard: true,
      name: "Pumpkin Pete Quest",
      profit: 0,
      questKey: questKey,
      title: info ? info.title : peteTitleCase(questKey.replace(/[-_]+/g, " ")),
      description: info ? info.description : "",
      choices: info && Array.isArray(info.choices) ? info.choices : [],
      isKnown: !!info,
      readyAtMs: readyAtMs,
      remainingSec: remainingSec,
      isReady: remainingSec <= 0
    };
  } catch (e) {
    return null;
  }
}

function farmPanelStockCategoryNames() {
  return new Set([ ...Object.keys(BASE_CROPS), ...Object.keys(BASE_FRUITS), ...Object.keys(BASE_GREENHOUSE), ...Object.keys(RESOURCE_DATA), ...Object.keys(BAIT_RECIPES), "Obsidian", "Sunstone", "Salt", "Honey" ]);
}

export function farmPanelComputeStocks(json) {
  const g = farmSyncExtractGameState(json);
  const inv = farmPanelField(g, "inventory");
  if (!inv || typeof inv !== "object") return [];
  const stockNames = farmPanelStockCategoryNames();
  const rows = [];
  Object.entries(inv).forEach(([name, amount]) => {
    if (!stockNames.has(name)) return;
    const qty = typeof amount === "string" ? parseFloat(amount) : Number(amount);
    if (!qty || qty <= 0) return;
    rows.push(farmPanelComputeEconomics(name, 1, qty));
  });
  rows.sort((a, b) => b.profit - a.profit);
  return rows;
}

function animalFlatYield(boosts, idx) {
  let flat = 0;
  const buds = {};
  (boosts || []).forEach(b => {
    if (b.yieldAddAll) flat += b.yieldAddAll;
    if (b.productIndex === idx && b.yieldAdd) {
      if (b.isBud && b.budId) buds[b.budId] = (buds[b.budId] || 0) + b.yieldAdd; else flat += b.yieldAdd;
    }
  });
  const vals = Object.values(buds);
  return flat + (vals.length ? Math.max(...vals) : 0);
}

function farmPanelRenderAnimalYieldBoostList(boosts, productNames, products, fallbackCount, spiceBuffCards, timeBoosts, costBoosts, cycleTimeSec) {
  const countForProduct = pname => {
    const match = products && products.find(p => p.name === pname);
    return match && typeof match.count === "number" ? match.count : fallbackCount || 0;
  };
  const flatPerAnimal = idx => animalFlatYield(boosts, idx);
  const scaledPart = (p, idx) => Math.max(0, p.totalYield - flatPerAnimal(idx) * (typeof p.count === "number" ? p.count : fallbackCount || 0));
  const yieldEntries = [];
  (boosts || []).forEach(b => {
    const boostIcon = getBoostIcon(b.name);
    if (b.truffleMult) {
      const tp = products && products[0];
      if (tp) {
        const extra = scaledPart(tp, 0) * (b.truffleMult - 1) / b.truffleMult;
        yieldEntries.push({
          productIndex: 0,
          html: `<div class="boost-applied-row is-yield">${boostIcon}<b>${escapeHtml(b.name)}</b> <span class="boost-mult-note">(×${b.truffleMult})</span> <span class="boost-total-value">+${fmtAnimal(extra)}</span>${getIcon(tp.name)}</div>`
        });
      }
    }
    if (b.yieldMultAll) {
      const mult = b.yieldMultAll;
      (products || []).forEach((p, idx) => {
        const extra = scaledPart(p, idx) * (mult - 1) / mult;
        const picon = getIcon(p.name);
        yieldEntries.push({
          productIndex: idx,
          html: `<div class="boost-applied-row is-yield">${boostIcon}<b>${escapeHtml(b.name)}</b> <span class="boost-mult-note">(×${mult})</span> <span class="boost-total-value">+${fmtAnimal(extra)}</span>${picon}</div>`
        });
      });
      return;
    }
    if (b.yieldAddAll) {
      (products || []).forEach((p, idx) => {
        const pname = productNames && productNames[idx] ? productNames[idx] : p.name;
        const picon = getIcon(pname);
        const totalAdd = b.yieldAddAll * countForProduct(pname);
        yieldEntries.push({
          productIndex: idx,
          html: `<div class="boost-applied-row is-yield">${boostIcon}<b>${escapeHtml(b.name)}</b> <span class="boost-total-value">+${fmtAnimal(totalAdd)}</span>${picon}</div>`
        });
      });
      return;
    }
    if (b.yieldAdd) {
      const pIndex = b.productIndex != null ? b.productIndex : 999;
      const pname = productNames && productNames[pIndex] ? productNames[pIndex] : "";
      const picon = pname ? getIcon(pname) : "";
      const totalAdd = b.yieldAdd * countForProduct(pname);
      yieldEntries.push({
        productIndex: pIndex,
        html: `<div class="boost-applied-row is-yield">${boostIcon}<b>${escapeHtml(b.name)}</b> <span class="boost-total-value">+${fmtAnimal(totalAdd)}</span>${picon}</div>`
      });
    }
  });
  yieldEntries.sort((a, b) => a.productIndex - b.productIndex);
  const yieldHtmlParts = yieldEntries.map(e => e.html);
  const timeHtmlParts = (timeBoosts || []).map(b => {
    const boostIcon = getBoostIcon(b.name);
    const mult = (b.timeMult || 1) * (b.timeMultAll || 1);
    const pct = (1 - mult) * 100;
    const secondsSaved = cycleTimeSec != null ? cycleTimeSec * (1 / mult - 1) : null;
    const savedNote = secondsSaved != null ? ` <span class="boost-total-value">-${farmPanelFormatSpiceDuration(secondsSaved)}</span>` : "";
    return `<div class="boost-applied-row is-time">${boostIcon}<b>${escapeHtml(b.name)}</b> <span class="boost-mult-note">(-${fmtAnimal(pct)}% cycle time)</span>${savedNote}</div>`;
  });
  const costHtmlParts = (costBoosts || []).map(b => {
    const parts = [];
    if (b.freeFeed) parts.push("free feed");
    if (b.feedMult) parts.push(`×${b.feedMult} feed`);
    if (b.feedMultAll) parts.push(`×${b.feedMultAll} feed`);
    if (b.xpMult) parts.push(`×${b.xpMult} feed XP`);
    return `<div class="boost-applied-row is-cost">${getBoostIcon(b.name)}<b>${escapeHtml(b.name)}</b> <span class="boost-mult-note">(${parts.join(", ")})</span></div>`;
  });
  (spiceBuffCards || []).forEach(card => {
    if (card.category !== "cost") yieldHtmlParts.push(card.html);
  });
  const sections = [ [ "YIELD", yieldHtmlParts ], [ "COST", costHtmlParts ], [ "TIME REDUCTION", timeHtmlParts ] ].filter(([, parts]) => parts.length);
  if (!sections.length) return "";
  const sectionsHtml = sections.map(([label, parts]) => `<div class="lib-section-title" style="margin-top:10px;">${label}</div>${parts.join("")}`).join("");
  return `<div class="section-badge is-boost-label">⚡ Applied Boost</div>${sectionsHtml}`;
}

function farmPanelComputeNodeYieldBoostSummary(row) {
  const rawCount = row.count || 0;
  const exactCount = row.boostTrackedCount || 0;
  const fallbackCount = Math.max(0, rawCount - exactCount);
  const estimateCount = exactCount > 0 ? fallbackCount : row.displayNodeCount || rawCount;
  const itemTier = (BASE_CROPS[row.name] || {}).tier;
  const totals = new Map;
  const add = (name, amount) => {
    if (!amount) return;
    totals.set(name, (totals.get(name) || 0) + amount);
  };
  if (estimateCount > 0) {
    const fallbackFraction = rawCount > 0 ? estimateCount / rawCount : 1;
    (row.activeBoosts || []).forEach(b => {
      const yieldAdd = getEffectiveYieldAdd(b, itemTier, row.name);
      if (yieldAdd) add(b.name, yieldAdd * estimateCount);
      if (b.yieldMult) add(b.name, (row.totalYield || 0) * fallbackFraction * (b.yieldMult - 1) / b.yieldMult);
      if (b.yieldMultAll) add(b.name, (row.totalYield || 0) * fallbackFraction * (b.yieldMultAll - 1) / b.yieldMultAll);
      if (b.harvestAdd) add(b.name, b.harvestAdd * estimateCount);
      if (b.flowerExtraFlat) add(b.name, b.flowerExtraFlat * estimateCount);
    });
  }
  (row.exactBoostTotals || []).forEach(eb => add(eb.name, eb.total));
  if (row.name === "Gold" && row.goldInstantMineBonusYieldEstimate > 0) add("Pickaxe Shark", row.goldInstantMineBonusYieldEstimate);
  return Array.from(totals.entries()).filter(([, total]) => total > 1e-9).map(([name, total]) => ({
    name: name,
    total: total
  }));
}

function farmPanelRenderNodeYieldBoostList(row, summary, produceIcon) {
  const guardianId = getActiveSeasonGuardianName();
  const guardianName = guardianId ? guardianId.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "";
  const yieldHtmlParts = (summary || []).map(b => {
    const guardianNote = b.name === "Bountiful Harvest" && guardianName ? ` <span class="boost-mult-note">(doubled by ${getBoostIcon(guardianName)}${escapeHtml(guardianName)})</span>` : "";
    return `<div class="boost-applied-row is-yield">${getBoostIcon(b.name)}<b>${escapeHtml(b.name)}</b>${guardianNote} <span class="boost-total-value">+${fmt(b.total)}</span>${produceIcon}</div>`;
  });
  const seenTime = new Set;
  const timeBoostSources = (row.activeBoosts || []).concat(row.exactTimeBoosts || []);
  const timeHtmlParts = timeBoostSources.filter(b => b.timeMult && b.timeMult !== 1 && !seenTime.has(b.name) && seenTime.add(b.name)).map(b => {
    const boostIcon = getBoostIcon(b.name);
    const pct = (1 - b.timeMult) * 100;
    const secondsSaved = row.cycleTimeSec != null ? row.cycleTimeSec * (1 / b.timeMult - 1) : null;
    const savedNote = secondsSaved != null ? ` <span class="boost-total-value">-${farmPanelFormatSpiceDuration(secondsSaved)}</span>` : "";
    return `<div class="boost-applied-row is-time">${boostIcon}<b>${escapeHtml(b.name)}</b> <span class="boost-mult-note">(-${fmt(pct)}% cycle time)</span>${savedNote}</div>`;
  });
  const sections = [ [ "YIELD", yieldHtmlParts ], [ "TIME REDUCTION", timeHtmlParts ] ].filter(([, parts]) => parts.length);
  if (!sections.length) return "";
  const sectionsHtml = sections.map(([label, parts]) => `<div class="lib-section-title" style="margin-top:10px;">${label}</div>${parts.join("")}`).join("");
  return `<div class="section-badge is-boost-label">⚡ Applied Boost</div>${sectionsHtml}`;
}

function farmPanelCardCategory(row) {
  if (row.isCropMachineCard) return "crops";
  if (row.isMushroomCard || row.isSkillResetCard) return "pete";
  if (row.isMycoCard) return "myco";
  if (row.isPeteQuestCard) return "pete";
  if (row.isFloatingIslandCard || row.isFishingCard || row.isCaveMerchantCard || row.isPowerSkillCard) return "pete";
  if (row.isAnimalMerged) return "animals";
  if (row.isComposterCard) return "composters";
  if (row.isHoneyCard) return "beehive";
  const name = row.name;
  if (BASE_GREENHOUSE[name]) return "greenhouse";
  if (FLOWER_VARIETIES[name]) return "beehive";
  if (BASE_CROPS[name]) return "crops";
  if (BASE_FRUITS[name]) return "fruits";
  return "resources";
}

export function farmPanelRowIsReady(row) {
  if (!row) return false;
  if (row.isPeteQuestCard || row.isFloatingIslandCard || row.isFishingCard || row.isCaveMerchantCard || row.isPowerSkillCard || row.isSkillResetCard) return !!row.isReady;
  return (row.readyCount || 0) > 0;
}

function guroCountdownText(sec) {
  return sec <= 0 ? "Ready now" : foldClock(sec);
}

function guroStatusFoldHtml(word, sec) {
  if (sec == null) return "";
  const clockHtml = sec > 0 ? `<span class="guro-status-clock">${foldStamp(Date.now() + sec * 1e3)}</span>` : "";
  return `<div class="guro-status-fold"><span class="guro-status-label">${word} IN</span><span class="guro-status-stack"><span class="guro-status-value farm-countdown" data-base="${sec}">${foldClock(sec)}</span>${clockHtml}</span></div>`;
}

function guroSignedAmount(v, fmtFn) {
  return `${v < 0 ? "" : "+"}${fmtFn(v)}`;
}

function guroValueBlockHtml(gross, fee, fmtFn) {
  const grossVal = gross || 0;
  const netVal = grossVal - (fee || 0);
  return `<div class="guro-value-block"><div class="guro-market-value"><span class="guro-market-label">Market value</span><span class="guro-market-amount">${guroSignedAmount(grossVal, fmtFn)} ${FLOWER_ICON}</span></div><div class="guro-net-line"><span class="guro-net-label">Net</span><span class="guro-net-amount">${guroSignedAmount(netVal, fmtFn)} ${FLOWER_ICON}</span></div></div>`;
}

export function farmPanelFilterCategories() {
  const cats = [ {
    id: "all",
    label: "All",
    name: "All Growing",
    icon: ""
  }, {
    id: "crops",
    label: "Crops",
    name: "Growing Crops",
    icon: getIcon("Sunflower")
  }, {
    id: "resources",
    label: "Resources",
    name: "Recovering Resources",
    icon: getIcon("Axe")
  }, {
    id: "greenhouse",
    label: "Greenhouse",
    name: "Greenhouse",
    icon: RCM_GREENHOUSE_ICON_HTML
  }, {
    id: "beehive",
    label: "Beehive",
    name: "Beehive",
    icon: getIcon("Beehive")
  }, {
    id: "fruits",
    label: "Fruits",
    name: "Growing Fruits",
    icon: getIcon("Orange")
  }, {
    id: "animals",
    label: "Animals",
    name: "Animals",
    icon: getIcon("Chicken")
  }, {
    id: "composters",
    label: "Composters",
    name: "Composters",
    icon: getIcon("Compost Bin")
  }, {
    id: "cooking",
    label: "Cooking",
    name: "Cooking Buildings",
    icon: COOKING_PANEL_TAB_ICON_HTML
  }, {
    id: "myco",
    label: "Myco Bins",
    name: "Myco Bins",
    icon: getIcon("Myco Bin")
  }, {
    id: "pete",
    label: "Other",
    name: "Other",
    icon: farmPanelPeteIconHtml()
  } ];
  return cats;
}

export function farmPanelRowFilterCategory(row) {
  if (row && row.isCookingCard) return "cooking";
  return farmPanelCardCategory(row);
}

export function farmPanelRenderCategoryFilterBar() {
  const cats = farmPanelFilterCategories().filter(c => c.id === "all" || farmPanelCategoryVisible(c.id));
  const btns = cats.map(c => `<button type="button" class="fp-filter-btn${farmPanelInProgressCategoryFilter === c.id ? " active" : ""}${c.id === "all" ? " has-label" : ""}" data-fp-filter-btn="${c.id}" title="${c.label}"><span class="fp-filter-icon">${c.icon}</span><span class="fp-filter-name">${c.id === "all" ? `<span class="fp-n-s">All</span><span class="fp-n-l">${c.name}</span>` : c.name}</span></button>`).join("");
  return `<div class="fp-filter-bar">${btns}</div>`;
}

function farmPanelProgressWord(row) {
  const cat = farmPanelCardCategory(row);
  if (cat === "resources") return "Recovering";
  return "Growing";
}

function farmPanelStatusBadgeHtml(readyCount, growingCount, word) {
  if (readyCount > 0 && growingCount > 0) {
    return `<span class="harvest-badge-group"><span class="harvest-badge is-ready">✅ Ready ${readyCount}</span><span class="harvest-badge is-growing">⏳ ${word} ${growingCount}</span></span>`;
  }
  if (readyCount > 0) return `<span class="harvest-badge is-ready">✅ Ready</span>`;
  return `<span class="harvest-badge is-growing">⏳ ${word}</span>`;
}

function farmPanelRenderAnimalMergedCard(card) {
  const baseStatus = card.readyCount > 0 ? card.readyCount === card.count ? "✅ All ready" : `✅ ${card.readyCount} ready · ⏳ ${card.count - card.readyCount} growing` : "⏳ Growing";
  const showCountdown = card.soonestSec != null && card.readyCount < card.count;
  const noEtaGrowing = !showCountdown && card.readyCount < card.count && card.noEtaCount > 0;
  const statusLine = noEtaGrowing ? `${baseStatus} <span style="color:var(--ink-soft);">(🤒 ${card.noEtaCount} sick — can't estimate)</span>` : baseStatus;
  const statusFoldHtml = guroStatusFoldHtml("Sleeping", showCountdown ? card.soonestSec : null);
  const cardNet = card.gross - card.sellFee;
  const isProfit = cardNet >= 0;
  const expandedCls = farmPanelExpandedNames.has(card.searchKey) ? " expanded" : "";
  const growingCount = card.count - card.readyCount;
  const statusBadgeHtml = farmPanelStatusBadgeHtml(card.readyCount, growingCount, "Sleeping");
  let badgeHtml = "";
  if (card.sickCount > 0) {
    badgeHtml += `<span class="harvest-badge" style="background:rgba(214,80,80,0.15);color:#c33;">🤒 ${card.sickCount} sick</span>`;
  }
  const animalIcon = getIcon(card.typeLabel);
  const dailyBadgeHtml = dailyHarvestBadgeHtml(card.typeLabel, "animal", animalIcon, farmPanelDailyFarmId());
  const animalPerHead = card.count > 0 ? card.products.reduce((sum, p) => sum + p.totalYield, 0) / card.count : 0;
  const animalDailyProducts = card.products.map(p => ({
    name: p.name,
    per: card.count > 0 ? p.totalYield / card.count : 0,
    icon: getIcon(p.name),
    price: p.price,
    feeRate: p.grossRevenue > 0 ? p.feeAmount / p.grossRevenue : 0
  }));
  dailyHarvestSetYield(card.typeLabel, animalPerHead, card.products.length ? getIcon(card.products[0].name) : "", null, {
    price: card.avgPricePerUnit,
    feeRate: card.gross > 0 ? card.sellFee / card.gross : 0
  }, farmPanelDailyFarmId(), animalDailyProducts);
  const productChipsHtml = card.products.map(p => `\n      <span class="animal-produce-chip">\n        <span class="produce-yield">+${fmtAnimal(p.totalYield)}</span>\n        <span class="produce-icon">${getIcon(p.name)}</span>\n        <span class="produce-name">${escapeHtml(p.name)}</span>\n      </span>`).join("");
  const valueBlockHtml = guroValueBlockHtml(card.gross, card.sellFee, fmtAnimal);
  const productDetailRows = card.products.map(p => renderAnimalCardProductDetailRow(getIcon(p.name), p.name, p.totalYield, p.grossRevenue, p.feeAmount)).join("");
  const yieldBoostListHtml = farmPanelRenderAnimalYieldBoostList(card.yieldBoosts, card.productNames, card.products, card.count, card.spiceBuffCards, card.timeBoosts, card.costBoosts, card.cycleTimeSec);
  const animalYieldGroupsHtml = renderAnimalYieldGroupsList(card);
  return `\n  <div class="card animal-merged-card${isProfit ? " is-profit" : " is-loss"}${expandedCls}" data-search="${card.searchKey}" data-fp-category="animals">\n    <div class="card-toggle">\n      <div class="card-name-row">\n        <span class="card-icon">${animalIcon}</span>\n        <div>\n          <div class="card-name">${escapeHtml(card.typeLabel)}${farmPanelAnimalFeedIconsHtml(card)}</div>\n          <div class="card-type-row">\n            <span class="card-type">${card.count} animal${card.count === 1 ? "" : "s"}</span>\n            ${badgeHtml}\n          </div>\n          <div class="animal-fold-row">${productChipsHtml}</div>${valueBlockHtml}\n        </div>\n      </div>\n      <div class="card-collapsed-profit">\n        <span class="harvest-stack">${dailyBadgeHtml}${statusBadgeHtml}</span>\n        <span class="chev">▾</span>\n      </div>\n      ${statusFoldHtml}\n    </div>\n    <div class="card-details">\n      <div class="animal-detail-grid">\n        ${productDetailRows}\n        <div class="animal-detail-stat"><span class="label">Market Price/Unit</span><span class="value">${fmtAnimalCost(card.avgPricePerUnit)} ${FLOWER_ICON}</span></div>\n        <div class="animal-detail-stat"><span class="label">Market Value</span><span class="value">${fmtAnimal(card.gross)} ${FLOWER_ICON}</span></div>\n        <div class="animal-detail-stat"><span class="label">Tax</span><span class="value">${card.sellFee > 0 ? `-${fmtAnimalCost(card.sellFee)}` : "0"} ${FLOWER_ICON}</span></div>\n      </div>\n      <div class="animal-net-row2">\n        <span class="label">Net</span>\n        <span class="value ${isProfit ? "is-profit" : "is-loss"}">${fmtAnimal(cardNet)} ${FLOWER_ICON}</span>\n      </div>\n      ${farmPanelAnimalFeedPickerHtml(card)}\n      ${animalYieldGroupsHtml}\n      ${yieldBoostListHtml}\n      ${fpLimitedBlockHtml(card)}\n    </div>\n  </div>`;
}

function farmPanelRenderHoneyCard(row) {
  const baseStatus = row.readyCount > 0 ? row.readyCount === row.count ? "✅ All ready" : `✅ ${row.readyCount} ready · ⏳ ${row.count - row.readyCount} growing` : "⏳ Growing";
  const showCountdown = row.soonestSec != null && row.readyCount < row.count;
  const noEtaGrowing = !showCountdown && row.readyCount < row.count && row.noEtaCount > 0;
  const statusLine = noEtaGrowing ? `${baseStatus} <span style="color:var(--ink-soft);">(no active flower/growth right now — can't estimate)</span>` : baseStatus;
  const statusFoldHtml = guroStatusFoldHtml("Collecting", showCountdown ? row.soonestSec : null);
  const isProfit = row.grossRevenue - row.feeAmount >= 0;
  const expandedCls = farmPanelExpandedNames.has(row.name.toLowerCase()) ? " expanded" : "";
  const growingCount = row.count - row.readyCount;
  const statusBadgeHtml = farmPanelStatusBadgeHtml(row.readyCount, growingCount, "Collecting");
  let badgeHtml = "";
  const tierEntries = row.tierCounts ? Object.entries(row.tierCounts) : [];
  const tierNote = tierEntries.length ? ` <span class="card-tier-note">(${tierEntries.map(([label, c]) => `${c} ${escapeHtml(label)}`).join(", ")})</span>` : "";
  const beehiveIcon = getIcon("Beehive");
  const produceIcon = getIcon("Honey");
  dailyHarvestSetYield("Honey", 0, produceIcon, null, {
    price: row.price,
    feeRate: row.grossRevenue > 0 ? row.feeAmount / row.grossRevenue : 0
  }, farmPanelDailyFarmId());
  const dailyBadgeHtml = dailyHarvestBadgeHtml("Honey", "honey", beehiveIcon, farmPanelDailyFarmId());
  const boostSummary = farmPanelComputeNodeYieldBoostSummary(row);
  const productChipHtml = `\n      <span class="animal-produce-chip">\n        <span class="produce-yield">+${(Math.floor(row.totalYield * 100) / 100).toFixed(2)}</span>\n        <span class="produce-icon">${produceIcon}</span>\n        <span class="produce-name">${escapeHtml(row.name)}</span>\n      </span>`;
  const valueBlockHtml = guroValueBlockHtml(row.grossRevenue, row.feeAmount, fmt);
  const swarmChipHtml = row.honeySwarmCount > 0 ? `<span class="hive-swarm hive-swarm-fold guro-frame" title="Bee Swarm"><img src="${BEE_SWARM_ICON}" alt=""><span>+${row.honeySwarmCount} Swarm</span></span>` : "";
  const productDetailRow = renderCardProductDetailRow(produceIcon, row.name, row.totalYield, row.grossRevenue, row.feeAmount, row.isBoosted ? row.baseTotalYield : null);
  const boostListHtml = farmPanelRenderNodeYieldBoostList(row, boostSummary, produceIcon);
  const beehiveListHtml = renderBeehiveListHtml(row.honeyHiveDetails);
  return `\n  <div class="card animal-merged-card${isProfit ? " is-profit" : " is-loss"}${expandedCls}" data-search="honey" data-fp-category="beehive">\n    <div class="card-toggle">\n      <div class="card-name-row">\n        <span class="card-icon">${beehiveIcon}</span>\n        <div>\n          <div class="card-name">Beehive</div>\n          <div class="card-type-row">\n            <span class="card-type">${row.displayNodeCount} node${row.displayNodeCount === 1 ? "" : "s"}${tierNote}</span>\n            ${badgeHtml}\n          </div>\n          <div class="animal-fold-row">${productChipHtml}${swarmChipHtml}</div>${valueBlockHtml}\n        </div>\n      </div>\n      <div class="card-collapsed-profit">\n        <span class="harvest-stack">${dailyBadgeHtml}${statusBadgeHtml}</span>\n        <span class="chev">▾</span>\n      </div>\n      ${statusFoldHtml}\n    </div>\n    <div class="card-details">\n      <div class="animal-detail-grid">\n        ${productDetailRow}\n        <div class="animal-detail-stat"><span class="label">Market Price/Unit</span><span class="value">${fmt(row.price)} ${FLOWER_ICON}</span></div>\n        <div class="animal-detail-stat"><span class="label">Market Value</span><span class="value">${fmt(row.grossRevenue)} ${FLOWER_ICON}</span></div>\n        <div class="animal-detail-stat"><span class="label">Tax</span><span class="value">${row.feeAmount > 0 ? `-${fmt(row.feeAmount)}` : "0"} ${FLOWER_ICON}</span></div>\n      </div>\n      <div class="animal-net-row2">\n        <span class="label">Net</span>\n        <span class="value ${isProfit ? "is-profit" : "is-loss"}">${fmt(row.grossRevenue - row.feeAmount)} ${FLOWER_ICON}</span>\n      </div>\n      ${beehiveListHtml}\n      ${boostListHtml}\n    </div>\n  </div>`;
}

function farmPanelRenderComposterBoostList(row) {
  const fertIcon = getIcon(row.fertilizer);
  const wormIcon = getIcon(row.wormName);
  const fertHtml = row.boostParts.fertParts.map(p => `<div class="boost-applied-row is-yield">${getBoostIcon(p.name)}<b>${escapeHtml(p.name)}</b>${p.note ? ` <span class="boost-mult-note">(${p.note})</span>` : ""} <span class="boost-total-value">+${fmtCompost(p.total)}</span>${fertIcon}</div>`);
  const wormHtml = row.boostParts.wormParts.map(p => {
    const valueHtml = p.total == null ? "" : ` <span class="boost-total-value">${p.total < 0 ? "-" : "+"}${fmtCompost(Math.abs(p.total))}</span>`;
    return `<div class="boost-applied-row is-yield">${getBoostIcon(p.name)}<b>${escapeHtml(p.name)}</b>${p.note ? ` <span class="boost-mult-note">(${p.note})</span>` : ""}${valueHtml}${wormIcon}</div>`;
  });
  const timeHtml = row.boostParts.timeParts.map(p => `<div class="boost-applied-row is-time">${getBoostIcon(p.name)}<b>${escapeHtml(p.name)}</b> <span class="boost-mult-note">(-${fmtCompost(p.pct)}% compost time)</span></div>`);
  const sections = [ [ "FERTILISER", fertHtml ], [ "WORMS", wormHtml ], [ "TIME REDUCTION", timeHtml ] ].filter(([, parts]) => parts.length);
  if (!sections.length) return "";
  const sectionsHtml = sections.map(([label, parts]) => `<div class="lib-section-title" style="margin-top:10px;">${label}</div>${parts.join("")}`).join("");
  return `<div class="section-badge is-boost-label">⚡ Applied Boost</div>${sectionsHtml}`;
}

function farmPanelRenderComposterChainHtml(row) {
  if (!row.wormExact || !row.wormChain.length) return "";
  const wormIcon = getIcon(row.wormName);
  const rows = row.wormChain.map((r, i) => {
    const mult = r.worms !== r.baseAmount ? ` <span class="boost-mult-note">(roll ${r.baseAmount} → ${fmtCompost(r.worms)})</span>` : "";
    const label = i === 0 ? "Next collect" : `Collect +${i}`;
    return `<div class="animal-detail-stat"><span class="label">${label} <span class="boost-mult-note">#${r.counter}</span></span><span class="value">+${fmtCompost(r.worms)} ${wormIcon}${mult}</span></div>`;
  }).join("");
  return `<div class="lib-section-title" style="margin-top:10px;">WORM ROLL CHAIN</div><div class="animal-detail-grid">${rows}</div>`;
}

function farmPanelRenderComposterCard(row) {
  const showCountdown = row.soonestSec != null && row.readyCount < row.count;
  const statusFoldHtml = guroStatusFoldHtml("Ready", showCountdown ? row.soonestSec : null);
  const expandedCls = farmPanelExpandedNames.has(row.searchKey) ? " expanded" : "";
  const growingCount = row.count - row.readyCount;
  const statusBadgeHtml = farmPanelStatusBadgeHtml(row.readyCount, growingCount, "Composting");
  const composterIcon = getIcon(row.composterName);
  const fertIcon = getIcon(row.fertilizer);
  const wormIcon = getIcon(row.wormName);
  const wormPrefix = row.wormExact ? "+" : "~+";
  const productChipsHtml = `\n      <span class="animal-produce-chip">\n        <span class="produce-yield">+${fmtCompost(row.fertTotal)}</span>\n        <span class="produce-icon">${fertIcon}</span>\n        <span class="produce-name">${escapeHtml(row.fertilizer)}</span>\n      </span>\n      <span class="animal-produce-chip">\n        <span class="produce-yield">${wormPrefix}${fmtCompost(row.wormTotal)}</span>\n        <span class="produce-icon">${wormIcon}</span>\n        <span class="produce-name">${escapeHtml(row.wormName)}</span>\n      </span>`;
  const valueBlockHtml = `<div class="guro-value-block"><div class="guro-market-value"><span class="guro-market-label">Ingredient cost</span><span class="guro-market-amount">${fmtAnimal(row.costFlower)} ${FLOWER_ICON}</span></div><div class="guro-net-line"><span class="guro-net-label">Per ${escapeHtml(row.fertilizer)}</span><span class="guro-net-amount">${fmtAnimalCost(row.unitCostFlower)} ${FLOWER_ICON}</span></div></div>`;
  const fertDetailRow = `\n        <div class="animal-detail-stat is-yield-row animal-yield-block">\n          <span class="label">${fertIcon} ${escapeHtml(row.fertilizer)}</span>\n          <div class="animal-yield-sublines">\n            <div class="animal-yield-subline"><span class="sublabel">Yield</span><span class="value">${fmtCompost(row.fertTotal)}</span></div>\n            <div class="animal-yield-subline"><span class="sublabel">Cost</span><span class="value">${fmtAnimal(row.costFlower)} ${FLOWER_ICON}</span></div>\n          </div>\n        </div>`;
  const wormRangeText = row.wormMin === row.wormMax ? fmtCompost(row.wormMin) : `${fmtCompost(row.wormMin)}–${fmtCompost(row.wormMax)}`;
  const wormYieldText = row.wormExact ? fmtCompost(row.wormTotal) : `~${fmtCompost(row.wormTotal)}`;
  const wormDetailRow = `\n        <div class="animal-detail-stat is-yield-row animal-yield-block">\n          <span class="label">${wormIcon} ${escapeHtml(row.wormName)}</span>\n          <div class="animal-yield-sublines">\n            <div class="animal-yield-subline"><span class="sublabel">${row.wormExact ? "Rolled" : "Average"}</span><span class="value">${wormYieldText}</span></div>\n            <div class="animal-yield-subline"><span class="sublabel">Range</span><span class="value">${wormRangeText}</span></div>\n          </div>\n        </div>`;
  const reqHtml = (row.reqs || []).map(r => `<span class="spice-yield-chip">${getIcon(r.item)}${fmtCompost((r.qty || 0) * row.count)}</span>`).join("");
  const reqRow = reqHtml ? `<div class="animal-detail-stat"><span class="label">Ingredients (${escapeHtml(previewSeason)})</span><span class="value">${reqHtml}</span></div>` : "";
  const mismatchNote = row.fertMismatch ? `<div class="animal-detail-stat"><span class="label">Locked at start</span><span class="value">${fmtCompost(row.fertTotal)} <span class="boost-mult-note">(current boosts give ${fmtCompost(row.expectedFert)})</span></span></div>` : "";
  const timeRow = `<div class="animal-detail-stat"><span class="label">Compost Time</span><span class="value">${farmPanelFormatSpiceDuration(row.cycleTimeSec)}${row.cycleTimeSec !== row.baseCycleTimeSec ? ` <span class="boost-mult-note">(base ${farmPanelFormatSpiceDuration(row.baseCycleTimeSec)})</span>` : ""}</span></div>`;
  const counterRow = row.wormExact ? `<div class="animal-detail-stat"><span class="label">${escapeHtml(row.wormCounterKey)}</span><span class="value">${row.wormCounterStart}</span></div>` : "";
  const boostListHtml = farmPanelRenderComposterBoostList(row);
  const dailyBadgeHtml = dailyHarvestBadgeHtml(row.composterName, "composter", composterIcon, farmPanelDailyFarmId());
  const chainHtml = farmPanelRenderComposterChainHtml(row);
  return `\n  <div class="card animal-merged-card is-profit${expandedCls}" data-search="${row.searchKey}" data-fp-category="composters">\n    <div class="card-toggle">\n      <div class="card-name-row">\n        <span class="card-icon">${composterIcon}</span>\n        <div>\n          <div class="card-name">${escapeHtml(row.composterName)}</div>\n          <div class="card-type-row">\n            <span class="card-type">${row.count} batch${row.count === 1 ? "" : "es"}</span>\n          </div>\n          <div class="animal-fold-row">${productChipsHtml}</div>${valueBlockHtml}\n        </div>\n      </div>\n      <div class="card-collapsed-profit">\n        <span class="harvest-stack">${dailyBadgeHtml}${statusBadgeHtml}</span>\n        <span class="chev">▾</span>\n      </div>\n      ${statusFoldHtml}\n    </div>\n    <div class="card-details">\n      <div class="animal-detail-grid">\n        ${fertDetailRow}\n        ${wormDetailRow}\n        ${mismatchNote}\n        ${reqRow}\n        ${timeRow}\n        ${counterRow}\n      </div>\n      ${chainHtml}\n      ${boostListHtml}\n    </div>\n  </div>`;
}

function fmtCookQty(n) {
  const r = Math.round(n * 1e6) / 1e6;
  return Number.isInteger(r) ? r.toLocaleString() : fmt(n);
}

function cookingFoodOrFishIcon(name) {
  if (COOKING_FOOD_IMAGES[name]) return cookFoodIcon(name);
  return getIcon(name);
}

function cookingQueueClockText(ms) {
  const d = new Date(ms);
  const today = new Date;
  const dayStart = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((dayStart(d) - dayStart(today)) / 864e5);
  let h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const time = `${h}:${String(d.getMinutes()).padStart(2, "0")} ${ampm}`;
  if (diffDays <= 0) return time;
  if (diffDays === 1) return `tomorrow ${time}`;
  return `${d.toLocaleDateString(undefined, {
    weekday: "short"
  })} ${time}`;
}

function farmPanelRenderCookingQueueList(row) {
  const slots = Array.isArray(row.slots) ? row.slots : [];
  if (!slots.length) return "";
  const now = Date.now();
  const rowsHtml = slots.map(s => {
    const itemName = row.cookingKind === "aging" && s.outputName ? s.outputName : s.name;
    const isReady = !(s.readyAt > now);
    const timeHtml = isReady ? `<span class="hive-time-pill guro-frame is-ready">Ready</span>` : `<span class="hive-time-pill guro-frame farm-countdown" data-base="${(s.readyAt - now) / 1e3}">${guroCountdownText((s.readyAt - now) / 1e3)}</span><span class="hive-time-clock">${cookingQueueClockText(s.readyAt)}</span>`;
    return `<div class="guro-queue-row"><span class="guro-queue-item"><span class="guro-queue-yield">+${fmtCookQty(s.amount)}</span>${cookingFoodOrFishIcon(itemName)}<span class="guro-queue-name">${escapeHtml(itemName)}</span></span><span class="guro-queue-time hive-time">${timeHtml}</span></div>`;
  }).join("");
  return `<div class="lib-section-title" style="margin-top:10px;">${escapeHtml(row.cookingBuilding)} Queue</div><div class="guro-queue-list">${rowsHtml}</div>`;
}

function farmPanelRenderCookingLimitedBoosts(row) {
  const list = Array.isArray(row.limitedBoosts) ? row.limitedBoosts : [];
  if (!list.length) return "";
  return farmPanelRenderLimitedBlock(list, row.cookingBuilding, "through the queue");
}

function farmPanelRenderLimitedBlock(list, openKey, runsText) {
  const building = openKey;
  const open = !!farmPanelCookingLimitedOpen[building];
  const extendedCount = list.filter(e => e.extended).length;
  const rowsHtml = list.map(e => {
    const icon = e.kind === "oil" ? getIcon("Oil") : getBoostIcon(e.name);
    let badgeHtml;
    if (e.status === "active") {
      badgeHtml = `<span class="hive-time-pill guro-frame farm-countdown" data-base="${e.remainingSec}">${guroCountdownText(e.remainingSec)}</span><span class="hive-time-clock">${cookingQueueClockText(e.expiresAt)}</span>`;
    } else if (e.status === "enough") {
      badgeHtml = `<span class="hive-time-pill guro-frame is-ready">Enough</span>`;
    } else if (e.status === "expired") {
      badgeHtml = `<span class="hive-time-pill guro-frame is-idle">Expired</span>`;
    } else if (e.status === "empty") {
      badgeHtml = `<span class="hive-time-pill guro-frame is-idle">No oil</span>`;
    } else {
      badgeHtml = `<span class="hive-time-pill guro-frame is-idle">Not placed</span>`;
    }
    const subText = e.extended ? `Extended — keeps running ${runsText}` : e.reason;
    const subCls = !e.canExtend && e.status !== "missing" && e.status !== "expired" ? " is-short" : "";
    const disabled = !e.canExtend ? " disabled" : "";
    const on = e.extended ? " is-on" : "";
    return `<div class="fp-ext-row"><div class="fp-ext-main"><span class="fp-ext-icon">${icon}</span><div class="fp-ext-text"><span class="fp-ext-name">${escapeHtml(e.name)}</span><span class="fp-ext-sub${subCls}">${escapeHtml(subText)}</span></div></div><div class="fp-ext-side"><span class="hive-time">${badgeHtml}</span><button type="button" class="fp-ext-switch guro-frame${on}" role="switch" aria-checked="${e.extended ? "true" : "false"}" data-fp-ext-key="${escapeHtml(e.key)}"${disabled}><span class="fp-ext-switch-label">Extend</span><span class="fp-ext-knob guro-frame">${e.extended ? CONFIRM_ICON : ""}</span></button></div></div>`;
  }).join("");
  const countHtml = extendedCount ? `<span class="fp-ext-count">${extendedCount} extended</span>` : "";
  return `<div class="fp-ext-block"><button type="button" class="fp-ext-head guro-frame${open ? " is-open" : ""}" data-fp-ext-open="${escapeHtml(building)}" aria-expanded="${open ? "true" : "false"}"><span class="fp-ext-title">Limited Time Boosts</span>${countHtml}<span class="chev">▾</span></button>${open ? `<div class="fp-ext-list">${rowsHtml}</div>` : ""}</div>`;
}

function farmPanelRenderCookingBoostList(row) {
  const yieldHtmlParts = (row.yieldBoostTotals || []).map(b => `<div class="boost-applied-row is-yield">${getBoostIcon(b.name)}<b>${escapeHtml(b.name)}</b> <span class="boost-total-value">+${fmtCookQty(b.total)}</span></div>`);
  const chanceHtmlParts = (row.chanceBoosts || []).map(b => `<div class="boost-applied-row is-yield">${getBoostIcon(b.name)}<b>${escapeHtml(b.name)}</b> <span class="boost-mult-note">(${escapeHtml(b.note)})</span></div>`);
  const timeHtmlParts = (row.timeBoosts || []).map(b => {
    const boostIcon = getBoostIcon(b.name);
    if (b.kind === "oil") return `<div class="boost-applied-row is-time">${boostIcon}<b>${escapeHtml(b.name)}</b> <span class="boost-mult-note">(-${fmt(b.pct)}% cook time with Oil)</span></div>`;
    return `<div class="boost-applied-row is-time">${boostIcon}<b>${escapeHtml(b.name)}</b> <span class="boost-mult-note">(cook time reduced)</span></div>`;
  });
  const sections = [ [ "YIELD", yieldHtmlParts.concat(chanceHtmlParts) ], [ "TIME REDUCTION", timeHtmlParts ] ].filter(([, parts]) => parts.length);
  if (!sections.length) return "";
  const sectionsHtml = sections.map(([label, parts]) => `<div class="lib-section-title" style="margin-top:10px;">${label}</div>${parts.join("")}`).join("");
  return `<div class="section-badge is-boost-label">⚡ Applied Boost</div>${sectionsHtml}`;
}

function farmPanelMycoPrice(name) {
  const market = farmPanelGetMarketPriceFlower(name);
  if (market > 0) return market;
  const live = findLivePriceForName(name);
  return live != null && live > 0 ? live : 0;
}

const MYCO_FUNGAL_BONUS = [ .2, .3, .4 ];

const MYCO_MUDDY_BONUS = [ .1, .2, .3 ];

const MYCO_TWIN_CHANCE = [ .05, .1, .15 ];

function farmPanelMycoBuriedFigures(row) {
  const buried = row.buried;
  if (!buried) return null;
  const fungal = row.fungalLevel ? MYCO_FUNGAL_BONUS[row.fungalLevel - 1] : 0;
  const muddy = row.muddyLevel ? MYCO_MUDDY_BONUS[row.muddyLevel - 1] : 0;
  const twin = row.twinLevel ? MYCO_TWIN_CHANCE[row.twinLevel - 1] : 0;
  const vipBeetle = row.vipBeetle || 0;
  const mushroomQty = buried.Mushroom * (1 + fungal);
  const beetleQty = buried.Beetle;
  const mudQty = buried.Mud * (buried.mudPerTile || 1) * (1 + muddy);
  const weights = buried.beetleWeights || {};
  const weightTotal = Object.values(weights).reduce((a, v) => a + v, 0) || 1;
  const beetleUnit = [ "Green Beetle", "Blue Beetle", "Pink Beetle", "Amber Beetle" ].reduce((sum, n) => sum + (weights[n] || 0) / weightTotal * farmPanelMycoPrice(n), 0);
  const feeRate = (feePercent || 0) / 100;
  const make = (key, icon, qty, unit) => {
    const gross = qty * unit;
    return {
      key: key,
      icon: icon,
      qty: qty,
      unit: unit,
      gross: gross,
      fee: gross * feeRate
    };
  };
  const items = [ make("Mushroom", "Wild Mushroom", mushroomQty, farmPanelMycoPrice("Wild Mushroom")), make("Beetle", "Green Beetle", beetleQty, beetleUnit), make("Mud", "Mud", mudQty, farmPanelMycoPrice("Mud")) ];
  const gross = items.reduce((a, i) => a + i.gross, 0);
  const fee = items.reduce((a, i) => a + i.fee, 0);
  return {
    items: items,
    gross: gross,
    fee: fee,
    fungal: fungal,
    muddy: muddy,
    twin: twin,
    vipBeetle: vipBeetle
  };
}

function farmPanelMycoBoostListHtml(row, fig) {
  const parts = [];
  const bs = row.batchSkills || {};
  const rowHtml = (name, text) => `<div class="boost-applied-row is-yield">${getBoostIcon(name)}<b>${escapeHtml(name)}</b> <span class="boost-total-value">${text}</span></div>`;
  if (bs.extraMushroomTiles) parts.push(rowHtml("Mushroom Bloom", `+${bs.extraMushroomTiles} Mushroom tile${bs.extraMushroomTiles === 1 ? "" : "s"}`));
  if (bs.extraBeetleTiles) parts.push(rowHtml("Beetle Nest", `+${bs.extraBeetleTiles} Beetle tile${bs.extraBeetleTiles === 1 ? "" : "s"}`));
  if (bs.beetleRarity) parts.push(rowHtml("Rare Breeds", "rarer Beetle odds"));
  if (fig && fig.fungal) parts.push(rowHtml("Fungal Harvest", `+${fig.fungal} per Mushroom`));
  if (fig && fig.muddy) parts.push(rowHtml("Muddy Bounty", `x${Math.round((1 + fig.muddy) * 100) / 100} Mud`));
  if (fig && fig.twin) parts.push(rowHtml("Twin Beetles", `${Math.round(fig.twin * 100)}% chance of +1 Beetle`));
  if (fig && fig.vipBeetle) parts.push(rowHtml("VIP Access", `${Math.round(fig.vipBeetle * 100)}% chance of +1 Beetle`));
  if (!parts.length) return "";
  return `<div class="section-badge is-boost-label">⚡ Applied Boost</div><div class="lib-section-title" style="margin-top:10px;">YIELD</div>${parts.join("")}`;
}

function farmPanelRenderMycoCard(row) {
  const expandedCls = farmPanelExpandedNames.has(row.searchKey) ? " expanded" : "";
  let statusBadgeHtml;
  if (row.state === "ready") {
    statusBadgeHtml = `<span class="harvest-badge is-ready">✅ Ready</span>`;
  } else if (row.state === "growing") {
    statusBadgeHtml = `<span class="harvest-badge is-growing">⏳ Growing</span>`;
  } else {
    statusBadgeHtml = `<span class="harvest-badge is-growing">💤 Empty</span>`;
  }
  const statusFoldHtml = guroStatusFoldHtml("Ready", row.soonestSec);
  let stateValue;
  if (row.state === "growing") {
    stateValue = `${escapeHtml(row.recipe)} · <span class="farm-countdown" data-base="${row.remainingSec}">${guroCountdownText(row.remainingSec)}</span>`;
  } else if (row.state === "ready") {
    stateValue = `${escapeHtml(row.recipe)} · ✅ Ready to dig (${row.dugCount}/25 dug)`;
  } else {
    stateValue = "💤 Empty · feed it to start a batch";
  }
  const fig = farmPanelMycoBuriedFigures(row);
  const shown = fig ? fig.items.filter(i => i.qty > 0) : [];
  const mycoIcon = i => i.key === "Beetle" ? `<span class="myco-beetle-gray">${getIcon(i.icon)}</span>` : getIcon(i.icon);
  const chipsHtml = shown.map(i => `\n      <span class="animal-produce-chip myco-produce-chip">\n        <span class="produce-yield">+${fmtCompost(i.qty)}</span>\n        <span class="produce-icon">${mycoIcon(i)}</span>\n        <span class="produce-name">${i.key}</span>\n      </span>`).join("");
  const foldRowHtml = chipsHtml ? `<div class="animal-fold-row">${chipsHtml}</div>` : "";
  const valueBlockHtml = fig && fig.gross > 0 ? guroValueBlockHtml(fig.gross, fig.fee, fmt) : "";
  const itemRows = shown.map(i => renderAnimalCardProductDetailRow(mycoIcon(i), i.key, i.qty, i.gross, i.fee)).join("");
  const priceRows = shown.map(i => `<div class="animal-detail-stat"><span class="label">${i.key} Price/Unit</span><span class="value">${fmt(i.unit)} ${FLOWER_ICON}</span></div>`).join("");
  const totalsHtml = fig && shown.length ? `
        <div class="animal-detail-stat"><span class="label">Market Value</span><span class="value">${fmt(fig.gross)} ${FLOWER_ICON}</span></div>
        <div class="animal-detail-stat"><span class="label">Tax</span><span class="value">${fig.fee > 0 ? `-${fmt(fig.fee)}` : "0"} ${FLOWER_ICON}</span></div>` : "";
  const netHtml = fig && shown.length ? `<div class="animal-net-row2"><span class="label">Net</span><span class="value is-profit">${fmt(fig.gross - fig.fee)} ${FLOWER_ICON}</span></div>` : "";
  const boostHtml = farmPanelMycoBoostListHtml(row, fig);
  return `
  <div class="card animal-merged-card${row.readyCount > 0 ? " is-profit" : ""}${expandedCls}" data-search="${row.searchKey}" data-fp-category="myco">
    <div class="card-toggle">
      <div class="card-name-row">
        <span class="card-icon">${getIcon("Myco Bin")}</span>
        <div>
          <div class="card-name">Myco Bin ${escapeHtml(row.binId)}</div>
          <div class="card-type-row">
            <span class="card-type">${row.recipe ? escapeHtml(row.recipe) : "1 bin"}</span>
          </div>
          ${foldRowHtml}${valueBlockHtml}
        </div>
      </div>
      <div class="card-collapsed-profit">
        <span class="harvest-stack">${statusBadgeHtml}</span>
        <span class="chev">▾</span>
      </div>
      ${statusFoldHtml}
    </div>
    <div class="card-details">
      <div class="animal-detail-grid">
        <div class="animal-detail-stat"><span class="label">Status</span><span class="value">${stateValue}</span></div>
        ${itemRows}
        ${priceRows}
        ${totalsHtml}
      </div>
      ${netHtml}
      ${boostHtml}
    </div>
  </div>`;
}

function farmPanelRenderPeteQuestCard(row) {
  const searchKey = "pumpkin-pete-quest";
  const expandedCls = farmPanelExpandedNames.has(searchKey) ? " expanded" : "";
  const badgeHtml = row.isReady ? `<span class="harvest-badge is-ready">✅ Quest Ready</span>` : `<span class="harvest-badge is-growing">⏳ <span class="fp-quest-countdown" data-ready-at="${row.readyAtMs}">${farmPanelFormatCountdown(row.remainingSec)}</span></span>`;
  const petIcon = NPC_ICONS && NPC_ICONS["pumpkin' pete"] ? `<img src="${NPC_ICONS["pumpkin' pete"]}" alt="Pumpkin Pete" style="width:20px;height:20px;image-rendering:pixelated;vertical-align:middle;">` : "🎃";
  const descHtml = row.description ? `<div class="fp-quest-desc">${escapeHtml(row.description)}</div>` : `<div class="fp-quest-desc">Quest details for "${escapeHtml(row.questKey)}" are not in the list yet.</div>`;
  const choiceRows = row.choices.map(c => {
    const parts = peteParseReward(c.reward);
    const rewardHtml = parts.map(p => `<span class="fp-quest-reward-part">${escapeHtml(p.label)}${p.icon ? ` ${p.icon}` : ""}</span>`).join('<span class="fp-quest-reward-sep">+</span>');
    return `<div class="fp-quest-choice"><span class="fp-quest-choice-text">${escapeHtml(c.text)}</span><span class="fp-quest-reward">${rewardHtml}</span></div>`;
  }).join("");
  const choicesHtml = row.choices.length ? `<div class="lib-section-title" style="margin-top:10px;">CHOICES &amp; REWARDS</div>${choiceRows}` : "";
  return `
  <div class="card animal-merged-card${row.isReady ? " is-profit" : ""}${expandedCls}" data-search="${searchKey}" data-fp-category="pete">
    <div class="card-toggle">
      <div class="card-name-row">
        <span class="card-icon">${petIcon}</span>
        <div>
          <div class="card-name">Pumpkin Pete Quest</div>
          <div class="card-type-row">
            ${badgeHtml}
          </div>
        </div>
      </div>
      <div class="card-collapsed-profit">
        <span class="chev">▾</span>
      </div>
    </div>
    <div class="card-details">
      <div class="fp-quest-title">${escapeHtml(row.title)}</div>
      ${descHtml}
      ${choicesHtml}
      <div class="fp-quest-guide-trigger" data-pete-guide-trigger>How to set up the Telegram Quest Bot</div>
      <a class="fp-quest-credit" href="${PETE_QUEST_LINK}" target="_blank" rel="noopener noreferrer">Special thanks to Digits for compiling quest info</a>
    </div>
  </div>`;
}

function farmPanelRenderCookingCard(row) {
  const building = row.cookingBuilding;
  const isProfit = true;
  const cookGross = (row.productGroups || []).reduce((sum, p) => sum + farmPanelGetMarketPriceFlower(p.name) * (p.amount || 0), 0);
  const cookFee = cookGross * ((feePercent || 0) / 100);
  const valueBlockHtml = cookGross > 0 ? guroValueBlockHtml(cookGross, cookFee, fmt) : "";
  const buildingIconKey = (row.cookingKind === "fermentation" || row.cookingKind === "spice") && IMAGE_ICONS["Aging Shed"] ? "Aging Shed" : building;
  const buildingIcon = IMAGE_ICONS[buildingIconKey] ? getIcon(buildingIconKey) : COOKING_BUILDING_ICONS[building] ? `<span style="font-size:calc(19.2px * var(--fs-desk,1));line-height:1;">${COOKING_BUILDING_ICONS[building]}</span>` : getIcon(building);
  const searchKey = building.toLowerCase().replace(/\s+/g, "-");
  const expandedCls = farmPanelExpandedNames.has(searchKey) ? " expanded" : "";
  const growingCount = row.slotCount - row.readyCount;
  const statusBadgeHtml = farmPanelStatusBadgeHtml(row.readyCount, growingCount, "Cooking");
  let badgeHtml = "";
  const baseStatus = row.readyCount > 0 ? row.readyCount === row.slotCount ? "✅ All ready" : `✅ ${row.readyCount} ready · ⏳ ${growingCount} cooking` : "⏳ Cooking";
  const showCountdown = row.soonestSec != null && row.readyCount < row.slotCount;
  const statusLine = baseStatus;
  const statusFoldHtml = guroStatusFoldHtml("Cooking", showCountdown ? row.soonestSec : null);
  const dailyBadgeHtml = dailyHarvestBadgeHtml(building, "cooking", buildingIcon, farmPanelDailyFarmId());
  const productChipHtml = row.productGroups.map(p => `\n      <span class="animal-produce-chip">\n        <span class="produce-yield">+${fmtCookQty(p.amount)}</span>\n        <span class="produce-icon">${cookingFoodOrFishIcon(p.name)}</span>\n        <span class="produce-name">${escapeHtml(p.name)}</span>\n      </span>`).join("");
  const boostListHtml = farmPanelRenderCookingBoostList(row);
  const queueListHtml = farmPanelRenderCookingQueueList(row);
  const limitedHtml = farmPanelRenderCookingLimitedBoosts(row);
  return `\n  <div class="card animal-merged-card${isProfit ? " is-profit" : " is-loss"}${expandedCls}" data-search="${searchKey}" data-fp-category="cooking">\n    <div class="card-toggle">\n      <div class="card-name-row">\n        <span class="card-icon">${buildingIcon}</span>\n        <div>\n          <div class="card-name">${escapeHtml(building)}</div>\n          <div class="card-type-row">\n            <span class="card-type">${row.slotCount} slot${row.slotCount === 1 ? "" : "s"}</span>\n            ${badgeHtml}\n          </div>\n          <div class="animal-fold-row">${productChipHtml}</div>${valueBlockHtml}\n        </div>\n      </div>\n      <div class="card-collapsed-profit">\n        <span class="harvest-stack">${dailyBadgeHtml}${statusBadgeHtml}</span>\n        <span class="chev">▾</span>\n      </div>\n      ${statusFoldHtml}\n    </div>\n    <div class="card-details">\n      ${queueListHtml}\n      ${boostListHtml}\n      ${limitedHtml}\n    </div>\n  </div>`;
}

const FARM_PANEL_DAILY_NODE_KINDS = {
  Wood: "wood",
  Stone: "stone",
  Iron: "iron",
  Gold: "gold",
  Crimstone: "crimstone",
  Oil: "oil"
};

const FARM_PANEL_PENDING_BAGS = {
  Wood: "trees",
  Stone: "stones",
  Iron: "iron",
  Gold: "gold"
};

function farmPanelResolveHarvestPending(groupKey, pend) {
  const json = farmPanelGameState;
  if (!json) return undefined;
  const bagKey = FARM_PANEL_PENDING_BAGS[groupKey];
  if (!bagKey || !pend || !Array.isArray(pend.ids) || !pend.prev || !pend.now) return null;
  if (!Number(farmPanelGetLastInfo().id)) return undefined;
  const g = farmSyncExtractGameState(json);
  const bag = farmPanelField(g, bagKey);
  const baseActivity = farmPanelField(g, "farmActivity");
  if (!bag || !baseActivity) return undefined;
  const byType = {};
  for (let i = 0; i < pend.ids.length; i++) {
    const node = bag[pend.ids[i]];
    if (!node) return null;
    let type;
    let actKey;
    if (groupKey === "Wood") {
      type = farmPanelTreeTypeForNode(node);
      actKey = `${type === "Tree" ? "Basic Tree" : type} Chopped`;
    } else {
      const known = groupKey === "Stone" ? STONE_KNOWN_IDS : groupKey === "Iron" ? IRON_KNOWN_IDS : GOLD_KNOWN_IDS;
      type = farmPanelRockNameForNode(node, known, `${groupKey} Rock`);
      actKey = `${type} Mined`;
    }
    const slot = byType[type] || (byType[type] = {
      actKey: actKey,
      nodes: []
    });
    slot.nodes.push({
      id: pend.ids[i],
      node: node
    });
  }
  const out = {};
  const chopsOut = {};
  const now = Date.now();
  const types = Object.keys(byType);
  for (let t = 0; t < types.length; t++) {
    const type = types[t];
    const slot = byType[type];
    const prev = pend.prev[slot.actKey];
    const after = pend.now[slot.actKey];
    if (typeof prev !== "number" || typeof after !== "number") return null;
    const clone = {
      farm: Object.assign({}, g, {
        farmActivity: Object.assign({}, baseActivity, {
          [slot.actKey]: prev
        })
      })
    };
    const count = slot.nodes.length;
    if (groupKey === "Wood" || groupKey === "Gold") {
      const chains = groupKey === "Wood" ? farmPanelBuildSequentialWoodRollChains(clone, type, count) : farmPanelBuildSequentialGoldRollChains(clone, type, count);
      if (!chains) return undefined;
      const consumed = chains.reduce((sum, chain) => sum + chain.length, 0);
      if (consumed !== after - prev) return null;
      slot.nodes.forEach((entry, i) => {
        chopsOut[entry.id] = chains[i].length * dailyHarvestNodeToolMult(entry.node);
        out[entry.id] = chains[i].reduce((sum, roll) => sum + ((groupKey === "Wood" ? farmPanelComputeExactWoodYieldForNode(entry.node, type, roll) : farmPanelComputeExactGoldYieldForNode(json, entry.node, type, roll, now)) || 0), 0);
      });
    } else {
      const rolls = groupKey === "Stone" ? farmPanelBuildSequentialStoneRolls(clone, type, count) : farmPanelBuildSequentialIronRolls(clone, type, count);
      if (!rolls) return undefined;
      if (count !== after - prev) return null;
      slot.nodes.forEach((entry, i) => {
        chopsOut[entry.id] = dailyHarvestNodeToolMult(entry.node);
        out[entry.id] = (groupKey === "Stone" ? farmPanelComputeExactStoneYieldForNode(json, entry.node, type, rolls[i], now) : farmPanelComputeExactIronYieldForNode(json, entry.node, type, rolls[i], now)) || 0;
      });
    }
  }
  return {
    y: out,
    c: chopsOut
  };
}

const FARM_PANEL_GROUP_TOOLS = {
  Wood: {
    tool: "Axe",
    free: [ "foreman_beaver" ],
    half: [ "logger" ]
  },
  Stone: {
    tool: "Pickaxe",
    free: [ "quarry" ],
    half: []
  },
  Iron: {
    tool: "Stone Pickaxe",
    free: [],
    half: []
  },
  Gold: {
    tool: "Iron Pickaxe",
    free: [],
    half: []
  },
  Crimstone: {
    tool: "Gold Pickaxe",
    free: [ "crimstone_spikes_hair" ],
    half: []
  },
  Oil: {
    tool: "Oil Drill",
    free: [ "infernal_drill" ],
    half: []
  }
};

function farmPanelToolInfoForGroup(groupKey) {
  const def = FARM_PANEL_GROUP_TOOLS[groupKey];
  if (!def) return null;
  let factor = 1;
  if (def.free.some(id => isBoostActive(id))) factor = 0; else if (def.half.some(id => isBoostActive(id))) factor = .5;
  return {
    tool: def.tool,
    factor: factor,
    icon: getIcon(def.tool)
  };
}

dailyHarvestSetToolProvider(farmPanelToolInfoForGroup);

dailyHarvestSetResolver(farmPanelResolveHarvestPending);

function farmPanelClaimedAnimalYield(groupKey, xp, buffName, claimedXp) {
  const type = String(groupKey).toLowerCase();
  if (!ANIMAL_DATA[type]) return null;
  let level = getAnimalLevelFromXp(type, xp, true);
  if (level === null) return null;
  if (typeof claimedXp === "number") level = Math.max(1, animalNextClaimLevel(type, {
    xp: xp,
    claimedExperience: claimedXp,
    state: "ready"
  }));
  const fig = computeAnimalYieldsForLevel(type, level, buffName || null);
  const parts = {};
  let total = 0;
  fig.products.forEach((name, i) => {
    parts[name] = fig.yields[i];
    total += fig.yields[i];
  });
  return {
    total: total,
    parts: parts
  };
}

dailyHarvestSetAnimalYieldProvider(farmPanelClaimedAnimalYield);

dailyHarvestSetCookingProvider(farmPanelCookingLogSlots);

dailyHarvestSetMachineProvider(farmPanelCropMachineLogProvider);

dailyHarvestSetIconProvider(cookingFoodOrFishIcon);

dailyHarvestSetPriceProvider(name => ({
  price: farmPanelGetMarketPriceFlower(name) || 0,
  fee: (feePercent || 0) / 100
}));

function farmPanelDailyFarmId() {
  const stateId = farmPanelGameState && farmPanelGameState.id;
  return String(stateId || farmPanelGetLastInfo().id || "");
}

function farmPanelDailyHarvestKind(name) {
  if (FARM_PANEL_DAILY_NODE_KINDS[name]) return FARM_PANEL_DAILY_NODE_KINDS[name];
  if (BASE_CROPS[name]) return "crop";
  if (BASE_FRUITS[name]) return "fruit";
  if (BASE_GREENHOUSE[name]) return "greenhouse";
  if (FLOWER_VARIETIES[name]) return "flower";
  return "";
}

export function farmPanelRenderInProgressRow(row) {
  if (row.isAnimalMerged) return farmPanelRenderAnimalMergedCard(row);
  if (row.isComposterCard) return farmPanelRenderComposterCard(row);
  if (row.isHoneyCard) return farmPanelRenderHoneyCard(row);
  if (row.isCookingCard) return farmPanelRenderCookingCard(row);
  if (row.isCropMachineCard) return farmPanelRenderCropMachineCard(row);
  if (row.isMushroomCard) return farmPanelRenderMushroomCard(row, farmPanelExpandedNames.has(row.name.toLowerCase()), {
    flowerIcon: FLOWER_ICON,
    valueBlockHtml: (gross, fee) => guroValueBlockHtml(gross, fee, fmt),
    statusBadgeHtml: r => farmPanelStatusBadgeHtml(r.count, 0, "Growing"),
    statusFoldHtml: r => {
      if (r.remainingSec == null) return `<div class="guro-status-fold"><span class="guro-status-label">SYNC TO CHECK RESPAWN</span></div>`;
      return guroStatusFoldHtml(r.count > 0 ? "Next spawn" : "Ready", r.remainingSec);
    }
  });
  if (row.isMycoCard) return farmPanelRenderMycoCard(row);
  if (row.isPeteQuestCard) return farmPanelRenderPeteQuestCard(row);
  if (row.isFloatingIslandCard) return farmPanelRenderFloatingIslandCard(row, farmPanelExpandedNames.has("floating-island"));
  if (row.isFishingCard) return farmPanelRenderFishingCard(row, farmPanelExpandedNames.has("fishing"));
  if (row.isCaveMerchantCard) return farmPanelRenderCaveMerchantCard(row, farmPanelExpandedNames.has("cave-merchant"));
  if (row.isSkillResetCard) return farmPanelRenderSkillResetCard(row, farmPanelExpandedNames.has(row.searchKey), row.isReady ? "" : guroStatusFoldHtml("Ready", row.remainingSec));
  if (row.isPowerSkillCard) return farmPanelRenderPowerSkillCard(row, farmPanelExpandedNames.has(row.searchKey), row.isReady ? "" : guroStatusFoldHtml("Ready", row.remainingSec));
  const baseStatus = row.readyCount > 0 ? row.readyCount === row.count ? "✅ All ready" : `✅ ${row.readyCount} ready · ⏳ ${row.count - row.readyCount} growing` : "⏳ Growing";
  const showCountdown = row.soonestSec != null && row.readyCount < row.count;
  const noEtaGrowing = !showCountdown && row.readyCount < row.count && row.noEtaCount > 0;
  const isAnimalProduct = ALL_ANIMAL_PRODUCTS.includes(row.name);
  const statusLine = noEtaGrowing ? isAnimalProduct ? `${baseStatus} <span style="color:var(--ink-soft);">(🤒 ${row.noEtaCount} sick — can't estimate)</span>` : `${baseStatus} <span style="color:var(--ink-soft);">(no active flower/growth right now — can't estimate)</span>` : baseStatus;
  const statusFoldHtml = guroStatusFoldHtml(farmPanelProgressWord(row), showCountdown ? row.soonestSec : null);
  const woodGross = row.fruitWood ? row.fruitWood.econ.grossRevenue : 0;
  const woodFee = row.fruitWood ? row.fruitWood.econ.feeAmount : 0;
  const totalGross = row.grossRevenue + woodGross;
  const totalFee = row.feeAmount + woodFee;
  const isProfit = totalGross - totalFee >= 0;
  const expandedCls = farmPanelExpandedNames.has(row.name.toLowerCase()) ? " expanded" : "";
  const growingCount = row.count - row.readyCount;
  const statusBadgeHtml = farmPanelStatusBadgeHtml(row.readyCount, growingCount, farmPanelProgressWord(row));
  let badgeHtml = "";
  if (row.sickCount > 0) {
    badgeHtml += `<span class="harvest-badge" style="background:rgba(214,80,80,0.15);color:#c33;">🤒 ${row.sickCount} sick</span>`;
  }
  if (row.weatherDestroyedCount > 0) {
    const destroyedIcon = row.weatherDestroyedEvent ? IMAGE_ICONS[row.weatherDestroyedEvent] : null;
    badgeHtml += `<span class="harvest-badge" style="background:rgba(214,80,80,0.18);color:#a12626;">${destroyedIcon ? `<img src="${destroyedIcon}" style="width:12px;height:12px;vertical-align:-2px;image-rendering:pixelated;margin-right:2px;">` : "🌊"} ${row.weatherDestroyedCount} destroyed by ${escapeHtml(row.weatherDestroyedEvent || "weather event")}</span>`;
  }
  (row.activeBoosts || []).forEach(b => {
    if (b.limitedBoostName === "Sunshower" || b.limitedBoostName === "Bountiful Harvest" || b.limitedBoostName === "Power hour") {
      const icon = IMAGE_ICONS[b.name];
      badgeHtml += `<span class="harvest-badge" style="background:rgba(255,196,0,0.18);color:#8a6300;">${icon ? `<img src="${icon}" style="width:12px;height:12px;vertical-align:-2px;image-rendering:pixelated;margin-right:2px;">` : "🌦️"} ${escapeHtml(b.name)} active</span>`;
    }
    if (b.isDebuff) {
      const icon = IMAGE_ICONS[b.name];
      const lossPct = Math.round((b.debuffLossMult || .5) * 100);
      badgeHtml += `<span class="harvest-badge" style="background:rgba(214,80,80,0.18);color:#a12626;">${icon ? `<img src="${icon}" style="width:12px;height:12px;vertical-align:-2px;image-rendering:pixelated;margin-right:2px;">` : "⚠️"} ${escapeHtml(b.name)} ~${lossPct}% plots destroyed</span>`;
    }
  });
  const tierEntries = row.tierCounts ? Object.entries(row.tierCounts) : [];
  const tierNote = tierEntries.length ? ` <span class="card-tier-note">(${tierEntries.map(([label, c]) => `${c} ${escapeHtml(label)}`).join(", ")})</span>` : "";
  const nodeIcon = getNodeIconHtml(row.name);
  const nodeLabel = getNodeLabel(row.name);
  const dailyKind = farmPanelDailyHarvestKind(row.name);
  const dailyBadgeHtml = dailyKind ? dailyHarvestBadgeHtml(row.name, dailyKind, nodeIcon, farmPanelDailyFarmId()) : "";
  const produceIcon = getIcon(row.name);
  if (dailyKind) dailyHarvestSetYield(row.name, row.count > 0 ? row.totalYield / row.count : 0, produceIcon, row.nodeYields, row.name === "Oil" ? null : {
    price: row.price,
    feeRate: row.grossRevenue > 0 ? row.feeAmount / row.grossRevenue : 0
  }, farmPanelDailyFarmId());
  const boostSummary = farmPanelComputeNodeYieldBoostSummary(row);
  const woodIcon = row.fruitWood ? getIcon("Wood") : "";
  const woodChipHtml = row.fruitWood ? `\n      <span class="animal-produce-chip fruit-wood-chip">\n        <span class="produce-yield">+${fmt(row.fruitWood.econ.totalYield)}</span>\n        <span class="produce-icon">${woodIcon}</span>\n        <span class="produce-name">Wood</span>\n      </span>` : "";
  const productChipHtml = `\n      <span class="animal-produce-chip">\n        <span class="produce-yield">+${fmt(row.totalYield)}</span>\n        <span class="produce-icon">${produceIcon}</span>\n        <span class="produce-name">${escapeHtml(row.name)}</span>\n      </span>`;
  const mutantChipsHtml = (row.mutantRewards || []).map(m => `<div class="animal-fold-row"><span class="animal-produce-chip mutant-flower-chip"><span class="produce-yield">+${fmt(m.amount)}</span><span class="produce-icon">${getIcon(m.name)}</span><span class="produce-name">${escapeHtml(m.name)}</span></span></div>`).join("");
  const valueBlockHtml = row.name === "Oil" ? "" : FLOWER_VARIETIES[row.name] ? mutantChipsHtml : guroValueBlockHtml(totalGross, totalFee, fmt);
  const moneyTreeBadgeHtml = row.moneyTreeBonus ? `\n      <span class="animal-produce-chip money-tree-badge-chip">\n        <span class="produce-name">Money Tree</span>\n        <span class="produce-yield">+${fmt(row.moneyTreeBonus.coins)}</span>\n        ${COIN_ICON}\n      </span>` : "";
  const productDetailRow = renderCardProductDetailRow(produceIcon, row.name, row.totalYield, row.grossRevenue, row.feeAmount, row.isBoosted ? row.baseTotalYield : null);
  const woodDetailRowHtml = row.fruitWood ? renderCardProductDetailRow(woodIcon, "Wood", row.fruitWood.econ.totalYield, row.fruitWood.econ.grossRevenue, row.fruitWood.econ.feeAmount) : "";
  const boostListHtml = farmPanelRenderNodeYieldBoostList(row, boostSummary, produceIcon);
  const tierYieldListHtml = row.name === "Oil" ? renderOilNodeYieldList(row.oilNodeGroups, produceIcon) : row.name === "Salt" ? renderSaltNodeYieldList(row.saltNodeGroups, produceIcon, row.price) : row.name === "Crimstone" ? renderCrimstoneNodeYieldList(row.crimstoneNodeGroups) : row.plantYieldLabel ? renderPlantYieldNodeList(row.plantYieldLabel, row.name, row.plantYieldGroups, produceIcon, nodeIcon) : renderNodeTierYieldList(row.tierYields, produceIcon);
  const harvestsLeftHtml = renderFruitHarvestsLeftHtml(row.harvestsLeftCounts, row.name, row.fruitWoodPerTree);
  const turnaroundBoostHtml = renderTurnaroundBoostHtml(row);
  const seaBlessedBoostHtml = renderSeaBlessedBoostHtml(row);
  const goldInstantMineBoostHtml = renderGoldInstantMineBoostHtml(row);
  const crimstoneInstantMineBoostHtml = renderCrimstoneInstantMineBoostHtml(row);
  let saltReadyLabelHtml = "";
  let saltProjectedHtml = "";
  if (row.name === "Salt" && row.saltNodeGroups && row.saltNodeGroups.length) {
    saltReadyLabelHtml = `<div class="salt-section-label">Ready to Harvest</div>`;
    const anySaltRecovering = row.saltNodeGroups.some(n => n.storedCharges < n.maxCharges);
    if (anySaltRecovering) {
      const saltChainBonusQty = row.saltNodeGroups.reduce((sum, n) => sum + (n.seaBlessedWindowRestored || 0) * n.yieldPerCharge, 0);
      const saltProjectedQty = row.saltNodeGroups.reduce((sum, n) => sum + n.qty + (n.storedCharges < n.maxCharges ? n.yieldPerCharge : 0), 0) + saltChainBonusQty;
      const saltProjectedHarvests = row.saltNodeGroups.reduce((sum, n) => sum + n.storedCharges + (n.seaBlessedRestored || 0) + (n.storedCharges < n.maxCharges ? 1 : 0) + (n.seaBlessedWindowRestored || 0), 0);
      const projectedEcon = farmPanelComputeEconomics("Salt", saltProjectedHarvests, saltProjectedQty);
      const projectedChipHtml = `\n      <span class="animal-produce-chip salt-projected-chip">\n        <span class="produce-yield">+${fmt(saltProjectedQty)}</span>\n        <span class="produce-icon">${produceIcon}</span>\n        <span class="produce-name">${escapeHtml(row.name)}</span>\n        <span class="produce-value">(${fmt(projectedEcon.grossRevenue)} ${FLOWER_ICON})</span>\n      </span>`;
      const projectedChainNote = saltChainBonusQty > 0 ? `<div class="salt-hint-sea-blessed">⚡ incl. +${fmt(saltChainBonusQty)} Salt from Sea Blessed chain</div>` : "";
      saltProjectedHtml = `<div class="salt-section-label">Projected Harvest</div>\n          <div class="animal-fold-row">${projectedChipHtml}</div>\n          ${projectedChainNote}`;
    }
  }
  return `\n  <div class="card animal-merged-card${isProfit ? " is-profit" : " is-loss"}${expandedCls}" data-search="${row.name.toLowerCase()}" data-fp-category="${farmPanelCardCategory(row)}">\n    <div class="card-toggle">\n      <div class="card-name-row">\n        <span class="card-icon">${nodeIcon}</span>\n        <div>\n          <div class="card-name">${escapeHtml(nodeLabel)}</div>\n          <div class="card-type-row">\n            <span class="card-type">${row.displayNodeCount} node${row.displayNodeCount === 1 ? "" : "s"}${tierNote}</span>\n            ${badgeHtml}\n          </div>\n          ${saltReadyLabelHtml}<div class="animal-fold-row">${productChipHtml}${woodChipHtml}${moneyTreeBadgeHtml}</div>${valueBlockHtml}\n          ${saltProjectedHtml}${seaBlessedBoostHtml}${turnaroundBoostHtml}${goldInstantMineBoostHtml}${crimstoneInstantMineBoostHtml}\n        </div>\n      </div>\n      <div class="card-collapsed-profit">\n        <span class="harvest-stack">${dailyBadgeHtml}${statusBadgeHtml}</span>\n        <span class="chev">▾</span>\n      </div>\n      ${statusFoldHtml}\n    </div>\n    <div class="card-details">\n      <div class="animal-detail-grid">\n        ${productDetailRow}${woodDetailRowHtml}\n        <div class="animal-detail-stat"><span class="label">Market Price/Unit</span><span class="value">${fmt(row.price)} ${FLOWER_ICON}</span></div>\n        <div class="animal-detail-stat"><span class="label">Market Value</span><span class="value">${fmt(totalGross)} ${FLOWER_ICON}</span></div>\n        <div class="animal-detail-stat"><span class="label">Tax</span><span class="value">${totalFee > 0 ? `-${fmt(totalFee)}` : "0"} ${FLOWER_ICON}</span></div>\n      </div>\n      <div class="animal-net-row2">\n        <span class="label">Net</span>\n        <span class="value ${isProfit ? "is-profit" : "is-loss"}">${fmt(totalGross - totalFee)} ${FLOWER_ICON}</span>\n      </div>\n      ${harvestsLeftHtml}\n      ${tierYieldListHtml}\n      ${boostListHtml}\n      ${fpLimitedBlockHtml(row)}\n    </div>\n  </div>`;
}

export function farmPanelRenderStockRow(row) {
  const isProfit = row.profit >= 0;
  const expandedCls = farmPanelExpandedNames.has(row.name.toLowerCase()) ? " expanded" : "";
  return `\n  <div class="card${isProfit ? " is-profit" : " is-loss"}${expandedCls}" data-search="${row.name.toLowerCase()}">\n    <div class="card-toggle">\n      <div class="card-name-row">\n        <span class="card-icon">${getIcon(row.name)}</span>\n        <div>\n          <div class="card-name">${escapeHtml(row.name)}</div>\n          <div class="card-type">${fmt(row.totalYield)} in stock</div>\n        </div>\n      </div>\n      <div class="card-collapsed-profit">\n        <span class="pvalue-mini${isProfit ? " is-profit" : " is-loss"}">${isProfit ? "+" : ""}${fmt(row.profit)} ${FLOWER_ICON}</span>\n        <span class="chev">▾</span>\n      </div>\n    </div>\n    <div class="card-details">\n      <div class="card-grid">\n        <div class="stat"><span class="label">Price / unit (market)</span><span class="value">${fmt(row.price)} ${FLOWER_ICON}</span></div>\n        <div class="stat"><span class="label">Cost / unit (seed)</span><span class="value">${fmt(row.costPerUnit)} ${FLOWER_ICON}</span></div>\n      </div>\n      ${renderTotalsBreakdown({
    title: "Totals",
    totalYield: row.totalYield,
    yieldLabel: escapeHtml(row.name),
    gross: row.grossRevenue,
    baseCost: row.totalCost - (row.restockCost || 0),
    restockCost: row.restockCost || 0,
    shrineCost: 0,
    sellFee: row.feeAmount
  })}\n      ${farmPanelRestockNoteHtml(row.restockInfo)}\n    </div>\n  </div>`;
}

function farmPanelRestockNoteHtml(ri) {
  if (!ri || !(ri.flowerCost > 0)) return "";
  const noun = ri.stockKind === "tool" ? "tool" : "seed";
  let txt = `${GEM_ICON} ~${fmt(ri.restocksNeeded)} ${noun} restock${ri.restocksNeeded === 1 ? "" : "s"} needed for this qty · ${fmt(ri.gemsTotal)} ${GEM_ICON} Gems ≈ ${fmt(ri.flowerCost)} ${FLOWER_ICON} (already added to Total cost above)`;
  if (ri.moonOnly) {
    const minDays = Math.ceil(ri.restocksNeeded) * SYNODIC_MONTH_DAYS;
    const moonStock = fullMoonSeedStockQty(ri.name);
    txt += `<br>🌕 Moon-fruit: Betty sells ${fmt(moonStock)} seed${moonStock === 1 ? "" : "s"} per real Full Moon${moonStock > 1 ? " (Moon Hair equipped)" : ""} — even with unlimited Gems this qty needs ~${fmt(minDays)} days minimum.`;
  }
  return `<div class="setting-hint" style="margin-top:4px;font-weight:700;color:#e0a63f;">${txt}</div>`;
}

function farmPanelTickCountdowns() {
  const panel = $("farmSidePanel");
  if (!panel || !panel.classList.contains("open")) return;
  if (farmPanelActiveTab !== "inprogress" || !farmPanelGameState) return;
  if (farmPanelUserScrolling) return;
  const wrap = $("farmPanelTabContent");
  if (!wrap) return;
  const els = wrap.querySelectorAll(".farm-countdown[data-base], .fp-quest-countdown[data-ready-at], .fi-countdown[data-fi-at], .cm-countdown[data-cm-at]");
  if (!els.length) return;
  const elapsedSec = (Date.now() - farmPanelRenderAtMs) / 1e3;
  let anyFinished = false;
  els.forEach(el => {
    if (el.hasAttribute("data-cm-at")) {
      const merchantRemaining = (parseFloat(el.getAttribute("data-cm-at")) - Date.now()) / 1e3;
      if (merchantRemaining <= 0) {
        anyFinished = true;
        return;
      }
      el.textContent = el.classList.contains("guro-status-value") ? foldClock(merchantRemaining) : caveMerchantClock(merchantRemaining);
      return;
    }
    if (el.hasAttribute("data-fi-at")) {
      const islandRemaining = (parseFloat(el.getAttribute("data-fi-at")) - Date.now()) / 1e3;
      if (islandRemaining <= 0) {
        anyFinished = true;
        return;
      }
      el.textContent = el.classList.contains("guro-status-value") ? foldClock(islandRemaining) : floatingIslandClock(islandRemaining);
      return;
    }
    if (el.hasAttribute("data-ready-at")) {
      const questRemaining = (parseFloat(el.getAttribute("data-ready-at")) - Date.now()) / 1e3;
      if (questRemaining <= 0) {
        anyFinished = true;
        return;
      }
      el.textContent = farmPanelFormatCountdown(questRemaining);
      return;
    }
    const base = parseFloat(el.getAttribute("data-base"));
    const remaining = base - elapsedSec;
    if (remaining <= 0) {
      anyFinished = true;
      return;
    }
    el.textContent = el.classList.contains("guro-status-value") ? foldClock(remaining) : guroCountdownText(remaining);
  });
  if (anyFinished) renderFarmPanelTabContent();
}

setInterval(farmPanelTickCountdowns, 1e3);

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) renderFarmPanelTabContent();
});

export function farmPanelDebugFindShapes(obj, substrs, path, depth, out) {
  if (!obj || typeof obj !== "object" || depth > 3) return;
  Object.keys(obj).forEach(k => {
    const full = path ? `${path}.${k}` : k;
    if (substrs.some(s => k.toLowerCase().includes(s)) && !out[full]) {
      const v = obj[k];
      if (v && typeof v === "object" && !Array.isArray(v)) {
        const firstKey = Object.keys(v)[0];
        out[full] = firstKey !== undefined ? {
          _sampleKey: firstKey,
          _sampleValue: v[firstKey]
        } : v;
      } else {
        out[full] = v;
      }
    }
    if (obj[k] && typeof obj[k] === "object") farmPanelDebugFindShapes(obj[k], substrs, full, depth + 1, out);
  });
}

const farmPanelDebugCloseBtnEl = $("farmPanelDebugCloseBtn");

if (farmPanelDebugCloseBtnEl) farmPanelDebugCloseBtnEl.onclick = () => {
  $("farmPanelDebugPanel").classList.remove("open");
  $("farmPanelDebugToggle").classList.remove("open");
  const box = $("farmPanelDebugOutput");
  if (box) box.style.display = "none";
};

const farmPanelDebugPetsBtnEl = $("farmPanelDebugPetsBtn");

if (farmPanelDebugPetsBtnEl) farmPanelDebugPetsBtnEl.onclick = () => {
  const box = $("farmPanelDebugOutput");
  if (!farmPanelGameState) {
    box.style.display = "block";
    box.value = "Sync a Farm ID first, then tap this again.";
    return;
  }
  const g = farmSyncExtractGameState(farmPanelGameState);
  const asObj = v => v && typeof v === "object" && !Array.isArray(v) ? v : null;
  const topBag = asObj(farmPanelField(g, "pets"));
  const house = asObj(farmPanelField(g, "petHouse"));
  const heuristic = !topBag || !Object.keys(topBag).length ? farmSyncFindBagByNameHeuristic(g, /^pets$/i, 3) : null;
  const records = typeof farmSyncGetPetRecords === "function" ? farmSyncGetPetRecords(g, true) : {};
  const firstId = Object.keys(records)[0];
  const out = {
    "g.pets (top-level bag)": topBag ? {
      count: Object.keys(topBag).length,
      first: topBag[Object.keys(topBag)[0]] || null
    } : "(missing)",
    "g.petHouse (building, if pets are nested inside it)": house ? {
      topLevelKeys: Object.keys(house),
      sample: house
    } : "(missing)",
    "heuristic search result (only runs if g.pets was missing/empty)": heuristic ? {
      path: heuristic.path,
      count: Object.keys(heuristic.value).length,
      first: Object.values(heuristic.value)[0] || null
    } : "(not run / nothing found)",
    "What syncPetsFromFarmData() will actually use": firstId ? {
      recordCount: Object.keys(records).length,
      firstRecordId: firstId,
      firstRecordRaw: records[firstId],
      extractedTraits: typeof farmSyncExtractPetTraits === "function" ? farmSyncExtractPetTraits(records[firstId]) : null
    } : "(no pet records found anywhere — copy this whole box and send it over)"
  };
  box.style.display = "block";
  box.value = JSON.stringify(out, null, 2);
  box.focus();
  box.select();
};

const farmPanelDebugNftPricesBtnEl = $("farmPanelDebugNftPricesBtn");

if (farmPanelDebugNftPricesBtnEl) farmPanelDebugNftPricesBtnEl.onclick = async () => {
  const box = $("farmPanelDebugOutput");
  box.style.display = "block";
  box.value = "Fetching " + SFL_NFT_PRICE_API + " ...";
  let json = null;
  let fetchError = null;
  try {
    const res = await fetch(SFL_NFT_PRICE_API, {
      cache: "no-store"
    });
    if (!res.ok) throw new Error("Bad response " + res.status);
    json = await res.json();
  } catch (e) {
    fetchError = String(e && e.message || e);
  }
  if (!json) {
    box.value = "Fetch failed: " + fetchError;
    box.focus();
    box.select();
    return;
  }
  const topLevelKeys = Object.keys(json);
  const budsArr = Array.isArray(json.buds) ? json.buds : null;
  const petsArr = Array.isArray(json.pets) ? json.pets : null;
  const collectiblesArr = Array.isArray(json.collectibles) ? json.collectibles : [];
  const wearablesArr = Array.isArray(json.wearables) ? json.wearables : [];
  const petTypeWords = [ "ram", "dragon", "phoenix", "griffin", "warthog", "wolf", "bear", "pet" ];
  const looksLikeBudOrPet = name => {
    const n = String(name || "").toLowerCase();
    return n.indexOf("bud") !== -1 || petTypeWords.some(w => n.indexOf(w) !== -1);
  };
  const collectiblesSuspects = collectiblesArr.filter(it => it && looksLikeBudOrPet(it.name));
  const wearablesSuspects = wearablesArr.filter(it => it && looksLikeBudOrPet(it.name));
  const g = farmPanelGameState ? farmSyncExtractGameState(farmPanelGameState) : null;
  const asObj = v => v && typeof v === "object" && !Array.isArray(v) ? v : null;
  const budsBag = g ? asObj(farmPanelField(g, "buds")) : null;
  const firstBudId = budsBag ? Object.keys(budsBag)[0] : null;
  const firstBudTraits = firstBudId ? farmSyncExtractBudTraits(budsBag[firstBudId]) : null;
  const petsRoot = g ? asObj(farmPanelField(g, "pets")) : null;
  const petNfts = petsRoot ? asObj(petsRoot.nfts) : null;
  const firstPetId = petNfts ? Object.keys(petNfts)[0] : null;
  const firstPetTraitType = firstPetId && asObj(petNfts[firstPetId]) && asObj(petNfts[firstPetId].traits) ? petNfts[firstPetId].traits.type : null;
  const out = {
    "Top-level keys on the /api/v1/nfts response": topLevelKeys,
    "json.buds (array?)": budsArr ? {
      count: budsArr.length,
      first: budsArr[0] || null,
      firstFew: budsArr.slice(0, 5)
    } : "(json.buds is missing or not an array — raw value: " + JSON.stringify(json.buds) + ")",
    "json.pets (array?)": petsArr ? {
      count: petsArr.length,
      first: petsArr[0] || null,
      firstFew: petsArr.slice(0, 5)
    } : "(json.pets is missing or not an array — raw value: " + JSON.stringify(json.pets) + ")",
    "collectibles count": collectiblesArr.length,
    "collectibles entries whose name contains bud/pet-type words": collectiblesSuspects.length ? collectiblesSuspects : "(none found)",
    "wearables count": wearablesArr.length,
    "wearables entries whose name contains bud/pet-type words": wearablesSuspects.length ? wearablesSuspects : "(none found)",
    "Your farm's first Bud type (from synced farm data, if any)": firstBudTraits ? firstBudTraits.type : "(sync a Farm ID first, or you have no buds)",
    "Your farm's first NFT Pet type (from synced farm data, if any)": firstPetTraitType || "(sync a Farm ID first, or you have no NFT pets)"
  };
  box.value = JSON.stringify(out, null, 2);
  box.focus();
  box.select();
};

const farmPanelDebugMarketplaceProbeBtnEl = $("farmPanelDebugMarketplaceProbeBtn");

if (farmPanelDebugMarketplaceProbeBtnEl) farmPanelDebugMarketplaceProbeBtnEl.onclick = async () => {
  const box = $("farmPanelDebugOutput");
  box.style.display = "block";
  box.value = "Probing candidate endpoints...";
  const candidates = [ SFL_PROXY_BASE + "/api/v1/marketplace?filters=buds,pets", SFL_PROXY_BASE + "/api/v1/marketplace/buds", SFL_PROXY_BASE + "/api/v1/marketplace/pets", SFL_PROXY_BASE + "/api/v1/collection/buds", SFL_PROXY_BASE + "/api/v1/collection/pets", SFL_PROXY_BASE + "/api/v1.1/marketplace", SFL_PROXY_BASE + "/api/v1.1/marketplace/buds", SFL_PROXY_BASE + "/api/v1.1/marketplace/pets", SFL_COMMUNITY_PROXY_BASE + "community/marketplace", SFL_COMMUNITY_PROXY_BASE + "community/marketplace/buds", SFL_COMMUNITY_PROXY_BASE + "community/marketplace/pets", SFL_COMMUNITY_PROXY_BASE + "community/nfts" ];
  const results = [];
  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        cache: "no-store"
      });
      let bodyPreview = null;
      let keys = null;
      try {
        const j = await res.json();
        keys = j && typeof j === "object" ? Object.keys(j).slice(0, 10) : null;
        bodyPreview = JSON.stringify(j).slice(0, 300);
      } catch (e) {
        bodyPreview = "(non-JSON or empty body)";
      }
      results.push({
        url: url,
        status: res.status,
        ok: res.ok,
        topLevelKeys: keys,
        bodyPreview: bodyPreview
      });
    } catch (e) {
      results.push({
        url: url,
        status: "fetch failed",
        error: String(e && e.message || e)
      });
    }
  }
  box.value = JSON.stringify(results, null, 2);
  box.focus();
  box.select();
};

const farmPanelDebugMutantsBtnEl = $("farmPanelDebugMutantsBtn");

if (farmPanelDebugMutantsBtnEl) farmPanelDebugMutantsBtnEl.onclick = () => {
  const box = $("farmPanelDebugOutput");
  if (!farmPanelGameState) {
    box.style.display = "block";
    box.value = "Sync a Farm ID first, then tap this again.";
    return;
  }
  const g = farmSyncExtractGameState(farmPanelGameState);
  const asObj = v => v && typeof v === "object" && !Array.isArray(v) ? v : null;
  const chapterName = getCurrentChapterName();
  const chapterMutants = getCurrentChapterMutantSet();
  const inspectJob = job => {
    if (!job || typeof job !== "object") return "(no job object)";
    return {
      allKeys: Object.keys(job),
      hasRewardField: Object.prototype.hasOwnProperty.call(job, "reward"),
      reward: job.reward === undefined ? "(reward key not present at all)" : job.reward,
      rewardItems: job.reward && Array.isArray(job.reward.items) ? job.reward.items : "(no reward.items array)"
    };
  };
  const flowersField = farmPanelField(g, "flowers");
  const flowerBeds = asObj(flowersField && flowersField.flowerBeds) || {};
  const flowerEntries = Object.entries(flowerBeds);
  const flowerOut = flowerEntries.length ? flowerEntries.map(([id, bed]) => ({
    bedId: id,
    ...inspectJob(bed && bed.flower)
  })) : "(no flower beds found on this farm)";
  const animalOut = {};
  [ "chicken", "sheep", "cow" ].forEach(type => {
    const bag = farmSyncGetAnimalRecords(g, type);
    const entries = Object.entries(bag || {});
    animalOut[type] = entries.length ? entries.map(([id, animal]) => ({
      animalId: id,
      state: animal && animal.state,
      ...inspectJob(animal)
    })) : `(no ${type} records found on this farm)`;
  });
  const out = {
    "Auto-detected current chapter": chapterName,
    "This chapter's target mutant names (what we're scanning reward.items for)": chapterMutants || "(no mutant table for this chapter)",
    "Flower beds — raw reward field per bed": flowerOut,
    "Chicken — raw reward field per animal": animalOut.chicken,
    "Sheep — raw reward field per animal": animalOut.sheep,
    "Cow — raw reward field per animal": animalOut.cow,
    "What farmPanelDetectActiveMutants() currently returns for this farm": farmPanelDetectActiveMutants(farmPanelGameState)
  };
  box.style.display = "block";
  box.value = JSON.stringify(out, null, 2);
  box.focus();
  box.select();
};

const farmPanelDebugTreeDataBtnEl = $("farmPanelDebugTreeDataBtn");

if (farmPanelDebugTreeDataBtnEl) farmPanelDebugTreeDataBtnEl.onclick = () => {
  const box = $("farmPanelDebugOutput");
  if (!farmPanelGameState) {
    box.style.display = "block";
    box.value = "Sync a Farm ID first, then tap this again.";
    return;
  }
  const g = farmSyncExtractGameState(farmPanelGameState);
  const trees = farmPanelField(g, "trees") || {};
  const treeEntries = Object.entries(trees);
  const farmActivity = farmPanelField(g, "farmActivity");
  const lastInfo = farmPanelGetLastInfo();
  const relevantActivityKeys = farmActivity ? Object.keys(farmActivity).filter(k => /Chopped$/.test(k)) : null;
  const perTree = treeEntries.map(([id, node]) => {
    const job = node && node.wood;
    return {
      treeId: id,
      name: node && node.name ? node.name : "Tree (base)",
      hasWoodAmount: !!(job && typeof job.amount === "number"),
      woodAmount: job && typeof job.amount === "number" ? job.amount : null,
      hasWoodReward: !!(job && job.reward),
      woodReward: job && job.reward || null,
      allWoodKeys: job ? Object.keys(job) : []
    };
  });
  const inProgress = farmPanelComputeInProgress(farmPanelGameState);
  const woodCard = inProgress.find(r => r.name === "Wood");
  const typesInFarm = [ ...new Set(treeEntries.map(([, node]) => farmPanelTreeTypeForNode(node))) ];
  const perTypeRolls = {};
  typesInFarm.forEach(t => {
    const typeEntries = treeEntries.filter(([, node]) => farmPanelTreeTypeForNode(node) === t);
    const readyEntries = typeEntries.filter(([, node]) => farmPanelIsNodeReadyNow("Wood", node, "wood", Date.now()));
    const chains = farmPanelBuildSequentialWoodRollChains(farmPanelGameState, t, readyEntries.length);
    const activityKey = `${t === "Tree" ? "Basic Tree" : t} Chopped`;
    let sequentialSum = 0;
    const perReadyNodeBreakdown = readyEntries.map(([id, node], i) => {
      const chain = chains && chains[i] ? chains[i] : null;
      const critRolls = chain && chain.length ? chain[0] : null;
      const amount = chain && chain.length ? chain.reduce((sum, roll) => sum + farmPanelComputeExactWoodYieldForNode(node, t, roll), 0) : null;
      if (typeof amount === "number") sequentialSum += amount;
      return {
        treeId: id,
        counterUsed: farmActivity ? (farmActivity[activityKey] ?? 0) + i : null,
        critRolls: critRolls,
        chain: chain,
        chainLength: chain ? chain.length : null,
        amount: amount
      };
    });
    perTypeRolls[t] = {
      turnaroundPredicted: perReadyNodeBreakdown.some(n => n.chainLength > 1),
      turnaroundPredictedNodeIds: perReadyNodeBreakdown.filter(n => n.chainLength > 1).map(n => n.treeId),
      moneyTreePredicted: farmPanelPredictMoneyTreeForType(farmPanelGameState, t),
      moneyTreeBatchPredicted: farmPanelPredictMoneyTreeBatchForType(farmPanelGameState, t, typeEntries.length, typeEntries.length ? typeof typeEntries[0][1].multiplier === "number" ? typeEntries[0][1].multiplier : 1 : 1),
      baseActivityCounter: farmActivity ? farmActivity[activityKey] ?? 0 : null,
      readyNodeCount: readyEntries.length,
      totalNodesOfThisType: typeEntries.length,
      sequentialSumForReadyNodes: readyEntries.length ? Number(sequentialSum.toFixed(4)) : null,
      perReadyNodeBreakdown: perReadyNodeBreakdown
    };
  });
  const out = {
    "farmId used for PRNG (farmPanelGetLastInfo().id)": lastInfo.id,
    "farmActivity present on merged state?": !!farmActivity,
    "farmActivity '*Chopped' keys found": relevantActivityKeys,
    "Tree Turnaround owned (isSkillActive)": isSkillActive("skill_tree_turnaround"),
    "Tree Turnaround rank (getAscensionRank)": getAscensionRank("skill_tree_turnaround"),
    "Money Tree owned (isSkillActive)": isSkillActive("skill_money_tree"),
    "Money Tree rank (getAscensionRank)": getAscensionRank("skill_money_tree"),
    "Total tree nodes": treeEntries.length,
    "Nodes with a real stored wood.amount": perTree.filter(t => t.hasWoodAmount).length,
    "Nodes with a real stored wood.reward": perTree.filter(t => t.hasWoodReward).length,
    "Per-TYPE roll (one shared result per type, NOT per node — see farmPanelPredictTreeTypeRoll)": perTypeRolls,
    "Per-tree raw wood field dump": perTree,
    "farmPanelDetectMoneyTreeBonus() result": farmPanelDetectMoneyTreeBonus(farmPanelGameState),
    "Wood card from farmPanelComputeInProgress() — actualYieldCount / turnaroundTypesPredicted": woodCard ? {
      actualYieldCount: woodCard.actualYieldCount,
      turnaroundTypesPredicted: woodCard.turnaroundTypesPredicted,
      turnaroundBonusYieldEstimate: woodCard.turnaroundBonusYieldEstimate
    } : "(no Wood card — sync a farm with trees first)",
    "Manually-entered Bud yield boost for Wood (resourceBuds panel)": farmPanelGetBudYieldForResource("Wood"),
    resourceBudsConfigured: resourceBuds
  };
  box.style.display = "block";
  box.value = JSON.stringify(out, null, 2);
  box.focus();
  box.select();
};

const farmPanelDebugMiningBtnEl = $("farmPanelDebugMiningBtn");

if (farmPanelDebugMiningBtnEl) farmPanelDebugMiningBtnEl.onclick = () => {
  const box = $("farmPanelDebugOutput");
  if (!farmPanelGameState) {
    box.style.display = "block";
    box.value = "Sync a Farm ID first, then tap this again.";
    return;
  }
  const g = farmSyncExtractGameState(farmPanelGameState);
  const farmActivity = farmPanelField(g, "farmActivity");
  const lastInfo = farmPanelGetLastInfo();
  function boostFlags(ids) {
    const out = {};
    ids.forEach(id => {
      if (id.startsWith("skill_")) {
        out[id] = isSkillActive(id) ? {
          owned: true,
          rank: getAscensionRank(id)
        } : {
          owned: false
        };
      } else {
        out[id] = isBoostActive(id);
      }
    });
    return out;
  }
  function buildSection(resourceLabel, bagKey, knownIds, defaultName, buildRollsFn, computeFn, boostIds) {
    const bag = farmPanelField(g, bagKey);
    if (!bag || typeof bag !== "object") return {
      present: false
    };
    const entries = Object.entries(bag);
    const typesInFarm = [ ...new Set(entries.map(([, node]) => farmPanelRockNameForNode(node, knownIds, defaultName))) ];
    const flags = boostFlags(boostIds);
    const perType = {};
    typesInFarm.forEach(t => {
      const typeEntries = entries.filter(([, node]) => farmPanelRockNameForNode(node, knownIds, defaultName) === t);
      const readyEntries = typeEntries.filter(([, node]) => farmPanelIsNodeReadyNow(resourceLabel, node, "stone", Date.now()));
      const rolls = buildRollsFn(farmPanelGameState, t, readyEntries.length);
      const activityKey = `${t} Mined`;
      let sequentialSum = 0;
      const perNodeBreakdown = readyEntries.map(([id, node], i) => {
        const rollOrChain = rolls && rolls[i] ? rolls[i] : null;
        const isChain = Array.isArray(rollOrChain);
        const critRolls = isChain ? rollOrChain.length ? rollOrChain[0] : null : rollOrChain;
        const amount = isChain ? rollOrChain.length ? rollOrChain.reduce((sum, roll) => sum + (computeFn(farmPanelGameState, node, t, roll) || 0), 0) : null : critRolls ? computeFn(farmPanelGameState, node, t, critRolls) : null;
        if (typeof amount === "number") sequentialSum += amount;
        return {
          nodeId: id,
          counterUsed: farmActivity ? (farmActivity[activityKey] ?? 0) + i : null,
          critRolls: critRolls,
          chain: isChain ? rollOrChain : null,
          chainLength: isChain ? rollOrChain.length : null,
          amount: amount
        };
      });
      perType[t] = {
        itemId: knownIds[t],
        baseActivityCounter: farmActivity ? farmActivity[activityKey] ?? 0 : null,
        readyNodeCount: readyEntries.length,
        totalNodesOfThisType: typeEntries.length,
        sequentialSumForReadyNodes: readyEntries.length ? Number(sequentialSum.toFixed(4)) : null,
        perReadyNodeBreakdown: perNodeBreakdown
      };
    });
    return {
      present: true,
      totalNodes: entries.length,
      boostFlags: flags,
      perType: perType
    };
  }
  const out = {
    "farmId used for PRNG (farmPanelGetLastInfo().id)": lastInfo.id,
    "farmActivity present on merged state?": !!farmActivity,
    Stone: buildSection("Stone", "stones", STONE_KNOWN_IDS, "Stone Rock", farmPanelBuildSequentialStoneRolls, farmPanelComputeExactStoneYieldForNode, [ "rock_golem", "prospector", "tunnel_mole", "stone_beetle", "skill_rocknroll", "skill_rocky_favor", "skill_ferrous_favor", "emerald_turtle", "tin_turtle", "faction_shield_res", "legendary_shrine_res", "volcano_gnome" ]),
    Iron: buildSection("Iron", "iron", IRON_KNOWN_IDS, "Iron Rock", farmPanelBuildSequentialIronRolls, farmPanelComputeExactIronYieldForNode, [ "rocky_the_mole", "radiant_ray", "iron_idol", "iron_beetle", "skill_iron_bumpkin", "skill_rocky_favor", "skill_ferrous_favor", "emerald_turtle", "faction_shield_res", "volcano_gnome" ]),
    Gold: buildSection("Gold", "gold", GOLD_KNOWN_IDS, "Gold Rock", farmPanelBuildSequentialGoldRollChains, farmPanelComputeExactGoldYieldForNode, [ "gold_rush", "skill_golden_touch", "nugget", "gilded_swordfish", "gold_beetle", "emerald_turtle", "faction_shield_res", "pickaxe_shark", "volcano_gnome" ]),
    "aoe object present on merged state?": !!farmPanelField(g, "aoe"),
    "collectibles present on merged state?": !!farmPanelField(g, "collectibles"),
    "Emerald Turtle position found": farmPanelGetCollectiblePosition(g, "Emerald Turtle"),
    "Tin Turtle position found": farmPanelGetCollectiblePosition(g, "Tin Turtle"),
    "Manually-entered Bud yield boosts (resourceBuds panel)": {
      Stone: farmPanelGetBudYieldForResource("Stone"),
      Iron: farmPanelGetBudYieldForResource("Iron"),
      Gold: farmPanelGetBudYieldForResource("Gold"),
      resourceBudsConfigured: resourceBuds
    }
  };
  box.style.display = "block";
  box.value = JSON.stringify(out, null, 2);
  box.focus();
  box.select();
};

function farmPanelSectionStorageKey(name) {
  return "hl_fpgs__" + name;
}

export function farmPanelSaveGameState(json, isFullSync, syncedFarmId) {
  farmPanelGameState = json || null;
  if (isFullSync) farmPanelStateIsCached = false;
  try {
    if (json && isFullSync) {
      const trackFarmId = String(syncedFarmId || json.id || farmPanelGetLastInfo().id || "");
      if (trackFarmId) {
        dailyHarvestTrack(farmSyncExtractGameState(json), trackFarmId);
        craftedToolsTrack(farmSyncExtractGameState(json), trackFarmId);
        harvestLogArm(trackFarmId);
      }
    }
  } catch (e) {}
  farmPanelHoneySnapshotMs = Date.now();
  const toStore = farmPanelGameState;
  if (__farmPanelSaveGameStateHandle !== null) {
    if (typeof cancelIdleCallback === "function") cancelIdleCallback(__farmPanelSaveGameStateHandle); else clearTimeout(__farmPanelSaveGameStateHandle);
  }
  const write = () => {
    __set___farmPanelSaveGameStateHandle(null);
    farmPanelWriteGameStateSharded(toStore);
  };
  if (typeof requestIdleCallback === "function") __set___farmPanelSaveGameStateHandle(requestIdleCallback(write, {
    timeout: 1500
  })); else __set___farmPanelSaveGameStateHandle(setTimeout(write, 0));
  if (isFullSync) {
    try {
      potionTrackFromState(farmSyncExtractGameState(json));
    } catch (e) {}
    try {
      digStreakTrackFromState(farmSyncExtractGameState(json));
    } catch (e) {}
    try {
      const caveFarmId = String(syncedFarmId || json.id || farmPanelGetLastInfo().id || "");
      if (caveFarmId) caveTrackFromState(farmSyncExtractGameState(json), caveFarmId);
    } catch (e) {}
    try {
      const fishFarmId = String(syncedFarmId || json.id || farmPanelGetLastInfo().id || "");
      if (fishFarmId) fishTrackFromState(farmSyncExtractGameState(json), fishFarmId);
    } catch (e) {}
    window.guroFarmSavedDone = true;
    window.dispatchEvent(new Event("guroFarmSaved"));
  }
}

function farmPanelWriteGameStateSharded(toStore) {
  try {
    if (!toStore || typeof toStore !== "object") {
      localStorage.setItem("hl_farm_panel_gamestate", JSON.stringify(toStore));
      localStorage.removeItem("hl_fpgs_meta");
      return;
    }
    const g = farmSyncExtractGameState(toStore);
    let containerKey = null;
    const hasGame = !!(g && typeof g === "object");
    if (g !== toStore) {
      [ "game", "farm", "gameState", "state" ].some(k => {
        if (toStore[k] === g) {
          containerKey = k;
          return true;
        }
        return false;
      });
    }
    const rootRest = {};
    Object.keys(toStore).forEach(k => {
      const keep = containerKey !== null ? k !== containerKey : !hasGame;
      if (keep) rootRest[k] = toStore[k];
    });
    const writeSection = (name, value) => {
      let serialized;
      try {
        serialized = JSON.stringify(value);
      } catch (e) {
        return;
      }
      if (__gameStateSectionLenSigs[name] === serialized) return;
      try {
        localStorage.setItem(farmPanelSectionStorageKey(name), serialized);
        __gameStateSectionLenSigs[name] = serialized;
      } catch (e) {
        delete __gameStateSectionLenSigs[name];
        try {
          localStorage.removeItem(farmPanelSectionStorageKey(name));
        } catch (e2) {}
      }
    };
    writeSection("__rootRest", rootRest);
    if (hasGame) {
      const gameRest = {};
      Object.keys(g).forEach(k => {
        if (!GAMESTATE_SECTION_KEYS.includes(k)) gameRest[k] = g[k];
      });
      writeSection("__gameRest", gameRest);
      GAMESTATE_SECTION_KEYS.forEach(k => {
        if (Object.prototype.hasOwnProperty.call(g, k)) {
          writeSection(k, g[k]);
        } else if (__gameStateSectionLenSigs[k] !== undefined) {
          delete __gameStateSectionLenSigs[k];
          localStorage.removeItem(farmPanelSectionStorageKey(k));
        }
      });
    }
    localStorage.setItem("hl_fpgs_meta", JSON.stringify({
      containerKey: containerKey,
      hasGame: hasGame
    }));
    localStorage.removeItem("hl_farm_panel_gamestate");
  } catch (e) {}
}

export function farmPanelLoadCachedGameState() {
  if (farmPanelGameState && !farmPanelStateIsCached) return;
  farmPanelHoneySnapshotMs = Date.now();
  try {
    const metaRaw = localStorage.getItem("hl_fpgs_meta");
    if (!metaRaw) {
      const raw = localStorage.getItem("hl_farm_panel_gamestate");
      if (raw) farmPanelGameState = JSON.parse(raw);
      return;
    }
    const meta = JSON.parse(metaRaw);
    const rootRestRaw = localStorage.getItem(farmPanelSectionStorageKey("__rootRest")) || "{}";
    const rootRest = JSON.parse(rootRestRaw);
    __set___gameStateSectionLenSigs({
      __rootRest: rootRestRaw
    });
    let g = null;
    if (meta.hasGame) {
      const gameRestRaw = localStorage.getItem(farmPanelSectionStorageKey("__gameRest")) || "{}";
      g = JSON.parse(gameRestRaw);
      __gameStateSectionLenSigs.__gameRest = gameRestRaw;
      GAMESTATE_SECTION_KEYS.forEach(k => {
        const raw = localStorage.getItem(farmPanelSectionStorageKey(k));
        if (raw !== null) {
          try {
            g[k] = JSON.parse(raw);
            __gameStateSectionLenSigs[k] = raw;
          } catch (e) {}
        }
      });
    }
    if (meta.containerKey && g) {
      const full = Object.assign({}, rootRest);
      full[meta.containerKey] = g;
      farmPanelGameState = full;
    } else if (g) {
      farmPanelGameState = g;
    } else {
      farmPanelGameState = rootRest;
    }
  } catch (e) {
    farmPanelGameState = null;
  } finally {
    farmPanelStateIsCached = !!farmPanelGameState;
  }
}

function farmPanelMergeAnimalFeedBuff(communityHouse, rawHouse) {
  if (!communityHouse || typeof communityHouse !== "object") return rawHouse;
  if (!rawHouse || typeof rawHouse !== "object") return communityHouse;
  const communityAnimals = communityHouse.animals && typeof communityHouse.animals === "object" ? communityHouse.animals : null;
  const rawAnimals = rawHouse.animals && typeof rawHouse.animals === "object" ? rawHouse.animals : null;
  if (!communityAnimals || !rawAnimals) return communityHouse;
  const patchedAnimals = {
    ...communityAnimals
  };
  let touched = false;
  Object.keys(patchedAnimals).forEach(id => {
    const communityAnimal = patchedAnimals[id];
    const rawAnimal = rawAnimals[id];
    if (!communityAnimal || typeof communityAnimal !== "object" || !rawAnimal || typeof rawAnimal !== "object") return;
    const communityHasBuff = communityAnimal.feedBuff && typeof communityAnimal.feedBuff === "object" && communityAnimal.feedBuff.name;
    const rawHasBuff = rawAnimal.feedBuff && typeof rawAnimal.feedBuff === "object" && rawAnimal.feedBuff.name;
    if (!communityHasBuff && rawHasBuff) {
      patchedAnimals[id] = {
        ...communityAnimal,
        feedBuff: rawAnimal.feedBuff
      };
      touched = true;
    }
  });
  if (!touched) return communityHouse;
  return {
    ...communityHouse,
    animals: patchedAnimals
  };
}

export function farmPanelMergeAuthoritativeResourceData(rawJson, communitySourceState, communityOk) {
  const rawG = farmSyncExtractGameState(rawJson);
  if (!communityOk) {
    return rawJson;
  }
  const communityG = farmSyncExtractGameState(communitySourceState);
  if (!rawG || typeof rawG !== "object" || rawG === communitySourceState) {
    return communitySourceState;
  }
  const merged = communityG && typeof communityG === "object" ? {
    ...communityG
  } : {};
  [ "trees", "stones", "iron", "gold", "crimstones", "farmActivity", "collectibles", "buildings", "home", "aoe", "crops", "fruitPatches", "greenhouse" ].forEach(key => {
    if (rawG[key] != null) merged[key] = rawG[key];
  });
  [ "henHouse", "barn" ].forEach(key => {
    const rawHouse = farmPanelField(rawG, key);
    if (rawHouse != null) merged[key] = farmPanelMergeAnimalFeedBuff(farmPanelField(merged, key), rawHouse);
  });
  return merged;
}

setTimeout(() => {
  const {id: savedFarmId} = farmPanelGetLastInfo();
  if (savedFarmId) {
    const idInput = document.getElementById("farmPanelIdInput");
    if (idInput) idInput.value = savedFarmId;
    const savedScreen = document.getElementById("appLoadingScreen");
    if (savedScreen) savedScreen.remove();
    window.dispatchEvent(new Event("goblinAppReady"));
  } else {
    const screen = document.getElementById("appLoadingScreen");
    const input = document.getElementById("farmIdPromptInput");
    const openBtn = document.getElementById("farmIdPromptOpenBtn");
    if (screen) screen.classList.add("show-prompt");
    if (input) setTimeout(() => input.focus(), 50);
    function handleOpen() {
      const farmId = (input && input.value || "").trim();
      if (!farmId) {
        if (input) input.focus();
        return;
      }
      if (screen) screen.classList.remove("show-prompt");
      farmIdPromptStartSync(farmId);
    }
    if (openBtn) openBtn.addEventListener("click", handleOpen);
    if (input) input.addEventListener("keydown", e => {
      if (e.key === "Enter") handleOpen();
    });
  }
}, 0);

setTimeout(() => {
  try {
    if (typeof farmPanelLoadCachedGameState === "function") {
      farmPanelLoadCachedGameState();
      if (typeof farmPanelGameState !== "undefined" && farmPanelGameState) {
        syncCookingCountsFromInventory(farmPanelGameState);
      }
    }
  } catch (e) {}
}, 0);

document.addEventListener("click", e => {
  const target = e.target.closest("#farmPanelProfileBtn, #profileOverlay button, #profileOverlay .profile-tradable-row-editable");
  if (!target) return;
  target.classList.remove("btn-pop-click");
  void target.offsetWidth;
  target.classList.add("btn-pop-click");
});

export function __set_farmPanelInProgressCategoryFilter(v) {
  return farmPanelInProgressCategoryFilter = v;
}

export function __set_farmPanelTabContentDirty(v) {
  return farmPanelTabContentDirty = v;
}

export function __set_farmPanelRenderAtMs(v) {
  return farmPanelRenderAtMs = v;
}

export function __set_farmPanelActiveTab(v) {
  return farmPanelActiveTab = v;
}

export function __set_farmPanelSyncInFlight(v) {
  return farmPanelSyncInFlight = v;
}