import { escapeHtml, farmSyncExtractGameState, farmSyncCollectEquippedAndPlacedNames, sflPrngChance, COIN_ICON, FLOWER_ICON, coinsToFlower, coinPerFlower, CRUSTACEAN_NAMES, getDailyFishingLimitInfoFromState, fishingBoostsActiveByScope, fishRodIsFree, fishRodUnitCoins, fishRodSectionHtml, fishRodUsageHtml, fishSetRodMatMode, fishTreasurePrice, fishMarketFlowerPrice, fishDigFmt } from "./calculator.js";

import { getIcon, getBoostIcon, hiveClockText, renderFarmPanelTabContent } from "./ui.js";

const STORE_PREFIX = "guro_fish_track_v1_";

const KEEP_DAYS = 14;

const ROD_ITEM_ID = 306;

const HARPOON_CHANCE = 20;

const MAX_CHAIN = 5000;

const FISH_SKILL_BOOSTS = [ {
  name: "Fishy Chance",
  ranks: [ 10, 12.5, 15 ],
  text: v => `+${v}% basic fish`
}, {
  name: "Fishy Roll",
  ranks: [ 10, 12.5, 15 ],
  text: v => `+${v}% advanced fish`
}, {
  name: "Fishy Gamble",
  ranks: [ 20, 25, 30 ],
  text: v => `+${v}% expert fish`
}, {
  name: "Reel Deal",
  ranks: [ .5, .45, .4 ],
  text: v => `×${v} Rod coin cost`
}, {
  name: "Frenzied Fish",
  ranks: [ 1, 2, 3 ],
  text: v => `+${v} fish during Fish Frenzy`
} ];

function skillLevelOf(g, name, max) {
  const skills = g && g.bumpkin && g.bumpkin.skills && typeof g.bumpkin.skills === "object" ? g.bumpkin.skills : {};
  return Math.min(Number(skills[name]) || 0, max);
}

const CRUSTACEANS = new Set(CRUSTACEAN_NAMES);

const ROD_ICON_HTML = size => `<img src="${rodIconSrc()}" alt="Rod" decoding="async" style="width:${size}px;height:${size}px;object-fit:contain;image-rendering:pixelated;vertical-align:middle;">`;

function rodIconSrc() {
  const m = /src="([^"]+)"/.exec(getIcon("Rod"));
  return m ? m[1] : "";
}

export function fishingMiniIconHtml(size) {
  return ROD_ICON_HTML(size);
}

function utcDay(ms) {
  return new Date(ms).toISOString().substring(0, 10);
}

function nextUtcMidnight(ms) {
  const d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
}

function emptyDay() {
  return {
    items: {},
    casts: 0,
    free: 0,
    rodsFree: 0
  };
}

function loadStore(farmKey) {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_PREFIX + farmKey) || "null");
    if (raw && typeof raw === "object" && raw.days && typeof raw.days === "object") {
      return {
        counters: raw.counters && typeof raw.counters === "object" ? raw.counters : {},
        cast: Number.isFinite(raw.cast) ? raw.cast : null,
        days: raw.days,
        started: raw.started === true,
        startedAt: Number(raw.startedAt) || 0
      };
    }
  } catch (e) {}
  return {
    counters: {},
    cast: null,
    days: {},
    started: false,
    startedAt: 0
  };
}

function saveStore(farmKey, store) {
  try {
    localStorage.setItem(STORE_PREFIX + farmKey, JSON.stringify(store));
  } catch (e) {}
}

function readCaught(activity) {
  const out = {};
  Object.keys(activity || {}).forEach(key => {
    if (key.length <= 7 || key.slice(-7) !== " Caught") return;
    const name = key.slice(0, -7);
    if (CRUSTACEANS.has(name)) return;
    const v = Number(activity[key]);
    if (isFinite(v) && v >= 0) out[name] = v;
  });
  return out;
}

