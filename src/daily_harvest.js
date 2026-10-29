import { FLOWER_ICON } from "./calculator.js";

const STORE_KEY = "hl_daily_harvest_v1";

const ROUND_THRESHOLD = 1;

let memStore = null;

function utcDay(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function utcDayStart(ms) {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function pruneStore(store) {
  const today = utcDay(Date.now());
  const active = store.__last;
  let changed = false;
  Object.keys(store).forEach(k => {
    if (k === "__last") return;
    const rec = store[k];
    if (!rec || typeof rec !== "object") {
      delete store[k];
      changed = true;
      return;
    }
    if (rec.day === today) return;
    if (k === active) {
      if (Object.keys(rec.stats || {}).length || Object.keys(rec.prev || {}).length) {
        store[k] = {
          day: rec.day,
          prev: {},
          stats: {},
          counters: rec.counters || {},
          inv: rec.inv || {},
          act: rec.act || {},
          power: rec.power || {},
          syncAt: rec.syncAt || 0
        };
        changed = true;
      }
      return;
    }
    delete store[k];
    changed = true;
  });
  return changed;
}

function loadStore() {
  if (memStore) return memStore;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    memStore = parsed && typeof parsed === "object" ? parsed : {};
  } catch (e) {
    memStore = {};
  }
  if (pruneStore(memStore)) saveStore();
  return memStore;
}

function freshStore() {
  const store = loadStore();
  if (pruneStore(store)) saveStore();
  return store;
}

function saveStore() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(memStore || {}));
  } catch (e) {}
}

function numTs(v) {
  return typeof v === "number" && v > 0 ? v : 0;
}

function isActiveNode(node, now) {
  if (!node || typeof node !== "object") return false;
  return !(typeof node.removedAt === "number" && node.removedAt <= now);
}

const yieldMeta = {};

let metaFarm = "";

const RESOLVABLE_GROUPS = {
  Wood: true,
  Stone: true,
  Iron: true,
  Gold: true
};

const ACT_KEY_RE = /^(.+ Tree Chopped|.+ Rock Mined)$/;

let pendResolver = null;

const TREE_BASE_RECOVERY_MS = 7200 * 1e3;

const TREE_CHARGE_RANKS = [ .9, .875, .85 ];

function treePermanentShiftMs(g) {
  let mult = 1;
  const col = g && g.collectibles && typeof g.collectibles === "object" ? g.collectibles : {};
  const placed = name => Array.isArray(col[name]) && col[name].some(c => c && c.coordinates);
  if (placed("Apprentice Beaver") || placed("Foreman Beaver")) mult *= .5;
  const skills = g && g.bumpkin && g.bumpkin.skills ? g.bumpkin.skills : {};
  const lvl = Number(skills["Tree Charge"]) || 0;
  if (lvl > 0) mult *= TREE_CHARGE_RANKS[Math.min(lvl, TREE_CHARGE_RANKS.length) - 1];
  return Math.round(TREE_BASE_RECOVERY_MS * (1 - mult));
}

const TREE_USE_BOOSTS = [ "Tree Charge", "Tree Turnaround", "Tough Tree", "Lumberjack's Extra", "Apprentice Beaver", "Foreman Beaver", "Super Totem", "Time Warp Totem", "Timber Hourglass", "Badger Shrine" ];

const WOOD_BATCH_MS = 5 * 6e4;

let woodShiftMs = 0;

let woodLowerBound = 0;

let woodAnchor = 0;

let woodBatchMin = 0;

const OIL_USE_BOOSTS = [ "Oil Extraction", "Oil Gallon", "Oil Can", "Oil Overalls", "Battle Fish", "Knight Chicken", "Stag Shrine", "Dev Wrench", "Oil Be Back", "Infernal Drill" ];

const OIL_BASE_RECOVERY_MS = 20 * 3600 * 1e3;

let oilAnchor = 0;

let oilBatchMin = 0;

function latestTreeUse(g, from, now, names) {
  const used = g && g.boostsUsedAt && typeof g.boostsUsedAt === "object" ? g.boostsUsedAt : {};
  let best = 0;
  (names || TREE_USE_BOOSTS).forEach(name => {
    const t = used[name];
    if (typeof t === "number" && t >= from && t <= now && t > best) best = t;
  });
  return best;
}

function realStamp(groupKey, node, now) {
  const ts = node ? node.ts : 0;
  if (!ts) return ts;
  if (node.shift > 0) return Math.min(now, ts + node.shift);
  if (groupKey === "Oil" && node.legacy) {
    if (oilAnchor && ts >= oilBatchMin && oilAnchor >= ts && oilAnchor <= ts + OIL_BASE_RECOVERY_MS) return Math.min(now, oilAnchor);
    return ts;
  }
  if (groupKey !== "Wood" || !node.legacy) return ts;
  if (woodAnchor && ts >= woodBatchMin && woodAnchor >= ts && woodAnchor <= ts + TREE_BASE_RECOVERY_MS) return Math.min(now, woodAnchor);
  const lower = Math.min(now, Math.max(ts, woodLowerBound));
  return Math.min(now, Math.max(lower, ts + woodShiftMs));
}

export function dailyHarvestSetResolver(fn) {
  pendResolver = typeof fn === "function" ? fn : null;
}

function pickActivity(fa) {
  const out = {};
  if (!fa || typeof fa !== "object") return out;
  Object.keys(fa).forEach(k => {
    if (k !== "Tree Chopped" && ACT_KEY_RE.test(k) && typeof fa[k] === "number") out[k] = fa[k];
  });
  return out;
}

function oilAmountOf(g, id) {
  const reserve = g.oilReserves && g.oilReserves[id];
  const amount = reserve && reserve.oil && reserve.oil.amount;
  return typeof amount === "number" && isFinite(amount) && amount > 0 ? amount : null;
}

