import * as calc from "./calculator.js";
import * as ui from "./ui.js";

const CATEGORIES = [ "Yield", "Time", "Cost", "Stock", "Swarm", "Other" ];

function esc(s) {
  return calc.escapeHtml(String(s));
}

function n2(n) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function signed(v) {
  return `${v > 0 ? "+" : ""}${n2(v)}`;
}

function iconSpan(html) {
  return `<span class="rc-share-icon">${html}</span>`;
}

function targetIcons(b, subjects) {
  const seen = new Set();
  let out = "";
  const push = (key, html) => {
    if (!html || seen.has(key)) return;
    seen.add(key);
    out += iconSpan(html);
  };
  (subjects || []).forEach(s => {
    if (s.products) {
      if (b.productIndex != null) {
        const n = s.products[b.productIndex];
        if (n) push(n, ui.getIcon(n));
      } else {
        s.products.forEach(n => push(n, ui.getIcon(n)));
      }
    } else {
      push(s.name, s.yieldIcon || s.icon);
    }
  });
  return out;
}

function effectParts(b, ctx) {
  const parts = [];
  const add = (kind, text) => parts.push({
    kind: kind,
    html: esc(text)
  });
  const addRaw = (kind, html) => parts.push({
    kind: kind,
    html: html
  });
  const target = targetIcons(b, ctx.subjects);
  const yieldHtml = lead => `${esc(lead)}${target} Yield`;
  const keyed = (map, key, byResource) => {
    const keys = Object.keys(map);
    if (key != null && keys.includes(key)) return `${esc(signed(map[key]))}${target} Yield`;
    return keys.map(k => byResource ? `${esc(signed(map[k]))}${iconSpan(ui.getIcon(k))} Yield` : `${esc(signed(map[k]))}${target} Yield (${esc(k)})`).join(" / ");
  };
  if (b.tierEffects) addRaw("Yield", keyed(b.tierEffects, ctx.tier, false)); else if (b.resourceEffects) addRaw("Yield", keyed(b.resourceEffects, ctx.name, true)); else if (b.yieldAdd) addRaw("Yield", yieldHtml(signed(b.yieldAdd)));
  if (b.yieldAddAll) addRaw("Yield", yieldHtml(signed(b.yieldAddAll)));
  if (b.yieldMult) addRaw("Yield", yieldHtml(`×${b.yieldMult}`));
  if (b.saltYieldAdd) addRaw("Yield", yieldHtml(signed(b.saltYieldAdd)));
  if (b.saltRechargeTimeMult) add("Time", `×${b.saltRechargeTimeMult} time`);
  if (b.harvestAdd) addRaw("Yield", `${esc(`+${n2(b.harvestAdd)}`)}${target} Harvest`);
  if (b.honeyYieldAdd) addRaw("Yield", yieldHtml(signed(b.honeyYieldAdd)));
  if (b.flowerExtraChance) addRaw("Yield", yieldHtml(`+${n2(b.flowerExtraChance)}`));
  if (b.flowerExtraFlat) addRaw("Yield", yieldHtml(`+${n2(b.flowerExtraFlat)}`));
  if (b.timeMult) add("Time", `×${b.timeMult} time`);
  if (b.timeMultAll) add("Time", `×${b.timeMultAll} time`);
  if (b.yieldMultAll) addRaw("Yield", yieldHtml(`×${b.yieldMultAll}`));
  if (b.feedMult) add("Cost", `×${b.feedMult} feed`);
  if (b.feedMultAll) add("Cost", `×${b.feedMultAll} feed`);
  if (b.freeFeed) add("Cost", "free feed");
  if (b.freeCure) add("Cost", "free medicine");
  if (b.cureCostMult) add("Cost", `×${b.cureCostMult} medicine cost`);
  if (b.speedAdd) add("Time", `${signed(b.speedAdd)} speed`);
  if (b.flowerTimeMult) add("Time", `×${b.flowerTimeMult} flower time`);
  if (b.freeCost) add("Cost", b.scope === "saltGlobal" ? "free rake" : "free seeds");
  if (b.coinCostMultAll) add("Cost", `×${b.coinCostMultAll} cost`);
  if (b.toolCostMult) add("Cost", `×${b.toolCostMult} tool cost`);
  if (b.coinCostMult) add("Cost", `×${b.coinCostMult} tool cost`);
  if (b.noTool) add("Cost", "free tool");
  if (b.noWood) add("Cost", "free axe");
  if (b.materialSwap) add("Cost", `${b.materialSwap.from} → ${b.materialSwap.to}`);
  if (b.seedQtyMult) add("Cost", `×${b.seedQtyMult} seeds`);
  if (b.oilQtyMult) add("Cost", `×${b.oilQtyMult} oil`);
  if (b.oilFlatReduce) add("Cost", `-${n2(b.oilFlatReduce)} oil`);
  if (b.stockAdd) add("Stock", `+${n2(b.stockAdd)} stock`);
  if (b.swarmChanceAdd) add("Swarm", `+${n2(b.swarmChanceAdd * 100)}% swarm chance`);
  if (b.swarmChanceMult) add("Swarm", `×${b.swarmChanceMult} swarm chance`);
  if (b.woodReturnPenalty) add("Other", `-${n2(b.woodReturnPenalty)} wood`);
  if (b.woodReturnAdd) add("Other", `+${n2(b.woodReturnAdd)} wood`);
  if (b.plotCap) add("Other", `AOE ${b.plotCap} ${ctx.unit || "plots"}`);
  return parts;
}

