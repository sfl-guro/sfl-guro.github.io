const HOUR_MS = 60 * 60 * 1e3;

const DAY_MS = 24 * HOUR_MS;

export const BOOST_EXPIRY_MS = {
  "Time Warp Totem": 4 * HOUR_MS,
  "Gourmet Hourglass": 6 * HOUR_MS,
  "Harvest Hourglass": 9 * HOUR_MS,
  "Timber Hourglass": 4 * HOUR_MS,
  "Ore Hourglass": 5 * HOUR_MS,
  "Orchard Hourglass": 8 * HOUR_MS,
  "Blossom Hourglass": 12 * HOUR_MS,
  "Fisher's Hourglass": 4 * HOUR_MS,
  "Super Totem": 7 * DAY_MS,
  "Legendary Shrine": DAY_MS,
  "Obsidian Shrine": 14 * DAY_MS,
  "Trading Shrine": 30 * DAY_MS
};

[ "Sparrow Shrine", "Toucan Shrine", "Collie Shrine", "Badger Shrine", "Stag Shrine", "Mole Shrine", "Bear Shrine", "Tortoise Shrine", "Moth Shrine", "Bantam Shrine", "Fox Shrine", "Boar Shrine", "Hound Shrine" ].forEach(name => {
  BOOST_EXPIRY_MS[name] = 7 * DAY_MS;
});

export const CROP_PLOT_SPEED = {
  "Sparrow Shrine": 1.35,
  "Harvest Hourglass": 1.35,
  "Super Totem": 2,
  "Time Warp Totem": 2,
  "Power hour": 2,
  "Rapid Root": 2,
  "Sproutroot Surprise": 2,
  sunshower: 2,
  sunshowerGuardian: 2
};

export const TREE_SPEED = {
  totem: 2,
  "Timber Hourglass": 1.35,
  "Badger Shrine": 1.35
};

export const MINE_SPEED = {
  totem: 2,
  "Ore Hourglass": 2,
  "Badger Shrine": 1.35,
  "Mole Shrine": 1.35
};

export const FRUIT_SPEED = {
  totem: 2,
  "Orchard Hourglass": 1.35,
  "Toucan Shrine": 1.35,
  "Turbofruit Mix": 1.25
};

export const FLOWER_SPEED = {
  "Blossom Hourglass": 1.35,
  "Moth Shrine": 1.35
};

export const OIL_SPEED = {
  "Stag Shrine": 1.35
};

export const ANIMAL_SPEED = {
  "Collie Shrine": 1.35,
  "Bantam Shrine": 1.35
};

export const ANIMAL_SLEEP_SHRINE = {
  Chicken: "Bantam Shrine",
  Cow: "Collie Shrine",
  Sheep: "Collie Shrine"
};

export const COOKING_SPEED = {
  totem: 2,
  "Gourmet Hourglass": 2,
  "Legendary Shrine": 2,
  "Boar Shrine": 1.25
};

export const CRAFTING_SPEED = {
  totem: 2,
  "Fox Shrine": 1.35
};

export const GREENHOUSE_SPEED = {
  totem: 2,
  "Harvest Hourglass": 1.35,
  "Orchard Hourglass": 1.35,
  "Tortoise Shrine": 1.5,
  "Greenhouse Glow": 1.25
};

export const CROP_MACHINE_SPEED = {
  "Tortoise Shrine": 10 / 9
};

const SEASON_ROTATION = [ "spring", "summer", "autumn", "winter" ];

const FIRST_WEEK_START_AT = Date.UTC(2024, 11, 16);

const GUARDIAN_BY_SEASON = {
  spring: "Spring Guardian",
  summer: "Summer Guardian",
  autumn: "Autumn Guardian",
  winter: "Winter Guardian"
};

function seasonAt(ts) {
  const days = Math.floor((ts - FIRST_WEEK_START_AT) / DAY_MS);
  const weeks = Math.max(Math.floor(days / 7), 0);
  return SEASON_ROTATION[weeks % 4];
}

function asObj(v) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : null;
}