const FLOW_KEYS = new Set([
  "Treasure Dug",
  "Digging Reward Collected",
  "Pirate Chest Opened",
  "Daily Reward Collected",
  "Gift Giver Reward Opened",
  "VIP Chest Opened",
  "VIP Gift Claimed",
  "Airdrop Reward Claimed",
  "Streamer Hat Reward Claimed",
  "Minigame Prize Claimed",
  "Faction Prize Claimed",
  "Raffle Won",
  "Coins Order Delivered",
  "FLOWER Order Delivered",
  "Ticket Order Delivered",
  "Marketplace Offer Claimed",
  "Marketplace Listing Created",
  "Marketplace Listing Cancelled",
  "Marketplace Bulk Listings Cancelled",
  "Marketplace Offer Made",
  "Marketplace Offer Cancelled",
  "Marketplace Bulk Offers Cancelled",
  "Trades Cleared",
  "Chore Skipped",
  "Shiny Feather Collected",
  "Acorn Fetched",
  "Dewberry Fetched",
  "Heart leaf Fetched",
  "Ribbon Fetched",
  "Fossil Shell Fetched",
  "Chewed Bone Fetched",
  "Crabs and Traps Points Earned",
  "Salt Awakening free Milestone Claimed",
  "Salt Awakening premium Milestone Claimed",
  "Ascension Age free Milestone Claimed",
  "Ascension Age premium Milestone Claimed",
  "Crabs and Traps free Milestone Claimed",
  "Crabs and Traps premium Milestone Claimed"
]);

const FRUIT_HARVEST_RE = /^(Apple|Blueberry|Orange|Banana|Tomato|Lemon|Grape|Duskberry|Lunara|Celestine|Olive|Crystal Leaf) Harvested$/;

const GROUP_FLOW_RE = /^(Wood|Stone|Iron|Gold) (Bought|Sold|Delivered|Fetched|Collected|Burned|Exchanged)$/;

function isFlowKey(key) {
  return FLOW_KEYS.has(key) || FRUIT_HARVEST_RE.test(key) || GROUP_FLOW_RE.test(key);
}

function pickFlow(fa) {
  const out = {};
  if (!fa || typeof fa !== "object") return out;
  Object.keys(fa).forEach(k => {
    if (isFlowKey(k) && typeof fa[k] === "number") out[k] = fa[k];
  });
  return out;
}

function flowAffects(groupKey, key) {
  if (FRUIT_HARVEST_RE.test(key)) return groupKey === "Wood";
  const m = GROUP_FLOW_RE.exec(key);
  if (m) return m[1] === groupKey;
  return true;
}

function hasOutsideFlow(groupKey, flowPrev, flowNow) {
  const known = Object.keys(flowPrev).length > 0;
  if (!known) return false;
  return Object.keys(flowNow).some(k => {
    if (!flowAffects(groupKey, k)) return false;
    const before = typeof flowPrev[k] === "number" ? flowPrev[k] : 0;
    return flowNow[k] > before;
  });
}

const LOG_CAP = 60;

const POWER_KINDS = {
  "Tree Blitz": "wood",
  "Grease Lightning": "oil",
  "Instant Growth": "crop",
  "Barnyard Rouse": "animal",
  "Greenhouse Guru": "greenhouse",
  "Petal Blessed": "flower"
};

function kindOfGroup(groupKey) {
  if (groupKey === "Wood") return "wood";
  if (groupKey === "Oil") return "oil";
  return "";
}

const NODE_BAGS = [ [ "trees", "Wood", n => n.wood && n.wood.choppedAt ], [ "stones", "Stone", n => n.stone && n.stone.minedAt ], [ "iron", "Iron", n => n.stone && n.stone.minedAt ], [ "gold", "Gold", n => n.stone && n.stone.minedAt ], [ "crimstones", "Crimstone", n => n.stone && n.stone.minedAt ], [ "oilReserves", "Oil", n => n.oil && n.oil.drilledAt ] ];

function isCropMachineActive(g, now) {
  const list = g.buildings && g.buildings["Crop Machine"];
  return Array.isArray(list) && list.some(b => isActiveNode(b, now));
}

function inventoryItemFor(groupKey, kind) {
  if (kind === "animal" || groupKey === "Honey") return null;
  return groupKey;
}

function collectGroups(g, now) {
  const groups = {};
  const cropMachine = isCropMachineActive(g, now);
  const add = (groupKey, mode, id, ts, key, noCounter, val, kind, legacy, shift) => {
    const grp = groups[groupKey] || (groups[groupKey] = {
      mode: mode,
      kind: kind || kindOfGroup(groupKey),
      noCounter: !!noCounter,
      nodes: {}
    });
    grp.nodes[id] = {
      ts: ts,
      key: key,
      val: val,
      legacy: !!legacy,
      shift: typeof shift === "number" && shift > 0 ? shift : 0
    };
  };
  NODE_BAGS.forEach(([bagKey, groupKey, getTs]) => {
    const bag = g[bagKey];
    if (!bag || typeof bag !== "object") return;
    Object.entries(bag).forEach(([id, node]) => {
      if (!isActiveNode(node, now)) return;
      const ts = numTs(getTs(node));
      const legacy = groupKey === "Wood" && !(node.wood && node.wood.baseDurationMs !== undefined) || groupKey === "Oil" && !(node.oil && node.oil.baseDurationMs !== undefined);
      const rock = node.stone && node.stone.baseDurationMs === undefined ? node.stone.boostedTime : 0;
      add(groupKey, "ts", id, ts, String(ts), undefined, undefined, undefined, legacy, rock);
    });
  });
  if (g.crops && typeof g.crops === "object") {
    Object.entries(g.crops).forEach(([id, plot]) => {
      if (!isActiveNode(plot, now)) return;
      const crop = plot.crop;
      if (!crop || !crop.name) return;
      add(crop.name, "key", id, numTs(crop.plantedAt), crop.id ? String(crop.id) : String(numTs(crop.plantedAt)), cropMachine, undefined, "crop", false, crop.baseDurationMs === undefined ? crop.boostedTime : 0);
    });
  }
  if (g.greenhouse && g.greenhouse.pots && typeof g.greenhouse.pots === "object") {
    Object.entries(g.greenhouse.pots).forEach(([id, pot]) => {
      const plant = pot && pot.plant;
      if (!plant || !plant.name) return;
      add(plant.name, "key", id, 0, plant.name, false, undefined, "greenhouse");
    });
  }
  if (g.flowers && g.flowers.flowerBeds && typeof g.flowers.flowerBeds === "object") {
    Object.entries(g.flowers.flowerBeds).forEach(([id, bed]) => {
      const flower = bed && bed.flower;
      if (!flower || !flower.name) return;
      add(flower.name, "key", id, 0, flower.name, false, undefined, "flower");
    });
  }
  if (g.fruitPatches && typeof g.fruitPatches === "object") {
    Object.entries(g.fruitPatches).forEach(([id, patch]) => {
      if (!isActiveNode(patch, now)) return;
      const fruit = patch.fruit;
      if (!fruit || !fruit.name) return;
      add(fruit.name, "key", id, numTs(fruit.harvestedAt), `${numTs(fruit.plantedAt)}|${numTs(fruit.harvestedAt)}`, undefined, undefined, "fruit", false, fruit.baseDurationMs === undefined && fruit.harvestedAt ? fruit.boostedTime : 0);
    });
  }
  if (g.beehives && typeof g.beehives === "object") {
    Object.entries(g.beehives).forEach(([id, hive]) => {
      if (!hive || !hive.honey || typeof hive.honey.produced !== "number") return;
      add("Honey", "honey", id, numTs(hive.honey.updatedAt), String(hive.honey.produced), false, hive.honey.produced);
    });
  }
  [ "henHouse", "barn", "pigpen" ].forEach(buildingKey => {
    const animals = g[buildingKey] && g[buildingKey].animals;
    if (!animals || typeof animals !== "object") return;
    Object.entries(animals).forEach(([id, animal]) => {
      if (!animal || !animal.type) return;
      const ts = numTs(animal.asleepAt);
      add(animal.type, "ts", id, ts, String(ts), false, undefined, "animal");
    });
  });
  return groups;
}

