import * as calc from "./calculator.js";
import * as prices from "./prices.js";
import * as ui from "./ui.js";
import { loadPetResourcesIfNeeded, savePetFoodChecks } from "./storage.js";

const STORE_KEY = "guro_rc_pets_v1";

const MAX_LEVEL = calc.PET_MAX_LEVEL;

const MAX_DAYS = 100000;

const DIFFS = [ "easy", "medium", "hard" ];

const DIFF_LABELS = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard"
};

const QUICK_TARGETS = [ 10, 20, 30, 60, 100, 150, 200 ];

const GUIDE_LEVELS = [ 2, 5, 10, 20, 30, 40, 50, 60, 75, 85, 100, 150, 200, 250, 300 ];

const AURA_SHORT = {
  "No Aura": "None",
  "Common Aura": "Common",
  "Rare Aura": "Rare",
  "Mythic Aura": "Mythic"
};

const BIB_SHORT = {
  "No Bib": "None",
  Collar: "Collar",
  "Gold Necklace": "Gold Necklace"
};

let host = null;
let state = null;
let popup = null;
let overlayEl = null;
let promptEl = null;
let restoreFns = [];
let listening = false;
let guideOpen = false;
let detailsOpen = false;

function esc(s) {
  return calc.escapeHtml(String(s));
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

function flowerHtml(n) {
  return `${fl(n)}${calc.FLOWER_ICON}`;
}

function flowerSigned(n) {
  return `${signed(n, fl)}${calc.FLOWER_ICON}`;
}

function profitHtml(n) {
  return `<span class="${n >= 0 ? "is-profit" : "is-loss"}">${flowerSigned(n)}</span>`;
}

function clampInt(v, min, max) {
  const n = Math.floor(Number(v));
  if (!isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function kv(label, html, cls) {
  return `<div class="rc-kv${cls ? " " + cls : ""}"><span class="rc-kv-label">${label}</span><span class="rc-kv-val">${html}</span></div>`;
}

function valueBoxHtml(label, html, extra, subHtml) {
  return `<div class="rc-val guro-frame${extra ? " " + extra : ""}"><span class="rc-val-label">${label}</span><span class="rc-val-num">${html}</span>${subHtml || ""}</div>`;
}

function activeMeals() {
  const list = DIFFS.filter(d => state.meals[d]);
  return list.length ? list : DIFFS;
}

function defaultState() {
  return {
    mode: "custom",
    meals: {
      easy: true,
      medium: true,
      hard: true
    },
    foodTab: "easy",
    custom: {
      isNFT: false,
      type: calc.PET_COMMON_TYPES[0],
      aura: "No Aura",
      bib: "No Bib",
      from: 1,
      to: 60,
      xp: 0
    },
    targets: {}
  };
}

function loadState() {
  const base = defaultState();
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (raw && typeof raw === "object") {
      if (raw.mode === "farm") base.mode = "farm";
      if (DIFFS.includes(raw.foodTab)) base.foodTab = raw.foodTab;
      if (raw.meals && typeof raw.meals === "object") {
        const m = {};
        DIFFS.forEach(d => {
          m[d] = raw.meals[d] !== false;
        });
        if (DIFFS.some(d => m[d])) base.meals = m;
      }
      const c = raw.custom;
      if (c && typeof c === "object") {
        base.custom.isNFT = c.isNFT === true;
        const list = base.custom.isNFT ? calc.PET_NFT_TYPES : calc.PET_COMMON_TYPES;
        base.custom.type = list.includes(c.type) ? c.type : list[0];
        base.custom.aura = calc.PET_AURA_TRAITS.includes(c.aura) ? c.aura : "No Aura";
        base.custom.bib = calc.PET_BIB_TRAITS.includes(c.bib) ? c.bib : "No Bib";
        base.custom.from = clampInt(c.from, 1, MAX_LEVEL - 1);
        base.custom.to = clampInt(c.to, 2, MAX_LEVEL);
        base.custom.xp = Math.max(0, Number(c.xp) || 0);
      }
      if (raw.targets && typeof raw.targets === "object") {
        Object.keys(raw.targets).forEach(k => {
          const v = clampInt(raw.targets[k], 2, MAX_LEVEL);
          if (isFinite(v)) base.targets[k] = v;
        });
      }
    }
  } catch (e) {}
  return base;
}

function saveState() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) {}
}

function petIcon(pet) {
  return ui.getPetIcon({
    name: pet.iconName || pet.name,
    petType: pet.petType
  });
}

function typeIcon(type, isNFT) {
  return ui.getPetIcon({
    name: isNFT ? "NFT Pet #" : (calc.PET_NAMES_BY_TYPE[type] || [ type ])[0],
    petType: type
  });
}

function resIcon(name) {
  return ui.getPetResourceIcon(name);
}

function fetchList(petType) {
  return calc.petFetchConfig(petType).slice().sort((a, b) => a.level - b.level);
}

function petBowlsXp() {
  return calc.isBoostActive("pet_bowls") ? 10 : 0;
}

function foodCosts() {
  const free = calc.petBoostActiveWithField("petFreeFeed");
  const out = {
    free: free
  };
  DIFFS.forEach(d => {
    out[d] = free ? 0 : calc.coinsToFlower(prices.petAvgFoodCostForDifficulty(d));
  });
  return out;
}

function simulate(pet, startXp, targetLevel) {
  const costs = foodCosts();
  const feeFrac = (calc.feePercent || 0) / 100;
  const targetXp = calc.petXpForLevel(targetLevel);
  const startLevel = calc.petLevelFromXp(startXp);
  const fetches = fetchList(pet.petType);
  const acc = {};
  const log = {};
  const houndOn = calc.isBoostActive("hound_shrine_pet");
  const houndSec = houndOn ? calc.getLimitedBoostRemainingSec("Hound Shrine") : 0;
  const houndDays = houndOn ? houndSec > 0 ? houndSec / 86400 : 7 : 0;
  const houndBoost = calc.BOOSTS.find(b => b.id === "hound_shrine_pet");
  const shrineDaily = houndOn && houndBoost ? prices.getActiveShrineDailyCostStable([ houndBoost ]).total : 0;
  const out = {
    pet: pet,
    startXp: startXp,
    startLevel: startLevel,
    targetLevel: targetLevel,
    targetXp: targetXp,
    xpNeeded: Math.max(0, targetXp - startXp),
    reachedLevel: startLevel,
    days: 0,
    feeds: {
      easy: 0,
      medium: 0,
      hard: 0,
      total: 0
    },
    cost: 0,
    foodCost: 0,
    shrineCost: 0,
    shrineDaily: shrineDaily,
    energy: 0,
    costs: costs,
    capped: false,
    done: startXp >= targetXp,
    resources: [],
    milestones: []
  };
  if (out.done) return out;
  let xp = startXp;
  let level = startLevel;
  let day = 0;
  let stalled = false;
  while (xp < targetXp && day < MAX_DAYS && !stalled) {
    day++;
    let gainedToday = 0;
    const plannedToday = activeMeals().reduce((n, d) => n + calc.petFeedCounts({
      isNFT: pet.isNFT,
      level: level
    })[d], 0);
    const shrineToday = shrineDaily * Math.max(0, Math.min(1, houndDays - (day - 1)));
    const shrineFeed = plannedToday > 0 ? shrineToday / plannedToday : 0;
    const meals = activeMeals();
    for (let di = 0; di < meals.length && xp < targetXp; di++) {
      const d = meals[di];
      const count = calc.petFeedCounts({
        isNFT: pet.isNFT,
        level: level
      })[d];
      for (let i = 0; i < count && xp < targetXp; i++) {
        const p = {
          level: level,
          isNFT: pet.isNFT,
          aura: pet.aura,
          bib: pet.bib,
          petType: pet.petType
        };
        const gain = calc.petXpPerFeed(p, d) - (houndOn && day - 1 >= houndDays ? calc.petBoostSum("petXpAdd") - petBowlsXp() : 0);
        const energy = calc.petEnergyPerFeed(p, d);
        const food = costs[d];
        const cost = food + shrineFeed;
        xp += gain;
        gainedToday += gain;
        out.feeds[d]++;
        out.feeds.total++;
        out.cost += cost;
        out.foodCost += food;
        out.shrineCost += shrineFeed;
        out.energy += energy;
        fetches.forEach(f => {
          if (level < f.level) return;
          const ec = calc.PET_RESOURCE_ENERGY[f.name] || 200;
          let a = acc[f.name];
          if (!a) {
            a = acc[f.name] = {
              name: f.name,
              unlockLevel: f.level,
              energyCost: ec,
              energy: 0,
              fetches: 0,
              yield: 0,
              cost: 0
            };
          }
          a.energy += energy;
          a.cost += cost;
          a.pool = (a.pool || 0) + energy;
          while (a.pool >= ec) {
            a.pool -= ec;
            a.fetches++;
            a.yield += calc.petFetchYieldPerFetch(p, f.name);
          }
        });
        while (calc.petXpForLevel(level + 1) <= xp) {
          level++;
          log[level] = {
            level: level,
            day: day,
            xp: calc.petXpForLevel(level),
            cost: out.cost,
            feeds: out.feeds.total
          };
        }
      }
    }
    if (gainedToday <= 0) stalled = true;
  }
  out.blocked = out.feeds.total === 0;
  out.days = out.blocked ? 0 : day;
  out.reachedLevel = level;
  out.capped = xp < targetXp;
  out.resources = fetches.filter(f => acc[f.name]).map(f => {
    const a = acc[f.name];
    const tradable = !calc.PET_NOT_TRADABLE.has(a.name);
    const market = tradable ? prices.getPetResourceMarket(a.name) : 0;
    const gross = a.yield * market;
    const tax = gross * feeFrac;
    const costPerUnit = a.yield > 0 ? a.cost / a.yield : 0;
    return Object.assign({}, a, {
      tradable: tradable,
      market: market,
      gross: gross,
      tax: tax,
      costPerUnit: costPerUnit,
      profitPerUnit: tradable ? market * (1 - feeFrac) - costPerUnit : -costPerUnit,
      net: tradable ? gross - tax - a.cost : -a.cost
    });
  });
  out.milestones = calc.PET_LEVEL_PERKS.filter(perk => calc.petPerkApplies(pet, perk) && perk.level > startLevel && perk.level <= level && log[perk.level]).map(perk => Object.assign({
    perk: perk
  }, log[perk.level]));
  return out;
}

