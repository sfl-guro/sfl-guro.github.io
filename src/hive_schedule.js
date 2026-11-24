import { computeReadyAt, flowerWindows } from "./speed_windows.js";

export const HIVE_FULL_RAW = 864e5;

const finite = v => typeof v === "number" && isFinite(v) ? v : null;

export function makeFlowerReadyResolver(g, flowersField, plantMsFor) {
  const beds = flowersField && flowersField.flowerBeds;
  if (!beds || typeof beds !== "object") return null;
  let windows = null;
  return id => {
    const bed = beds[id];
    if (!bed || !bed.flower) return null;
    const f = bed.flower;
    const planted = finite(f.plantedAt);
    const base = finite(f.baseDurationMs) ?? (typeof plantMsFor === "function" ? finite(plantMsFor(f.name)) : null);
    if (planted == null || base == null) return undefined;
    if (!windows) windows = flowerWindows(g);
    return computeReadyAt({ startedAt: planted, baseDurationMs: base, windows: windows });
  };
}

export function computeHiveSchedule(hive, nowMs, flowerReadyAt) {
  const honey = hive && hive.honey ? hive.honey : {};
  const stored = finite(honey.produced) ?? 0;
  const updatedAt = finite(honey.updatedAt) ?? nowMs;
  const list = Array.isArray(hive && hive.flowers) ? hive.flowers : [];
  const segments = [];
  list.forEach(f => {
    if (!f || typeof f !== "object") return;
    const at = finite(f.attachedAt) ?? updatedAt;
    let until = finite(f.attachedUntil) ?? nowMs;
    const rate = finite(f.rate) ?? 1;
    if (typeof flowerReadyAt === "function") {
      const readyAt = flowerReadyAt(f.id);
      if (readyAt === null) return;
      if (typeof readyAt === "number" && isFinite(readyAt)) until = Math.min(until, readyAt);
    }
    if (until > at && rate > 0) segments.push({ at: at, until: until, rate: rate });
  });
  let produced = stored;
  segments.forEach(s => {
    const start = Math.max(updatedAt, s.at);
    const end = Math.min(nowMs, s.until);
    if (end > start) produced += (end - start) * s.rate;
  });
  if (produced >= HIVE_FULL_RAW) {
    return { produced: produced, ready: true, readyAtMs: null, stallAtMs: null, upcoming: false };
  }
  const ahead = segments.filter(s => s.until > nowMs).map(s => ({ at: Math.max(s.at, nowMs), until: s.until, rate: s.rate }));
  const cuts = Array.from(new Set(ahead.flatMap(s => [ s.at, s.until ]))).sort((a, b) => a - b);
  let remaining = HIVE_FULL_RAW - produced;
  let lastEnd = null;
  for (let i = 0; i < cuts.length - 1; i++) {
    const a = cuts[i];
    const b = cuts[i + 1];
    const rate = ahead.reduce((r, s) => s.at <= a && s.until >= b ? r + s.rate : r, 0);
    if (rate <= 0) continue;
    const gain = (b - a) * rate;
    if (gain >= remaining) {
      return { produced: produced, ready: false, readyAtMs: a + remaining / rate, stallAtMs: null, upcoming: true };
    }
    remaining -= gain;
    lastEnd = b;
  }
  return { produced: produced, ready: false, readyAtMs: null, stallAtMs: lastEnd, upcoming: ahead.length > 0 };
}
