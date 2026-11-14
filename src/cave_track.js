import { sflPrngChance, farmSyncCollectEquippedAndPlacedNames } from "./calculator.js";

const STORE_PREFIX = "guro_cave_track_v2_";

const KEEP_DAYS = 14;

const COUNTER_KEY = "Cave Tile Dug";

const ITEM_IDS = {
  "Green Beetle": 3084,
  "Blue Beetle": 3085,
  "Pink Beetle": 3086,
  "Amber Beetle": 3087,
  "Sand Shovel": 310,
  "Sand Drill": 311
};

export const CAVE_SKILL_RANKS = {
  "Twin Beetles": [ 5, 10, 15 ],
  "Sturdy Shovel": [ 10, 20, 30 ],
  "Sturdy Drill": [ 20, 30, 40 ],
  "Muddy Bounty": [ .1, .2, .3 ],
  "Fungal Harvest": [ .2, .3, .4 ]
};

const AURA = {
  Basic: 1.05,
  Green: 1.2,
  Rare: 2,
  Mythical: 5
};

function round6(n) {
  return Math.round(n * 1e6) / 1e6;
}

export function caveSkillLevel(skills, name) {
  const lv = Math.floor(Number(skills && skills[name]) || 0);
  const max = (CAVE_SKILL_RANKS[name] || [ 0, 0, 0 ]).length;
  return Math.max(0, Math.min(lv, max));
}

function skillRank(skills, name) {
  const lv = caveSkillLevel(skills, name);
  return lv ? CAVE_SKILL_RANKS[name][lv - 1] : 0;
}

function budBoost(buds, name) {
  let best = 0;
  Object.keys(buds && typeof buds === "object" ? buds : {}).forEach(id => {
    const bud = buds[id];
    if (!bud || !bud.coordinates) return;
    let stem = 0;
    if (name === "Wild Mushroom" && bud.stem === "Mushroom") stem = .3;
    if (name === "Magic Mushroom" && bud.stem === "Magic Mushroom") stem = .2;
    const v = Number(((AURA[bud.aura] || 1) * stem).toFixed(4));
    if (v > best) best = v;
  });
  return Number(best.toFixed(4));
}

export function caveMushroomAmount(name, g, placed) {
  let amount = 1;
  if (name === "Wild Mushroom") {
    if (placed.has("Mushroom House")) amount = round6(amount + .2);
    if (placed.has("Fairy Circle")) amount = round6(amount + .2);
    if (placed.has("Mushroom Hat")) amount = round6(amount + .1);
  }
  amount = round6(amount + budBoost(g && g.buds, name));
  const fungal = skillRank(g && g.bumpkin && g.bumpkin.skills, "Fungal Harvest");
  return round6(amount + fungal);
}

export function caveMudAmount(base, g) {
  const muddy = skillRank(g && g.bumpkin && g.bumpkin.skills, "Muddy Bounty");
  return muddy ? round6(base * (1 + muddy)) : base;
}

function tileName(tile) {
  if (!tile) return null;
  if (tile.type === "Beetle") return tile.beetle || null;
  if (tile.type === "Mushroom") return tile.mushroom || null;
  if (tile.type === "Mud") return "Mud";
  return null;
}

function utcDay(ms) {
  return new Date(ms).toISOString().substring(0, 10);
}

function loadStore(farmKey) {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_PREFIX + farmKey) || "null");
    if (raw && typeof raw === "object" && raw.days && typeof raw.days === "object") {
      return {
        counter: Number.isFinite(raw.counter) ? raw.counter : null,
        seen: Array.isArray(raw.seen) ? raw.seen : [],
        days: raw.days,
        started: raw.started === true
      };
    }
  } catch (e) {}
  return {
    counter: null,
    seen: [],
    days: {},
    started: false
  };
}

function saveStore(farmKey, store) {
  try {
    localStorage.setItem(STORE_PREFIX + farmKey, JSON.stringify(store));
  } catch (e) {}
}

function emptyDay() {
  return {
    items: {},
    tiles: 0,
    twin: 0,
    used: {
      "Sand Shovel": 0,
      "Sand Drill": 0
    },
    kept: {
      "Sand Shovel": 0,
      "Sand Drill": 0
    },
    approx: false,
    missed: 0
  };
}