const COUNTER_KEYS = {
  Crimstone: "Crimstone Mined",
  Oil: "Oil Drilled",
  Chicken: "Egg Collected",
  Cow: "Milk Collected",
  Sheep: "Wool Collected"
};

const COUNTER_PATTERNS = {
  Wood: k => /Tree Chopped$/.test(k) && k !== "Tree Chopped",
  Stone: k => /Stone Rock Mined$/.test(k),
  Iron: k => /Iron Rock Mined$/.test(k),
  Gold: k => /Gold Rock Mined$/.test(k)
};

function counterFor(g, groupKey, noCounter) {
  const fa = g.farmActivity;
  if (noCounter || !fa || typeof fa !== "object") return null;
  if (COUNTER_PATTERNS[groupKey]) {
    let sum = 0;
    let found = false;
    Object.keys(fa).forEach(k => {
      if (COUNTER_PATTERNS[groupKey](k)) {
        sum += Number(fa[k]) || 0;
        found = true;
      }
    });
    return found ? sum : 0;
  }
  const key = COUNTER_KEYS[groupKey] || `${groupKey} Harvested`;
  return typeof fa[key] === "number" ? fa[key] : 0;
}

function roundsFromStats(st) {
  const need = Math.max(1, Math.ceil(st.total * ROUND_THRESHOLD));
  const counts = Object.values(st.counts).sort((a, b) => b - a);
  const rounds = counts.length >= need ? counts[need - 1] : 0;
  const nextProgress = counts.filter(c => c > rounds).length;
  return {
    need: need,
    rounds: rounds,
    nextProgress: nextProgress
  };
}

