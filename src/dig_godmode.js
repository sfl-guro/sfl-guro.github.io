import { digSolveBoard } from "./calculator.js";
import { getIcon } from "./ui.js";

const SIZE = 10;
const LINE_COLOR = "#e8332a";

let card = null;
let layer = null;
let observer = null;
let selected = -1;
let drag = null;
let resizeBound = false;

function gridEl() {
  return document.getElementById("digPanelGrid");
}

function wrapEl() {
  const g = gridEl();
  return g ? g.parentNode : null;
}

function normalize(shape) {
  const minX = Math.min.apply(null, shape.map(c => c.x));
  const minY = Math.min.apply(null, shape.map(c => c.y));
  return shape.map(c => ({ x: c.x - minX, y: c.y - minY, name: c.name }));
}

function findPlacements(shape, cells) {
  const cs = normalize(shape);
  const maxX = Math.max.apply(null, cs.map(c => c.x));
  const maxY = Math.max.apply(null, cs.map(c => c.y));
  const out = [];
  for (let oy = 0; oy + maxY < SIZE; oy++) {
    for (let ox = 0; ox + maxX < SIZE; ox++) {
      let ok = true;
      for (const p of cs) {
        const cell = cells[oy + p.y][ox + p.x];
        if (cell.dug || cell.status === "guaranteed" || cell.status === "empty" || cell.status === "crab" || cell.status === "sand") {
          ok = false;
          break;
        }
      }
      if (ok) out.push(cs.map(p => ({ x: ox + p.x, y: oy + p.y, name: p.name })));
    }
  }
  return out;
}

function links(placement) {
  const n = placement.length;
  const inTree = new Array(n).fill(false);
  inTree[0] = true;
  const edges = [];
  for (let k = 1; k < n; k++) {
    let best = null;
    for (let i = 0; i < n; i++) {
      if (!inTree[i]) continue;
      for (let j = 0; j < n; j++) {
        if (inTree[j]) continue;
        const d = Math.abs(placement[i].x - placement[j].x) + Math.abs(placement[i].y - placement[j].y);
        if (!best || d < best.d) best = { i, j, d };
      }
    }
    inTree[best.j] = true;
    edges.push([best.i, best.j]);
  }
  return edges;
}

function chipHtml(shape, idx) {
  const cs = normalize(shape);
  const w = Math.max.apply(null, cs.map(c => c.x)) + 1;
  const h = Math.max.apply(null, cs.map(c => c.y)) + 1;
  const map = new Map(cs.map(c => [c.x + "," + c.y, c.name]));
  let html = "";
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = map.get(x + "," + y);
      html += `<div class="dig-god-cell">${n ? getIcon(n) : ""}</div>`;
    }
  }
  return `<button type="button" class="dig-god-chip${idx === selected ? " is-selected" : ""}" data-god-idx="${idx}" style="grid-template-columns:repeat(${w}, 12px);grid-template-rows:repeat(${h}, 12px);">${html}</button>`;
}

function renderChips(solved) {
  const box = card && card.querySelector(".dig-god-list");
  if (!box) return;
  const items = [];
  solved.instances.forEach((inst, i) => {
    if (solved.completedByIndex[i] || solved.guaranteedByIndex[i]) return;
    items.push(chipHtml(inst.shape, i));
  });
  box.innerHTML = items.length ? items.join("") : `<div class="dig-god-empty">No unconfirmed patterns</div>`;
}

function clearLayer() {
  if (layer) layer.innerHTML = "";
}

function cellRect(x, y, wrapRect) {
  const g = gridEl();
  if (!g) return null;
  const el = g.children[11 + y * 11 + 1 + x];
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { l: r.left - wrapRect.left, t: r.top - wrapRect.top, w: r.width, h: r.height };
}