function field(g, key) {
  if (!g) return null;
  if (g[key] != null) return g[key];
  if (g.land && g.land[key] != null) return g.land[key];
  return null;
}

function collectibleBags(g) {
  const bags = [];
  const farmBag = asObj(field(g, "collectibles"));
  if (farmBag) bags.push(farmBag);
  const home = asObj(g && g.home);
  if (home) {
    const b = asObj(home.collectibles != null ? home.collectibles : home.land && home.land.collectibles);
    if (b) bags.push(b);
  }
  const interior = asObj(g && g.interior);
  if (interior) {
    Object.keys(interior).forEach(k => {
      const level = asObj(interior[k]);
      const b = level && asObj(level.collectibles);
      if (b) bags.push(b);
    });
  }
  return bags;
}

export function placementsOf(g, name) {
  const out = [];
  collectibleBags(g).forEach(bag => {
    const arr = bag[name];
    if (Array.isArray(arr)) arr.forEach(p => {
      if (p && typeof p === "object") out.push(p);
    });
  });
  return out;
}

export function mergeWindows(windows) {
  if (windows.length <= 1) return windows;
  const sorted = [ ...windows ].sort((a, b) => a.from - b.from);
  const merged = [ {
    ...sorted[0]
  } ];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const cur = sorted[i];
    if (cur.speed === last.speed && cur.from <= last.to) {
      last.to = Math.max(last.to, cur.to);
    } else {
      merged.push({
        ...cur
      });
    }
  }
  return merged;
}

export function collectibleExpiry(name, placed) {
  const dur = BOOST_EXPIRY_MS[name];
  return (typeof placed.createdAt === "number" ? placed.createdAt : 0) + (dur || 0) + (typeof placed.extendedMs === "number" ? placed.extendedMs : 0);
}

export function boostWindowsFor(g, name, speed) {
  const live = placementsOf(g, name).filter(p => typeof p.createdAt === "number").map(p => {
    const expiry = collectibleExpiry(name, p);
    const to = typeof p.removedAt === "number" ? Math.min(expiry, p.removedAt) : expiry;
    return {
      from: p.createdAt,
      to: to,
      speed: speed
    };
  });
  const hist = boostHistoryOf(g, name).map(w => ({
    from: w.from,
    to: w.to,
    speed: speed
  }));
  return mergeWindows(live.concat(hist).filter(w => w.to > w.from));
}

function boostHistoryOf(g, name) {
  const h = asObj(field(g, "boostHistory"));
  const arr = h && h[name];
  return Array.isArray(arr) ? arr.filter(w => w && typeof w.from === "number" && typeof w.to === "number") : [];
}

function mergedTotemWindows(g, speed) {
  return mergeWindows(boostWindowsFor(g, "Super Totem", speed).concat(boostWindowsFor(g, "Time Warp Totem", speed)));
}

export function powerHourWindows(g) {
  const speed = CROP_PLOT_SPEED["Power hour"];
  const buffs = asObj(field(g, "buffs"));
  const buff = buffs && asObj(buffs["Power hour"]);
  const live = buff && typeof buff.startedAt === "number" ? [ {
    from: buff.startedAt,
    to: buff.startedAt + (typeof buff.durationMS === "number" ? buff.durationMS : HOUR_MS),
    speed: speed
  } ] : [];
  const hist = boostHistoryOf(g, "Power hour").filter(w => !buff || w.from !== buff.startedAt).map(w => ({
    from: w.from,
    to: w.to,
    speed: speed
  }));
  return mergeWindows(live.concat(hist).filter(w => w.to > w.from));
}

function sunshowerWindows(g) {
  const speed = CROP_PLOT_SPEED.sunshower;
  const hist = boostHistoryOf(g, "Sunshower").map(w => ({
    from: w.from,
    to: w.to,
    speed: speed
  }));
  const calendar = asObj(field(g, "calendar"));
  const sun = calendar && asObj(calendar.sunshower);
  if (sun && typeof sun.startedAt === "number" && !hist.some(w => w.from === sun.startedAt)) {
    const d = new Date(sun.startedAt);
    const to = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
    return [ {
      from: sun.startedAt,
      to: to,
      speed: speed
    } ].concat(hist);
  }
  return hist;
}