export function dailyHarvestTrack(g, farmId) {
  if (!g || typeof g !== "object") return;
  const now = Date.now();
  const today = utcDay(now);
  const start = utcDayStart(now);
  const store = freshStore();
  const fid = String(farmId || store.__last || "");
  if (!fid) return;
  store.__last = fid;
  pruneStore(store);
  const old = store[fid];
  let rec = old;
  const fresh = !rec || rec.day !== today;
  if (fresh) rec = {
    day: today,
    prev: {},
    stats: {},
    counters: old && old.counters ? old.counters : {},
    inv: old && old.inv ? old.inv : {},
    act: old && old.act ? old.act : {},
    flow: old && old.flow ? old.flow : {},
    power: old && old.power ? old.power : {},
    syncAt: old && old.syncAt ? old.syncAt : 0
  };
  const prevSyncAt = rec.syncAt || 0;
  woodShiftMs = treePermanentShiftMs(g);
  woodLowerBound = Math.max(prevSyncAt, start);
  const invPrev = rec.inv || {};
  const actPrev = rec.act || {};
  const actNow = pickActivity(g.farmActivity);
  const flowPrev = rec.flow || {};
  const flowNow = pickFlow(g.farmActivity);
  const invNowMap = {};
  const inventory = g.inventory && typeof g.inventory === "object" ? g.inventory : null;
  const powerNow = g.bumpkin && g.bumpkin.previousPowerUseAt && typeof g.bumpkin.previousPowerUseAt === "object" ? g.bumpkin.previousPowerUseAt : {};
  const knownPower = rec.power || {};
  const skillTimes = {};
  Object.keys(POWER_KINDS).forEach(skill => {
    const at = powerNow[skill];
    if (typeof at !== "number" || !prevSyncAt || at <= prevSyncAt || at <= (knownPower[skill] || 0)) return;
    const kind = POWER_KINDS[skill];
    skillTimes[kind] = Math.max(skillTimes[kind] || 0, at);
  });
  const groups = collectGroups(g, now);
  woodAnchor = latestTreeUse(g, woodLowerBound, now);
  woodBatchMin = 0;
  if (groups.Wood) {
    const legacyTs = Object.values(groups.Wood.nodes).filter(n => n.legacy && n.ts).map(n => n.ts);
    if (legacyTs.length) woodBatchMin = Math.max(...legacyTs) - WOOD_BATCH_MS;
  }
  oilAnchor = latestTreeUse(g, Math.max(prevSyncAt, start), now, OIL_USE_BOOSTS);
  oilBatchMin = 0;
  if (groups.Oil) {
    const oilTs = Object.values(groups.Oil.nodes).filter(n => n.legacy && n.ts).map(n => n.ts);
    if (oilTs.length) oilBatchMin = Math.max(...oilTs) - WOOD_BATCH_MS;
  }
  const keys = new Set([ ...Object.keys(groups), ...Object.keys(rec.prev) ]);
  keys.forEach(groupKey => {
    const invItem = inventoryItemFor(groupKey, groups[groupKey] ? groups[groupKey].kind : "");
    if (invItem && inventory) invNowMap[invItem] = Number(inventory[invItem]) || 0;
    const grp = groups[groupKey] || {
      mode: rec.prev[groupKey] ? rec.prev[groupKey].mode : "ts",
      noCounter: rec.prev[groupKey] ? !!rec.prev[groupKey].noCounter : false,
      nodes: {}
    };
    const ids = Object.keys(grp.nodes);
    const prev = fresh ? null : rec.prev[groupKey] || null;
    let st = rec.stats[groupKey];
    if (!st) st = rec.stats[groupKey] = {
      total: ids.length,
      counts: {},
      lastAt: 0,
      est: false
    };
    if (grp.kind) st.kind = grp.kind;
    st.total = Math.max(st.total, ids.length);
    const cNow = counterFor(g, groupKey, grp.noCounter);
    const cPrev = typeof rec.counters[groupKey] === "number" ? rec.counters[groupKey] : null;
    if (cNow !== null) rec.counters[groupKey] = cNow;
    const events = [];
    if (fresh) {
      const honeyMoved = grp.mode !== "honey" || cNow !== null && cPrev !== null && cNow > cPrev;
      ids.forEach(id => {
        if (honeyMoved && grp.nodes[id].ts >= start) events.push(id);
      });
    } else if (prev) {
      if (grp.mode === "ts") {
        ids.forEach(id => {
          const p = prev.nodes[id];
          if (p && grp.nodes[id].ts > p.ts) events.push(id);
        });
      } else if (grp.mode === "honey") {
        ids.forEach(id => {
          const p = prev.nodes[id];
          if (p && typeof p.val === "number" && grp.nodes[id].val < p.val - 1e-6) events.push(id);
        });
      } else {
        Object.keys(prev.nodes).forEach(id => {
          const c = grp.nodes[id];
          if (!c || c.key !== prev.nodes[id].key && !String(prev.nodes[id].key).startsWith(`${c.key}:`)) events.push(id);
        });
      }
    }
    const skillTime = grp.kind ? skillTimes[grp.kind] || 0 : 0;
    const gapScale = fresh && prevSyncAt && prevSyncAt < start && skillTime < start ? Math.min(1, Math.max(0, (now - start) / (now - prevSyncAt))) : 1;
    let hiddenOnly = false;
    if (!events.length) {
      const gain = grp.mode !== "honey" && skillTime && cNow !== null && cPrev !== null && cNow > cPrev ? Math.round((cNow - cPrev) * gapScale) : 0;
      if (!gain) return;
      hiddenOnly = true;
      ids.forEach(id => events.push(id));
    }
    let extras = 0;
    let estimated = false;
    if (hiddenOnly) {
      extras = Math.round((cNow - cPrev) * gapScale);
      estimated = true;
    } else if (grp.mode === "honey") {
      estimated = fresh;
    } else if (cNow !== null && cPrev !== null && cNow >= cPrev) {
      let yesterday = 0;
      if (fresh && prevSyncAt && prevSyncAt < start) {
        ids.forEach(id => {
          const ts = grp.nodes[id].ts;
          if (ts > prevSyncAt && ts < start) yesterday += 1;
        });
      }
      extras = Math.max(0, cNow - cPrev - events.length - yesterday);
      if (fresh && prevSyncAt && prevSyncAt < start && extras > 0) {
        extras = Math.round(extras * gapScale);
      }
      if (extras > 0) estimated = true;
    } else if (fresh) {
      estimated = true;
    }
    const before = roundsFromStats(st).rounds;
    const sorted = events.slice().sort();
    const per = Math.floor(extras / sorted.length);
    const rem = extras % sorted.length;
    const snap = metaFarm === fid && yieldMeta[groupKey] && yieldMeta[groupKey].nodes ? yieldMeta[groupKey].nodes : null;
    const buckets = {};
    sorted.forEach((id, i) => {
      const inc = (hiddenOnly ? 0 : 1) + per + (i < rem ? 1 : 0);
      st.counts[id] = (st.counts[id] || 0) + inc;
      if (hiddenOnly) return;
      const ts = grp.nodes[id] ? grp.nodes[id].ts : 0;
      const rs = ts ? realStamp(groupKey, grp.nodes[id], now) : 0;
      const t = rs && rs >= start ? rs : now;
      const bk = Math.floor(t / 6e4);
      const b = buckets[bk] || (buckets[bk] = {
        t: t,
        n: 0,
        y: 0,
        miss: false,
        ids: []
      });
      b.t = Math.max(b.t, t);
      b.n += 1;
      b.ids.push(id);
      const oilAmt = groupKey === "Oil" ? oilAmountOf(g, id) : null;
      if (oilAmt !== null) b.y += oilAmt; else if (snap && typeof snap[id] === "number") b.y += snap[id]; else b.miss = true;
    });
    const honeyTotal = grp.mode === "honey" && cNow !== null && cPrev !== null && cNow > cPrev ? cNow - cPrev : null;
    const resolvable = RESOLVABLE_GROUPS[groupKey] && grp.mode === "ts" && !hiddenOnly;
    const entries = Object.values(buckets).sort((a, b) => a.t - b.t).map(b => {
      const entry = {
        t: b.t,
        n: b.n,
        y: b.miss ? null : b.y
      };
      if (resolvable) entry.ids = b.ids;
      return entry;
    });
    let pendId = null;
    if (resolvable && entries.length) {
      const pid = String(now);
      pendId = pid;
      const ordered = sorted.slice().sort((a, b) => grp.nodes[a].ts - grp.nodes[b].ts || (a < b ? -1 : 1));
      st.pend = st.pend || {};
      st.pend[pid] = {
        ids: ordered,
        prev: Object.assign({}, actPrev),
        now: Object.assign({}, actNow)
      };
      entries.forEach(e => {
        e.pid = pid;
      });
    }
    if (extras > 0 && grp.mode !== "honey") {
      const snapVals = snap ? Object.values(snap).filter(v => typeof v === "number") : [];
      const mean = snapVals.length ? snapVals.reduce((a, b) => a + b, 0) / snapVals.length : 0;
      const lastVisible = entries.length ? entries[entries.length - 1].t : now;
      const extraEntry = {
        t: skillTime || lastVisible,
        n: extras,
        y: mean ? mean * extras : null
      };
      if (pendId) extraEntry.xpid = pendId;
      entries.push(extraEntry);
    }
    const nSum = entries.reduce((sum, e) => sum + e.n, 0) || 1;
    entries.forEach(e => {
      if (honeyTotal !== null) e.y = honeyTotal * e.n / nSum;
    });
    const invItemNow = inventoryItemFor(groupKey, grp.kind);
    const invBefore = invItemNow && typeof invPrev[invItemNow] === "number" ? invPrev[invItemNow] : null;
    const invAfter = invItemNow && typeof invNowMap[invItemNow] === "number" ? invNowMap[invItemNow] : null;
    const spanInDay = !(fresh && prevSyncAt && prevSyncAt < start);
    const outsideFlow = hasOutsideFlow(groupKey, flowPrev, flowNow);
    if (honeyTotal === null && groupKey !== "Oil" && invBefore !== null && invAfter !== null && spanInDay && entries.length && !outsideFlow) {
      const gained = invAfter - invBefore;
      if (gained > 1e-9) entries.forEach(e => {
        e.y = gained * e.n / nSum;
      });
    }
    const mergedLog = (st.log || []).concat(entries);
    const overflow = mergedLog.length - LOG_CAP;
    if (overflow > 0) {
      st.dropped = (st.dropped || 0) + mergedLog.slice(0, overflow).reduce((sum, e) => sum + (typeof e.y === "number" ? e.y : 0), 0);
    }
    st.log = mergedLog.slice(-LOG_CAP);
    if (estimated) st.est = true;
    const after = roundsFromStats(st).rounds;
    if (after > before) {
      const stamps = hiddenOnly ? [ skillTime ] : events.map(id => grp.nodes[id] ? realStamp(groupKey, grp.nodes[id], now) : 0).filter(Boolean);
      st.lastAt = stamps.length ? Math.max(...stamps) : now;
    }
  });
  rec.prev = groups;
  rec.power = Object.assign({}, knownPower);
  Object.keys(POWER_KINDS).forEach(skill => {
    if (typeof powerNow[skill] === "number") rec.power[skill] = powerNow[skill];
  });
  rec.inv = Object.assign({}, invPrev, invNowMap);
  rec.act = Object.assign({}, actPrev, actNow);
  rec.flow = Object.assign({}, flowPrev, flowNow);
  rec.syncAt = now;
  store[fid] = rec;
  saveStore();
}

