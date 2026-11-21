import { toast } from "./calculator.js";

import { dailyHarvestReloadStore } from "./daily_harvest.js";

import { ICON_DATA } from "./icon_data.js";

const APP_ID = "sfl-guro";

const KIND = "daily-harvest-log";

const VERSION = 1;

const FIXED_KEYS = [ "hl_daily_harvest_v1", "hl_hlog_cache_v1", "hl_hlog_tl_v1", "hl_hlog_farm" ];

const CAVE_KEY_RE = /^guro_cave_(dug_v1|track_v2)_\d{1,20}$/;

const SENT_KEY = "hl_hlog_sent_v1";

const CONFIRM_MS = 5000;

let confirmTimer = null;

function $(id) {
  return document.getElementById(id);
}

function isManagedKey(key) {
  return FIXED_KEYS.indexOf(key) !== -1 || CAVE_KEY_RE.test(key);
}

function caveKeys() {
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && CAVE_KEY_RE.test(k)) out.push(k);
    }
  } catch (e) {}
  return out;
}

function readValue(key) {
  let raw = null;
  try {
    raw = localStorage.getItem(key);
  } catch (e) {}
  if (raw == null) return undefined;
  const head = raw.charAt(0);
  if (head !== "{" && head !== "[") return raw;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return raw;
  }
}

function hasHarvestData(store) {
  if (!store || typeof store !== "object") return false;
  return Object.keys(store).some(k => k !== "__last" && store[k] && typeof store[k] === "object");
}

export function buildHarvestBackup() {
  const data = {};
  FIXED_KEYS.concat(caveKeys()).forEach(key => {
    const v = readValue(key);
    if (v !== undefined) data[key] = v;
  });
  if (!hasHarvestData(data.hl_daily_harvest_v1)) return "";
  const farm = data.hl_daily_harvest_v1.__last || data.hl_hlog_farm || "";
  return JSON.stringify({
    app: APP_ID,
    kind: KIND,
    version: VERSION,
    savedAt: new Date().toISOString(),
    farm: String(farm),
    data: data
  });
}

function validateBackup(text) {
  let obj;
  try {
    obj = JSON.parse(text);
  } catch (e) {
    return {
      error: "That is not valid backup text. Paste the full text you copied from your old device."
    };
  }
  if (!obj || obj.app !== APP_ID || obj.kind !== KIND || typeof obj.data !== "object" || !obj.data) {
    return {
      error: "This is not a Daily Harvest Log backup from SFL GURO."
    };
  }
  if (obj.version !== VERSION) {
    return {
      error: "This backup was made by a different version and cannot be restored."
    };
  }
  const keys = Object.keys(obj.data);
  if (keys.some(k => !isManagedKey(k))) {
    return {
      error: "The backup contains unknown data and was rejected."
    };
  }
  if (!hasHarvestData(obj.data.hl_daily_harvest_v1)) {
    return {
      error: "The backup has no daily harvest data inside."
    };
  }
  return {
    obj: obj
  };
}

function snapshotKeys(extra) {
  const snap = {};
  FIXED_KEYS.concat(caveKeys(), extra, [ SENT_KEY ]).forEach(key => {
    try {
      snap[key] = localStorage.getItem(key);
    } catch (e) {
      snap[key] = null;
    }
  });
  return snap;
}

function rollbackKeys(snap) {
  Object.keys(snap).forEach(key => {
    try {
      if (snap[key] == null) localStorage.removeItem(key); else localStorage.setItem(key, snap[key]);
    } catch (e) {}
  });
}

function applyBackup(obj) {
  const data = obj.data;
  const snap = snapshotKeys(Object.keys(data));
  try {
    caveKeys().forEach(key => localStorage.removeItem(key));
    FIXED_KEYS.forEach(key => {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const v = data[key];
        localStorage.setItem(key, typeof v === "string" ? v : JSON.stringify(v));
      } else {
        localStorage.removeItem(key);
      }
    });
    Object.keys(data).forEach(key => {
      if (!CAVE_KEY_RE.test(key)) return;
      const v = data[key];
      localStorage.setItem(key, typeof v === "string" ? v : JSON.stringify(v));
    });
    localStorage.removeItem(SENT_KEY);
  } catch (e) {
    rollbackKeys(snap);
    dailyHarvestReloadStore();
    return false;
  }
  dailyHarvestReloadStore();
  return true;
}