function sunshowerGuardianWindows(g) {
  const speed = CROP_PLOT_SPEED.sunshowerGuardian;
  const out = [];
  sunshowerWindows(g).forEach(sun => {
    const guardian = GUARDIAN_BY_SEASON[seasonAt(sun.from)];
    if (!guardian) return;
    const placed = placementsOf(g, guardian).filter(p => p.coordinates).map(p => ({
      from: typeof p.placedAt === "number" ? p.placedAt : 0,
      to: Number.MAX_SAFE_INTEGER
    })).concat(boostHistoryOf(g, guardian));
    placed.forEach(p => {
      const from = Math.max(p.from, sun.from);
      const to = Math.min(p.to, sun.to);
      if (to > from) out.push({
        from: from,
        to: to,
        speed: speed
      });
    });
  });
  return mergeWindows(out);
}

export function cropPlotWindows(g) {
  return [ ...boostWindowsFor(g, "Sparrow Shrine", CROP_PLOT_SPEED["Sparrow Shrine"]), ...boostWindowsFor(g, "Harvest Hourglass", CROP_PLOT_SPEED["Harvest Hourglass"]), ...mergedTotemWindows(g, CROP_PLOT_SPEED["Super Totem"]), ...powerHourWindows(g), ...sunshowerWindows(g), ...sunshowerGuardianWindows(g) ];
}

export function treeWindows(g) {
  return [ ...mergedTotemWindows(g, TREE_SPEED.totem), ...boostWindowsFor(g, "Timber Hourglass", TREE_SPEED["Timber Hourglass"]), ...boostWindowsFor(g, "Badger Shrine", TREE_SPEED["Badger Shrine"]) ];
}

export function mineWindows(g, family) {
  if (family === "crimstone") return boostWindowsFor(g, "Mole Shrine", MINE_SPEED["Mole Shrine"]);
  if (family === "stone") {
    return [ ...mergedTotemWindows(g, MINE_SPEED.totem), ...boostWindowsFor(g, "Ore Hourglass", MINE_SPEED["Ore Hourglass"]), ...boostWindowsFor(g, "Badger Shrine", MINE_SPEED["Badger Shrine"]) ];
  }
  if (family === "iron" || family === "gold") {
    return [ ...mergedTotemWindows(g, MINE_SPEED.totem), ...boostWindowsFor(g, "Ore Hourglass", MINE_SPEED["Ore Hourglass"]), ...boostWindowsFor(g, "Mole Shrine", MINE_SPEED["Mole Shrine"]) ];
  }
  return [];
}

export function fruitWindows(g) {
  return [ ...mergedTotemWindows(g, FRUIT_SPEED.totem), ...boostWindowsFor(g, "Orchard Hourglass", FRUIT_SPEED["Orchard Hourglass"]), ...boostWindowsFor(g, "Toucan Shrine", FRUIT_SPEED["Toucan Shrine"]) ];
}

export function flowerWindows(g) {
  return [ ...boostWindowsFor(g, "Blossom Hourglass", FLOWER_SPEED["Blossom Hourglass"]), ...boostWindowsFor(g, "Moth Shrine", FLOWER_SPEED["Moth Shrine"]) ];
}

export function oilWindows(g) {
  return boostWindowsFor(g, "Stag Shrine", OIL_SPEED["Stag Shrine"]);
}

export function animalWindows(g, animalType) {
  const name = ANIMAL_SLEEP_SHRINE[animalType];
  if (!name) return [];
  return boostWindowsFor(g, name, ANIMAL_SPEED[name]);
}

export function cookingWindows(g) {
  return [ ...mergedTotemWindows(g, COOKING_SPEED.totem), ...boostWindowsFor(g, "Gourmet Hourglass", COOKING_SPEED["Gourmet Hourglass"]), ...boostWindowsFor(g, "Legendary Shrine", COOKING_SPEED["Legendary Shrine"]), ...boostWindowsFor(g, "Boar Shrine", COOKING_SPEED["Boar Shrine"]) ];
}

