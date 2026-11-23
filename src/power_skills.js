import { escapeHtml, farmSyncExtractGameState, farmSyncCollectEquippedAndPlacedNames, formatDuration } from "./calculator.js";

import { getIcon, getBoostIcon, hiveClockText } from "./ui.js";

const HOUR = 3600 * 1e3;

export const POWER_SKILL_DEFS = [ {
  name: "Instant Growth",
  ranks: [ 72 * HOUR, 60 * HOUR, 48 * HOUR ]
}, {
  name: "Tree Blitz",
  ranks: [ 24 * HOUR, 18 * HOUR, 12 * HOUR ]
}, {
  name: "Barnyard Rouse",
  ranks: [ 120 * HOUR, 96 * HOUR, 84 * HOUR ]
}, {
  name: "Greenhouse Guru",
  ranks: [ 96 * HOUR, 84 * HOUR, 72 * HOUR ]
}, {
  name: "Instant Gratification",
  ranks: [ 96 * HOUR, 84 * HOUR, 72 * HOUR ]
}, {
  name: "Petal Blessed",
  ranks: [ 96 * HOUR, 84 * HOUR, 72 * HOUR ]
}, {
  name: "Grease Lightning",
  ranks: [ 96 * HOUR, 84 * HOUR, 72 * HOUR ]
}, {
  name: "Salt Surge",
  ranks: [ 72 * HOUR, 60 * HOUR, 48 * HOUR ]
} ];

const COOLDOWN_WEARABLES = [ {
  name: "Luna's Crescent",
  mult: .5
}, {
  name: "Ascension Staff",
  mult: .9
} ];

function skillLevelOf(skills, name, max) {
  if (!skills || typeof skills !== "object") return 0;
  const key = Object.keys(skills).find(k => k.trim().toLowerCase() === name.toLowerCase());
  if (!key) return 0;
  const lv = Math.round(Number(skills[key]));
  if (!isFinite(lv) || lv < 1) return 0;
  return Math.min(lv, max);
}

function slug(name) {
  return "power-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function powerSkillSearchKey(name) {
  return slug(name);
}

export function farmPanelComputePowerSkillCards(json) {
  try {
    const g = farmSyncExtractGameState(json);
    const bumpkin = g && g.bumpkin && typeof g.bumpkin === "object" ? g.bumpkin : null;
    if (!bumpkin) return [];
    const skills = bumpkin.skills && typeof bumpkin.skills === "object" ? bumpkin.skills : {};
    const used = bumpkin.previousPowerUseAt && typeof bumpkin.previousPowerUseAt === "object" ? bumpkin.previousPowerUseAt : {};
    const worn = farmSyncCollectEquippedAndPlacedNames(g);
    const wearables = COOLDOWN_WEARABLES.filter(w => worn.has(w.name));
    const now = Date.now();
    const rows = [];
    POWER_SKILL_DEFS.forEach(def => {
      const level = skillLevelOf(skills, def.name, def.ranks.length);
      if (!level) return;
      const baseMs = def.ranks[0];
      const rankMs = def.ranks[level - 1];
      const finalMs = wearables.reduce((ms, w) => ms * w.mult, rankMs);
      const rawLast = Number(used[def.name]);
      const lastUsedAt = isFinite(rawLast) && rawLast > 0 ? rawLast : 0;
      const readyAt = lastUsedAt ? lastUsedAt + finalMs : 0;
      const isReady = readyAt <= now;
      rows.push({
        isPowerSkillCard: true,
        name: def.name,
        searchKey: slug(def.name),
        profit: 0,
        level: level,
        maxLevel: def.ranks.length,
        baseMs: baseMs,
        rankMs: rankMs,
        finalMs: finalMs,
        wearables: wearables,
        lastUsedAt: lastUsedAt,
        readyAt: readyAt,
        isReady: isReady,
        remainingSec: isReady ? 0 : (readyAt - now) / 1e3
      });
    });
    return rows;
  } catch (e) {
    return [];
  }
}

function span(ms) {
  return escapeHtml(formatDuration(Math.round(ms / 1e3)));
}

function boostRow(name, text) {
  return `<div class="boost-applied-row is-yield">${getBoostIcon(name)}<b>${escapeHtml(name)}</b> <span class="boost-total-value">${escapeHtml(text)}</span></div>`;
}

function appliedBoostHtml(row) {
  const rows = [];
  if (row.rankMs < row.baseMs) rows.push(boostRow(`${row.name} Lv ${row.level}`, `${formatDuration(Math.round(row.baseMs / 1e3))} → ${formatDuration(Math.round(row.rankMs / 1e3))}`));
  row.wearables.forEach(w => rows.push(boostRow(w.name, `×${w.mult} cooldown`)));
  if (!rows.length) return "";
  return `<div class="section-badge is-boost-label">⚡ Applied Boost</div>${rows.join("")}`;
}

export function farmPanelRenderPowerSkillCard(row, expanded, statusFoldHtml) {
  const badgeHtml = row.isReady ? `<span class="harvest-badge is-ready">✅ Ready</span>` : `<span class="harvest-badge is-growing">⏳ Cooldown</span>`;
  const line = (label, val) => `<div class="dig-total-row"><span class="dig-total-label">${label}</span><span class="dig-total-val">${val}</span></div>`;
  const lastLine = row.lastUsedAt ? line("Last Used", escapeHtml(hiveClockText(row.lastUsedAt))) : "";
  const readyLine = row.readyAt && !row.isReady ? line("Ready At", escapeHtml(hiveClockText(row.readyAt))) : "";
  return `
  <div class="card animal-merged-card${row.isReady ? " is-profit" : ""}${expanded ? " expanded" : ""}" data-search="${row.searchKey}" data-fp-category="pete">
    <div class="card-toggle">
      <div class="card-name-row">
        <span class="card-icon">${getIcon(row.name)}</span>
        <div>
          <div class="card-name">${escapeHtml(row.name)}</div>
          <div class="card-type-row">
            <span class="card-type">Power Skill · Lv ${row.level}/${row.maxLevel}</span>
            ${badgeHtml}
          </div>
        </div>
      </div>
      <div class="card-collapsed-profit">
        <span class="chev">▾</span>
      </div>
      ${statusFoldHtml}
    </div>
    <div class="card-details">
      <div class="dig-totals">${line("Base Cooldown", span(row.baseMs))}${line("New Cooldown", span(row.finalMs))}${lastLine}${readyLine}</div>
      ${appliedBoostHtml(row)}
    </div>
  </div>`;
}