function collectCurrentTiles(cave) {
  const out = [];
  Object.keys(cave.machines || {}).forEach(machineId => {
    const batch = cave.machines[machineId] && cave.machines[machineId].batch;
    if (!batch || !batch.dug || typeof batch.dug !== "object") return;
    Object.keys(batch.dug).forEach(key => {
      const rec = batch.dug[key];
      if (!rec || !(Number(rec.dugAt) > 0)) return;
      const parts = key.split(",").map(Number);
      const idx = parts[1] * 5 + parts[0];
      out.push({
        id: machineId + ":" + batch.startedAt + ":" + key,
        machineId: machineId,
        dugAt: Number(rec.dugAt),
        idx: isFinite(idx) ? idx : 0,
        tile: rec.tile || null
      });
    });
  });
  out.sort((a, b) => a.dugAt - b.dugAt || Number(a.machineId) - Number(b.machineId) || a.idx - b.idx);
  return out;
}

export function caveTrackFromState(g, farmId) {
  if (!g || typeof g !== "object" || !g.cave || !g.cave.machines) return;
  const farmKey = String(farmId || "");
  const farmNum = Number(farmId);
  if (!farmKey || !isFinite(farmNum)) return;
  const store = loadStore(farmKey);
  const current = collectCurrentTiles(g.cave);
  const seen = new Set(store.seen);
  const fresh = current.filter(t => !seen.has(t.id));
  const rawCounter = g.farmActivity ? Number(g.farmActivity[COUNTER_KEY]) : NaN;
  const counterNow = isFinite(rawCounter) && rawCounter >= 0 ? rawCounter : null;
  const skills = g.bumpkin && g.bumpkin.skills || {};
  const placed = farmSyncCollectEquippedAndPlacedNames(g);
  if (fresh.length && store.started) {
    let counters = null;
    let exact = false;
    let missed = 0;
    if (counterNow !== null) {
      if (store.started && store.counter !== null && counterNow - store.counter === fresh.length) {
        counters = fresh.map((t, i) => store.counter + i);
        exact = true;
      } else {
        counters = fresh.map((t, i) => Math.max(0, counterNow - fresh.length + i));
        if (store.started && store.counter !== null) missed = Math.max(0, counterNow - store.counter - fresh.length);
        exact = !store.started && counterNow === fresh.length;
      }
    }
    const twinRank = skillRank(skills, "Twin Beetles");
    const groups = {};
    fresh.forEach((t, i) => {
      const name = tileName(t.tile);
      if (!name) return;
      const day = utcDay(t.dugAt);
      const bucket = store.days[day] || (store.days[day] = emptyDay());
      let base = 1;
      let amount = 1;
      if (t.tile.type === "Mushroom") {
        amount = caveMushroomAmount(name, g, placed);
      } else if (t.tile.type === "Mud") {
        base = Number(t.tile.amount) || 1;
        amount = caveMudAmount(base, g);
      } else if (t.tile.type === "Beetle") {
        if (twinRank && counters && sflPrngChance({
          farmId: farmNum,
          itemId: ITEM_IDS[name],
          counter: counters[i],
          chance: twinRank,
          criticalHitName: "Twin Beetles"
        })) {
          amount = 2;
          bucket.twin += 1;
        }
      }
      const slot = bucket.items[name] || (bucket.items[name] = {
        b: 0,
        x: 0
      });
      slot.b = round6(slot.b + base);
      slot.x = round6(slot.x + (amount - base));
      bucket.tiles += 1;
      if (!exact) bucket.approx = true;
      const gk = t.machineId + ":" + t.dugAt;
      (groups[gk] || (groups[gk] = {
        day: day,
        first: i,
        size: 0
      })).size += 1;
    });
    Object.keys(groups).forEach(k => {
      const grp = groups[k];
      const bucket = store.days[grp.day];
      const tool = grp.size > 1 ? "Sand Drill" : "Sand Shovel";
      bucket.used[tool] += 1;
      const rank = skillRank(skills, tool === "Sand Drill" ? "Sturdy Drill" : "Sturdy Shovel");
      if (rank && counters && sflPrngChance({
        farmId: farmNum,
        itemId: ITEM_IDS[tool],
        counter: counters[grp.first],
        chance: rank,
        criticalHitName: tool === "Sand Drill" ? "Sturdy Drill" : "Sturdy Shovel"
      })) bucket.kept[tool] += 1;
    });
    if (missed > 0) {
      const day = utcDay(Date.now());
      const bucket = store.days[day] || (store.days[day] = emptyDay());
      bucket.missed += missed;
    }
  }
  store.seen = current.map(t => t.id);
  store.counter = counterNow !== null ? counterNow : store.counter;
  store.started = true;
  const cutoff = utcDay(Date.now() - KEEP_DAYS * 86400000);
  Object.keys(store.days).forEach(day => {
    if (day < cutoff) delete store.days[day];
  });
  saveStore(farmKey, store);
}

export function caveDayTotals(farmId, now) {
  const store = loadStore(String(farmId || ""));
  const day = store.days[utcDay(now || Date.now())] || emptyDay();
  return day;
}