export function greenhouseWindows(g, plantName) {
  const shared = [ ...mergedTotemWindows(g, GREENHOUSE_SPEED.totem), ...boostWindowsFor(g, "Tortoise Shrine", GREENHOUSE_SPEED["Tortoise Shrine"]) ];
  if (plantName === "Rice" || plantName === "Olive") {
    return shared.concat(boostWindowsFor(g, "Harvest Hourglass", GREENHOUSE_SPEED["Harvest Hourglass"]));
  }
  if (plantName === "Grape") {
    return shared.concat(boostWindowsFor(g, "Orchard Hourglass", GREENHOUSE_SPEED["Orchard Hourglass"]));
  }
  return shared;
}

function openWindow(fertiliser, names, speedOf) {
  if (!fertiliser || !names.includes(fertiliser.name) || typeof fertiliser.fertilisedAt !== "number") return [];
  return [ {
    from: fertiliser.fertilisedAt,
    to: Number.MAX_SAFE_INTEGER,
    speed: speedOf(fertiliser.name)
  } ];
}

export function cropFertiliserWindows(fertiliser) {
  return openWindow(fertiliser, [ "Rapid Root", "Sproutroot Surprise" ], n => CROP_PLOT_SPEED[n]);
}

export function turbofruitWindows(fertiliser) {
  return openWindow(fertiliser, [ "Turbofruit Mix" ], () => FRUIT_SPEED["Turbofruit Mix"]);
}

export function greenhouseGlowWindows(fertiliser) {
  return openWindow(fertiliser, [ "Greenhouse Glow" ], () => GREENHOUSE_SPEED["Greenhouse Glow"]);
}

function buildSegments(startedAt, windows) {
  const clipped = windows.map(w => ({
    from: Math.max(w.from, startedAt),
    to: w.to,
    speed: w.speed
  })).filter(w => w.to > w.from);
  if (!clipped.length) return [];
  const boundaries = [ ...new Set([ startedAt, ...clipped.flatMap(w => [ w.from, w.to ]) ]) ].sort((a, b) => a - b);
  const segments = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const from = boundaries[i];
    const to = boundaries[i + 1];
    const mid = (from + to) / 2;
    const speed = clipped.reduce((acc, w) => w.from <= mid && mid < w.to ? acc * w.speed : acc, 1);
    segments.push({
      from: from,
      to: to,
      speed: speed
    });
  }
  return segments;
}

export function computeReadyAt({startedAt, baseDurationMs, windows}) {
  if (!(baseDurationMs > 0)) return startedAt;
  const segments = buildSegments(startedAt, windows);
  let accumulated = 0;
  for (const seg of segments) {
    const work = (seg.to - seg.from) * seg.speed;
    if (accumulated + work >= baseDurationMs) {
      return seg.from + (baseDurationMs - accumulated) / seg.speed;
    }
    accumulated += work;
  }
  const tailStart = segments.length ? segments[segments.length - 1].to : startedAt;
  return tailStart + (baseDurationMs - accumulated);
}

export function workAccruedAt({startedAt, at, windows}) {
  if (at <= startedAt) return 0;
  const segments = buildSegments(startedAt, windows);
  let work = 0;
  for (const seg of segments) {
    if (at <= seg.from) return work;
    const end = Math.min(at, seg.to);
    work += (end - seg.from) * seg.speed;
    if (at <= seg.to) return work;
  }
  const tailStart = segments.length ? segments[segments.length - 1].to : startedAt;
  if (at > tailStart) work += at - tailStart;
  return work;
}

export function effectiveSpeedAt(at, windows) {
  return windows.reduce((speed, w) => w.from <= at && at < w.to ? speed * w.speed : speed, 1);
}

