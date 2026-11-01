export const CAVE_WIDTH = 5;

const TILE_COUNT = CAVE_WIDTH * CAVE_WIDTH;

const BEETLES = [ "Green Beetle", "Blue Beetle", "Pink Beetle", "Amber Beetle" ];

const BEETLE_WEIGHTS = {
  "Green Beetle": 40,
  "Blue Beetle": 30,
  "Pink Beetle": 20,
  "Amber Beetle": 10
};

const MAGIC_CHANCE = 0.1;

export const CAVE_RECIPES = {
  Mushroom: {
    Mushroom: 6,
    Beetle: 2,
    Mud: 17,
    mud: 1
  },
  Beetle: {
    Mushroom: 3,
    Beetle: 5,
    Mud: 17,
    mud: 1
  },
  Mud: {
    Mushroom: 3,
    Beetle: 2,
    Mud: 20,
    mud: 2
  }
};

export function caveKey(x, y) {
  return x + "," + y;
}

function parseKey(key) {
  const parts = String(key).split(",").map(Number);
  const x = parts[0];
  const y = parts[1];
  if (!Number.isInteger(x) || !Number.isInteger(y)) return null;
  if (x < 0 || y < 0 || x >= CAVE_WIDTH || y >= CAVE_WIDTH) return null;
  return {
    x: x,
    y: y
  };
}

export function isCaveSeed(seed) {
  return typeof seed === "string" && /^[0-9a-f]{32}$/.test(seed);
}

function sfc32(a, b, c, d) {
  const next = () => {
    const t = (a + b | 0) + d | 0;
    d = d + 1 | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = c << 21 | c >>> 11;
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
  };
  for (let i = 0; i < 15; i += 1) next();
  return next;
}

function seedWords(seed) {
  const word = i => parseInt(seed.slice(i * 8, i * 8 + 8), 16) | 0;
  return [ word(0), word(1), word(2), word(3) ];
}

function rollBeetle(random, weights) {
  const roll = random() * 100;
  let cumulative = 0;
  for (const beetle of BEETLES) {
    cumulative += weights[beetle];
    if (roll < cumulative) return beetle;
  }
  return BEETLES[BEETLES.length - 1];
}

export function caveComposition(recipe, skills) {
  const base = CAVE_RECIPES[recipe] || CAVE_RECIPES.Mushroom;
  const extraMushroom = skills && skills.extraMushroomTiles || 0;
  const extraBeetle = skills && skills.extraBeetleTiles || 0;
  return {
    Mushroom: base.Mushroom + extraMushroom,
    Beetle: base.Beetle + extraBeetle,
    Mud: base.Mud - extraMushroom - extraBeetle
  };
}

export function generateCaveBoard(recipe, seed, skills) {
  const [a, b, c, d] = seedWords(seed);
  const random = sfc32(a, b, c, d);
  const counts = caveComposition(recipe, skills);
  const weights = skills && skills.beetleRarity || BEETLE_WEIGHTS;
  const mudAmount = (CAVE_RECIPES[recipe] || CAVE_RECIPES.Mushroom).mud;
  const bag = [];
  const push = (kind, count) => {
    for (let i = 0; i < count; i += 1) bag.push(kind);
  };
  push("Mushroom", counts.Mushroom);
  push("Beetle", counts.Beetle);
  push("Mud", counts.Mud);
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = bag[i];
    bag[i] = bag[j];
    bag[j] = tmp;
  }
  const board = {};
  bag.forEach((kind, index) => {
    const x = index % CAVE_WIDTH;
    const y = Math.floor(index / CAVE_WIDTH);
    let tile;
    if (kind === "Beetle") {
      tile = {
        type: "Beetle",
        beetle: rollBeetle(random, weights)
      };
    } else if (kind === "Mud") {
      tile = {
        type: "Mud",
        amount: mudAmount
      };
    } else {
      tile = {
        type: "Mushroom",
        mushroom: random() < MAGIC_CHANCE ? "Magic Mushroom" : "Wild Mushroom"
      };
    }
    board[caveKey(x, y)] = tile;
  });
  return board;
}

const NEIGHBOURS = [ [ 0, -1 ], [ 0, 1 ], [ -1, 0 ], [ 1, 0 ] ];

function boardClue(board, x, y) {
  let count = 0;
  for (const [dx, dy] of NEIGHBOURS) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= CAVE_WIDTH || ny >= CAVE_WIDTH) continue;
    const type = board[caveKey(nx, ny)] && board[caveKey(nx, ny)].type;
    if (type === "Beetle" || type === "Mushroom") count += 1;
  }
  return count;
}

function kindOf(tile) {
  if (tile.type === "Beetle") return "Beetle:" + tile.beetle;
  if (tile.type === "Mushroom") return "Mushroom:" + tile.mushroom;
  return "Mud";
}