export function fishTrackFromState(g, farmId) {
  if (!g || typeof g !== "object" || !g.farmActivity || typeof g.farmActivity !== "object") return;
  const farmKey = String(farmId || "");
  const farmNum = Number(farmId);
  if (!farmKey || !isFinite(farmNum)) return;
  const store = loadStore(farmKey);
  const now = Date.now();
  const caught = readCaught(g.farmActivity);
  const rawCast = Number(g.farmActivity["Rod Casted"]);
  const castNow = isFinite(rawCast) && rawCast >= 0 ? rawCast : null;
  if (store.started) {
    const day = utcDay(now);
    const bucket = store.days[day] || (store.days[day] = emptyDay());
    Object.keys(caught).forEach(name => {
      const diff = caught[name] - (Number(store.counters[name]) || 0);
      if (diff > 0) bucket.items[name] = (bucket.items[name] || 0) + diff;
    });
    if (castNow !== null && store.cast !== null && castNow > store.cast) {
      const placed = farmSyncCollectEquippedAndPlacedNames(g);
      const casts = castNow - store.cast;
      bucket.casts += casts;
      if (placed.has("Ancient Rod")) bucket.rodsFree += casts;
      if (placed.has("Harpoon")) {
        const from = Math.max(store.cast + 1, castNow - MAX_CHAIN + 1);
        for (let n = from; n <= castNow; n++) {
          if (sflPrngChance({
            farmId: farmNum,
            itemId: ROD_ITEM_ID,
            counter: n,
            chance: HARPOON_CHANCE,
            criticalHitName: "Harpoon"
          })) bucket.free += 1;
        }
      }
    }
  } else {
    store.startedAt = now;
  }
  store.counters = caught;
  if (castNow !== null) store.cast = castNow;
  store.started = true;
  const cutoff = utcDay(now - KEEP_DAYS * 864e5);
  Object.keys(store.days).forEach(day => {
    if (day < cutoff) delete store.days[day];
  });
  saveStore(farmKey, store);
}

function fiNumber(v) {
  const n = Number(v && typeof v === "object" && v.toString ? v.toString() : v);
  return Number.isFinite(n) ? n : 0;
}