export function remainingSecFor({startedAt, baseDurationMs, windows, now}) {
  const readyAt = computeReadyAt({
    startedAt: startedAt,
    baseDurationMs: baseDurationMs,
    windows: windows
  });
  return Math.max(0, (readyAt - now) / 1e3);
}

export function growDurationMsFor({startedAt, baseDurationMs, windows}) {
  return computeReadyAt({
    startedAt: startedAt,
    baseDurationMs: baseDurationMs,
    windows: windows
  }) - startedAt;
}

export const COOKING_OIL_RATE = {
  "Fire Pit": 1,
  Kitchen: 5,
  "Smoothie Shack": 8,
  Bakery: 10,
  Deli: 12
};

export const COOKING_OIL_CLOCK_RATE = {
  "Fire Pit": 1.25,
  Kitchen: 6.75,
  "Smoothie Shack": 11.5,
  Bakery: 15.5,
  Deli: 20
};

export function resolveCookingQueue({crafting, windows, oil, buildingName}) {
  let previousReadyAt;
  let tank = oil ? Math.max(oil.tank, 0) : 0;
  const clockRate = COOKING_OIL_CLOCK_RATE[buildingName] || 0;
  return crafting.map(recipe => {
    const baseDurationMs = recipe.baseDurationMs;
    const startedAt = recipe.startedAt !== undefined ? recipe.startedAt : previousReadyAt;
    if (typeof baseDurationMs !== "number" || startedAt === undefined) {
      previousReadyAt = recipe.readyAt;
      return {
        startedAt: startedAt,
        readyAt: recipe.readyAt
      };
    }
    if (!oil || recipe.oilBoost === undefined || tank <= 0) {
      const readyAt = computeReadyAt({
        startedAt: startedAt,
        baseDurationMs: baseDurationMs,
        windows: windows
      });
      previousReadyAt = readyAt;
      return {
        startedAt: startedAt,
        readyAt: readyAt
      };
    }
    const from = Math.max(startedAt, oil.settledAt);
    const speed = 1 / (1 - recipe.oilBoost);
    if (recipe.oilRate === undefined) {
      const fuelled = {
        from: from,
        to: from + tank / clockRate * DAY_MS,
        speed: speed
      };
      const readyAt = computeReadyAt({
        startedAt: startedAt,
        baseDurationMs: baseDurationMs,
        windows: [ ...windows, fuelled ]
      });
      previousReadyAt = readyAt;
      const to = Math.min(readyAt, fuelled.to);
      if (to > from) tank -= (to - from) / DAY_MS * clockRate;
      return {
        startedAt: startedAt,
        readyAt: readyAt
      };
    }
    const oilRate = recipe.oilRate;
    if (!(oilRate > 0)) {
      const readyAt = computeReadyAt({
        startedAt: startedAt,
        baseDurationMs: baseDurationMs,
        windows: windows
      });
      previousReadyAt = readyAt;
      return {
        startedAt: startedAt,
        readyAt: readyAt
      };
    }
    const fuelledWork = Math.min(baseDurationMs - workAccruedAt({
      startedAt: startedAt,
      at: from,
      windows: windows
    }), tank / oilRate * DAY_MS);
    if (!(fuelledWork > 0)) {
      const readyAt = computeReadyAt({
        startedAt: startedAt,
        baseDurationMs: baseDurationMs,
        windows: windows
      });
      previousReadyAt = readyAt;
      return {
        startedAt: startedAt,
        readyAt: readyAt
      };
    }
    const to = computeReadyAt({
      startedAt: from,
      baseDurationMs: fuelledWork,
      windows: [ ...windows, {
        from: from,
        to: from + fuelledWork,
        speed: speed
      } ]
    });
    const readyAt = computeReadyAt({
      startedAt: startedAt,
      baseDurationMs: baseDurationMs,
      windows: [ ...windows, {
        from: from,
        to: to,
        speed: speed
      } ]
    });
    previousReadyAt = readyAt;
    tank -= fuelledWork / DAY_MS * oilRate;
    return {
      startedAt: startedAt,
      readyAt: readyAt
    };
  });
}
