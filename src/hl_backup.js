import { toast } from "./calculator.js";

import { dailyHarvestReloadStore } from "./daily_harvest.js";

import { ICON_DATA } from "./icon_data.js";

import { harvestLogFarmId } from "./harvest_log.js";

import { stateSetCode, stateRemoveCode, stateLastSaved, harvestStateInit } from "./hl_state_sync.js";

import { stateCodeInfo, stateCodeValid, stateCodeRequired } from "./hl_code_store.js";

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

let codeShown = false;

let askBusy = false;

let codeBusy = false;

function farmNow() {
  return String(harvestLogFarmId() || "");
}

function setMsg(id, msg, bad) {
  const el = $(id);
  if (!el) return;
  el.textContent = msg || "";
  el.classList.toggle("is-bad", !!bad);
}

function failText(res) {
  if (res.reason === "bad_code") return "Use 4 to 32 characters (letters, numbers or symbols, no spaces).";
  if (res.reason === "code_exists") {
    const left = Number(res.left);
    return "This Farm ID already has a private code on the server. Enter the first code that was set." + (Number.isFinite(left) && left >= 0 ? " Tries left: " + left + "." : "");
  }
  if (res.reason === "locked") {
    const mins = Math.max(1, Math.ceil((Number(res.retryAfter) || 900) / 60));
    return "Too many wrong tries. Try again in about " + mins + " minute" + (mins === 1 ? "" : "s") + ".";
  }
  if (res.reason === "network") return "Could not reach the server. Check your connection and try again.";
  if (res.reason === "no_farm") return "Sync your farm first so the app knows your Farm ID.";
  return "The server could not save the code. Try again later.";
}

function timeText(ms) {
  try {
    return new Date(ms).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (e) {
    return "";
  }
}

function renderCode() {
  const state = $("hlCodeState");
  const view = $("hlCodeView");
  const form = $("hlCodeForm");
  const value = $("hlCodeValue");
  if (!state || !view || !form || !value) return;
  const farm = farmNow();
  const info = farm ? stateCodeInfo(farm) : null;
  const input = $("hlCodeInput");
  const saveBtn = $("hlCodeSaveBtn");
  if (!farm) {
    state.textContent = "Sync your farm first so the app knows your Farm ID.";
    view.hidden = true;
    form.hidden = true;
    return;
  }
  if (!info) {
    state.textContent = stateCodeRequired(farm) ? "This Farm ID already has a private code on the server. Enter it to sync and view your log." : "Not set. Set a private code to turn on the automatic server backup for Farm ID " + farm + ".";
    view.hidden = true;
    form.hidden = false;
  } else if (info.bad) {
    state.textContent = "The code saved here does not match the code the server has for this Farm ID. Edit it and enter the first code that was set.";
    view.hidden = false;
    form.hidden = true;
    codeShown = true;
  } else {
    const saved = stateLastSaved(farm);
    if (saved && saved.tooLarge) state.textContent = "Server backup is on, but today's log is too large to store.";
    else if (saved) state.textContent = "Server backup is on. Last saved " + timeText(saved.at) + ".";
    else state.textContent = "Server backup is on. It saves after your next sync.";
    view.hidden = false;
    form.hidden = true;
  }
  if (info) value.textContent = codeShown ? info.code : "\u2022".repeat(Math.min(info.code.length, 12));
  if (input) input.disabled = codeBusy;
  if (saveBtn) saveBtn.disabled = codeBusy;
}

async function saveCodeFrom(inputId, msgId, onOk) {
  const input = $(inputId);
  const farm = farmNow();
  if (!input) return;
  if (!farm) {
    setMsg(msgId, failText({
      reason: "no_farm"
    }), true);
    return;
  }
  const code = input.value.trim();
  if (!stateCodeValid(code)) {
    setMsg(msgId, failText({
      reason: "bad_code"
    }), true);
    return;
  }
  setMsg(msgId, "Saving…", false);
  const res = await stateSetCode(farm, code);
  if (!res.ok) {
    setMsg(msgId, failText(res), true);
    return;
  }
  input.value = "";
  codeShown = false;
  setMsg(msgId, "", false);
  toast("Private code saved");
  onOk();
}

function onSaveCode() {
  if (codeBusy) return;
  codeBusy = true;
  renderCode();
  saveCodeFrom("hlCodeInput", "hlCodeMsg", () => {
    setMsg("hlCodeMsg", "Code saved. Server backup is on.", false);
  }).finally(() => {
    codeBusy = false;
    renderCode();
  });
}

function onEditCode() {
  const farm = farmNow();
  if (!farm) return;
  stateRemoveCode(farm);
  codeShown = false;
  renderCode();
  const input = $("hlCodeInput");
  if (input) input.focus();
}

function onToggleCodeValue() {
  codeShown = !codeShown;
  renderCode();
}

function snoozeKey(farm) {
  return "hl_code_ask_snooze_" + farm;
}

function askOpen() {
  const ask = $("hlCodeAsk");
  if (!ask || !ask.hidden) return;
  if (ask.parentNode !== document.body) document.body.appendChild(ask);
  ask.hidden = false;
  setMsg("hlAskMsg", "", false);
}

function askClose(snooze) {
  const ask = $("hlCodeAsk");
  if (!ask) return;
  ask.hidden = true;
  if (snooze) {
    try {
      sessionStorage.setItem(snoozeKey(farmNow()), "1");
    } catch (e) {}
  }
}

function maybeAsk() {
  const farm = farmNow();
  if (!farm || stateCodeInfo(farm)) return;
  const layer = $("hlBackupLayer");
  if (layer && !layer.hidden) return;
  try {
    if (sessionStorage.getItem(snoozeKey(farm))) return;
  } catch (e) {}
  askOpen();
}

function askRequired() {
  const farm = farmNow();
  if (!farm) return;
  const info = stateCodeInfo(farm);
  if (info && !info.bad) return;
  const layer = $("hlBackupLayer");
  if (layer && !layer.hidden) return;
  try {
    if (sessionStorage.getItem(snoozeKey(farm))) return;
  } catch (e) {}
  askOpen();
  setMsg("hlAskMsg", "This Farm ID already has a private code. Enter it to sync and view your log.", true);
}

function onAskSave() {
  if (askBusy) return;
  askBusy = true;
  saveCodeFrom("hlAskInput", "hlAskMsg", () => {
    askClose(false);
    renderCode();
  }).finally(() => {
    askBusy = false;
  });
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
  } else {
    codeShown = false;
    setMsg("hlCodeMsg", "", false);
    renderCode();
  }
}

