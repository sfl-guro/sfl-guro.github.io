import { escapeHtml, farmSyncExtractGameState, FLOWER_ICON, COOKING_FOOD_IMAGES, COOKING_FOOD_EMOJI } from "./calculator.js";

import { getIcon, cookFoodIcon, hiveClockText } from "./ui.js";

import { GOBLIN_MERCHANT_ICON } from "./goblin_merchant_icon.js";

import { merchantOfferCardsHtml } from "./cave_merchant_calc.js";

function cmField(g, key) {
  if (!g) return null;
  if (g[key] != null) return g[key];
  if (g.land && g.land[key] != null) return g.land[key];
  return null;
}

function cmNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function caveMerchantMiniIconHtml(size) {
  return `<img src="${GOBLIN_MERCHANT_ICON}" alt="Cave Merchant" decoding="async" style="width:${size}px;height:${size}px;object-fit:contain;image-rendering:pixelated;vertical-align:middle;">`;
}

export function caveMerchantClock(sec) {
  sec = Math.max(0, Math.floor(sec));
  const d = Math.floor(sec / 86400);
  const h = Math.floor(sec % 86400 / 3600);
  const m = Math.floor(sec % 3600 / 60);
  const s = sec % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function cmItemIcon(name) {
  if (cookFoodIcon && (COOKING_FOOD_IMAGES && COOKING_FOOD_IMAGES[name] || COOKING_FOOD_EMOJI && COOKING_FOOD_EMOJI[name])) return cookFoodIcon(name);
  return getIcon(name);
}

export function farmPanelComputeCaveMerchantCard(json, now) {
  try {
    const nowMs = now || Date.now();
    const g = farmSyncExtractGameState(json);
    const cave = cmField(g, "cave");
    const visit = cave && cave.merchantVisit;
    if (!visit || typeof visit !== "object") return null;
    const opensAt = cmNum(visit.opensAt);
    const closesAt = cmNum(visit.closesAt);
    const nextOpensAt = cmNum(visit.nextOpensAt);
    if (!opensAt && !closesAt && !nextOpensAt) return null;
    let phase = "unknown";
    let targetAt = 0;
    if (nowMs >= opensAt && nowMs < closesAt) {
      phase = "open";
      targetAt = closesAt;
    } else if (nowMs < opensAt) {
      phase = "arriving";
      targetAt = opensAt;
    } else if (nextOpensAt > nowMs) {
      phase = "away";
      targetAt = nextOpensAt;
    }
    const offers = Array.isArray(visit.offers) ? visit.offers.filter(o => o && o.cost && o.reward) : [];
    return {
      isCaveMerchantCard: true,
      name: "Cave Merchant",
      profit: 0,
      isReady: phase === "open",
      phase: phase,
      opensAt: opensAt,
      closesAt: closesAt,
      nextOpensAt: nextOpensAt,
      targetAt: targetAt,
      remainingSec: targetAt ? Math.max(0, (targetAt - nowMs) / 1e3) : 0,
      offerCount: offers.length,
      cave: cave,
      game: g
    };
  } catch (e) {
    return null;
  }
}

function cmStatusFoldHtml(row) {
  if (!row.targetAt) return `<div class="guro-status-fold"><span class="guro-status-label">SYNC TO CHECK NEXT VISIT</span></div>`;
  const label = row.phase === "open" ? "LEAVES IN" : row.phase === "arriving" ? "ARRIVES IN" : "RETURNS IN";
  return `<div class="guro-status-fold"><span class="guro-status-label">${label}</span><span class="guro-status-stack"><span class="guro-status-value cm-countdown" data-cm-at="${row.targetAt}">${caveMerchantClock(row.remainingSec)}</span><span class="guro-status-clock">${escapeHtml(hiveClockText(row.targetAt))}</span></span></div>`;
}

function cmInfoHtml(row) {
  const line = (label, val) => `<div class="dig-total-row"><span class="dig-total-label">${label}</span><span class="dig-total-val">${val}</span></div>`;
  const lines = [];
  if (row.phase === "open") {
    lines.push(line("Status", "Here now"));
    lines.push(line("Leaves at", escapeHtml(hiveClockText(row.closesAt))));
    if (row.nextOpensAt > row.closesAt) lines.push(line("Returns at", escapeHtml(hiveClockText(row.nextOpensAt))));
  } else if (row.phase === "arriving") {
    lines.push(line("Status", "On the way"));
    lines.push(line("Arrives at", escapeHtml(hiveClockText(row.opensAt))));
    lines.push(line("Leaves at", escapeHtml(hiveClockText(row.closesAt))));
  } else if (row.phase === "away") {
    lines.push(line("Status", "Away"));
    lines.push(line("Returns at", escapeHtml(hiveClockText(row.nextOpensAt))));
  } else {
    lines.push(line("Status", "Away"));
    lines.push(line("Returns at", "Sync to check"));
  }
  return `<div class="dig-totals">${lines.join("")}</div>`;
}

function cmOffersHtml(row) {
  const cards = merchantOfferCardsHtml({
    cave: row.cave,
    game: row.game,
    icon: cmItemIcon,
    flower: FLOWER_ICON
  });
  const label = `<div class="dig-data-label fh-label">Offers <span class="fh-label-count">×${row.offerCount}</span></div>`;
  if (!cards) return `${label}<div class="fh-empty">${row.phase === "open" ? "No offers right now." : "No offers while the merchant is away. They show up when he returns and you sync."}</div>`;
  return `${label}<div class="fh-empty">Tradable items use the market price. Others use their cost, made from bought materials.</div>${cards}`;
}

export function farmPanelRenderCaveMerchantCard(row, expanded) {
  const badgeHtml = row.phase === "open" ? `<span class="harvest-badge is-ready">🟢 Here</span>` : row.phase === "arriving" ? `<span class="harvest-badge is-growing">⏳ Arriving</span>` : `<span class="harvest-badge is-growing">⏳ Away</span>`;
  const countHtml = row.offerCount ? `<span class="fi-count">x${row.offerCount}</span>` : "";
  return `
  <div class="card animal-merged-card${row.isReady ? " is-profit" : ""}${expanded ? " expanded" : ""}" data-search="cave-merchant" data-fp-category="pete">
    <div class="card-toggle">
      <div class="card-name-row">
        <span class="card-icon">${caveMerchantMiniIconHtml(22)}</span>
        <div>
          <div class="card-name">Cave Merchant ${countHtml}</div>
          <div class="card-type-row">
            ${badgeHtml}
          </div>
        </div>
      </div>
      <div class="card-collapsed-profit">
        <span class="chev">▾</span>
      </div>
      ${cmStatusFoldHtml(row)}
    </div>
    <div class="card-details">
      ${cmInfoHtml(row)}
      ${cmOffersHtml(row)}
    </div>
  </div>`;
}
