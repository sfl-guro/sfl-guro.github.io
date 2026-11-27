import { escapeHtml, farmSyncExtractGameState } from "./calculator.js";

import { getIcon } from "./ui.js";

const DAY_MS = 864e5;

const FREE_RESET_DAYS = 180;

const BASE_GEM_COST = 200;

export const SKILL_RESET_NAME = "Skill Reset";

export const SKILL_RESET_SEARCH_KEY = "skill-reset";

function stamp(ms) {
  const d = new Date(ms);
  const date = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit"
  });
  return `${date}, ${time}`;
}

export function farmPanelComputeSkillResetCard(json, now) {
  try {
    const nowMs = now || Date.now();
    const g = farmSyncExtractGameState(json);
    const bumpkin = g && g.bumpkin && typeof g.bumpkin === "object" ? g.bumpkin : null;
    if (!bumpkin) return null;
    const skills = bumpkin.skills && typeof bumpkin.skills === "object" ? bumpkin.skills : {};
    if (!Object.keys(skills).length) return null;
    const rawLast = Number(bumpkin.previousFreeSkillResetAt);
    const lastAt = isFinite(rawLast) && rawLast > 0 ? rawLast : 0;
    const readyAt = lastAt + FREE_RESET_DAYS * DAY_MS;
    const isReady = readyAt <= nowMs;
    const rawPaid = Number(bumpkin.paidSkillResets);
    const paidResets = isFinite(rawPaid) && rawPaid > 0 ? Math.floor(rawPaid) : 0;
    return {
      isSkillResetCard: true,
      name: SKILL_RESET_NAME,
      searchKey: SKILL_RESET_SEARCH_KEY,
      profit: 0,
      isReady: isReady,
      lastAt: lastAt,
      readyAt: readyAt,
      remainingSec: isReady ? 0 : (readyAt - nowMs) / 1e3,
      paidResets: paidResets,
      gemCost: BASE_GEM_COST * Math.pow(2, paidResets),
      skillCount: Object.keys(skills).length
    };
  } catch (e) {
    return null;
  }
}

export function farmPanelRenderSkillResetCard(row, expanded, statusFoldHtml) {
  const badgeHtml = row.isReady ? `<span class="harvest-badge is-ready">✅ Free reset ready</span>` : `<span class="harvest-badge is-growing">⏳ Cooldown</span>`;
  const line = (label, val) => `<div class="dig-total-row"><span class="dig-total-label">${label}</span><span class="dig-total-val">${val}</span></div>`;
  const lastLine = line("Last Free Reset", row.lastAt ? escapeHtml(stamp(row.lastAt)) : "Never");
  const nextLine = line(row.isReady ? "Available Since" : "Next Free Reset", row.lastAt || !row.isReady ? escapeHtml(stamp(row.readyAt)) : "Now");
  return `
  <div class="card animal-merged-card${row.isReady ? " is-profit" : ""}${expanded ? " expanded" : ""}" data-search="${row.searchKey}" data-fp-category="pete">
    <div class="card-toggle">
      <div class="card-name-row">
        <span class="card-icon">${getIcon("Green Thumb")}</span>
        <div>
          <div class="card-name">${escapeHtml(row.name)}</div>
          <div class="card-type-row">
            <span class="card-type">Bumpkin Skills · ${row.skillCount} learned</span>
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
      <div class="dig-totals">${line("Free Reset Cooldown", `${FREE_RESET_DAYS} days`)}${lastLine}${nextLine}${line("Paid Resets Used", String(row.paidResets))}${line("Next Paid Reset", `${row.gemCost} Gems`)}</div>
    </div>
  </div>`;
}