export function initHarvestBackup() {
  const closeImg = $("hlBackupCloseImg");
  if (closeImg) closeImg.src = ICON_DATA["close.png"];
  harvestStateInit();
  window.addEventListener("hlStateChange", e => {
    renderCode();
    if (e && e.detail && e.detail.type === "applied") toast("Daily Harvest Log restored from server");
    if (e && e.detail && e.detail.type === "required") askRequired();
  });
  window.addEventListener("guroFarmSaved", () => {
    renderCode();
    setTimeout(maybeAsk, 1500);
  });
  document.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    const id = e.target && e.target.id;
    if (id === "hlCodeInput") onSaveCode(); else if (id === "hlAskInput") onAskSave();
  });
  document.addEventListener("click", e => {
    const t = e.target && e.target.closest ? e.target : null;
    if (!t) return;
    if (t.id === "hlCodeAsk") askClose(true); else if (t.closest("#hlAskSaveBtn")) onAskSave(); else if (t.closest("#hlAskLaterBtn")) askClose(true); else if (t.closest("#hlCodeSaveBtn")) onSaveCode(); else if (t.closest("#hlCodeEdit")) onEditCode(); else if (t.closest("#hlCodeValue")) onToggleCodeValue(); else if (t.id === "hlBackupLayer") onToggle(); else if (t.closest("#hlBackupToggleBtn")) onToggle(); else if (t.closest("#hlBackupCopyBtn")) onCopy(); else if (t.closest("#hlBackupRestoreBtn")) onRestore(); else if (t.closest("#hlBackupCloseBtn")) {
      const panel = $("hlBackupLayer");
      if (panel && !panel.hidden) onToggle();
    }
  });
}
