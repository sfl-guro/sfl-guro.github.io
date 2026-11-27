import { IMAGE_ICONS, escapeHtml, farmSyncExtractGameState } from "./calculator.js";

import { getIcon, hiveClockText } from "./ui.js";

import { FLOATING_ISLAND_ICON, FLOATING_ISLAND_ICON_DATA } from "./floating_island_icons.js";

import { foldClock } from "./fold_clock.js";

const ISLAND_TITLE = "Floating / Mystery Island";

const CURRENCY = "Love Charm";

function fiField(g, key) {
  if (!g) return null;
  if (g[key] != null) return g[key];
  if (g.land && g.land[key] != null) return g.land[key];
  return null;
}

function fiNumber(v) {
  const n = Number(v && typeof v === "object" && v.toString ? v.toString() : v);
  return Number.isFinite(n) ? n : 0;
}

function fiPlural(name, qty) {
  if (qty === 1 || /s$/i.test(name)) return name;
  return `${name}s`;
}

function fiCostText(costs) {
  return costs.map(c => `${c.qty.toLocaleString("en-US")} ${fiPlural(c.item, c.qty)}`).join(", ");
}

function fiAttr(text) {
  return String(text).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const FI_COPY_ICON = `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><rect x="5" y="5" width="9" height="9" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H11" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;

export function floatingIslandIconSrc(name) {
  if (IMAGE_ICONS[name]) return IMAGE_ICONS[name];
  const lower = String(name || "").trim().toLowerCase();
  const hit = Object.entries(IMAGE_ICONS).find(([k]) => k.toLowerCase() === lower);
  if (hit) return hit[1];
  return FLOATING_ISLAND_ICON_DATA[name] || null;
}

const FI_REMOTE_BASE = "https://sunflower-land.com/game-assets/";

const FI_REMOTE_PATHS = {
  "Mysterious Entrance": "decorations/mysterious_entrance.webp",
  "Mermaid Fountain": "decorations/mermaid_fountain.webp",
  "Heartstruck Tree": "decorations/heartstruck_tree.webp",
  "Flower Statue": "decorations/flower_statue.webp"
};

function fiRemoteIconSrc(name) {
  const key = String(name || "");
  if (FI_REMOTE_PATHS[key]) return FI_REMOTE_BASE + FI_REMOTE_PATHS[key];
  const tile = /^Letter ([A-Z]) Tile$/.exec(key);
  if (tile) return `${FI_REMOTE_BASE}sfts/tiles/letter_${tile[1].toLowerCase()}_tile.png`;
  return null;
}

function fiIconHtml(name, size) {
  const local = floatingIslandIconSrc(name);
  const remote = fiRemoteIconSrc(name);
  const src = remote || local;
  if (!src) return getIcon(name);
  const fallback = remote && local ? ` data-fi-fallback="${fiAttr(local)}"` : "";
  return `<img src="${fiAttr(src)}"${fallback} alt="${escapeHtml(name)}" decoding="async" style="width:${size}px;height:${size}px;object-fit:contain;image-rendering:pixelated;vertical-align:middle;">`;
}

document.addEventListener("error", e => {
  const img = e.target;
  if (!img || img.tagName !== "IMG" || !img.dataset || !img.dataset.fiFallback) return;
  const fallback = img.dataset.fiFallback;
  delete img.dataset.fiFallback;
  img.src = fallback;
}, true);

export function floatingIslandMiniIconHtml(size) {
  return `<img src="${FLOATING_ISLAND_ICON}" alt="Floating Island" decoding="async" style="width:${size}px;height:${size}px;object-fit:contain;image-rendering:pixelated;vertical-align:middle;">`;
}

export function floatingIslandClock(sec) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor(sec % 3600 / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fiReadyAtText(ms) {
  const d = new Date(ms);
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
  const today = new Date();
  const sameDay = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  return sameDay ? time : `${time} · ${d.toLocaleDateString(undefined, {
    weekday: "short"
  })}`;
}

function fiOwned(g, island, item) {
  const boughtAt = island.boughtAt && typeof island.boughtAt === "object" ? island.boughtAt : {};
  if (boughtAt[item.name]) return true;
  if (item.type === "wearable") {
    const wardrobe = fiField(g, "wardrobe");
    return !!wardrobe && fiNumber(wardrobe[item.name]) > 0;
  }
  const inventory = fiField(g, "inventory");
  return !!inventory && fiNumber(inventory[item.name]) > 0;
}

export function floatingIslandDiscordText(entry, shop) {
  const startSec = Math.floor(entry.startAt / 1e3);
  const lines = [ `**${ISLAND_TITLE}** - ${entry.isLive ? "Live now" : "Arriving"}`, `<t:${startSec}:F>`, `<t:${startSec}:R>`, `**ISLAND SHOP:**` ];
  shop.forEach(item => lines.push(`- ${item.name}: ${item.costText}`));
  return lines.join("\n");
}

export function farmPanelComputeFloatingIslandCard(json, now) {
  try {
    const nowMs = now || Date.now();
    const g = farmSyncExtractGameState(json);
    const island = fiField(g, "floatingIsland");
    if (!island || typeof island !== "object") return null;
    const schedule = Array.isArray(island.schedule) ? island.schedule : [];
    const entries = schedule.map(s => ({
      startAt: Number(s && s.startAt),
      endAt: Number(s && s.endAt)
    })).filter(s => Number.isFinite(s.startAt) && Number.isFinite(s.endAt) && s.endAt > nowMs).sort((a, b) => a.startAt - b.startAt).map(s => ({
      startAt: s.startAt,
      endAt: s.endAt,
      isLive: nowMs >= s.startAt
    }));
    const inventory = fiField(g, "inventory") || {};
    const shopSrc = island.shop && typeof island.shop === "object" ? Object.values(island.shop) : [];
    const shop = shopSrc.filter(i => i && i.name).map(i => {
      const items = i.cost && i.cost.items && typeof i.cost.items === "object" ? i.cost.items : {};
      const costs = Object.entries(items).map(([item, qty]) => ({
        item: item,
        qty: fiNumber(qty),
        balance: fiNumber(inventory[item])
      }));
      return {
        name: i.name,
        type: i.type === "wearable" ? "wearable" : "collectible",
        costs: costs,
        costText: fiCostText(costs),
        owned: fiOwned(g, island, i),
        affordable: costs.every(c => c.balance >= c.qty)
      };
    });
    if (!entries.length && !shop.length) return null;
    const live = entries.find(e => e.isLive) || null;
    const next = live || entries[0] || null;
    const targetAt = next ? live ? live.endAt : next.startAt : 0;
    return {
      isFloatingIslandCard: true,
      name: "Floating Island",
      profit: 0,
      entries: entries,
      shop: shop,
      isLive: !!live,
      isReady: !!live,
      targetAt: targetAt,
      remainingSec: targetAt ? Math.max(0, (targetAt - nowMs) / 1e3) : 0,
      balance: fiNumber(inventory[CURRENCY])
    };
  } catch (e) {
    return null;
  }
}

function fiStatusFoldHtml(row) {
  if (!row.targetAt) return `<div class="guro-status-fold"><span class="guro-status-label">NO ISLAND SCHEDULED</span></div>`;
  const label = row.isLive ? "ENDS IN" : "ARRIVING IN";
  return `<div class="guro-status-fold"><span class="guro-status-label">${label}</span><span class="guro-status-stack"><span class="guro-status-value fi-countdown" data-fi-at="${row.targetAt}">${foldClock(row.remainingSec)}</span><span class="guro-status-clock">${escapeHtml(hiveClockText(row.targetAt))}</span></span></div>`;
}

function fiEntryHtml(row, entry) {
  const label = entry.isLive ? "LIVE ISLAND" : "SCHEDULED ISLAND";
  const targetAt = entry.isLive ? entry.endAt : entry.startAt;
  const sub = entry.isLive ? `Ends at ${fiReadyAtText(entry.endAt)}` : `Ready at ${fiReadyAtText(entry.startAt)}`;
  const text = floatingIslandDiscordText(entry, row.shop);
  return `<div class="fi-slot guro-frame${entry.isLive ? " is-live" : ""}"><div class="fi-slot-top"><span class="fi-slot-name"><span class="fi-dot"></span>${label}</span><button type="button" class="gf-copy px-no-frame" data-gf-copy="${fiAttr(text)}" title="Copy for Discord" aria-label="Copy for Discord">${FI_COPY_ICON}</button></div><div class="fi-slot-bottom"><span class="fi-slot-clock fi-countdown" data-fi-at="${targetAt}">${floatingIslandClock((targetAt - Date.now()) / 1e3)}</span><span class="fi-slot-sub">${sub}</span></div></div>`;
}

function fiShopRowHtml(item) {
  const priceHtml = item.costs.map(c => `<span class="fi-price"><span class="fi-price-amt">${c.qty.toLocaleString("en-US")}</span>${fiIconHtml(c.item, 16)}</span>`).join("");
  const ownedHtml = item.owned ? `<span class="fi-owned">OWNED</span>` : "";
  return `<div class="fi-shop-row guro-frame${item.owned ? " is-owned" : ""}${item.affordable ? "" : " is-short"}"><span class="fi-thumb">${fiIconHtml(item.name, 24)}</span><span class="fi-info"><span class="fi-name">${escapeHtml(item.name)}</span>${ownedHtml}</span><span class="fi-prices">${priceHtml}</span></div>`;
}

export function farmPanelRenderFloatingIslandCard(row, expanded) {
  const badgeHtml = row.isLive ? `<span class="harvest-badge is-ready">🟢 Live</span>` : `<span class="harvest-badge is-growing">⏳ Waiting</span>`;
  const countHtml = row.entries.length ? `<span class="fi-count">x${row.entries.length}</span>` : "";
  const entriesHtml = row.entries.map(entry => fiEntryHtml(row, entry)).join("");
  const shopHtml = row.shop.length ? `<div class="fi-shop-head"><span class="fi-shop-title">ISLAND SHOP</span><span class="fi-balance">${fiIconHtml(CURRENCY, 14)}<span>${row.balance.toLocaleString("en-US")}</span></span></div><div class="fi-shop-list">${row.shop.map(fiShopRowHtml).join("")}</div>` : "";
  const emptyHtml = row.entries.length ? "" : `<div class="fi-empty">No island is scheduled right now.</div>`;
  return `
  <div class="card animal-merged-card${row.isLive ? " is-profit" : ""}${expanded ? " expanded" : ""}" data-search="floating-island" data-fp-category="pete">
    <div class="card-toggle">
      <div class="card-name-row">
        <span class="card-icon">${floatingIslandMiniIconHtml(22)}</span>
        <div>
          <div class="card-name">Floating Island ${countHtml}</div>
          <div class="card-type-row">
            ${badgeHtml}
          </div>
        </div>
      </div>
      <div class="card-collapsed-profit">
        <span class="chev">▾</span>
      </div>
      ${fiStatusFoldHtml(row)}
    </div>
    <div class="card-details">
      ${entriesHtml}
      ${emptyHtml}
      ${shopHtml}
    </div>
  </div>`;
}