function drawPlacements(solved) {
  const wrap = wrapEl();
  if (!wrap) return;
  if (!layer || layer.parentNode !== wrap) {
    if (layer && layer.parentNode) layer.parentNode.removeChild(layer);
    layer = document.createElement("div");
    layer.className = "dig-god-layer";
    wrap.appendChild(layer);
  }
  layer.innerHTML = "";
  if (selected < 0) return;
  const inst = solved.instances[selected];
  if (!inst || solved.completedByIndex[selected] || solved.guaranteedByIndex[selected]) {
    selected = -1;
    return;
  }
  const placements = findPlacements(inst.shape, solved.cells);
  const wrapRect = wrap.getBoundingClientRect();
  const taken = new Set();
  const shown = [];
  placements.forEach(pl => {
    if (pl.some(c => taken.has(c.y * SIZE + c.x))) return;
    pl.forEach(c => taken.add(c.y * SIZE + c.x));
    shown.push(pl);
  });
  let svg = "";
  let iconsHtml = "";
  shown.forEach(pl => {
    const color = LINE_COLOR;
    const rects = pl.map(c => cellRect(c.x, c.y, wrapRect));
    if (rects.some(r => !r)) return;
    let d = "";
    links(pl).forEach(([i, j]) => {
      const a = rects[i];
      const b = rects[j];
      d += `M${(a.l + a.w / 2).toFixed(1)} ${(a.t + a.h / 2).toFixed(1)}L${(b.l + b.w / 2).toFixed(1)} ${(b.t + b.h / 2).toFixed(1)}`;
    });
    if (d) svg += `<path d="${d}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
    pl.forEach((c, i) => {
      const r = rects[i];
      iconsHtml += `<span class="dig-god-ico" style="left:${r.l.toFixed(1)}px;top:${r.t.toFixed(1)}px;width:${r.w.toFixed(1)}px;height:${r.h.toFixed(1)}px;padding:${(r.w * 0.15).toFixed(1)}px;">${getIcon(c.name)}</span>`;
    });
  });
  layer.innerHTML = `<svg class="dig-god-lines" width="${wrapRect.width}" height="${wrapRect.height}">${svg}</svg>${iconsHtml}`;
  const note = card && card.querySelector(".dig-god-count");
  if (note) note.textContent = !placements.length ? "No possible spot" : shown.length === placements.length ? `${placements.length} possible spot${placements.length === 1 ? "" : "s"}` : `${shown.length} of ${placements.length} possible spots shown`;
}

function refresh() {
  if (!card) return;
  const solved = digSolveBoard();
  const inst = solved.instances[selected];
  if (selected >= 0 && (!inst || solved.completedByIndex[selected] || solved.guaranteedByIndex[selected])) selected = -1;
  renderChips(solved);
  if (selected < 0) {
    clearLayer();
    const note = card.querySelector(".dig-god-count");
    if (note) note.textContent = "";
  }
  drawPlacements(solved);
}

function onChipClick(ev) {
  const chip = ev.target.closest(".dig-god-chip");
  if (!chip) return;
  const idx = parseInt(chip.getAttribute("data-god-idx"), 10);
  selected = selected === idx ? -1 : idx;
  refresh();
}

function viewW() {
  return document.documentElement.clientWidth || window.innerWidth;
}

function viewH() {
  return window.innerHeight || document.documentElement.clientHeight;
}

function clamp() {
  if (!card) return;
  const maxL = Math.max(0, viewW() - card.offsetWidth);
  const maxT = Math.max(0, viewH() - card.offsetHeight);
  const l = Math.min(maxL, Math.max(0, parseFloat(card.style.left) || 0));
  const t = Math.min(maxT, Math.max(0, parseFloat(card.style.top) || 0));
  card.style.left = l + "px";
  card.style.top = t + "px";
}

function onDragStart(ev) {
  if (!card || drag || ev.target.closest(".dig-god-close")) return;
  if (ev.pointerType === "mouse" && ev.button !== 0) return;
  const rect = card.getBoundingClientRect();
  drag = { dx: ev.clientX - rect.left, dy: ev.clientY - rect.top, id: ev.pointerId };
  window.addEventListener("pointermove", onDragMove);
  window.addEventListener("pointerup", onDragEnd);
  window.addEventListener("pointercancel", onDragEnd);
  window.addEventListener("blur", onDragEnd);
}

function onDragMove(ev) {
  if (!drag || !card || ev.pointerId !== drag.id) return;
  card.style.left = ev.clientX - drag.dx + "px";
  card.style.top = ev.clientY - drag.dy + "px";
  clamp();
}

function onDragEnd() {
  drag = null;
  window.removeEventListener("pointermove", onDragMove);
  window.removeEventListener("pointerup", onDragEnd);
  window.removeEventListener("pointercancel", onDragEnd);
  window.removeEventListener("blur", onDragEnd);
}

function onResize() {
  if (!card) return;
  clamp();
  refresh();
}

function build() {
  card = document.createElement("div");
  card.id = "digGodCard";
  card.className = "dig-god-card guro-frame";
  card.innerHTML = `<div class="dig-god-head"><div class="dig-god-title-row"><span class="dig-god-title">God Mode</span><button type="button" class="dig-god-close" aria-label="Close God Mode">✕</button></div><div class="dig-god-help">Click me To Drag this Card</div></div><div class="dig-god-help dig-god-help-2">Click Pattern to Display all possible locations</div><div class="dig-god-list"></div><div class="dig-god-count"></div>`;
  document.body.appendChild(card);
  const w = card.offsetWidth;
  card.style.left = Math.max(4, viewW() - w - 8) + "px";
  card.style.top = "120px";
  const head = card.querySelector(".dig-god-head");
  head.addEventListener("pointerdown", onDragStart);
  card.querySelector(".dig-god-close").addEventListener("click", () => close());
  card.querySelector(".dig-god-list").addEventListener("click", onChipClick);
  if (!resizeBound) {
    resizeBound = true;
    window.addEventListener("resize", onResize);
  }
}

export function isOpen() {
  return !!card;
}

export function open() {
  if (card) return;
  build();
  const g = gridEl();
  if (g) {
    observer = new MutationObserver(() => refresh());
    observer.observe(g, { childList: true });
  }
  const btn = document.getElementById("digGodToggleBtn");
  if (btn) btn.classList.add("active");
  refresh();
  clamp();
}

export function close() {
  if (observer) observer.disconnect();
  observer = null;
  if (card && card.parentNode) card.parentNode.removeChild(card);
  card = null;
  if (layer && layer.parentNode) layer.parentNode.removeChild(layer);
  layer = null;
  selected = -1;
  onDragEnd();
  const btn = document.getElementById("digGodToggleBtn");
  if (btn) btn.classList.remove("active");
}

export function toggle() {
  if (card) close(); else open();
}