function rowHtml(b, text, noteSkip) {
  const locked = calc.isSeasonLocked(b);
  const active = calc.isBoostDraftActive(b.id);
  const mark = locked ? "🔒" : `<input type="checkbox" class="rc-boost-check" tabindex="-1" aria-hidden="true"${active ? " checked" : ""}>`;
  const note = b.note && !noteSkip.test(b.note) && b.note.length < 60 ? ` · ${b.note}` : "";
  return `<div class="lib-item-row rc-boost-pick${active ? " boost-active" : ""}${locked ? " season-locked" : ""}" data-boost-id="${b.id}"><span class="lib-item-icon">${mark}</span><div class="lib-item-main"><div class="lib-item-name">${ui.getBoostIcon(b.name)}${esc(b.name)}</div><div class="lib-item-meta">${text}${note}</div></div></div>`;
}

function subjectHtml(title, icon, list, ctx, noteSkip) {
  const buckets = {};
  list.forEach(b => {
    const parts = effectParts(b, ctx);
    if (!parts.length) {
      (buckets.Other = buckets.Other || []).push(rowHtml(b, "", noteSkip));
      return;
    }
    const kinds = [];
    parts.forEach(p => {
      if (!kinds.includes(p.kind)) kinds.push(p.kind);
    });
    kinds.forEach(k => {
      const text = parts.filter(p => p.kind === k).map(p => p.html).join(", ");
      (buckets[k] = buckets[k] || []).push(rowHtml(b, text, noteSkip));
    });
  });
  const sections = CATEGORIES.filter(k => buckets[k]).map(k => `<div class="rc-boost-section"><div class="rc-boost-section-title">${k}</div>${buckets[k].join("")}</div>`).join("");
  if (!sections) return "";
  return `<div class="rc-boost-subject"><div class="rc-boost-subject-title guro-frame">${icon ? `<span class="rc-boost-subject-icon">${icon}</span>` : ""}<span>${esc(title)}</span></div>${sections}</div>`;
}

export function boostsBySubjectHtml(opts) {
  const noteSkip = opts.noteSkip || /AOE|free seeds|expected/i;
  const subjects = opts.subjects;
  const perSubject = subjects.map(s => ({
    subject: s,
    list: opts.boosts.filter(b => opts.appliesTo(b, s))
  }));
  let html = "";
  let shared = [];
  if (subjects.length > 1) {
    shared = opts.boosts.filter(b => perSubject.every(p => p.list.includes(b)));
    if (shared.length) html += subjectHtml(`${opts.allLabel || "All Selected"}`, "", shared, {
      unit: opts.unit,
      subjects: subjects
    }, noteSkip);
  }
  perSubject.forEach(p => {
    const list = p.list.filter(b => !shared.includes(b));
    html += subjectHtml(`Boost for ${p.subject.name}`, p.subject.icon, list, {
      name: p.subject.name,
      tier: p.subject.tier,
      unit: opts.unit,
      subjects: [ p.subject ]
    }, noteSkip);
  });
  return html;
}