function bestResource(res) {
  const rows = res.resources.filter(r => r.tradable);
  return rows.reduce((b, r) => !b || r.net > b.net ? r : b, null);
}

function customSubject() {
  const c = state.custom;
  const from = clampInt(c.from, 1, MAX_LEVEL - 1);
  const base = calc.petXpForLevel(from);
  const gap = calc.petXpForLevel(from + 1) - base;
  const extra = Math.min(Math.max(0, c.xp), Math.max(0, gap - 1));
  const pet = {
    id: "custom",
    isNFT: c.isNFT,
    petType: c.type,
    name: c.isNFT ? "NFT " + c.type : c.type,
    iconName: c.isNFT ? "NFT Pet #" : (calc.PET_NAMES_BY_TYPE[c.type] || [ c.type ])[0],
    level: from,
    aura: c.isNFT ? c.aura : "No Aura",
    bib: c.isNFT ? c.bib : "No Bib"
  };
  return {
    id: "custom",
    pet: pet,
    startXp: base + extra,
    target: clampInt(c.to, 2, MAX_LEVEL)
  };
}

function nextPerkLevel(pet) {
  const next = calc.PET_LEVEL_PERKS.filter(p => calc.petPerkApplies(pet, p) && p.level > pet.level).map(p => p.level);
  return next.length ? next[0] : Math.min(MAX_LEVEL, pet.level + 10);
}

function farmPets() {
  return calc.petsData.filter(p => p && p.petType && isFinite(Number(p.level)));
}

function farmSubject(p) {
  const level = clampInt(p.level, 1, MAX_LEVEL);
  const exp = Number(p.experience);
  const startXp = isFinite(exp) && exp > 0 && calc.petLevelFromXp(exp) === level ? exp : calc.petXpForLevel(level);
  const pet = Object.assign({}, p, {
    level: level,
    aura: p.isNFT ? p.aura : "No Aura",
    bib: p.isNFT ? p.bib : "No Bib"
  });
  const saved = state.targets[p.id];
  return {
    id: p.id,
    pet: pet,
    startXp: startXp,
    target: saved ? clampInt(saved, 2, MAX_LEVEL) : nextPerkLevel(pet)
  };
}

function run(subject) {
  const res = simulate(subject.pet, subject.startXp, subject.target);
  res.id = subject.id;
  res.best = bestResource(res);
  return res;
}

function farmRuns() {
  prices.invalidateCostCache();
  return farmPets().map(p => run(farmSubject(p)));
}

function customRun() {
  prices.invalidateCostCache();
  return run(customSubject());
}

function findSubjectRun(id) {
  prices.invalidateCostCache();
  if (id === "custom") return run(customSubject());
  const p = farmPets().find(x => x.id === id);
  return p ? run(farmSubject(p)) : null;
}

function mealsCardHtml() {
  const box = d => `<label class="pc-meal"><span>${DIFF_LABELS[d]}</span><input type="checkbox" data-pc-meal="${d}"${state.meals[d] ? " checked" : ""} aria-label="Feed ${DIFF_LABELS[d]} meals"></label>`;
  return `<div class="pc-meals guro-frame" role="group" aria-label="Fed pet with"><span class="pc-meals-label">Fed Pet With</span><div class="pc-meals-row">${DIFFS.map(box).join("")}</div></div>`;
}

function modeToggleHtml() {
  const btn = (key, label) => `<button type="button" class="rc-mode guro-frame${state.mode === key ? " is-on" : ""}" data-pc-mode="${key}" aria-pressed="${state.mode === key ? "true" : "false"}">${label}</button>`;
  return `<div class="rc-modes" role="group" aria-label="Pet source">${btn("custom", "Custom Pet")}${btn("farm", "Farm Pets")}</div>`;
}

function tbtn(attr, value, label, on) {
  return `<button type="button" class="es-mode-btn es-toolcfg-tbtn${on ? " active" : ""}" ${attr}="${esc(value)}">${label}</button>`;
}

function typeCellsHtml() {
  const c = state.custom;
  const list = c.isNFT ? calc.PET_NFT_TYPES : calc.PET_COMMON_TYPES;
  return list.map(t => {
    const on = c.type === t;
    return `<label class="rc-crop guro-frame${on ? " is-on" : ""}"><span class="rc-crop-icon">${typeIcon(t, c.isNFT)}</span><span class="rc-crop-name">${esc(t)}</span><input type="checkbox" data-pc-type="${esc(t)}"${on ? " checked" : ""} aria-label="${esc(t)}"></label>`;
  }).join("");
}

function traitRowsHtml() {
  const c = state.custom;
  if (!c.isNFT) return "";
  const aura = calc.PET_AURA_TRAITS.map(a => tbtn("data-pc-aura", a, AURA_SHORT[a] || a, c.aura === a)).join("");
  const bib = calc.PET_BIB_TRAITS.map(b => tbtn("data-pc-bib", b, BIB_SHORT[b] || b, c.bib === b)).join("");
  return `<div class="rc-tool-cfg"><div class="rc-tool-mat"><span class="rc-tool-mat-item"><span class="rc-tool-mat-name">Aura</span></span><span class="es-toolcfg-tog">${aura}</span></div><div class="rc-boost-none">${esc(calc.petAuraInfoText(c.aura))}</div><div class="rc-tool-mat"><span class="rc-tool-mat-item"><span class="rc-tool-mat-name">Bib</span></span><span class="es-toolcfg-tog">${bib}</span></div><div class="rc-boost-none">${esc(calc.petBibInfoText(c.bib))}</div></div>`;
}