export function dailyHarvestInfo(groupKey, farmId) {
  const store = freshStore();
  const rec = store[farmId ? String(farmId) : store.__last];
  if (!rec || rec.day !== utcDay(Date.now())) return null;
  const st = rec.stats[groupKey];
  if (!st) return null;
  const r = roundsFromStats(st);
  if (r.rounds < 1) return null;
  return {
    rounds: r.rounds,
    need: r.need,
    total: st.total,
    nextProgress: r.nextProgress,
    lastAt: st.lastAt,
    estimated: !!st.est,
    dropped: typeof st.dropped === "number" ? st.dropped : 0,
    log: Array.isArray(st.log) ? st.log : []
  };
}

function resolvePending(st, groupKey) {
  if (!st.pend || !pendResolver) return false;
  let changed = false;
  Object.keys(st.pend).forEach(pid => {
    let amounts;
    try {
      amounts = pendResolver(groupKey, st.pend[pid]);
    } catch (e) {
      amounts = null;
    }
    if (amounts === undefined) return;
    if (amounts) {
      st.log = st.log.filter(e => e.xpid !== pid);
      st.log.forEach(e => {
        if (e.pid !== pid || !Array.isArray(e.ids)) return;
        let sum = 0;
        let ok = true;
        e.ids.forEach(id => {
          if (typeof amounts[id] === "number") sum += amounts[id]; else ok = false;
        });
        if (ok) {
          e.y = sum;
          e.exact = true;
        }
      });
    }
    st.log.forEach(e => {
      if (e.pid === pid) {
        delete e.pid;
        delete e.ids;
      }
      if (e.xpid === pid) delete e.xpid;
    });
    delete st.pend[pid];
    changed = true;
  });
  return changed;
}

let yieldListener = null;

export function dailyHarvestOnYield(fn) {
  yieldListener = typeof fn === "function" ? fn : null;
}