function fishingClock(sec) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor(sec % 3600 / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function pairText(coins) {
  return `${fishDigFmt(coins)}${COIN_ICON}<span class="fh-dot">·</span>${fishDigFmt(coinsToFlower(coins))}${FLOWER_ICON}`;
}

export function farmPanelComputeFishingCard(json, farmId, now) {
  try {
    const nowMs = now || Date.now();
    const g = farmSyncExtractGameState(json);
    if (!g || !g.fishing || typeof g.fishing !== "object") return null;
    const farmKey = String(farmId || "");
    const store = farmKey ? loadStore(farmKey) : {
      days: {},
      started: false,
      startedAt: 0
    };
    const today = utcDay(nowMs);
    const day = store.days[today] || emptyDay();
    const fishRows = [];
    const treasureRows = [];
    Object.keys(day.items).forEach(name => {
      const qty = day.items[name];
      if (!(qty > 0)) return;
      const tp = fishTreasurePrice(name);
      if (tp) {
        const coins = tp.price * qty;
        treasureRows.push({
          name: name,
          qty: qty,
          each: tp.price,
          coins: coins
        });
      } else {
        const flower = fishMarketFlowerPrice(name);
        const flowerTotal = flower * qty;
        fishRows.push({
          name: name,
          qty: qty,
          each: flower,
          flower: flowerTotal
        });
      }
    });
    fishRows.sort((a, b) => b.flower - a.flower || b.qty - a.qty);
    treasureRows.sort((a, b) => b.coins - a.coins);
    const fishQty = fishRows.reduce((s, r) => s + r.qty, 0);
    const treasureQty = treasureRows.reduce((s, r) => s + r.qty, 0);
    const cpf = coinPerFlower > 0 ? coinPerFlower : 1;
    const fishCoins = fishRows.reduce((s, r) => s + r.flower * cpf, 0);
    const treasureCoins = treasureRows.reduce((s, r) => s + r.coins, 0);
    const rodFree = fishRodIsFree();
    const rodsUsed = Math.max(0, day.casts - (rodFree ? day.rodsFree : 0));
    const rodUnit = fishRodUnitCoins();
    const toolCost = rodUnit * rodsUsed;
    const fishing = g.fishing;
    const attempts = fiNumber(fishing.dailyAttempts && fishing.dailyAttempts[today]);
    const limitInfo = getDailyFishingLimitInfoFromState(g) || {
      limit: 20,
      parts: []
    };
    const limit = limitInfo.limit;
    const extra = fiNumber(fishing.extraReels && fishing.extraReels.count);
    const extraUsed = Math.max(0, attempts - limit);
    const reelsLeft = Math.max(0, limit - attempts) + extra;
    const skillBoosts = [];
    FISH_SKILL_BOOSTS.forEach(def => {
      const level = skillLevelOf(g, def.name, def.ranks.length);
      if (level > 0) skillBoosts.push({
        name: def.name,
        text: def.text(def.ranks[level - 1])
      });
    });
    const placed = farmSyncCollectEquippedAndPlacedNames(g);
    const targetAt = nextUtcMidnight(nowMs);
    return {
      isFishingCard: true,
      name: "Fishing",
      profit: 0,
      isReady: reelsLeft > 0,
      targetAt: targetAt,
      remainingSec: Math.max(0, (targetAt - nowMs) / 1e3),
      tracked: store.started,
      day: day,
      fishRows: fishRows,
      treasureRows: treasureRows,
      fishQty: fishQty,
      treasureQty: treasureQty,
      fishCoins: fishCoins,
      treasureCoins: treasureCoins,
      rodsUsed: rodsUsed,
      rodUnit: rodUnit,
      rodFree: rodFree,
      toolCost: toolCost,
      attempts: attempts,
      limit: limit,
      extraReels: extra,
      extraUsed: extraUsed,
      limitParts: limitInfo.parts,
      skillBoosts: skillBoosts,
      reelsLeft: reelsLeft,
      harpoon: placed.has("Harpoon"),
      ancientRod: placed.has("Ancient Rod"),
      yieldBoosts: fishingBoostsActiveByScope("fishYield").concat(fishingBoostsActiveByScope("fishReels").filter(b => b.randomFishEvery)).map(b => ({
        name: b.name,
        text: fishYieldBoostText(b)
      }))
    };
  } catch (e) {
    return null;
  }
}

function fishingStatusFoldHtml(row) {
  return `<div class="guro-status-fold"><span class="guro-status-label">RESETS IN</span><span class="guro-status-stack"><span class="guro-status-value fi-countdown" data-fi-at="${row.targetAt}">${fishingClock(row.remainingSec)}</span><span class="guro-status-clock">${escapeHtml(hiveClockText(row.targetAt))}</span></span></div>`;
}

function fishYieldBoostText(b) {
  if (b.randomFishEvery) return `+1 random fish every ${b.randomFishEvery}th reel`;
  const add = b.fishYieldAdd || 0;
  const kind = b.tier === "basic" ? "basic fish" : "fish";
  if (add > 0 && add < 1) {
    const pct = Math.round(add * 1000) / 10;
    if (Math.abs(add - 1 / 15) < 1e-9) return "+1 random fish every 15th reel";
    return `${pct}% chance +1 ${kind}`;
  }
  return `+${fishDigFmt(add)} ${kind}`;
}

function boostRow(name, text) {
  return `<div class="boost-applied-row is-yield">${getBoostIcon(name)}<b>${escapeHtml(name)}</b> <span class="boost-total-value">${escapeHtml(text)}</span></div>`;
}

function appliedBoostHtml(row) {
  const rows = [];
  const day = row.day;
  row.limitParts.forEach(p => rows.push(boostRow(p.name, `+${fishDigFmt(p.add)} daily reels`)));
  row.skillBoosts.forEach(b => rows.push(boostRow(b.name, b.text)));
  if (row.harpoon || day.free > 0) rows.push(boostRow("Harpoon", `${fishDigFmt(day.free)}× free reel (${fishDigFmt(day.casts)} casts)`));
  if (row.ancientRod || day.rodsFree > 0) rows.push(boostRow("Ancient Rod", `${fishDigFmt(day.rodsFree)}× free Rod`));
  const bonus = Math.max(0, row.fishQty - day.casts);
  if (row.yieldBoosts.length && day.casts > 0) {
    row.yieldBoosts.forEach(b => rows.push(boostRow(b.name, b.text)));
    rows.push(`<div class="boost-applied-row is-yield"><b>Bonus Fish</b> <span class="boost-total-value">+${fishDigFmt(bonus)} (${fishDigFmt(row.fishQty)} fish from ${fishDigFmt(day.casts)} casts)</span></div>`);
  }
  if (!rows.length) return "";
  return `<div class="section-badge is-boost-label">⚡ Applied Boost</div>${rows.join("")}`;
}

function fishRowHtml(r) {
  const val = r.each > 0 ? `<span class="fh-val">${fishDigFmt(r.flower)}${FLOWER_ICON}</span>` : `<span class="fh-val fh-na">No price</span>`;
  return `<div class="fh-row"><span class="fh-qty">×${fishDigFmt(r.qty)}</span><span class="fh-ico">${getIcon(r.name)}</span><span class="fh-name" title="${escapeHtml(r.name)}">${escapeHtml(r.name)}</span>${val}</div>`;
}

function treasureRowHtml(r) {
  return `<div class="fh-trow"><div class="fh-trow-top"><span class="fh-qty">×${fishDigFmt(r.qty)}</span><span class="fh-ico">${getIcon(r.name)}</span><span class="fh-name" title="${escapeHtml(r.name)}">${escapeHtml(r.name)}</span><span class="fh-each">${fishDigFmt(r.each)}${COIN_ICON}<small>/ item</small></span><span class="fh-tot">${pairText(r.coins)}</span></div></div>`;
}

function totalsHtml(row) {
  const grossCoins = row.fishCoins + row.treasureCoins;
  const net = grossCoins - row.toolCost;
  const line = (label, val, cls, title) => `<div class="dig-total-row${cls ? " " + cls : ""}"${title ? ` title="${escapeHtml(title)}"` : ""}><span class="dig-total-label">${label}</span><span class="dig-total-val">${val}</span></div>`;
  const rodNote = row.rodFree ? "Ancient Rod (free)" : `Rod ×${fishDigFmt(row.rodsUsed)}`;
  const cap = row.limit + row.extraUsed + row.extraReels;
  const rodsQty = row.rodFree ? `×${fishDigFmt(row.day.casts)} <small>(free)</small>` : `×${fishDigFmt(row.rodsUsed)}${row.day.casts === 0 && row.attempts > 0 ? ` <small>(≈${fishDigFmt(row.attempts)} reels today)</small>` : ""}`;
  return `<div class="dig-totals">${line("Reels Left", `${fishDigFmt(row.reelsLeft)} <small>(${fishDigFmt(row.attempts)}/${fishDigFmt(cap)} used)</small>`, "")}${line("Fish Value", pairText(row.fishCoins), "")}${line("Treasure Value", pairText(row.treasureCoins), "")}${line("Total Gross", pairText(grossCoins), "")}${line("Rods Used", rodsQty, "", rodNote)}${line("Tool Cost", pairText(row.toolCost), "", rodNote)}${line("Net", `${net > 0 ? "+" : ""}${pairText(net)}`, (net > 0 ? "is-profit" : net < 0 ? "is-loss" : "") + " dig-total-net")}</div>`;
}

export function farmPanelRenderFishingCard(row, expanded) {
  const badgeHtml = row.isReady ? `<span class="harvest-badge is-ready">🟢 ${fishDigFmt(row.reelsLeft)} reels left</span>` : `<span class="harvest-badge is-growing">⏳ No reels left</span>`;
  const fishHtml = row.fishRows.length ? row.fishRows.map(fishRowHtml).join("") : `<div class="fh-empty">No fish caught yet.</div>`;
  const treasureHtml = row.treasureRows.length ? row.treasureRows.map(treasureRowHtml).join("") : `<div class="fh-empty">No treasures caught yet.</div>`;
  const noteHtml = row.tracked ? "" : `<div class="fh-empty">Catches are counted from your first sync. Sync again after fishing to see them here.</div>`;
  return `
  <div class="card animal-merged-card fh-card${row.isReady ? " is-profit" : ""}${expanded ? " expanded" : ""}" data-search="fishing" data-fp-category="pete">
    <div class="card-toggle">
      <div class="card-name-row">
        <span class="card-icon">${fishingMiniIconHtml(22)}</span>
        <div>
          <div class="card-name">Fishing</div>
          <div class="card-type-row">
            ${badgeHtml}
          </div>
        </div>
      </div>
      <div class="card-collapsed-profit">
        <span class="chev">▾</span>
      </div>
      ${fishingStatusFoldHtml(row)}
    </div>
    <div class="card-details">
      ${noteHtml}
      <div class="dig-data-label fh-label">Fish <span class="fh-label-count">×${fishDigFmt(row.fishQty)}</span></div>
      <div class="fh-list">${fishHtml}</div>
      <div class="dig-data-label fh-label">Treasures <span class="fh-label-count">×${fishDigFmt(row.treasureQty)}</span></div>
      <div class="fh-list">${treasureHtml}</div>
      <div class="dig-data-label fh-label">Tool Cost</div>
      <div class="fh-tool">${fishRodSectionHtml()}</div>
      <div class="dig-data-label fh-label">Materials Used</div>
      <div class="fh-tool">${fishRodUsageHtml(row.rodsUsed)}</div>
      ${totalsHtml(row)}
      ${appliedBoostHtml(row)}
    </div>
  </div>`;
}

document.addEventListener("click", e => {
  const t = e.target && e.target.closest ? e.target.closest(".fh-card [data-dig-mat-mode]") : null;
  if (!t) return;
  fishSetRodMatMode(t.getAttribute("data-dig-mat-name"), t.getAttribute("data-dig-mat-mode"));
  renderFarmPanelTabContent();
});