function typeInfoHtml() {
  const c = state.custom;
  const cat = calc.PET_CATEGORIES[c.type] || {};
  const cats = [ cat.primary, cat.secondary, cat.tertiary ].filter(Boolean).map(n => `${calc.PET_CATEGORY_ICON[n] || ""} ${esc(n)}`).join(" · ");
  const fetches = fetchList(c.type).map(f => `${resIcon(f.name)} ${esc(f.name)} <span class="rc-kv-sub">Lv${f.level}</span>`).join("<br>");
  return `<div class="rc-note">${esc(c.type)} · ${cats}<br>${fetches}</div>`;
}

function levelFieldsHtml() {
  const c = state.custom;
  const row = (label, hint, key, value, min, max, placeholder) => `<label class="rc-node-row guro-frame"><span class="rc-node-text"><span class="rc-node-name">${label}</span><span class="rc-node-used">${hint}</span></span><input type="number" min="${min}" max="${max}" step="1" inputmode="numeric" data-pc-in="${key}" value="${value}" placeholder="${placeholder}"></label>`;
  const chips = QUICK_TARGETS.map(l => tbtn("data-pc-chip", l, "Lv" + l, c.to === l)).join("");
  return `${row("Current Level", `1 to ${MAX_LEVEL - 1}`, "from", c.from, 1, MAX_LEVEL - 1, "1")}${row("Extra XP In This Level", "Optional, XP already earned", "xp", c.xp ? c.xp : "", 0, "", "0")}${row("Target Level", `2 to ${MAX_LEVEL}`, "to", c.to, 2, MAX_LEVEL, "60")}<div class="pc-chips" role="group" aria-label="Quick target level"><span class="es-toolcfg-tog">${chips}</span></div>`;
}

function customBuilderHtml() {
  const c = state.custom;
  const kind = `<div class="rc-tool-mat"><span class="rc-tool-mat-item"><span class="rc-tool-mat-name">Pet Kind</span></span><span class="es-toolcfg-tog">${tbtn("data-pc-kind", "common", "Common", !c.isNFT)}${tbtn("data-pc-kind", "nft", "NFT", c.isNFT)}</span></div>`;
  return `<div class="rc-tool-cfg">${kind}</div><div class="rc-crops" id="pcTypes">${typeCellsHtml()}</div><div id="pcTypeInfo">${typeInfoHtml()}</div><div id="pcTraits">${traitRowsHtml()}</div><div id="pcLevels">${levelFieldsHtml()}</div>`;
}

function farmRowHtml(run) {
  const pet = run.pet;
  const badge = pet.isNFT ? "NFT" : "Common";
  const xpInLevel = run.startXp - calc.petXpForLevel(run.startLevel);
  const gap = calc.petXpForLevel(run.startLevel + 1) - calc.petXpForLevel(run.startLevel);
  return `<article class="pc-pet guro-frame" data-pc-row="${esc(pet.id)}">
    <div class="pc-pet-head"><span class="rc-comp-icon">${petIcon(pet)}</span><span class="pc-pet-title"><span class="rc-comp-name">${esc(pet.name)}</span><span class="rc-kv-sub">${esc(pet.petType)} · ${badge} · Lv${run.startLevel} · ${n2(xpInLevel)}/${n2(gap)} XP</span></span></div>
    <label class="rc-sick-row"><span class="rc-tool-mat-name">Target Level</span><input type="number" min="${run.startLevel + 1}" max="${MAX_LEVEL}" step="1" inputmode="numeric" class="rc-sick-input guro-frame" data-pc-target="${esc(pet.id)}" value="${run.targetLevel}" aria-label="Target level for ${esc(pet.name)}"></label>
    <div class="pc-pet-sum" data-pc-sum="${esc(pet.id)}">${farmRowSumHtml(run)}</div>
  </article>`;
}

function energyPerDayHtml(run) {
  const a = dailyEnergyAt(run.pet, run.startLevel);
  const b = dailyEnergyAt(run.pet, Math.max(run.reachedLevel, run.startLevel));
  return a === b ? `${n2(a)}⚡` : `${n2(a)}⚡ → ${n2(b)}⚡ <span class="rc-kv-sub">at Lv${Math.max(run.reachedLevel, run.startLevel)}</span>`;
}

function farmPerkCountHtml(run) {
  const list = calc.PET_LEVEL_PERKS.filter(perk => calc.petPerkApplies(run.pet, perk));
  const done = list.filter(perk => perk.level <= run.startLevel).length;
  return `${done} of ${list.length}`;
}

function farmNextPerkHtml(run) {
  const next = calc.PET_LEVEL_PERKS.find(perk => calc.petPerkApplies(run.pet, perk) && perk.level > run.startLevel);
  return next ? `Lv${next.level} · ${perkLabel(next)}` : "All perks unlocked";
}

function blockedText(res) {
  const names = activeMeals().map(d => DIFF_LABELS[d]).join(", ");
  return `This pet can't be fed ${esc(names)} meals at Lv${res.startLevel}. Common pets get Hard meals from level 10. Tick another meal in Fed Pet With.`;
}

function farmRowSumHtml(run) {
  if (run.blocked) return `<div class="rc-note is-warn">${blockedText(run)}</div>`;
  if (run.done) return `<div class="rc-note">This pet is already at or above the target level.</div>`;
  const best = run.best;
  return `<div class="rc-kv-grid">
    ${kv("XP Needed", `${n2(run.xpNeeded)} XP`)}
    ${kv("Days", n2(run.days))}
    ${kv("Energy / Day", energyPerDayHtml(run), "rc-kv-wide")}
    ${kv("Perks", `${farmPerkCountHtml(run)} unlocked<br><span class="rc-kv-sub">Next: ${farmNextPerkHtml(run)}</span>`, "rc-kv-wide")}
    ${kv("Feeds", n2(run.feeds.total))}
    ${kv("Food Cost", flowerHtml(run.foodCost))}
    ${kv("Shrine Cost", flowerHtml(run.shrineCost))}
    ${kv("Total Cost", flowerHtml(run.cost))}
    ${kv("Best Resource", best ? `${resIcon(best.name)} ${esc(best.name)}` : "—")}
    ${kv("Best Net", best ? profitHtml(best.net) : "—")}
  </div>
  <div class="rc-details-row"><button type="button" class="rc-linktext" data-rc-open="pet:${esc(run.pet.id)}">Computation</button></div>`;
}

function farmListHtml() {
  const runs = farmRuns();
  if (!runs.length) return `<div class="rc-empty">No farm pets found yet. Sync your farm first and your Common and NFT pets will show up here with their real level and XP.</div>`;
  const nft = runs.filter(r => r.pet.isNFT).length;
  const seen = {};
  const dup = [];
  runs.filter(r => r.pet.isNFT).forEach(r => {
    const t = r.pet.petType;
    if (seen[t] && !dup.includes(t)) dup.push(t);
    seen[t] = true;
  });
  const dupNote = dup.length ? `<div class="rc-note is-warn">You have more than one NFT ${esc(dup.join(", "))}. The game lets only one NFT pet of the same type be fed each day, so those pets take turns and their days are longer than shown.</div>` : "";
  return `${dupNote}<div class="rc-note">${runs.length} pets on this farm (${runs.length - nft} Common, ${nft} NFT). Set a target level for each pet to see its XP, days and food cost.</div>${runs.map(farmRowHtml).join("")}`;
}

function pickerHtml() {
  const body = state.mode === "custom" ? customBuilderHtml() : farmListHtml();
  return `<section class="rc-block guro-frame" aria-label="Pet Calculator">
    <div class="rc-block-title">Pet Calculator</div>
    ${modeToggleHtml()}
    ${mealsCardHtml()}
    <div id="pcPickerBody">${body}</div>
  </section>`;
}