export function dailyHarvestSetYield(groupKey, perNode, iconHtml, nodeQty, econ, farmId, products) {
  if (yieldListener) {
    try {
      yieldListener();
    } catch (e) {}
  }
  const metaStore = freshStore();
  const metaFid = farmId ? String(farmId) : metaStore.__last || "";
  if (metaFarm !== metaFid) {
    Object.keys(yieldMeta).forEach(k => {
      delete yieldMeta[k];
    });
    metaFarm = metaFid;
  }
  const per = typeof perNode === "number" && isFinite(perNode) && perNode > 0 ? perNode : 0;
  const meta = yieldMeta[groupKey] || (yieldMeta[groupKey] = {
    per: 0,
    icon: "",
    nodes: null,
    price: 0,
    feeRate: 0,
    products: null,
    productName: ""
  });
  if (Array.isArray(products)) {
    const clean = products.filter(pr => pr && typeof pr.name === "string" && pr.name).map(pr => ({
      name: pr.name,
      per: typeof pr.per === "number" && isFinite(pr.per) && pr.per > 0 ? pr.per : 0,
      icon: pr.icon || "",
      price: typeof pr.price === "number" && isFinite(pr.price) && pr.price > 0 ? pr.price : 0,
      feeRate: typeof pr.feeRate === "number" && isFinite(pr.feeRate) && pr.feeRate > 0 ? pr.feeRate : 0
    }));
    meta.products = clean.length > 1 ? clean : null;
    meta.productName = clean.length === 1 ? clean[0].name : "";
  }
  if (econ && typeof econ === "object") {
    meta.price = typeof econ.price === "number" && isFinite(econ.price) && econ.price > 0 ? econ.price : 0;
    meta.feeRate = typeof econ.feeRate === "number" && isFinite(econ.feeRate) && econ.feeRate > 0 ? econ.feeRate : 0;
  }
  if (Array.isArray(nodeQty) && nodeQty.length) {
    const map = {};
    nodeQty.forEach(n => {
      if (!n || typeof n.key !== "string" || typeof n.qty !== "number" || !isFinite(n.qty)) return;
      map[n.key.slice(n.key.indexOf(":") + 1)] = n.qty;
    });
    meta.nodes = map;
  }
  if (per) meta.per = per;
  if (iconHtml) meta.icon = iconHtml;
  const store = metaStore;
  const rec = store[metaFid];
  const st = rec && rec.stats ? rec.stats[groupKey] : null;
  if (!st || !Array.isArray(st.log)) return;
  let changed = resolvePending(st, groupKey);
  if (meta.per) st.log.forEach(e => {
    if (e.y === null || e.y === undefined) {
      if (meta.products) {
        e.p = {};
        let sum = 0;
        meta.products.forEach(pr => {
          const v = e.n * pr.per;
          e.p[pr.name] = v;
          sum += v;
        });
        e.y = sum;
      } else {
        e.y = e.n * meta.per;
      }
      changed = true;
    }
  });
  if (changed) saveStore();
}

const LOG_NODE_GROUPS = [ "Wood", "Stone", "Iron", "Gold", "Crimstone", "Oil" ];

const LOG_KIND_OF = {
  crop: "crop",
  fruit: "fruit",
  greenhouse: "greenhouse"
};

function addLogTotal(totals, name, kind, amount) {
  const value = Math.round(amount * 100) / 100;
  if (!(value > 0) || !isFinite(value)) return;
  const cur = totals[name];
  totals[name] = {
    k: kind,
    a: cur ? Math.round((cur.a + value) * 100) / 100 : value
  };
}

function animalLogTotals(totals, groupKey, st) {
  const meta = yieldMeta[groupKey];
  if (!meta) return;
  const dropped = typeof st.dropped === "number" ? st.dropped : 0;
  if (meta.products) {
    const products = meta.products;
    const sumPer = products.reduce((sum, pr) => sum + pr.per, 0);
    const parts = products.map(pr => sumPer > 0 ? dropped * pr.per / sumPer : 0);
    st.log.forEach(e => {
      splitEntryByProduct(e, products).forEach((v, i) => {
        parts[i] += v;
      });
    });
    products.forEach((pr, i) => addLogTotal(totals, pr.name, "animal", parts[i]));
    return;
  }
  if (!meta.productName) return;
  let amount = dropped;
  st.log.forEach(e => {
    if (typeof e.y === "number") amount += e.y; else if (meta.per) amount += e.n * meta.per;
  });
  addLogTotal(totals, meta.productName, "animal", amount);
}

export function dailyHarvestTotals(farmId) {
  const store = freshStore();
  const rec = store[farmId ? String(farmId) : store.__last];
  if (!rec || rec.day !== utcDay(Date.now()) || !rec.stats) return null;
  const totals = {};
  Object.keys(rec.stats).forEach(groupKey => {
    const st = rec.stats[groupKey];
    if (!st || !Array.isArray(st.log) || !st.log.length) return;
    if (st.kind === "animal") {
      animalLogTotals(totals, groupKey, st);
      return;
    }
    let logKind = LOG_KIND_OF[st.kind];
    if (groupKey === "Honey") logKind = "beehive";
    if (LOG_NODE_GROUPS.includes(groupKey)) logKind = "node";
    if (!logKind) return;
    const per = yieldMeta[groupKey] && yieldMeta[groupKey].per || 0;
    let amount = typeof st.dropped === "number" ? st.dropped : 0;
    st.log.forEach(e => {
      if (typeof e.y === "number") amount += e.y; else if (per) amount += e.n * per;
    });
    addLogTotal(totals, groupKey, logKind, amount);
  });
  return {
    day: rec.day,
    totals: totals
  };
}

function store0Last() {
  return freshStore().__last || "";
}

export function dailyOrdinal(n) {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  const mod10 = n % 10;
  if (mod10 === 1) return `${n}st`;
  if (mod10 === 2) return `${n}nd`;
  if (mod10 === 3) return `${n}rd`;
  return `${n}th`;
}

const KIND_META = {
  wood: {
    verb: "Chopped",
    action: "chopped",
    unit: "nodes",
    palette: [ "#a0673a", "#d8a060", "#6b4226" ]
  },
  stone: {
    verb: "Mined",
    action: "mined",
    unit: "nodes",
    palette: [ "#b8bcc8", "#7a7f90", "#e6e9f0" ]
  },
  iron: {
    verb: "Mined",
    action: "mined",
    unit: "nodes",
    palette: [ "#9fb4c9", "#e8eef5", "#c27a4a" ]
  },
  gold: {
    verb: "Mined",
    action: "mined",
    unit: "nodes",
    palette: [ "#ffd23f", "#fff3a0", "#d69a1e" ]
  },
  crimstone: {
    verb: "Mined",
    action: "mined",
    unit: "nodes",
    palette: [ "#e43b44", "#ff8a8a", "#a1202a" ]
  },
  honey: {
    verb: "Collected",
    action: "collected",
    unit: "nodes",
    palette: [ "#ffd23f", "#fff3a0", "#d69a1e" ]
  },
  oil: {
    verb: "Drilled",
    action: "drilled",
    unit: "reserves",
    palette: [ "#2b2b3a", "#6a5acd", "#9a8cff" ]
  },
  crop: {
    verb: "Harvested",
    action: "harvested",
    unit: "plots",
    palette: [ "#5fcf4a", "#c9f07a", "#ffe14a" ]
  },
  fruit: {
    verb: "Harvested",
    action: "harvested",
    unit: "patches",
    palette: [ "#ff6b6b", "#ffe14a", "#5fcf4a" ]
  },
  flower: {
    verb: "Harvested",
    action: "harvested",
    unit: "beds",
    palette: [ "#ff8ac8", "#ffe14a", "#c9f07a" ]
  },
  greenhouse: {
    verb: "Harvested",
    action: "harvested",
    unit: "pots",
    palette: [ "#5fcf4a", "#9fe6ff", "#ffe14a" ]
  },
  animal: {
    verb: "Collected",
    action: "collected",
    unit: "animals",
    palette: [ "#ffffff", "#f5d36b", "#ffb347" ]
  }
};

