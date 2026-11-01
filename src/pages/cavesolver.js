import { solveCaveBatch, CAVE_WIDTH } from "../cave_solver.js";

const COLS = [ "A", "B", "C", "D", "E" ];

const BEETLE_COLORS = {
  Beetle: "#8d6e4a"
};

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

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getGame() {
  const state = apiRef.inprogress.farmPanelGameState;
  if (!state) return null;
  return apiRef.calc.farmSyncExtractGameState(state);
}

const KEEP_CHANCE = {
  "Sturdy Shovel": [ 0.1, 0.2, 0.3 ],
  "Sturdy Drill": [ 0.2, 0.3, 0.4 ]
};

function keepChance(game, skill) {
  const skills = game && game.bumpkin && game.bumpkin.skills;
  if (!skills || typeof skills !== "object") return 0;
  const key = Object.keys(skills).find(k => k.trim().toLowerCase() === skill.toLowerCase());
  if (!key) return 0;
  const level = Math.min(Math.max(Math.round(Number(skills[key])) || 1, 1), 3);
  return KEEP_CHANCE[skill][level - 1];
}

function toolCostHtml(game, shovels, drills) {
  const sh = keepChance(game, "Sturdy Shovel");
  const dr = keepChance(game, "Sturdy Drill");
  const fmt = n => (Math.round(n * 100) / 100).toString();
  const part = (icon, label, chance, count) => {
    if (!chance) return `${icon} ${label}: 1 per use`;
    const avg = 1 - chance;
    const uses = avg > 0 ? Math.floor(count / avg) : 0;
    return `${icon} ${label}: ${Math.round(chance * 100)}% kept · avg ${fmt(avg)} per use · about ${uses} uses from ${count}`;
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
  const mins = Math.max(1, Math.ceil(ms / 60000));
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
    const clue = c.clue !== undefined ? `<span class="cave-clue">${c.clue}</span>` : "";
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
  return Object.keys(res.names).map(name => `<span class="dig-legend-item cave-chip">${itemIcon(name)} ×${res.names[name]}</span>`).join("");
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
  const kinds = Object.keys(c.kinds).filter(k => k !== "Mud" && c.kinds[k] > 0);
  const lines = kinds.map(k => `<span class="cave-kind">${itemIcon(k)} ${esc(k)} ${pctText(c.kinds[k])}</span>`);
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
    card.innerHTML = `${title}<div class="dig-panel-chapter">${esc(farmLabel)} · Sync your farm to load your Cave</div></div>`;
    return;
  }
  if (!cave || !cave.machines || !Object.keys(cave.machines).length) {
    card.innerHTML = `${title}<div class="dig-panel-chapter">${esc(farmLabel)} · No Cave found. Build the Cave in game, then sync.</div></div>`;
    return;
  }
  const inv = game.inventory || {};
  const shovels = Math.floor(Number(inv["Sand Shovel"]) || 0);
  const drills = Math.floor(Number(inv["Sand Drill"]) || 0);
  const now = Date.now();
  const ids = Object.keys(cave.machines).sort((a, b) => Number(a) - Number(b));
  const boards = ids.map(id => boardHtml(id, cave.machines[id] && cave.machines[id].batch, game, now)).join("");
  const legend = `<div class="dig-panel-legend"><span class="dig-legend-item"><span class="dig-swatch dig-swatch-red"></span>Only Mud</span><span class="dig-legend-item"><span class="dig-swatch dig-swatch-yellow"></span>Chance</span><span class="dig-legend-item"><span class="dig-swatch dig-swatch-blue"></span>Sure thing</span></div>`;
  card.innerHTML = `${title}<div class="dig-panel-chapter">${esc(farmLabel)} · Cave tier ${esc(cave.tier || ids.length)}<br>${apiRef.ui.getIcon("Sand Shovel")} ${shovels} · ${apiRef.ui.getIcon("Sand Drill")} ${drills}${toolCostHtml(game, shovels, drills)}</div></div><div class="dig-panel-divider-solid"></div><div class="cave-top-row">${guideHtml()}${statusHtml(cave, ids, now)}</div>${legend}<div class="cave-boards">${boards}</div>`;
  const growing = ids.some(id => {
    const b = cave.machines[id] && cave.machines[id].batch;
    return b && b.readyAt > now;
  });
  clearTimeout(timer);
  timer = growing ? setTimeout(render, 30000) : null;
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

export function mount(root, api) {
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

export function unmount() {
  clearTimeout(timer);
  timer = null;
  if (rootEl) {
    const card = rootEl.querySelector("#caveCard");
    if (card) card.removeEventListener("click", onClick);
  }
  rootEl = null;
}