function guideHtml() {
  const perks = {};
  calc.PET_LEVEL_PERKS.forEach(p => {
    (perks[p.level] = perks[p.level] || []).push(p);
  });
  const levels = Array.from(new Set(GUIDE_LEVELS.concat(Object.keys(perks).map(Number)))).filter(l => l <= MAX_LEVEL).sort((a, b) => a - b);
  const rows = levels.map(l => {
    const list = (perks[l] || []).map(p => `${esc(p.label)}${p.nftOnly ? " (NFT)" : p.commonOnly ? " (Common)" : ""}`).join("<br>") || "—";
    return `<div class="pc-trow" style="--pc-cols:44px 1fr 1.6fr"><span>${l}</span><span>${n2(calc.petXpForLevel(l))}</span><span>${list}</span></div>`;
  }).join("");
  return `<div class="pc-table"><div class="pc-trow pc-thead" style="--pc-cols:44px 1fr 1.6fr"><span>Level</span><span>Total XP</span><span>Perk</span></div>${rows}</div><div class="rc-note">XP to reach level N is 50 × (N − 1) × N. Going from level N to N+1 costs ${n2(100)} × N XP.</div>`;
}

function infoNoteHtml() {
  return `<div class="rc-note">Every day the pet is fed its requests (Easy, Medium and Hard) and the Energy it earns is spent on fetches. Common pets get a Hard request from level 10. NFT pets get a second Medium request from level 30 and a second Hard request from level 200. XP and Energy per feed use the game formulas and the level is re-checked after every feed. Fetches are whole fetches: each one needs the full Energy cost and gives the exact yield for your level, as in the game. Leftover energy (for example 50 of 450 after two 200 fetches) stays on the pet and is used later, so nothing is wasted over time. Hound Shrine only counts for its 7 days, and while it is ticked in Boost its cost (50 Acorn, priced from your Acorn cost and Shrine cost mode) is added to the total. Cost / Unit in a level path is the food (and shrine) cost spent while the resource was unlocked divided by the units fetched, so a higher yield per fetch lowers it. In the farm table it is a pet's daily cost divided by its daily yield of that resource if all its energy went to it, averaged over your pets. Fed Pet With only changes this calculator: unticked meals are not fed, so they give no XP, Energy or cost. Food cost is the average of the foods ticked in Foods, because the game picks each day's food at random, so real cost will vary around it. A resource only counts the food spent after it unlocks. Petting and cheer XP from visitors is not counted. Feeding every day is assumed: a pet left unfed for more than 3 days (Common) or 7 days (NFT) is neglected, and a pet must be petted before it can be fed.</div>`;
}

function resourceTileHtml(r) {
  const good = r.net >= 0;
  return `<div class="rc-tile rc-tile-animal guro-frame ${good ? "is-profit" : "is-loss"}" data-pc-tile="${esc(r.name)}"><span class="rc-tile-icon">${resIcon(r.name)}</span><span class="rc-tile-prods"><span class="rc-tile-prod"><span class="rc-tile-pq">×${n2(r.yield)}</span><span class="rc-tile-pn">${esc(r.name)}</span><span class="rc-tile-pv">${flowerSigned(r.net)}</span></span></span></div>`;
}

function splitRowsHtml(res) {
  if (!res.resources.length) return "";
  return `<span class="rc-val-split">${res.resources.map(r => `<span class="rc-val-split-row"><span class="rc-val-split-name">${resIcon(r.name)}<span>${esc(r.name)}</span></span><span class="rc-val-split-num ${r.net >= 0 ? "is-profit" : "is-loss"}">${flowerSigned(r.net)}</span></span>`).join("")}</span>`;
}

function customResultsHtml() {
  const res = customRun();
  if (res.done) return `<div class="rc-empty">The target level must be higher than the current level.</div>`;
  if (res.blocked) return `<div class="rc-note is-warn">${blockedText(res)}</div>`;
  const tiles = res.resources.length ? `<div class="rc-tiles-wrap guro-frame"><div class="rc-tiles rc-tiles-animals">${res.resources.map(resourceTileHtml).join("")}</div></div>` : "";
  const capNote = res.capped ? `<div class="rc-note is-warn">The simulation stopped at ${n2(MAX_DAYS)} days before reaching the target.</div>` : "";
  const free = res.costs.free ? `<div class="rc-note">Paw Aura is on, so feeding is free.</div>` : "";
  const noFood = !res.costs.free && res.foodCost <= 0 ? `<div class="rc-note is-warn">Food cost is 0. Tick at least one food in Foods, or check your ingredient prices.</div>` : "";
  const costPerK = res.xpNeeded > 0 ? res.cost / res.xpNeeded * 1e3 : 0;
  return `${capNote}${free}${noFood}${tiles}${yieldTableHtml(res)}
  <div class="rc-values">
    ${valueBoxHtml("XP Needed", `${n2(res.xpNeeded)} XP`, "", `<span class="rc-kv-sub">Lv${res.startLevel} → Lv${res.targetLevel}</span>`)}
    ${valueBoxHtml("Days", n2(res.days), "", `<span class="rc-kv-sub">${n2(res.days / 30)} months</span>`)}
    ${valueBoxHtml("Total Feeds", n2(res.feeds.total), "", `<span class="rc-kv-sub">E ${n2(res.feeds.easy)} · M ${n2(res.feeds.medium)} · H ${n2(res.feeds.hard)}</span>`)}
    ${valueBoxHtml("Energy Earned", `${n2(res.energy)}⚡`)}
    ${valueBoxHtml("Food Cost", flowerHtml(res.foodCost))}
    ${valueBoxHtml("Shrine Cost", flowerHtml(res.shrineCost))}
    ${valueBoxHtml("Total Cost", flowerHtml(res.cost))}
    ${valueBoxHtml("Cost / 1,000 XP", flowerHtml(costPerK))}
  </div>
  <div class="rc-net-row">
    ${valueBoxHtml("Best Resource Net", res.best ? `<span class="${res.best.net >= 0 ? "is-profit" : "is-loss"}">${flowerSigned(res.best.net)}</span>` : "—", "rc-val-net", splitRowsHtml(res))}
    <button type="button" class="rc-linktext" data-rc-open="custom">Computation</button>
  </div>`;
}

function farmTotalsHtml() {
  const runs = farmRuns();
  if (!runs.length) return "";
  const live = runs.filter(r => !r.done && !r.blocked);
  const sum = key => live.reduce((s, r) => s + r[key], 0);
  const feeds = live.reduce((s, r) => s + r.feeds.total, 0);
  const days = live.reduce((m, r) => Math.max(m, r.days), 0);
  const net = live.reduce((s, r) => s + (r.best ? r.best.net : -r.cost), 0);
  const split = live.length ? `<span class="rc-val-split">${live.map(r => `<span class="rc-val-split-row"><span class="rc-val-split-name">${petIcon(r.pet)}<span>${esc(r.pet.name)}</span></span><span class="rc-val-split-num ${(r.best ? r.best.net : -r.cost) >= 0 ? "is-profit" : "is-loss"}">${flowerSigned(r.best ? r.best.net : -r.cost)}</span></span>`).join("")}</span>` : "";
  return `<div class="rc-values">
    ${valueBoxHtml("Pets To Level", n2(live.length), "", `<span class="rc-kv-sub">of ${n2(runs.length)}</span>`)}
    ${valueBoxHtml("XP Needed", `${n2(sum("xpNeeded"))} XP`)}
    ${valueBoxHtml("Longest Wait", `${n2(days)} days`)}
    ${valueBoxHtml("Total Feeds", n2(feeds))}
    ${valueBoxHtml("Energy Earned", `${n2(sum("energy"))}⚡`)}
    ${valueBoxHtml("Food Cost", flowerHtml(sum("foodCost")))}
    ${valueBoxHtml("Shrine Cost", flowerHtml(sum("shrineCost")))}
    ${valueBoxHtml("Total Cost", flowerHtml(sum("cost")))}
  </div>
  <div class="rc-net-row">${valueBoxHtml("Net (Best Resource Per Pet)", `<span class="${net >= 0 ? "is-profit" : "is-loss"}">${flowerSigned(net)}</span>`, "rc-val-net", split)}</div>`;
}

