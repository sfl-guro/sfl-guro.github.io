import { escapeHtml, farmSyncExtractGameState, fmt, IMAGE_ICONS } from "./calculator.js";

import { getIcon, getBoostIcon, hiveClockText } from "./ui.js";

import { placementsOf } from "./speed_windows.js";

const HOUR_MS = 36e5;

const WILD = "Wild Mushroom";

const MAGIC = "Magic Mushroom";

const MUSHROOM_NAMES = [ WILD, MAGIC ];

const WILD_RESPAWN_HOURS = 16;

const WILD_FARM_CAP = 5;

const MAGIC_FARM_CAP = 3;

const MAGIC_RESPAWN_HOURS = {
  basic: 48,
  spring: 36,
  desert: 24,
  volcano: 24
};

const BUD_AURA_MULT = {
  Basic: 1.05,
  Green: 1.2,
  Rare: 2,
  Mythical: 5
};

const BUD_STEM_BOOST = {
  [WILD]: {
    stem: "Mushroom",
    value: .3
  },
  [MAGIC]: {
    stem: "Magic Mushroom",
    value: .2
  }
};

const WILD_COLLECTIBLE_BOOSTS = [ {
  name: "Mushroom House",
  value: .2
}, {
  name: "Fairy Circle",
  value: .2
} ];

const WILD_WEARABLE_BOOSTS = [ {
  name: "Mushroom Hat",
  value: .1
} ];

function mField(g, key) {
  if (!g) return null;
  if (g[key] != null) return g[key];
  if (g.land && g.land[key] != null) return g.land[key];
  return null;
}

function mNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function mRound(v) {
  return Math.round(v * 1e4) / 1e4;
}

function mIsBuilt(g, name, nowMs) {
  return placementsOf(g, name).some(p => p && !!p.coordinates && !p.used && (typeof p.readyAt === "number" ? p.readyAt : 0) <= nowMs);
}

function mEquippedNames(g) {
  const out = new Set;
  const collect = equipped => {
    if (equipped && typeof equipped === "object") Object.values(equipped).forEach(v => {
      if (typeof v === "string") out.add(v);
    });
  };
  collect(g && g.bumpkin && g.bumpkin.equipped);
  const hands = g && g.farmHands && g.farmHands.bumpkins;
  if (hands && typeof hands === "object") Object.values(hands).forEach(h => collect(h && h.equipped));
  return out;
}

function mBestBud(g, name) {
  const rule = BUD_STEM_BOOST[name];
  const buds = g && g.buds;
  if (!rule || !buds || typeof buds !== "object") return null;
  let best = null;
  Object.entries(buds).forEach(([id, bud]) => {
    if (!bud || typeof bud !== "object" || !bud.coordinates) return;
    if (bud.stem !== rule.stem) return;
    const aura = BUD_AURA_MULT[bud.aura] || 1;
    const value = mRound(aura * rule.value);
    if (value > 0 && (!best || value > best.value)) best = {
      id: id,
      value: value,
      aura: bud.aura,
      auraMult: aura,
      stem: bud.stem
    };
  });
  return best;
}

export function computeMushroomYield(g, name, nowMs) {
  let amount = 1;
  const boosts = [];
  if (name === WILD) {
    WILD_COLLECTIBLE_BOOSTS.forEach(b => {
      if (mIsBuilt(g, b.name, nowMs)) {
        amount += b.value;
        boosts.push({
          name: b.name,
          value: b.value,
          note: ""
        });
      }
    });
    const equipped = mEquippedNames(g);
    WILD_WEARABLE_BOOSTS.forEach(b => {
      if (equipped.has(b.name)) {
        amount += b.value;
        boosts.push({
          name: b.name,
          value: b.value,
          note: ""
        });
      }
    });
  }
  const bud = mBestBud(g, name);
  if (bud) {
    amount += bud.value;
    const auraNote = bud.auraMult !== 1 ? `, ${bud.aura} aura ×${fmt(bud.auraMult)}` : "";
    boosts.push({
      name: `Bud #${bud.id}`,
      value: bud.value,
      note: `${bud.stem} stem${auraNote}`,
      isBud: true
    });
  }
  return {
    amount: mRound(amount),
    boosts: boosts
  };
}