function setStatus(msg, bad) {
  const el = $("hlBackupStatus");
  if (!el) return;
  el.textContent = msg || "";
  el.classList.toggle("is-bad", !!bad);
}

function copyText(text, onDone) {
  const fallback = () => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {}
    ta.remove();
    onDone(ok);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => onDone(true)).catch(fallback);
  } else {
    fallback();
  }
}

function resetRestoreButton() {
  const btn = $("hlBackupRestoreBtn");
  if (confirmTimer) clearTimeout(confirmTimer);
  confirmTimer = null;
  if (btn) {
    btn.textContent = "Restore";
    btn.classList.remove("is-armed");
  }
}

function onCopy() {
  const text = buildHarvestBackup();
  if (!text) {
    setStatus("Nothing to back up yet. Sync your farm first so the Daily Harvest Log has data.", true);
    return;
  }
  copyText(text, ok => {
    if (ok) {
      setStatus("Copied " + Math.max(1, Math.round(text.length / 1024)) + " KB. Now paste it into the Restore box on your other device.", false);
      toast("Backup copied");
    } else {
      setStatus("Copy was blocked by the browser. Try again.", true);
    }
  });
}

function onRestore() {
  const box = $("hlBackupInput");
  const btn = $("hlBackupRestoreBtn");
  if (!box || !btn) return;
  const text = box.value.trim();
  if (!text) {
    setStatus("Paste the backup text into the box first.", true);
    return;
  }
  const res = validateBackup(text);
  if (res.error) {
    resetRestoreButton();
    setStatus(res.error, true);
    return;
  }
  if (!btn.classList.contains("is-armed")) {
    btn.classList.add("is-armed");
    btn.textContent = "Tap again to confirm";
    setStatus("This replaces the Daily Harvest Log on this device with the backup. Tap Restore again to continue.", false);
    if (confirmTimer) clearTimeout(confirmTimer);
    confirmTimer = setTimeout(resetRestoreButton, CONFIRM_MS);
    return;
  }
  resetRestoreButton();
  if (!applyBackup(res.obj)) {
    setStatus("Restore failed because this device has no storage space left. Nothing was changed.", true);
    return;
  }
  box.value = "";
  setStatus("Restored. Reloading…", false);
  toast("Backup restored");
  setTimeout(() => {
    window.location.reload();
  }, 700);
}

function onToggle() {
  const panel = $("hlBackupLayer");
  const btn = $("hlBackupToggleBtn");
  if (!panel) return;
  const show = panel.hidden;
  if (show && panel.parentNode !== document.body) document.body.appendChild(panel);
  panel.hidden = !show;
  if (btn) {
    btn.classList.toggle("active", show);
    btn.setAttribute("aria-expanded", show ? "true" : "false");
  }
  if (!show) {
    resetRestoreButton();
    setStatus("", false);
  }
}

export function initHarvestBackup() {
  const closeImg = $("hlBackupCloseImg");
  if (closeImg) closeImg.src = ICON_DATA["close.png"];
  document.addEventListener("click", e => {
    const t = e.target && e.target.closest ? e.target : null;
    if (!t) return;
    if (t.id === "hlBackupLayer") onToggle(); else if (t.closest("#hlBackupToggleBtn")) onToggle(); else if (t.closest("#hlBackupCopyBtn")) onCopy(); else if (t.closest("#hlBackupRestoreBtn")) onRestore(); else if (t.closest("#hlBackupCloseBtn")) {
      const panel = $("hlBackupLayer");
      if (panel && !panel.hidden) onToggle();
    }
  });
}