function farmCostTableHtml() {
  const pets = farmPets();
  if (!pets.length) return "";
  prices.invalidateCostCache();
  const feeFrac = (calc.feePercent || 0) / 100;
  const counts = {};
  const daily = {};
  pets.forEach(p => {
    const card = calc.petComputeCardCached(p);
    card.rows.forEach(r => {
      if (!(r.totalYield > 0)) return;
      counts[r.name] = (counts[r.name] || 0) + 1;
      daily[r.name] = (daily[r.name] || 0) + r.totalYield;
    });
  });
  const names = calc.PET_COST_TRACK_RESOURCES.filter(n => counts[n]);
  if (!names.length) return "";
  const allMeals = activeMeals().length === DIFFS.length;
  const mealCosts = foodCosts();
  const localCost = name => {
    let total = 0;
    let n = 0;
    pets.forEach(p => {
      const pet = Object.assign({}, p, {
        aura: p.isNFT ? p.aura : "No Aura",
        bib: p.isNFT ? p.bib : "No Bib"
      });
      const level = clampInt(pet.level, 1, MAX_LEVEL);
      const f = fetchList(pet.petType).find(x => x.name === name && x.level <= level);
      if (!f) return;
      const counts2 = calc.petFeedCounts(petAt(pet, level));
      const food = activeMeals().reduce((sum, d) => sum + mealCosts[d] * counts2[d], 0);
      const ec = calc.PET_RESOURCE_ENERGY[name] || 200;
      const units = dailyEnergyAt(pet, level) / ec * calc.petFetchYieldPerFetch(petAt(pet, level), name);
      if (units > 0) {
        total += food / units;
        n++;
      }
    });
    return n ? total / n : 0;
  };
  const cols = "1.5fr .55fr 1fr 1fr 1fr";
  const rows = names.map(name => {
    const tradable = !calc.PET_NOT_TRADABLE.has(name);
    const market = tradable ? prices.getPetResourceMarket(name) : 0;
    const custom = Object.prototype.hasOwnProperty.call(prices.petResourceCostOverride, name);
    const cost = allMeals || custom ? prices.petResourceCostPerUnit(name) : localCost(name);
    const profit = tradable ? market * (1 - feeFrac) - cost : -cost;
    return `<div class="pc-trow" style="--pc-cols:${cols}"><span class="ct-tcell">${resIcon(name)}<span>${esc(name)}</span></span><span>${counts[name]}</span><span>${flowerHtml(cost)}${custom ? " ✏️" : ""}</span><span>${tradable ? flowerHtml(market) : "—"}</span><span class="${profit >= 0 ? "is-profit" : "is-loss"}">${flowerSigned(profit)}</span></div>`;
  }).join("");
  return `<div class="rc-group"><div class="rc-comp-sub">Pet Resource Cost (Your Farm)</div><div class="pc-table"><div class="pc-trow pc-thead" style="--pc-cols:${cols}"><span>Resource</span><span>Pets</span><span>Cost / Unit</span><span>Market / Unit</span><span>Profit / Unit</span></div>${rows}</div><div class="rc-note">Cost / Unit is a pet's daily food cost divided by its daily yield of that resource if all its energy went to it, averaged over your pets that make it. Boosts and levels that raise the yield per fetch lower it. It is the same cost the rest of the app uses for pet resources (shrines in Collect mode). If you untick a meal in Fed Pet With, this table uses only the ticked meals and the rest of the app is not changed. A ✏️ means you set a custom cost in the Pets tab. Profit / Unit is Market Price minus the market fee and Cost.</div></div>`;
}

function petAt(pet, level) {
  return {
    level: level,
    isNFT: pet.isNFT,
    aura: pet.aura,
    bib: pet.bib,
    petType: pet.petType
  };
}

function dailyEnergyAt(pet, level) {
  const p = petAt(pet, level);
  const counts = calc.petFeedCounts(p);
  return activeMeals().reduce((sum, d) => sum + calc.petEnergyPerFeed(p, d) * counts[d], 0);
}

function yieldTableHtml(res) {
  const pet = res.pet;
  const level = Math.max(res.reachedLevel, res.startLevel);
  const p = petAt(pet, level);
  const perDay = dailyEnergyAt(pet, level);
  const cols = "1.5fr 1fr 1fr 1fr";
  const rows = fetchList(pet.petType).filter(f => f.level <= level).map(f => {
    const ec = calc.PET_RESOURCE_ENERGY[f.name] || 200;
    const y = calc.petFetchYieldPerFetch(p, f.name);
    return `<div class="pc-trow" style="--pc-cols:${cols}"><span class="ct-tcell">${resIcon(f.name)}<span>${esc(f.name)}</span></span><span>${n2(ec)}⚡</span><span>${n2(y)}</span><span>${n2(perDay / ec * y)}</span></div>`;
  }).join("");
  if (!rows) return "";
  return `<div class="rc-group"><div class="rc-comp-sub">Yield Per Fetch (Lv${level})</div><div class="rc-kv-grid">${kv("Energy / Day", `${n2(perDay)}⚡`, "rc-kv-wide")}</div><div class="pc-table"><div class="pc-trow pc-thead" style="--pc-cols:${cols}"><span>Resource</span><span>Energy / Fetch</span><span>Yield / Fetch</span><span>Yield / Day</span></div>${rows}</div><div class="rc-note">Yield / Fetch includes the level bonuses and your boosts. A higher yield means each unit costs less. Energy is never lost: what is left after a fetch stays on the pet for later fetches, so Yield / Day is the daily average.</div></div>`;
}

function farmYieldTableHtml() {
  const pets = farmPets();
  if (!pets.length) return "";
  const acc = {};
  const energyRows = [];
  pets.forEach(p => {
    const pet = Object.assign({}, p, {
      aura: p.isNFT ? p.aura : "No Aura",
      bib: p.isNFT ? p.bib : "No Bib"
    });
    const level = clampInt(pet.level, 1, MAX_LEVEL);
    const perDay = dailyEnergyAt(pet, level);
    energyRows.push(kv(`${petIcon(pet)} ${esc(pet.name)}`, `${n2(perDay)}⚡`));
    fetchList(pet.petType).filter(f => f.level <= level).forEach(f => {
      const ec = calc.PET_RESOURCE_ENERGY[f.name] || 200;
      const y = calc.petFetchYieldPerFetch(petAt(pet, level), f.name);
      const a = acc[f.name] = acc[f.name] || {
        ec: ec,
        pets: 0,
        yPerFetch: 0,
        perDay: 0
      };
      a.pets++;
      a.yPerFetch += y;
      a.perDay += perDay / ec * y;
    });
  });
  const names = calc.PET_COST_TRACK_RESOURCES.filter(n => acc[n]);
  if (!names.length) return "";
  const cols = "1.5fr 1fr .55fr 1fr 1fr";
  const rows = names.map(n => {
    const a = acc[n];
    return `<div class="pc-trow" style="--pc-cols:${cols}"><span class="ct-tcell">${resIcon(n)}<span>${esc(n)}</span></span><span>${n2(a.ec)}⚡</span><span>${a.pets}</span><span>${n2(a.yPerFetch / a.pets)}</span><span>${n2(a.perDay)}</span></div>`;
  }).join("");
  return `<div class="rc-group"><div class="rc-comp-sub">Yield Per Fetch (Your Farm)</div><div class="rc-kv-grid">${energyRows.join("")}</div><div class="pc-table"><div class="pc-trow pc-thead" style="--pc-cols:${cols}"><span>Resource</span><span>Energy / Fetch</span><span>Pets</span><span>Yield / Fetch</span><span>Yield / Day</span></div>${rows}</div><div class="rc-note">Yield / Fetch is the average across your pets at their current levels and includes level bonuses and your boosts (Squirrel Onesie and Oaken add to Acorn). Yield / Day is the total of all your pets feeding every day. Energy / Day is what each pet earns from its daily feeds. Energy is never lost: what is left after a fetch stays on the pet for later fetches, so Yield / Day is the daily average.</div></div>`;
}