function mRespawnHours(name, g) {
  if (name === WILD) return WILD_RESPAWN_HOURS;
  const type = g && g.island && g.island.type;
  return MAGIC_RESPAWN_HOURS[type] || MAGIC_RESPAWN_HOURS.basic;
}

function mIconHtml(name, size) {
  const src = IMAGE_ICONS[name];
  if (!src) return getIcon(name);
  return `<img src="${src}" alt="${escapeHtml(name)}" decoding="async" style="width:${size}px;height:${size}px;object-fit:contain;image-rendering:pixelated;vertical-align:middle;">`;
}

export function mushroomClock(sec) {
  sec = Math.max(0, Math.floor(sec));
  const d = Math.floor(sec / 86400);
  const h = Math.floor(sec % 86400 / 3600);
  const m = Math.floor(sec % 3600 / 60);
  const s = sec % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export function farmPanelComputeMushroomCards(json, econFn, now) {
  try {
    const nowMs = now || Date.now();
    const g = farmSyncExtractGameState(json);
    const state = mField(g, "mushrooms");
    if (!state || typeof state !== "object") return [];
    const onLand = state.mushrooms && typeof state.mushrooms === "object" ? Object.values(state.mushrooms).filter(m => m && typeof m === "object") : [];
    return MUSHROOM_NAMES.map(name => {
      const isMagic = name === MAGIC;
      const cap = isMagic ? MAGIC_FARM_CAP : WILD_FARM_CAP;
      const count = onLand.filter(m => m.name === name).length;
      const intervalHours = mRespawnHours(name, g);
      const lastAt = mNum(isMagic ? state.magicSpawnedAt : state.spawnedAt);
      const nextAt = lastAt ? lastAt + intervalHours * HOUR_MS : 0;
      const remainingSec = nextAt ? Math.max(0, (nextAt - nowMs) / 1e3) : null;
      const yieldInfo = computeMushroomYield(g, name, nowMs);
      const totalYield = mRound(yieldInfo.amount * count);
      const econ = econFn ? econFn(name, count, totalYield) : null;
      const pickEcon = econFn ? econFn(name, 1, yieldInfo.amount) : null;
      return {
        isMushroomCard: true,
        name: name,
        profit: econ ? econ.profit : 0,
        isReady: count > 0,
        count: count,
        readyCount: count,
        cap: cap,
        intervalHours: intervalHours,
        lastAt: lastAt,
        nextAt: nextAt,
        remainingSec: remainingSec,
        due: !!nextAt && nextAt <= nowMs,
        perPick: yieldInfo.amount,
        boosts: yieldInfo.boosts,
        totalYield: totalYield,
        price: econ ? econ.price : 0,
        grossRevenue: econ ? econ.grossRevenue : 0,
        feeAmount: econ ? econ.feeAmount : 0,
        pickGross: pickEcon ? pickEcon.grossRevenue : 0,
        pickFee: pickEcon ? pickEcon.feeAmount : 0,
        islandType: g && g.island && g.island.type || "basic"
      };
    });
  } catch (e) {
    return [];
  }
}

function mBoostRowsHtml(row) {
  const icon = getIcon(row.name);
  const baseRow = `<div class="boost-applied-row is-yield"><b>Base yield</b> <span class="boost-total-value">${fmt(1)}</span>${icon}</div>`;
  const rows = row.boosts.map(b => {
    const note = b.note ? ` <span class="boost-mult-note">(${escapeHtml(b.note)})</span>` : "";
    return `<div class="boost-applied-row is-yield">${b.isBud ? "" : getBoostIcon(b.name)}<b>${escapeHtml(b.name)}</b>${note} <span class="boost-total-value">+${fmt(b.value)}</span>${icon}</div>`;
  }).join("");
  const perPickRow = `<div class="boost-applied-row is-yield"><b>Per mushroom</b> <span class="boost-total-value">${fmt(row.perPick)}</span>${icon}</div>`;
  const label = row.boosts.length ? "⚡ Applied Boost" : "⚡ Boosts";
  const empty = row.boosts.length ? "" : `<div class="fh-empty">No ${escapeHtml(row.name)} boosts active on your farm.</div>`;
  return `<div class="section-badge is-boost-label">${label}</div><div class="lib-section-title" style="margin-top:10px;">YIELD</div>${baseRow}${rows}${perPickRow}${empty}`;
}

function mInfoHtml(row) {
  const line = (label, val) => `<div class="dig-total-row"><span class="dig-total-label">${label}</span><span class="dig-total-val">${val}</span></div>`;
  const lines = [];
  lines.push(line("On your farm", `${row.count} / ${row.cap}`));
  lines.push(line("Respawn time", `Every ${row.intervalHours}h`));
  if (row.lastAt) lines.push(line("Last spawn", escapeHtml(hiveClockText(row.lastAt))));
  if (row.nextAt) lines.push(line(row.due ? "Spawn was due" : "Next spawn", escapeHtml(hiveClockText(row.nextAt))));
  if (row.count >= row.cap) lines.push(line("Farm full", "Pick some to make room"));
  return `<div class="dig-totals">${lines.join("")}</div>`;
}

export function farmPanelRenderMushroomCard(row, expanded, ctx) {
  const produceIcon = getIcon(row.name);
  const hasReady = row.count > 0;
  const shownYield = hasReady ? row.totalYield : row.perPick;
  const yieldNote = hasReady ? `<span class="card-tier-note">(${fmt(row.perPick)} each)</span>` : `<span class="card-tier-note">(next pick)</span>`;
  const chipHtml = `<span class="animal-produce-chip"><span class="produce-yield">+${fmt(shownYield)}</span><span class="produce-icon">${produceIcon}</span><span class="produce-name">${escapeHtml(row.name)}</span></span>`;
  const gross = hasReady ? row.grossRevenue : row.pickGross;
  const fee = hasReady ? row.feeAmount : row.pickFee;
  const valueHtml = row.price > 0 && ctx && ctx.valueBlockHtml ? ctx.valueBlockHtml(gross, fee) : "";
  const badgeHtml = row.due && !hasReady ? `<span class="harvest-badge is-growing">⏳ Spawn due</span>` : "";
  const stateBadge = ctx && ctx.statusBadgeHtml ? ctx.statusBadgeHtml(row) : "";
  const foldHtml = ctx && ctx.statusFoldHtml ? ctx.statusFoldHtml(row) : "";
  const boostBadge = row.boosts.length ? `<span class="harvest-badge is-ready">⚡ ${row.boosts.length} boost${row.boosts.length === 1 ? "" : "s"}</span>` : "";
  const net = gross - fee;
  const priceRow = row.price > 0 ? `<div class="animal-detail-grid"><div class="animal-detail-stat"><span class="label">Market Price/Unit</span><span class="value">${fmt(row.price)} ${ctx && ctx.flowerIcon || ""}</span></div><div class="animal-detail-stat"><span class="label">Market Value</span><span class="value">${fmt(gross)} ${ctx && ctx.flowerIcon || ""}</span></div><div class="animal-detail-stat"><span class="label">Tax</span><span class="value">${fee > 0 ? `-${fmt(fee)}` : "0"} ${ctx && ctx.flowerIcon || ""}</span></div></div><div class="animal-net-row2"><span class="label">Net</span><span class="value is-profit">${fmt(net)} ${ctx && ctx.flowerIcon || ""}</span></div>` : "";
  return `
  <div class="card animal-merged-card is-profit${expanded ? " expanded" : ""}" data-search="${escapeHtml(row.name.toLowerCase())}" data-fp-category="crops">
    <div class="card-toggle">
      <div class="card-name-row">
        <span class="card-icon">${mIconHtml(row.name, 22)}</span>
        <div>
          <div class="card-name">${escapeHtml(row.name)}</div>
          <div class="card-type-row">
            <span class="card-type">Respawns every ${row.intervalHours}h ${yieldNote}</span>
            ${badgeHtml}${boostBadge}
          </div>
          <div class="animal-fold-row">${chipHtml}</div>
          ${valueHtml}
        </div>
      </div>
      <div class="card-collapsed-profit">
        <span class="harvest-stack">${stateBadge}</span>
        <span class="chev">▾</span>
      </div>
      ${foldHtml}
    </div>
    <div class="card-details">
      ${mInfoHtml(row)}
      ${priceRow}
      ${mBoostRowsHtml(row)}
    </div>
  </div>`;
}
