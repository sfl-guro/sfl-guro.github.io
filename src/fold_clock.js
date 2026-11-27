const MONTH_SEC = 30 * 86400;

const DAY_SEC = 86400;

export function foldClock(sec) {
  sec = Math.max(0, Math.floor(Number(sec) || 0));
  const units = [ [ Math.floor(sec / MONTH_SEC), "M" ], [ Math.floor(sec % MONTH_SEC / DAY_SEC), "D" ], [ Math.floor(sec % DAY_SEC / 3600), "h" ], [ Math.floor(sec % 3600 / 60), "m" ], [ sec % 60, "s" ] ];
  const parts = [];
  units.forEach(([value, suffix], i) => {
    if (parts.length || value > 0 || i === units.length - 1) parts.push(`${value}${suffix}`);
  });
  return parts.join(" ");
}

export function foldStamp(ms, nowMs = Date.now()) {
  const d = new Date(ms);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  const time = `${h}:${String(m).padStart(2, "0")} ${ampm}`;
  const today = new Date(nowMs);
  const sameDay = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  if (sameDay) return time;
  if (ms - nowMs > 6 * DAY_SEC * 1e3) return `${d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  })} ${time}`;
  return `${d.toLocaleDateString(undefined, {
    weekday: "short"
  })} ${time}`;
}