function toolsHtml() {
  return `<div class="rc-tools"><button type="button" class="rc-tool guro-frame" data-rc-open="boost">Boost</button><button type="button" class="rc-tool guro-frame" data-rc-open="foods">Foods</button></div>`;
}

function noticeHtml() {
  return `<div class="rc-details-row"><button type="button" class="rc-linktext" data-rc-guide aria-expanded="${guideOpen ? "true" : "false"}">Level Guide</button></div>${guideOpen ? guideHtml() : ""}<div class="rc-details-row"><button type="button" class="rc-linktext" data-rc-details aria-expanded="${detailsOpen ? "true" : "false"}">Details</button></div>${detailsOpen ? infoNoteHtml() : ""}`;
}

function resultsHtml() {
  const body = state.mode === "custom" ? customResultsHtml() : farmTotalsHtml() + farmYieldTableHtml() + farmCostTableHtml();
  const title = state.mode === "custom" ? "Level Up Cost" : "Farm Pets Results";
  return `<section class="rc-block guro-frame" aria-label="Pet results">
    <div class="rc-block-title">${title}</div>
    ${toolsHtml()}
    ${noticeHtml()}
    <div id="rcResults">${body}</div>
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
  if (!blocks.length) {
    render();
    return;
  }
  for (let i = blocks.length - 1; i >= 1; i--) blocks[i].remove();
  const tmp = document.createElement("div");
  tmp.innerHTML = resultsHtml();
  while (tmp.firstChild) host.appendChild(tmp.firstChild);
  if (popup) renderOverlayBody();
}

function refreshPicker() {
  if (!host) return;
  const body = host.querySelector("#pcPickerBody");
  if (!body) {
    render();
    return;
  }
  const tops = host.querySelector(".rc-modes");
  if (tops) tops.outerHTML = modeToggleHtml();
  body.innerHTML = state.mode === "custom" ? customBuilderHtml() : farmListHtml();
}

function updateCustomParts() {
  const types = host && host.querySelector("#pcTypes");
  const info = host && host.querySelector("#pcTypeInfo");
  const traits = host && host.querySelector("#pcTraits");
  if (types) types.innerHTML = typeCellsHtml();
  if (info) info.innerHTML = typeInfoHtml();
  if (traits) traits.innerHTML = traitRowsHtml();
}

function updateChips() {
  const wrap = host && host.querySelector("#pcLevels");
  if (!wrap) return;
  wrap.querySelectorAll("[data-pc-chip]").forEach(b => {
    b.classList.toggle("active", Number(b.getAttribute("data-pc-chip")) === state.custom.to);
  });
}

function currentComputation() {
  if (popup === "custom") return findSubjectRun("custom");
  if (popup && popup.indexOf("pet:") === 0) return findSubjectRun(popup.slice(4));
  return null;
}

function yieldPerFetchKv(r, res) {
  const l1 = Math.max(res.startLevel, r.unlockLevel);
  const l2 = Math.max(res.reachedLevel, l1);
  const y1 = calc.petFetchYieldPerFetch(petAt(res.pet, l1), r.name);
  const y2 = calc.petFetchYieldPerFetch(petAt(res.pet, l2), r.name);
  return kv("Yield / Fetch", y1 === y2 ? n2(y2) : `${n2(y1)} → ${n2(y2)} <span class="rc-kv-sub">Lv${l1} → Lv${l2}</span>`);
}

function resourceBlockHtml(r, res) {
  const feeFrac = (calc.feePercent || 0) / 100;
  return `<div class="rc-group"><div class="rc-comp-sub">${resIcon(r.name)} ${esc(r.name)}</div><div class="rc-kv-grid">
    ${kv("Unlocks At", `Lv${r.unlockLevel}`)}
    ${kv("Energy / Fetch", `${n2(r.energyCost)}⚡`)}
    ${kv("Fetches", n2(r.fetches))}
    ${yieldPerFetchKv(r, res)}
    ${kv("Total Yield", `${n2(r.yield)}${resIcon(r.name)}`)}
    ${kv("Market Price / Unit", r.tradable ? flowerHtml(r.market) : "Not tradable")}
    ${kv("Cost / Unit", flowerHtml(r.costPerUnit))}
    ${kv("Profit / Unit", profitHtml(r.profitPerUnit))}
    ${kv("Total Cost", flowerHtml(r.cost))}
    ${kv("Gross", r.tradable ? flowerHtml(r.gross) : "—")}
    ${kv(`Tax${feeFrac > 0 ? " (" + n2(feeFrac * 100) + "%)" : ""}`, r.tradable ? flowerHtml(r.tax) : "—")}
    ${kv("Net", profitHtml(r.net), "rc-kv-wide rc-kv-net")}
  </div></div>`;
}

function feedTableHtml(res) {
  const pet = res.pet;
  const atStart = {
    level: res.startLevel,
    isNFT: pet.isNFT,
    aura: pet.aura,
    bib: pet.bib,
    petType: pet.petType
  };
  const atEnd = Object.assign({}, atStart, {
    level: Math.max(res.reachedLevel, res.startLevel)
  });
  const cols = "1fr 1fr 1fr 1fr 1fr";
  const rows = activeMeals().map(d => `<div class="pc-trow" style="--pc-cols:${cols}"><span>${DIFF_LABELS[d]}</span><span>${n2(calc.petXpPerFeed(atStart, d))}</span><span>${n2(calc.petXpPerFeed(atEnd, d))}</span><span>${n2(calc.petEnergyPerFeed(atEnd, d))}⚡</span><span>${flowerHtml(res.costs[d])}</span></div>`).join("");
  return `<div class="rc-group"><div class="rc-comp-sub">Per Feed</div><div class="pc-table"><div class="pc-trow pc-thead" style="--pc-cols:${cols}"><span>Meal</span><span>XP Lv${atStart.level}</span><span>XP Lv${atEnd.level}</span><span>Energy</span><span>Food Cost</span></div>${rows}</div></div>`;
}

function perkLabel(perk) {
  return `${esc(perk.label)}${perk.nftOnly ? " (NFT)" : perk.commonOnly ? " (Common)" : ""}`;
}

function perksHtml(res) {
  const pet = res.pet;
  const top = Math.max(res.reachedLevel, res.targetLevel);
  const list = calc.PET_LEVEL_PERKS.filter(perk => calc.petPerkApplies(pet, perk));
  const nextAfter = list.filter(perk => perk.level > top).slice(0, 1);
  const shown = list.filter(perk => perk.level <= top).concat(nextAfter);
  const byLevel = {};
  res.milestones.forEach(m => {
    byLevel[m.perk.level] = m;
  });
  const cols = "40px 1.7fr 1fr";
  const rows = shown.map(perk => {
    let status;
    if (perk.level <= res.startLevel) status = "Unlocked";
    else if (byLevel[perk.level]) status = `Day ${n2(byLevel[perk.level].day)} · ${flowerHtml(byLevel[perk.level].cost)}`;
    else status = perk.level <= top ? "Reached" : "Next";
    return `<div class="pc-trow" style="--pc-cols:${cols}"><span>${perk.level}</span><span>${perkLabel(perk)}</span><span>${status}</span></div>`;
  }).join("");
  return `<div class="rc-group"><div class="rc-comp-sub">Pet Perks</div><div class="pc-table"><div class="pc-trow pc-thead" style="--pc-cols:${cols}"><span>Lv</span><span>Perk</span><span>Status</span></div>${rows}</div><div class="rc-note">Perks work by level and are already counted in XP, Energy, requests and yield. They are not switches. Day and cost show when the perk is reached on the way to your target.</div></div>`;
}

function appliedBoostHtml() {
  const rows = calc.BOOSTS.filter(b => b.category === "pets" && b.source !== "skill" && calc.isBoostActive(b.id)).map(b => `<div class="rc-boost-row">${ui.getBoostIconAnyFallback(b.name)}<span class="rc-boost-name">${esc(b.name)}</span><span class="rc-boost-eff">${esc(b.note || "")}</span></div>`);
  return `<div class="rc-group"><div class="rc-comp-sub">Applied Boost</div>${rows.join("") || `<div class="rc-boost-none">No boost applied</div>`}</div>`;
}

function computationCardHtml(res) {
  const pet = res.pet;
  const badge = pet.isNFT ? `NFT · ${esc(AURA_SHORT[pet.aura] || pet.aura)} Aura · ${esc(BIB_SHORT[pet.bib] || pet.bib)}` : "Common";
  if (res.done) return `<article class="rc-comp-card guro-frame"><header class="rc-comp-head"><span class="rc-comp-icon">${petIcon(pet)}</span><span class="rc-comp-name">${esc(pet.name)} · Lv${res.startLevel}</span><span class="rc-comp-nodes">${badge}</span></header><div class="rc-empty">The target level must be higher than the current level.</div></article>`;
  const costPerK = res.xpNeeded > 0 ? res.cost / res.xpNeeded * 1e3 : 0;
  const resources = res.resources.length ? res.resources.map(r => resourceBlockHtml(r, res)).join("") : `<div class="rc-boost-none">No resource unlocked</div>`;
  return `<article class="rc-comp-card guro-frame">
    <header class="rc-comp-head"><span class="rc-comp-icon">${petIcon(pet)}</span><span class="rc-comp-name">${esc(pet.name)} · Lv${res.startLevel} → Lv${res.targetLevel}</span><span class="rc-comp-nodes">${badge}</span></header>
    <div class="rc-group"><div class="rc-comp-sub">Level Up</div><div class="rc-kv-grid">
      ${kv("Start Level", `Lv${res.startLevel}`)}
      ${kv("Target Level", `Lv${res.targetLevel}`)}
      ${kv("Start XP", `${n2(res.startXp)} XP`)}
      ${kv("Target XP", `${n2(res.targetXp)} XP`)}
      ${kv("XP Needed", `${n2(res.xpNeeded)} XP`, "rc-kv-wide")}
      ${kv("Days", n2(res.days))}
      ${kv("Months", n2(res.days / 30))}
      ${kv("Total Feeds", n2(res.feeds.total))}
      ${kv("Easy / Medium / Hard", `${n2(res.feeds.easy)} / ${n2(res.feeds.medium)} / ${n2(res.feeds.hard)}`)}
      ${kv("Energy Earned", `${n2(res.energy)}⚡`)}
      ${kv("Energy / Day", energyPerDayHtml(res))}
      ${kv("XP / Day (Avg)", `${n2(res.days > 0 ? res.xpNeeded / res.days : 0)} XP`)}
      ${kv("Food Cost", flowerHtml(res.foodCost))}
      ${kv("Hound Shrine Cost", res.shrineDaily > 0 ? `${flowerHtml(res.shrineCost)} <span class="rc-kv-sub">${flowerHtml(res.shrineDaily)}/day</span>` : "Off")}
      ${kv("Total Cost", flowerHtml(res.cost), "rc-kv-wide")}
      ${kv("Cost / 1,000 XP", flowerHtml(costPerK))}
      ${kv("Total Cost / Day", flowerHtml(res.days > 0 ? res.cost / res.days : 0))}
    </div></div>
    ${feedTableHtml(res)}
    ${perksHtml(res)}
    ${resources}
    ${appliedBoostHtml()}
  </article>`;
}

function computationBodyHtml() {
  const res = currentComputation();
  if (!res) return `<div class="rc-empty">Nothing to show.</div>`;
  if (res.blocked) return `<div class="rc-note is-warn">${blockedText(res)}</div>`;
  return computationCardHtml(res);
}

function boostBodyHtml() {
  const list = calc.BOOSTS.filter(b => b.category === "pets" && b.source !== "skill" && !b.petResetPct);
  const rows = list.map(b => {
    const locked = calc.isSeasonLocked(b);
    const active = calc.isBoostDraftActive(b.id);
    const mark = locked ? "🔒" : `<input type="checkbox" class="rc-boost-check" tabindex="-1" aria-hidden="true"${active ? " checked" : ""}>`;
    return `<div class="lib-item-row rc-boost-pick${active ? " boost-active" : ""}${locked ? " season-locked" : ""}" data-boost-id="${b.id}"><span class="lib-item-icon">${mark}</span><div class="lib-item-main"><div class="lib-item-name">${ui.getBoostIcon(b.name)}${esc(b.name)}</div><div class="lib-item-meta">${esc(b.note || "")}</div></div></div>`;
  }).join("");
  return `<div class="rc-pop-hint">Boosts that change pet XP, Energy, fetches and feeding cost. Tap a boost to switch it on or off, then press Save.</div><div class="rc-boost-subject"><div class="rc-boost-subject-title guro-frame"><span>Boost for Pets</span></div><div class="rc-boost-section">${rows || `<div class="rc-empty">No boosts found.</div>`}</div></div>`;
}

function foodsBodyHtml() {
  const mode = prices.cookingCostMode === "buy" ? "buy" : "collect";
  const tabs = DIFFS.map(d => tbtn("data-pc-foodtab", d, DIFF_LABELS[d], state.foodTab === d)).join("");
  const modeBtns = tbtn("data-pc-costmode", "collect", "Collect", mode === "collect") + tbtn("data-pc-costmode", "buy", "Buy", mode === "buy");
  const foods = calc.PET_FOOD_LISTS[state.foodTab] || [];
  const checked = foods.filter(calc.isPetFoodChecked);
  const avg = foodCosts()[state.foodTab];
  const rows = foods.map(f => {
    const on = calc.isPetFoodChecked(f);
    const cost = calc.coinsToFlower(prices.petFoodCostCoins(f));
    return `<label class="rc-tool-mat"><span class="rc-tool-mat-item"><input type="checkbox" data-pc-food="${esc(f)}"${on ? " checked" : ""} aria-label="${esc(f)}">${ui.cookFoodIcon(f)}<span class="rc-tool-mat-name">${esc(f)}</span></span><span class="rc-mat-val">${flowerHtml(cost)}</span></label>`;
  }).join("");
  const base = calc.PET_BASE_XP_ENERGY[state.foodTab];
  return `<div class="rc-pop-hint">Pet food is priced from your ingredient settings. The average of the ticked foods is the cost of one feed. Untick foods you never cook.</div>
  <div class="rc-group"><div class="rc-comp-sub">Food Cost Mode</div><div class="rc-tool-cfg"><div class="rc-tool-mat"><span class="rc-tool-mat-item"><span class="rc-tool-mat-name">Ingredients</span></span><span class="es-toolcfg-tog">${modeBtns}</span></div></div></div>
  <div class="rc-group"><div class="rc-comp-sub">Meal Difficulty</div><div class="rc-tool-cfg"><div class="rc-tool-mat"><span class="rc-tool-mat-item"><span class="rc-tool-mat-name">Meal</span></span><span class="es-toolcfg-tog">${tabs}</span></div><div class="rc-boost-none">Base +${base} XP and +${base}⚡ per feed · ${checked.length} of ${foods.length} foods ticked · Average ${flowerHtml(avg)}${calc.petBoostActiveWithField("petFreeFeed") ? " (Paw Aura makes feeding free)" : ""}</div>${rows}</div></div>`;
}

function popupTitle() {
  if (popup === "boost") return "Pet Boosts";
  if (popup === "foods") return "Pet Foods";
  return "Computation";
}

function popupBodyHtml() {
  if (popup === "boost") return boostBodyHtml();
  if (popup === "foods") return foodsBodyHtml();
  return computationBodyHtml();
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

function footerHtml() {
  if (popup === "boost") return `<div id="rcSaveSlot"></div>`;
  return "";
}

function overlayHtml() {
  const wide = popup !== "boost" && popup !== "foods";
  return `<div class="rc-pop guro-frame rc-pop-animals${wide ? " rc-pop-comp" : ""}" role="dialog" aria-modal="true" aria-label="${popupTitle()}">
    <div class="rc-pop-head"><span class="rc-pop-title">${popupTitle()}</span><button type="button" class="rc-pop-close" data-rc-close aria-label="Close">✕</button></div>
    <div class="rc-pop-body" id="rcPopBody">${popupBodyHtml()}</div>
    <div class="rc-pop-foot">${footerHtml()}</div>
  </div>`;
}

function renderOverlayBody() {
  if (!overlayEl) return;
  const body = overlayEl.querySelector("#rcPopBody");
  if (!body) return;
  const top = body.scrollTop;
  body.innerHTML = popupBodyHtml();
  body.scrollTop = top;
  if (popup === "boost") calc.updateSkillSaveBarState();
}

function isPopupDirty() {
  if (popup === "boost") return calc.isSkillDraftDirty() || calc.isBoostDraftDirty();
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
  if (kind === "boost") {
    borrow("skillSaveBar", "rcSaveSlot");
    calc.updateSkillSaveBarState();
  }
}

function destroyPopup() {
  releaseBorrowed();
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
  const keep = popup !== "boost" && popup !== "foods";
  destroyPopup();
  if (!keep) refreshResults();
}

function setKind(isNFT) {
  const c = state.custom;
  if (c.isNFT === isNFT) return;
  c.isNFT = isNFT;
  const list = isNFT ? calc.PET_NFT_TYPES : calc.PET_COMMON_TYPES;
  c.type = list[0];
  saveState();
  render();
}

function setMode(mode) {
  if (state.mode === mode) return;
  state.mode = mode;
  saveState();
  render();
}

function applyCustomInput(key, raw) {
  const c = state.custom;
  if (key === "from") {
    if (raw === "") return;
    c.from = clampInt(raw, 1, MAX_LEVEL - 1);
  } else if (key === "to") {
    if (raw === "") return;
    c.to = clampInt(raw, 2, MAX_LEVEL);
  } else if (key === "xp") {
    c.xp = raw === "" ? 0 : Math.max(0, Number(raw) || 0);
  }
  saveState();
}

function applyFarmTarget(id, raw) {
  if (raw === "") return;
  state.targets[id] = clampInt(raw, 2, MAX_LEVEL);
  saveState();
  const p = farmPets().find(x => x.id === id);
  const row = host && host.querySelector(`[data-pc-sum="${CSS.escape(id)}"]`);
  if (p && row) row.innerHTML = farmRowSumHtml(run(farmSubject(p)));
}

function onClick(e) {
  const mode = e.target.closest("[data-pc-mode]");
  if (mode) {
    setMode(mode.getAttribute("data-pc-mode"));
    return;
  }
  const kind = e.target.closest("[data-pc-kind]");
  if (kind) {
    setKind(kind.getAttribute("data-pc-kind") === "nft");
    return;
  }
  const aura = e.target.closest("[data-pc-aura]");
  if (aura) {
    state.custom.aura = aura.getAttribute("data-pc-aura");
    saveState();
    updateCustomParts();
    refreshResults();
    return;
  }
  const bib = e.target.closest("[data-pc-bib]");
  if (bib) {
    state.custom.bib = bib.getAttribute("data-pc-bib");
    saveState();
    updateCustomParts();
    refreshResults();
    return;
  }
  const chip = e.target.closest("[data-pc-chip]");
  if (chip) {
    state.custom.to = clampInt(chip.getAttribute("data-pc-chip"), 2, MAX_LEVEL);
    saveState();
    const input = host.querySelector('[data-pc-in="to"]');
    if (input) input.value = state.custom.to;
    updateChips();
    refreshResults();
    return;
  }
  if (e.target.closest("[data-rc-guide]")) {
    guideOpen = !guideOpen;
    refreshResults();
    return;
  }
  if (e.target.closest("[data-rc-details]")) {
    detailsOpen = !detailsOpen;
    refreshResults();
    return;
  }
  const open = e.target.closest("[data-rc-open]");
  if (open && !open.disabled) openPopup(open.getAttribute("data-rc-open"));
}

function onChange(e) {
  const t = e.target;
  if (!t || !t.dataset) return;
  if (t.dataset.pcMeal != null) {
    const d = t.dataset.pcMeal;
    const next = Object.assign({}, state.meals, {
      [d]: !!t.checked
    });
    if (!DIFFS.some(k => next[k])) {
      t.checked = true;
      calc.toast("⚠️ Keep at least one meal ticked");
      return;
    }
    state.meals = next;
    saveState();
    if (state.mode === "farm") refreshPicker();
    refreshResults();
    return;
  }
  if (t.dataset.pcType != null) {
    state.custom.type = t.dataset.pcType;
    saveState();
    updateCustomParts();
    refreshResults();
  }
}

function onInput(e) {
  const t = e.target;
  if (!t || !t.dataset || !host || !host.contains(t)) return;
  if (t.dataset.pcIn != null) {
    applyCustomInput(t.dataset.pcIn, t.value);
    updateChips();
    refreshResults();
  } else if (t.dataset.pcTarget != null) {
    applyFarmTarget(t.dataset.pcTarget, t.value);
    refreshResults();
  }
}

function onDocChange(e) {
  const t = e.target;
  if (!t || !t.dataset || !overlayEl || !overlayEl.contains(t)) return;
  if (t.dataset.pcFood != null) {
    calc.petFoodChecks[t.dataset.pcFood] = !!t.checked;
    savePetFoodChecks();
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
  const tab = e.target.closest("[data-pc-foodtab]");
  if (tab) {
    state.foodTab = tab.getAttribute("data-pc-foodtab");
    saveState();
    renderOverlayBody();
    return;
  }
  const cm = e.target.closest("[data-pc-costmode]");
  if (cm) {
    prices.setCookingCostMode(cm.getAttribute("data-pc-costmode"));
    prices.invalidateCostCache();
    renderOverlayBody();
    refreshResults();
    return;
  }
  const row = e.target.closest("[data-boost-id]");
  if (row && popup === "boost") {
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

function onImgError(e) {
  const t = e.target;
  if (!t || t.tagName !== "IMG" || t.getAttribute("alt") !== "Fossil Shell") return;
  const span = document.createElement("span");
  span.style.fontSize = "calc(19.2px * var(--fs-desk, 1))";
  span.style.lineHeight = "1";
  span.textContent = calc.PET_RESOURCE_ICON["Fossil Shell"];
  t.replaceWith(span);
}

function onExternalChange() {
  if (!host) return;
  prices.invalidateCostCache();
  if (state.mode === "farm") refreshPicker();
  refreshResults();
}

export function mountPetsCalculator(root) {
  host = root;
  loadPetResourcesIfNeeded();
  prices.invalidateCostCache();
  state = loadState();
  guideOpen = false;
  detailsOpen = false;
  host.addEventListener("click", onClick);
  host.addEventListener("change", onChange);
  host.addEventListener("input", onInput);
  document.addEventListener("click", onDocClick);
  document.addEventListener("change", onDocChange);
  document.addEventListener("keydown", onKey);
  document.addEventListener("error", onImgError, true);
  window.addEventListener("guroBoostsChanged", onBoostsChanged);
  window.addEventListener("guroGemPackChanged", onExternalChange);
  window.addEventListener("guroPricesUpdated", onExternalChange);
  listening = true;
  render();
}

export function unmountPetsCalculator() {
  prices.invalidateCostCache();
  if (popup) destroyPopup();
  if (promptEl) {
    promptEl.remove();
    promptEl = null;
  }
  if (host) {
    host.removeEventListener("click", onClick);
    host.removeEventListener("change", onChange);
    host.removeEventListener("input", onInput);
    host.innerHTML = "";
  }
  if (listening) {
    document.removeEventListener("click", onDocClick);
    document.removeEventListener("change", onDocChange);
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("error", onImgError, true);
    window.removeEventListener("guroBoostsChanged", onBoostsChanged);
    window.removeEventListener("guroGemPackChanged", onExternalChange);
    window.removeEventListener("guroPricesUpdated", onExternalChange);
    listening = false;
  }
  host = null;
}

export function petsCalculatorCanLeave() {
  if (!popup) return true;
  if (isPopupDirty()) {
    calc.toast("⚠️ Save your changes first");
    return false;
  }
  destroyPopup();
  return true;
}