const KIND_NOUN = {
  Wood: "Tree",
  Stone: "Stone",
  Iron: "Iron",
  Gold: "Gold",
  Crimstone: "Crimstone",
  Oil: "Oil",
  Honey: "Beehive"
};

const PARTICLES = [ [ 2, 9, -5, -7 ], [ 9, 2, 6, -6 ], [ 11, 8, 7, 3 ], [ 4, 11, -6, 4 ], [ 6, 1, 1, -8 ], [ 12, 5, 8, -2 ] ];

function effectSvg(kind) {
  const meta = KIND_META[kind];
  if (!meta) return "";
  const rects = PARTICLES.map(([x, y, dx, dy], i) => `<rect class="dh-p" x="${x}" y="${y}" width="2" height="2" fill="${meta.palette[i % meta.palette.length]}" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${i * 18}ms"/>`).join("");
  return `<svg class="dh-fx" viewBox="0 0 14 14" width="14" height="14" shape-rendering="crispEdges" aria-hidden="true"><path class="dh-slash" d="M2 2h2v2h2v2h2v2h2v2h2" fill="none" stroke="#ffffff" stroke-width="1.4"/>${rects}</svg>`;
}

function escapeAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function dailyHarvestBadgeHtml(groupKey, kind, iconHtml, farmId) {
  if (!KIND_META[kind]) return "";
  const info = dailyHarvestInfo(groupKey, farmId);
  if (!info) return "";
  return `<span class="daily-harvest-badge guro-frame dh-${kind}" role="button" tabindex="0" data-dh-key="${escapeAttr(groupKey)}" data-dh-kind="${kind}" data-dh-farm="${escapeAttr(farmId || "")}"><span class="dh-ord">${info.estimated ? "~" : ""}${info.rounds}x</span><span class="dh-icon">${iconHtml || ""}${effectSvg(kind)}</span></span>`;
}