export function revealedCaveTiles(batch, initial) {
  const revealed = {};
  const dug = batch.dug || {};
  for (const key of Object.keys(dug)) {
    const at = parseKey(key);
    if (!at) continue;
    const record = dug[key] || {};
    if (record.tile) {
      revealed[key] = record.tile.type === "Beetle" || record.clue === undefined ? {
        tile: record.tile
      } : {
        tile: record.tile,
        clue: record.clue
      };
      continue;
    }
    if (!initial) continue;
    const tile = initial[key];
    if (!tile) continue;
    revealed[key] = tile.type === "Beetle" ? {
      tile: tile
    } : {
      tile: tile,
      clue: boardClue(initial, at.x, at.y)
    };
  }
  return revealed;
}

const PATTERNS = Array.from({
  length: 1 << CAVE_WIDTH
}, (_, p) => p);

const bit = (pattern, x) => pattern >> x & 1;

const popcount = p => bit(p, 0) + bit(p, 1) + bit(p, 2) + bit(p, 3) + bit(p, 4);

export function solveCaveBatch(batch) {
  const hasSeed = isCaveSeed(batch.seed);
  const skills = batch.skills || {};
  const composition = caveComposition(batch.recipe, skills);
  const initial = hasSeed ? generateCaveBoard(batch.recipe, batch.seed, skills) : null;
  const revealed = revealedCaveTiles(batch, initial);
  const width = CAVE_WIDTH;
  const result = {
    hasSeed: hasSeed,
    composition: composition,
    revealed: revealed,
    ok: true,
    total: 0,
    remaining: 0,
    buried: [],
    cells: []
  };
  let buried = [];
  if (hasSeed) {
    for (let i = 0; i < TILE_COUNT; i += 1) {
      const tile = initial[caveKey(i % width, Math.floor(i / width))];
      if (tile.type !== "Mud") buried.push(tile);
    }
  } else {
    for (let i = 0; i < composition.Mushroom; i += 1) buried.push({
      type: "Mushroom",
      mushroom: "Mushroom"
    });
    for (let i = 0; i < composition.Beetle; i += 1) buried.push({
      type: "Beetle",
      beetle: "Beetle"
    });
  }
  const fixed = Array(TILE_COUNT).fill(undefined);
  const clues = Array(TILE_COUNT).fill(undefined);
  let dugCount = 0;
  for (const key of Object.keys(revealed)) {
    const at = parseKey(key);
    const tile = revealed[key].tile;
    const clue = revealed[key].clue;
    const i = at.y * width + at.x;
    dugCount += 1;
    if (tile.type === "Mud") {
      fixed[i] = 0;
    } else {
      fixed[i] = 1;
      let idx = buried.findIndex(c => kindOf(c) === kindOf(tile));
      if (idx < 0 && !hasSeed) idx = buried.findIndex(c => c.type === tile.type);
      if (idx < 0) {
        result.ok = false;
        return result;
      }
      buried.splice(idx, 1);
    }
    if (tile.type !== "Beetle" && clue !== undefined) clues[i] = clue;
  }
  const remaining = buried.length;
  result.buried = buried;
  result.remaining = remaining;
  result.dugCount = dugCount;
  if (remaining > TILE_COUNT - dugCount) {
    result.ok = false;
    return result;
  }
  const candidates = Array.from({
    length: width
  }, (_, r) => PATTERNS.filter(p => {
    for (let x = 0; x < width; x += 1) {
      const known = fixed[r * width + x];
      if (known !== undefined && bit(p, x) !== known) return false;
    }
    return true;
  }));
  const undugCount = (r, p) => {
    let count = 0;
    for (let x = 0; x < width; x += 1) {
      if (fixed[r * width + x] === undefined && bit(p, x)) count += 1;
    }
    return count;
  };
  const rowHasClue = Array.from({
    length: width
  }, (_, r) => clues.slice(r * width, (r + 1) * width).some(c => c !== undefined));
  const rowCluesOk = (r, above, row, below) => {
    if (!rowHasClue[r]) return true;
    for (let x = 0; x < width; x += 1) {
      const clue = clues[r * width + x];
      if (clue === undefined) continue;
      const count = bit(above, x) + bit(below, x) + (x > 0 ? bit(row, x - 1) : 0) + (x < width - 1 ? bit(row, x + 1) : 0);
      if (count !== clue) return false;
    }
    return true;
  };
  const C = remaining + 1;
  const idxOf = (a, p, c) => (a * 32 + p) * C + c;
  const forward = [];
  const backward = [];
  for (let r = 0; r < width; r += 1) {
    forward.push(new Float64Array(32 * 32 * C));
    backward.push(new Float64Array(32 * 32 * C));
  }
  for (const p of candidates[0]) {
    const c = undugCount(0, p);
    if (c <= remaining) forward[0][idxOf(0, p, c)] += 1;
  }
  for (let r = 0; r < width - 1; r += 1) {
    for (const a of r === 0 ? [ 0 ] : candidates[r - 1]) {
      for (const p of candidates[r]) {
        for (let c = 0; c <= remaining; c += 1) {
          const ways = forward[r][idxOf(a, p, c)];
          if (!ways) continue;
          for (const q of candidates[r + 1]) {
            if (!rowCluesOk(r, a, p, q)) continue;
            const nc = c + undugCount(r + 1, q);
            if (nc > remaining) continue;
            forward[r + 1][idxOf(p, q, nc)] += ways;
          }
        }
      }
    }
  }
  const last = width - 1;
  for (const a of candidates[last - 1]) {
    for (const p of candidates[last]) {
      if (rowCluesOk(last, a, p, 0)) backward[last][idxOf(a, p, 0)] = 1;
    }
  }
  for (let r = last - 1; r >= 0; r -= 1) {
    for (const a of r === 0 ? [ 0 ] : candidates[r - 1]) {
      for (const p of candidates[r]) {
        for (const q of candidates[r + 1]) {
          if (!rowCluesOk(r, a, p, q)) continue;
          const add = undugCount(r + 1, q);
          for (let k = add; k <= remaining; k += 1) {
            const ways = backward[r + 1][idxOf(p, q, k - add)];
            if (ways) backward[r][idxOf(a, p, k)] += ways;
          }
        }
      }
    }
  }
  let total = 0;
  for (const a of candidates[last - 1]) {
    for (const p of candidates[last]) {
      for (let c = 0; c <= remaining; c += 1) {
        total += forward[last][idxOf(a, p, c)] * backward[last][idxOf(a, p, remaining - c)];
      }
    }
  }
  result.total = total;
  if (total === 0) {
    result.ok = false;
    return result;
  }
  const hold = new Array(TILE_COUNT).fill(0);
  for (let r = 0; r < width; r += 1) {
    for (const a of r === 0 ? [ 0 ] : candidates[r - 1]) {
      for (const p of candidates[r]) {
        let through = 0;
        for (let c = 0; c <= remaining; c += 1) {
          const f = forward[r][idxOf(a, p, c)];
          if (!f) continue;
          through += f * backward[r][idxOf(a, p, remaining - c)];
        }
        if (!through) continue;
        for (let x = 0; x < width; x += 1) {
          if (bit(p, x)) hold[r * width + x] += through;
        }
      }
    }
  }
  const mushroomLeft = buried.filter(t => t.type === "Mushroom").length;
  const beetleLeft = buried.filter(t => t.type === "Beetle").length;
  const names = {};
  buried.forEach(t => {
    const name = t.type === "Beetle" ? t.beetle : t.mushroom;
    names[name] = (names[name] || 0) + 1;
  });
  result.names = names;
  result.mushroomLeft = mushroomLeft;
  result.beetleLeft = beetleLeft;
  for (let i = 0; i < TILE_COUNT; i += 1) {
    const x = i % width;
    const y = Math.floor(i / width);
    const key = caveKey(x, y);
    if (revealed[key]) {
      result.cells.push({
        x: x,
        y: y,
        dug: true,
        tile: revealed[key].tile,
        clue: revealed[key].clue
      });
      continue;
    }
    const p = remaining === 0 ? 0 : hold[i] / total;
    const certain = hold[i] === total;
    const none = hold[i] === 0;
    const kinds = {};
    if (remaining > 0) {
      for (const name of Object.keys(names)) kinds[name] = p * names[name] / remaining;
    }
    kinds.Mud = 1 - p;
    result.cells.push({
      x: x,
      y: y,
      dug: false,
      p: p,
      certain: certain,
      none: none,
      kinds: kinds,
      single: certain && Object.keys(names).length === 1 ? Object.keys(names)[0] : null
    });
  }
  const undug = result.cells.filter(c => !c.dug);
  let best = null;
  undug.forEach(c => {
    if (!best || c.p > best.p) best = c;
  });
  result.best = best;
  let drill = null;
  for (let top = 0; top < width - 1; top += 1) {
    for (let left = 0; left < width - 1; left += 1) {
      let expected = 0;
      let fresh = 0;
      [ [ 0, 0 ], [ 1, 0 ], [ 0, 1 ], [ 1, 1 ] ].forEach(([dx, dy]) => {
        const cell = result.cells[(top + dy) * width + left + dx];
        if (!cell.dug) {
          expected += cell.p;
          fresh += 1;
        }
      });
      if (fresh && (!drill || expected > drill.expected)) drill = {
        x: left,
        y: top,
        expected: expected,
        fresh: fresh
      };
    }
  }
  result.drill = drill;
  return result;
}
