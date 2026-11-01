import "./chunk.AS3VMXOQ.js";

// src/cave_solver.js
var CAVE_WIDTH = 5;
var TILE_COUNT = CAVE_WIDTH * CAVE_WIDTH;
var BEETLES = ["Green Beetle", "Blue Beetle", "Pink Beetle", "Amber Beetle"];
var BEETLE_WEIGHTS = {
  "Green Beetle": 40,
  "Blue Beetle": 30,
  "Pink Beetle": 20,
  "Amber Beetle": 10
};
var MAGIC_CHANCE = 0.1;
var CAVE_RECIPES = {
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
function caveKey(x, y) {
  return x + "," + y;
}
function parseKey(key) {
  const parts = String(key).split(",").map(Number);
  const x = parts[0];
  const y = parts[1];
  if (!Number.isInteger(x) || !Number.isInteger(y)) return null;
  if (x < 0 || y < 0 || x >= CAVE_WIDTH || y >= CAVE_WIDTH) return null;
  return {
    x,
    y
  };
}
function isCaveSeed(seed) {
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
  const word = (i) => parseInt(seed.slice(i * 8, i * 8 + 8), 16) | 0;
  return [word(0), word(1), word(2), word(3)];
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
function caveComposition(recipe, skills) {
  const base = CAVE_RECIPES[recipe] || CAVE_RECIPES.Mushroom;
  const extraMushroom = skills && skills.extraMushroomTiles || 0;
  const extraBeetle = skills && skills.extraBeetleTiles || 0;
  return {
    Mushroom: base.Mushroom + extraMushroom,
    Beetle: base.Beetle + extraBeetle,
    Mud: base.Mud - extraMushroom - extraBeetle
  };
}
function generateCaveBoard(recipe, seed, skills) {
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
var NEIGHBOURS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
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
function revealedCaveTiles(batch, initial) {
  const revealed = {};
  const dug = batch.dug || {};
  for (const key of Object.keys(dug)) {
    const at = parseKey(key);
    if (!at) continue;
    const record = dug[key] || {};
    if (record.tile) {
      revealed[key] = record.tile.type === "Beetle" || record.clue === void 0 ? {
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
      tile
    } : {
      tile,
      clue: boardClue(initial, at.x, at.y)
    };
  }
  return revealed;
}
var PATTERNS = Array.from({
  length: 1 << CAVE_WIDTH
}, (_, p) => p);
var bit = (pattern, x) => pattern >> x & 1;
function solveCaveBatch(batch) {
  const hasSeed = isCaveSeed(batch.seed);
  const skills = batch.skills || {};
  const composition = caveComposition(batch.recipe, skills);
  const initial = hasSeed ? generateCaveBoard(batch.recipe, batch.seed, skills) : null;
  const revealed = revealedCaveTiles(batch, initial);
  const width = CAVE_WIDTH;
  const result = {
    hasSeed,
    composition,
    revealed,
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
  const fixed = Array(TILE_COUNT).fill(void 0);
  const clues = Array(TILE_COUNT).fill(void 0);
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
      let idx = buried.findIndex((c) => kindOf(c) === kindOf(tile));
      if (idx < 0 && !hasSeed) idx = buried.findIndex((c) => c.type === tile.type);
      if (idx < 0) {
        result.ok = false;
        return result;
      }
      buried.splice(idx, 1);
    }
    if (tile.type !== "Beetle" && clue !== void 0) clues[i] = clue;
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
  }, (_, r) => PATTERNS.filter((p) => {
    for (let x = 0; x < width; x += 1) {
      const known = fixed[r * width + x];
      if (known !== void 0 && bit(p, x) !== known) return false;
    }
    return true;
  }));
  const undugCount = (r, p) => {
    let count = 0;
    for (let x = 0; x < width; x += 1) {
      if (fixed[r * width + x] === void 0 && bit(p, x)) count += 1;
    }
    return count;
  };
  const rowHasClue = Array.from({
    length: width
  }, (_, r) => clues.slice(r * width, (r + 1) * width).some((c) => c !== void 0));
  const rowCluesOk = (r, above, row, below) => {
    if (!rowHasClue[r]) return true;
    for (let x = 0; x < width; x += 1) {
      const clue = clues[r * width + x];
      if (clue === void 0) continue;
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
    for (const a of r === 0 ? [0] : candidates[r - 1]) {
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
    for (const a of r === 0 ? [0] : candidates[r - 1]) {
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
    for (const a of r === 0 ? [0] : candidates[r - 1]) {
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
  const mushroomLeft = buried.filter((t) => t.type === "Mushroom").length;
  const beetleLeft = buried.filter((t) => t.type === "Beetle").length;
  const names = {};
  buried.forEach((t) => {
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
        x,
        y,
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
      x,
      y,
      dug: false,
      p,
      certain,
      none,
      kinds,
      single: certain && Object.keys(names).length === 1 ? Object.keys(names)[0] : null
    });
  }
  const undug = result.cells.filter((c) => !c.dug);
  let best = null;
  undug.forEach((c) => {
    if (!best || c.p > best.p) best = c;
  });
  result.best = best;
  let drill = null;
  for (let top = 0; top < width - 1; top += 1) {
    for (let left = 0; left < width - 1; left += 1) {
      let expected = 0;
      let fresh = 0;
      [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([dx, dy]) => {
        const cell = result.cells[(top + dy) * width + left + dx];
        if (!cell.dug) {
          expected += cell.p;
          fresh += 1;
        }
      });
      if (fresh && (!drill || expected > drill.expected)) drill = {
        x: left,
        y: top,
        expected,
        fresh
      };
    }
  }
  result.drill = drill;
  return result;
}

// src/pages/cavesolver.js
var COLS = ["A", "B", "C", "D", "E"];
var BEETLE_COLORS = {
  Beetle: "#8d6e4a"
};
var RECIPE_LABELS = {
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
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function getGame() {
  const state = apiRef.inprogress.farmPanelGameState;
  if (!state) return null;
  return apiRef.calc.farmSyncExtractGameState(state);
}
var KEEP_CHANCE = {
  "Sturdy Shovel": [0.1, 0.2, 0.3],
  "Sturdy Drill": [0.2, 0.3, 0.4]
};
function keepChance(game, skill) {
  const skills = game && game.bumpkin && game.bumpkin.skills;
  if (!skills || typeof skills !== "object") return 0;
  const key = Object.keys(skills).find((k) => k.trim().toLowerCase() === skill.toLowerCase());
  if (!key) return 0;
  const level = Math.min(Math.max(Math.round(Number(skills[key])) || 1, 1), 3);
  return KEEP_CHANCE[skill][level - 1];
}
function toolCostHtml(game, shovels, drills) {
  const sh = keepChance(game, "Sturdy Shovel");
  const dr = keepChance(game, "Sturdy Drill");
  const fmt = (n) => (Math.round(n * 100) / 100).toString();
  const part = (icon, label, chance, count) => {
    if (!chance) return `${icon} ${label}: 1 per use`;
    const avg = 1 - chance;
    const uses = avg > 0 ? Math.floor(count / avg) : 0;
    return `${icon} ${label}: ${Math.round(chance * 100)}% kept \xB7 avg ${fmt(avg)} per use \xB7 about ${uses} uses from ${count}`;
  };
  const getIcon = apiRef.ui.getIcon;
  return `<br>${part(getIcon("Sturdy Shovel"), "Sturdy Shovel", sh, shovels)}<br>${part(getIcon("Sturdy Drill"), "Sturdy Drill", dr, drills)}`;
}
function itemIcon(name) {
  if (BEETLE_COLORS[name]) return `<span class="cave-beetle" style="--bt:${BEETLE_COLORS[name]}" title="${esc(name)}"></span>`;
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
function cellHtml(machineId, c, best) {
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
  if (c.none) {
    cls = "is-empty";
    inner = `<span class="cave-pct">0%</span>`;
  } else if (c.certain) {
    cls = "is-guaranteed";
    inner = c.single ? itemIcon(c.single) : `<span class="cave-pct">100%</span>`;
  }
  const star = best && best.x === c.x && best.y === c.y && !c.none ? " cave-best" : "";
  return `<div class="dig-cell ${cls}${star}" data-cave-cell="${key}">${inner}</div>`;
}
function chipsHtml(res) {
  if (!res.remaining) return `<span class="dig-legend-item">Nothing valuable left buried</span>`;
  return Object.keys(res.names).map((name) => `<span class="dig-legend-item cave-chip">${itemIcon(name)} \xD7${res.names[name]}</span>`).join("");
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
    return `<div class="dig-panel-status cave-info"><b>${cellLabel(c)}</b> dug: ${itemIcon(name)} ${esc(name)}${clue}</div>`;
  }
  const parts = [];
  parts.push(`<b>${cellLabel(c)}</b> holds something: <b>${pctText(c.p)}</b>`);
  const kinds = Object.keys(c.kinds).filter((k) => k !== "Mud" && c.kinds[k] > 0);
  const lines = kinds.map((k) => `<span class="cave-kind">${itemIcon(k)} ${esc(k)} ${pctText(c.kinds[k])}</span>`);
  lines.push(`<span class="cave-kind">${itemIcon("Mud")} Mud ${pctText(c.kinds.Mud)}</span>`);
  return `<div class="dig-panel-status cave-info">${parts.join("")}<div class="cave-kinds">${lines.join("")}</div></div>`;
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
    for (let x = 0; x < CAVE_WIDTH; x++) grid += cellHtml(machineId, res.cells[y * CAVE_WIDTH + x], res.best);
  }
  const hints = [];
  if (res.best && res.best.p > 0) hints.push(`Best dig: <b>${cellLabel(res.best)}</b> (${pctText(res.best.p)})`);
  if (res.drill && res.drill.expected > 0) hints.push(`Best drill: <b>${COLS[res.drill.x]}${res.drill.y + 1}</b> square, about ${res.drill.expected.toFixed(1)} items`);
  const seedNote = res.hasSeed ? "" : `<div class="dig-panel-status cave-note">Beetle species and Magic Mushrooms are not in the synced data, so kinds are shown as Mushroom and Beetle.</div>`;
  const found = res.beetleLeft === 0 ? `<div class="dig-panel-status cave-note">Every Beetle is found. You can restart this batch.</div>` : "";
  return `<div class="cave-board guro-frame">${head}${sub}<div class="dig-panel-legend cave-chips">${chipsHtml(res)}</div><div class="dig-panel-grid-wrap"><div class="dig-panel-grid cave-grid">${grid}</div></div><div class="dig-panel-status">${hints.join("<br>")}</div>${infoHtml(res, machineId)}${found}${seedNote}</div>`;
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
    "Feed the bin again once the patch is fully dug or every Beetle is found. There is no limit and the cost stays the same.",
    "Every Cave upgrade adds one more Myco Bin, so more patches can grow at the same time."
  ];
  const list = steps.map((t, i) => `<div class="cave-guide-step"><span class="cave-guide-num">${i + 1}</span><span>${esc(t)}</span></div>`).join("");
  const open = guideOpen ? " is-open" : "";
  return `<div class="cave-info-box guro-frame cave-guide${open}"><button type="button" class="cave-guide-toggle" data-cave-guide aria-expanded="${guideOpen}">Info</button><div class="cave-board-title cave-guide-title">How Myco Bins work</div><div class="cave-guide-body">${list}</div></div>`;
}
function statusHtml(cave, ids, now) {
  const rows = [];
  const counts = { growing: 0, ready: 0, idle: 0 };
  let soon = null;
  ids.forEach((id) => {
    const batch = cave.machines[id] && cave.machines[id].batch;
    const st = binState(batch, now);
    counts[st] += 1;
    let detail = "Feed it to start a batch";
    if (batch && st === "growing") {
      detail = (RECIPE_LABELS[batch.recipe] || batch.recipe) + " \xB7 ready in " + formatWait(batch.readyAt - now);
      if (soon === null || batch.readyAt < soon) soon = batch.readyAt;
    } else if (batch && st === "ready") {
      detail = (RECIPE_LABELS[batch.recipe] || batch.recipe) + " \xB7 dig it now";
    }
    rows.push(`<div class="cave-bin-row"><span class="cave-bin-name">Bin ${esc(id)}</span><span class="cave-bin-state is-${st}">${STATE_LABELS[st]}</span><span class="cave-bin-detail">${esc(detail)}</span></div>`);
  });
  const total = ids.length;
  const next = soon !== null ? `<div class="cave-bin-next">Next bin ready in ${formatWait(soon - now)}</div>` : "";
  const summary = `<div class="cave-bin-count"><b>${counts.growing}</b> of ${total} running</div><div class="cave-bin-sub">${counts.ready} ready to dig \xB7 ${counts.idle} empty</div>${next}`;
  return `<div class="cave-info-box guro-frame"><div class="cave-board-title"><span class="cave-myco-icon">${apiRef.ui.getIcon("Myco Bin")}</span> Myco Bins running</div>${summary}<div class="cave-bin-list">${rows.join("")}</div></div>`;
}
function render() {
  if (!rootEl) return;
  const card = rootEl.querySelector("#caveCard");
  if (!card) return;
  const game = getGame();
  const info = apiRef.inprogress.farmPanelGetLastInfo ? apiRef.inprogress.farmPanelGetLastInfo() : null;
  const farmLabel = info && info.id ? `Farm #${info.id}` : "No farm synced";
  const title = `<div class="dig-panel-header"><div class="dig-panel-title"><span class="cave-title-icon">${apiRef.ui.getIcon("Sand Shovel")}</span> CAVE DIGGING</div>`;
  const cave = game && game.cave;
  if (!game) {
    card.innerHTML = `${title}<div class="dig-panel-chapter">${esc(farmLabel)} \xB7 Sync your farm to load your Cave</div></div>`;
    return;
  }
  if (!cave || !cave.machines || !Object.keys(cave.machines).length) {
    card.innerHTML = `${title}<div class="dig-panel-chapter">${esc(farmLabel)} \xB7 No Cave found. Build the Cave in game, then sync.</div></div>`;
    return;
  }
  const inv = game.inventory || {};
  const shovels = Math.floor(Number(inv["Sand Shovel"]) || 0);
  const drills = Math.floor(Number(inv["Sand Drill"]) || 0);
  const now = Date.now();
  const ids = Object.keys(cave.machines).sort((a, b) => Number(a) - Number(b));
  const boards = ids.map((id) => boardHtml(id, cave.machines[id] && cave.machines[id].batch, game, now)).join("");
  const legend = `<div class="dig-panel-legend"><span class="dig-legend-item"><span class="dig-swatch dig-swatch-red"></span>Only Mud</span><span class="dig-legend-item"><span class="dig-swatch dig-swatch-yellow"></span>Chance</span><span class="dig-legend-item"><span class="dig-swatch dig-swatch-blue"></span>Sure thing</span></div>`;
  card.innerHTML = `${title}<div class="dig-panel-chapter">${esc(farmLabel)} \xB7 Cave tier ${esc(cave.tier || ids.length)}<br>${apiRef.ui.getIcon("Sand Shovel")} ${shovels} \xB7 ${apiRef.ui.getIcon("Sand Drill")} ${drills}${toolCostHtml(game, shovels, drills)}</div></div><div class="dig-panel-divider-solid"></div><div class="cave-top-row">${guideHtml()}${statusHtml(cave, ids, now)}</div>${legend}<div class="cave-boards">${boards}</div>`;
  const growing = ids.some((id) => {
    const b = cave.machines[id] && cave.machines[id].batch;
    return b && b.readyAt > now;
  });
  clearTimeout(timer);
  timer = growing ? setTimeout(render, 3e4) : null;
}
function onClick(e) {
  if (e.target.closest("[data-cave-guide]")) {
    guideOpen = !guideOpen;
    render();
    return;
  }
  const cell = e.target.closest("[data-cave-cell]");
  if (!cell) return;
  const [machineId, key] = cell.dataset.caveCell.split(":");
  selected[machineId] = selected[machineId] === key ? null : key;
  render();
}
function onSaved() {
  if (rootEl) render();
}
function mount(root, api) {
  rootEl = root;
  apiRef = api;
  selected = {};
  guideOpen = false;
  const card = root.querySelector("#caveCard");
  if (card) card.addEventListener("click", onClick);
  if (!listening) {
    listening = true;
    window.addEventListener("guroFarmSaved", onSaved);
  }
  render();
}
function unmount() {
  clearTimeout(timer);
  timer = null;
  if (rootEl) {
    const card = rootEl.querySelector("#caveCard");
    if (card) card.removeEventListener("click", onClick);
  }
  rootEl = null;
}
export {
  mount,
  unmount
};