function formatResetIn(now) {
  const next = utcDayStart(now) + 864e5;
  const mins = Math.max(0, Math.floor((next - now) / 6e4));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function formatClock(ms) {
  if (!ms) return "Just now";
  try {
    return new Date(ms).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (e) {
    return "Today";
  }
}

function formatLogClock(ms) {
  const d = new Date(ms);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h % 12 || 12}:${m}${h < 12 ? "AM" : "PM"}`;
}

const LOG_MERGE_GAP = 10 * 60 * 1000;

function formatLogYield(y) {
  return y.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function splitEntryByProduct(e, products) {
  if (e.p && typeof e.p === "object") {
    return products.map(pr => typeof e.p[pr.name] === "number" ? e.p[pr.name] : 0);
  }
  const sumPer = products.reduce((sum, pr) => sum + pr.per, 0);
  if (typeof e.y === "number") {
    return products.map(pr => sumPer > 0 ? e.y * pr.per / sumPer : 0);
  }
  return products.map(pr => e.n * pr.per);
}

function multiYieldHtml(values, products) {
  const lines = values.map((v, i) => v > 1e-9 ? `<span class="dh-log-yield">+${formatLogYield(v)}<span class="dh-log-ico">${products[i].icon}</span></span>` : "").join("");
  return `<span class="dh-log-multi">${lines || "—"}</span>`;
}

function logHtmlProducts(meta, info) {
  const products = meta.products;
  const sorted = info.log.slice().sort((a, b) => b.t - a.t);
  if (!sorted.length) return "";
  const totals = products.map(() => 0);
  const sumPer = products.reduce((sum, pr) => sum + pr.per, 0);
  products.forEach((pr, i) => {
    totals[i] += sumPer > 0 ? (info.dropped || 0) * pr.per / sumPer : 0;
  });
  const merged = [];
  sorted.forEach(e => {
    const parts = splitEntryByProduct(e, products);
    parts.forEach((v, i) => {
      totals[i] += v;
    });
    const last = merged[merged.length - 1];
    if (last && last.t - e.t <= LOG_MERGE_GAP) {
      parts.forEach((v, i) => {
        last.parts[i] += v;
      });
      return;
    }
    merged.push({
      t: e.t,
      parts: parts
    });
  });
  const rows = merged.map(e => `<div class="dh-log-row dh-log-row-multi"><span>${formatLogClock(e.t)}</span>${multiYieldHtml(e.parts, products)}</div>`).join("");
  let gross = 0;
  let fee = 0;
  products.forEach((pr, i) => {
    const g = totals[i] * pr.price;
    gross += g;
    fee += g * pr.feeRate;
  });
  const net = gross - fee;
  const valueRows = gross > 0 ? `<div class="dh-log-row"><span>Gross</span><span class="dh-log-yield">${formatLogYield(gross)}<span class="dh-log-ico">${FLOWER_ICON}</span></span></div><div class="dh-log-row"><span>Net</span><span class="dh-log-yield">${formatLogYield(net)}<span class="dh-log-ico">${FLOWER_ICON}</span></span></div>` : "";
  const sumHtml = `<div class="dh-log-sum"><div class="dh-log-row dh-log-row-multi dh-log-total"><span>Total</span>${multiYieldHtml(totals, products)}</div>${valueRows}</div>`;
  return `<div class="dh-pop-log guro-frame"><div class="dh-log-head"><span>Time</span><span>Harvested</span></div><div class="dh-log-list">${rows}</div>${sumHtml}</div>`;
}

function logHtml(groupKey, info) {
  const meta = yieldMeta[groupKey] || {
    per: 0,
    icon: "",
    price: 0,
    feeRate: 0,
    products: null
  };
  if (meta.products) return logHtmlProducts(meta, info);
  const sorted = info.log.slice().sort((a, b) => b.t - a.t);
  if (!sorted.length) return "";
  let total = info.dropped || 0;
  const merged = [];
  sorted.forEach(e => {
    const y = typeof e.y === "number" ? e.y : meta.per ? e.n * meta.per : null;
    if (y !== null) total += y;
    const last = merged[merged.length - 1];
    if (last && last.t - e.t <= LOG_MERGE_GAP) {
      if (y !== null) last.y = (last.y || 0) + y;
      return;
    }
    merged.push({
      t: e.t,
      y
    });
  });
  const rows = merged.map(e => {
    const amount = e.y === null ? "—" : `+${formatLogYield(e.y)}`;
    return `<div class="dh-log-row"><span>${formatLogClock(e.t)}</span><span class="dh-log-yield">${amount}<span class="dh-log-ico">${meta.icon}</span></span></div>`;
  }).join("");
  const gross = total * meta.price;
  const net = gross - gross * meta.feeRate;
  const valueRows = meta.price > 0 ? `<div class="dh-log-row"><span>Gross</span><span class="dh-log-yield">${formatLogYield(gross)}<span class="dh-log-ico">${FLOWER_ICON}</span></span></div><div class="dh-log-row"><span>Net</span><span class="dh-log-yield">${formatLogYield(net)}<span class="dh-log-ico">${FLOWER_ICON}</span></span></div>` : "";
  const sumHtml = `<div class="dh-log-sum"><div class="dh-log-row dh-log-total"><span>Total</span><span class="dh-log-yield">+${formatLogYield(total)}<span class="dh-log-ico">${meta.icon}</span></span></div>${valueRows}</div>`;
  return `<div class="dh-pop-log guro-frame"><div class="dh-log-head"><span>Time</span><span>Harvested</span></div><div class="dh-log-list">${rows}</div>${sumHtml}</div>`;
}

function closeDailyPop() {
  const el = document.getElementById("dailyHarvestPop");
  if (el) el.remove();
  document.documentElement.classList.remove("dh-pop-lock");
}

function openDailyPop(badgeEl) {
  const groupKey = badgeEl.getAttribute("data-dh-key");
  const kind = badgeEl.getAttribute("data-dh-kind");
  const meta = KIND_META[kind];
  const info = dailyHarvestInfo(groupKey, badgeEl.getAttribute("data-dh-farm") || "");
  if (!meta || !info) return;
  closeDailyPop();
  const noun = KIND_NOUN[groupKey] || groupKey;
  const iconEl = badgeEl.querySelector(".dh-icon");
  const iconHtml = iconEl ? iconEl.innerHTML : "";
  const times = `${info.estimated ? "~" : ""}${info.rounds}x`;
  const safeNoun = escapeAttr(noun);
  const bodyText = kind === "animal" ? `Your ${safeNoun} produce has been ${meta.action} ${times} today. A round is counted once all of your ${safeNoun} animals (${info.need} of ${info.total}) have been ${meta.action}.` : `Your ${safeNoun} ${meta.unit} have been ${meta.action} ${times} today. A round is counted once all of them (${info.need} of ${info.total}) have been ${meta.action}.`;
  const now = Date.now();
  const html = `<div class="dh-pop-back" id="dailyHarvestPop"><div class="dh-pop guro-frame dh-${kind}" role="dialog" aria-modal="true"><div class="dh-pop-top"><span class="dh-pop-top-title">Daily Harvest · UTC</span><span class="dh-pop-top-acts"><button type="button" class="dh-pop-log-btn" data-dh-log="${escapeAttr(badgeEl.getAttribute("data-dh-farm") || store0Last())}">Log</button><button type="button" class="dh-pop-x" data-dh-close="1" aria-label="Close"></button></span></div><div class="dh-pop-head"><span class="dh-pop-icon guro-frame dh-icon">${iconHtml}</span><div class="dh-pop-headtext guro-frame"><div class="dh-pop-title dh-pop-title-solo">${escapeAttr(noun)}</div></div><span class="dh-pop-ord guro-frame">${info.estimated ? "~" : ""}${info.rounds}x</span></div><div class="dh-pop-main guro-frame">${meta.verb} <b>${times}</b> today</div><p class="dh-pop-text">${bodyText}</p><div class="dh-pop-stats guro-frame"><div class="dh-stat"><span>Accuracy</span><b>${info.estimated ? "Estimated" : "Exact"}</b></div><div class="dh-stat"><span>Next round</span><b>${info.nextProgress} / ${info.need}</b></div><div class="dh-stat"><span>Last completed</span><b>${formatClock(info.lastAt)}</b></div><div class="dh-stat"><span>Resets in</span><b>${formatResetIn(now)}</b></div></div>${logHtml(groupKey, info)}${info.estimated ? `<p class="dh-pop-text dh-pop-note">Includes harvests made between syncs, estimated from your lifetime activity counters.</p>` : ""}</div></div>`;
  document.body.insertAdjacentHTML("beforeend", html);
  document.documentElement.classList.add("dh-pop-lock");
}

document.addEventListener("click", e => {
  const target = e.target;
  if (!target || !target.closest) return;
  const logBtn = target.closest("[data-dh-log]");
  if (logBtn) {
    e.stopPropagation();
    e.preventDefault();
    document.dispatchEvent(new CustomEvent("dh-open-log", {
      detail: {
        farm: logBtn.getAttribute("data-dh-log") || ""
      }
    }));
    return;
  }
  if (target.closest("[data-dh-close]")) {
    e.stopPropagation();
    closeDailyPop();
    return;
  }
  const backdrop = target.closest(".dh-pop-back");
  if (backdrop && target === backdrop) {
    closeDailyPop();
    return;
  }
  const badge = target.closest(".daily-harvest-badge");
  if (!badge) return;
  e.stopPropagation();
  e.preventDefault();
  openDailyPop(badge);
}, true);

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeDailyPop();
  if ((e.key === "Enter" || e.key === " ") && e.target && e.target.classList && e.target.classList.contains("daily-harvest-badge")) {
    e.preventDefault();
    e.stopPropagation();
    openDailyPop(e.target);
  }
}, true);
