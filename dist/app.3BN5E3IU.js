import {
  api,
  initNav,
  initRouter
} from "./chunk.HOHP3GBA.js";
import {
  initGemPacks
} from "./chunk.F7REBWYF.js";
import {
  applyFontScale,
  getFontScale
} from "./chunk.SOBU22BA.js";
import {
  COIN_ICON,
  IMAGE_ICONS,
  MUTANT_TYPE_EMOJI,
  __deferredInitialRenderCallbacks,
  __set___deferredInitialRenderDone,
  __set_currentSeason,
  currentSeason,
  dailyHarvestReloadStore,
  escapeHtml,
  farmPanelDetectActiveMutants,
  farmPanelDetectMoneyTreeBonus,
  farmPanelGameState,
  getRealSeason,
  harvestLogFarmId,
  harvestStateInit,
  previewSeason,
  renderFarmPanelInfo,
  renderSeasonToggle,
  runDeferredInitialRender,
  setPreviewSeason,
  stateCodeInfo,
  stateCodeRequired,
  stateCodeValid,
  stateLastSaved,
  stateSetCode,
  toast
} from "./chunk.KAT3VBVV.js";
import "./chunk.XKJMJZUJ.js";
import "./chunk.LPEVZJ4B.js";
import "./chunk.D3PHX6VZ.js";
import {
  ICON_DATA
} from "./chunk.VR6FV3KR.js";
import "./chunk.AS3VMXOQ.js";

// src/footer.js
function initFooter() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest ? e.target.closest("[data-gf-copy]") : null;
    if (!btn) return;
    e.stopPropagation();
    const text = btn.getAttribute("data-gf-copy");
    const done = () => {
      btn.classList.add("is-done");
      toast("Copied!");
      setTimeout(() => btn.classList.remove("is-done"), 1200);
    };
    const fallback = () => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        done();
      } catch (err) {
      }
      ta.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(fallback);
    } else fallback();
  });
}

// src/hl_backup.js
var APP_ID = "sfl-guro";
var KIND = "daily-harvest-log";
var VERSION = 1;
var FIXED_KEYS = ["hl_daily_harvest_v1", "hl_hlog_cache_v1", "hl_hlog_tl_v1", "hl_hlog_farm"];
var CAVE_KEY_RE = /^guro_cave_(dug_v1|track_v2)_\d{1,20}$/;
var SENT_KEY = "hl_hlog_sent_v1";
var CONFIRM_MS = 5e3;
var confirmTimer = null;
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
  } catch (e) {
  }
  return out;
}
function readValue(key) {
  let raw = null;
  try {
    raw = localStorage.getItem(key);
  } catch (e) {
  }
  if (raw == null) return void 0;
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
  return Object.keys(store).some((k) => k !== "__last" && store[k] && typeof store[k] === "object");
}
function buildHarvestBackup() {
  const data = {};
  FIXED_KEYS.concat(caveKeys()).forEach((key) => {
    const v = readValue(key);
    if (v !== void 0) data[key] = v;
  });
  if (!hasHarvestData(data.hl_daily_harvest_v1)) return "";
  const farm = data.hl_daily_harvest_v1.__last || data.hl_hlog_farm || "";
  return JSON.stringify({
    app: APP_ID,
    kind: KIND,
    version: VERSION,
    savedAt: (/* @__PURE__ */ new Date()).toISOString(),
    farm: String(farm),
    data
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
  if (keys.some((k) => !isManagedKey(k))) {
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
    obj
  };
}
function snapshotKeys(extra) {
  const snap = {};
  FIXED_KEYS.concat(caveKeys(), extra, [SENT_KEY]).forEach((key) => {
    try {
      snap[key] = localStorage.getItem(key);
    } catch (e) {
      snap[key] = null;
    }
  });
  return snap;
}
function rollbackKeys(snap) {
  Object.keys(snap).forEach((key) => {
    try {
      if (snap[key] == null) localStorage.removeItem(key);
      else localStorage.setItem(key, snap[key]);
    } catch (e) {
    }
  });
}
function applyBackup(obj) {
  const data = obj.data;
  const snap = snapshotKeys(Object.keys(data));
  try {
    caveKeys().forEach((key) => localStorage.removeItem(key));
    FIXED_KEYS.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const v = data[key];
        localStorage.setItem(key, typeof v === "string" ? v : JSON.stringify(v));
      } else {
        localStorage.removeItem(key);
      }
    });
    Object.keys(data).forEach((key) => {
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
    } catch (e) {
    }
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
  copyText(text, (ok) => {
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
  setStatus("Restored. Reloading\u2026", false);
  toast("Backup restored");
  setTimeout(() => {
    window.location.reload();
  }, 700);
}
var EYE_ON = '<svg viewBox="0 0 16 12" aria-hidden="true" focusable="false"><path d="M1 6C3.5 2 12.5 2 15 6C12.5 10 3.5 10 1 6Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="miter"/><rect x="6.5" y="4.5" width="3" height="3" fill="currentColor"/></svg>';
var EYE_OFF = '<svg viewBox="0 0 16 12" aria-hidden="true" focusable="false"><path d="M1 6C3.5 2 12.5 2 15 6C12.5 10 3.5 10 1 6Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="miter"/><rect x="6.5" y="4.5" width="3" height="3" fill="currentColor"/><path d="M2 11.5L14 0.5" stroke="currentColor" stroke-width="1.5"/></svg>';
var codeShown = false;
var miniMode = "";
var miniBack = "";
var miniBusy = false;
var askBusy = false;
var codeBusy = false;
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
  if (info) {
    value.textContent = codeShown ? info.code : "\u2022".repeat(Math.min(info.code.length, 12));
    const label = codeShown ? "Hide private code" : "Show private code";
    value.setAttribute("aria-label", label);
    const eye = $("hlCodeEye");
    if (eye) {
      eye.innerHTML = (codeShown ? EYE_OFF : EYE_ON) + "<span>" + (codeShown ? "Hide" : "Show") + "</span>";
      eye.setAttribute("aria-label", label);
      eye.setAttribute("title", label);
    }
  }
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
  setMsg(msgId, "Saving\u2026", false);
  const res = await stateSetCode(farm, code);
  if (!res.ok) {
    if (res.reason === "code_exists") {
      setMsg(msgId, "", false);
      showCodeExistsPopup(res, "");
      return;
    }
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
function miniEl(id) {
  return $(id);
}
function miniShow() {
  const dlg = miniEl("hlMiniDlg");
  if (!dlg) return;
  if (dlg.parentNode !== document.body) document.body.appendChild(dlg);
  dlg.hidden = false;
}
function miniClose() {
  const dlg = miniEl("hlMiniDlg");
  if (dlg) dlg.hidden = true;
  const input = miniEl("hlMiniInput");
  if (input) input.value = "";
  miniMode = "";
  miniBack = "";
  setMsg("hlMiniMsg", "", false);
}
function miniRender(mode, text) {
  const title = miniEl("hlMiniTitle");
  const body = miniEl("hlMiniBody");
  const cur = miniEl("hlMiniCurrent");
  const codeEl = miniEl("hlMiniCode");
  const input = miniEl("hlMiniInput");
  const ok = miniEl("hlMiniOkBtn");
  const cancel = miniEl("hlMiniCancelBtn");
  if (!title || !body || !cur || !codeEl || !input || !ok || !cancel) return;
  miniMode = mode;
  cur.hidden = mode !== "edit";
  input.hidden = mode !== "edit";
  cancel.hidden = mode === "error";
  if (mode === "confirm") {
    title.textContent = "EDIT PRIVATE CODE";
    body.textContent = "Are you sure you want to edit your private code?";
    ok.textContent = "Yes, edit";
    cancel.textContent = "Cancel";
  } else if (mode === "edit") {
    const info = stateCodeInfo(farmNow());
    title.textContent = "EDIT PRIVATE CODE";
    body.textContent = "This is your current code. Enter the new code below. The server only accepts the first code that was set for this Farm ID.";
    codeEl.textContent = info ? info.code : "";
    ok.textContent = "Save";
    cancel.textContent = "Cancel";
  } else {
    title.textContent = "CODE ALREADY LINKED";
    body.textContent = text || "";
    ok.textContent = "OK";
  }
  setMsg("hlMiniMsg", "", false);
}
function showCodeExistsPopup(res, back) {
  const left = Number(res && res.left);
  const tries = Number.isFinite(left) && left >= 0 ? " Tries left: " + left + "." : "";
  miniBack = back || "";
  miniShow();
  miniRender("error", "This Farm ID already has a linked code in the server. Please input the correct code." + tries);
}
function onEditCode() {
  const farm = farmNow();
  if (!farm || !stateCodeInfo(farm)) return;
  miniBack = "";
  miniShow();
  miniRender("confirm");
}
async function onMiniOk() {
  if (miniBusy) return;
  const input = miniEl("hlMiniInput");
  if (miniMode === "confirm") {
    miniRender("edit");
    if (input) input.focus();
    return;
  }
  if (miniMode === "error") {
    if (miniBack === "edit") {
      miniRender("edit");
      if (input) input.focus();
    } else {
      miniClose();
    }
    return;
  }
  if (miniMode !== "edit" || !input) return;
  const farm = farmNow();
  if (!farm) {
    setMsg("hlMiniMsg", failText({
      reason: "no_farm"
    }), true);
    return;
  }
  const code = input.value.trim();
  if (!stateCodeValid(code)) {
    setMsg("hlMiniMsg", failText({
      reason: "bad_code"
    }), true);
    return;
  }
  const info = stateCodeInfo(farm);
  if (info && !info.bad && info.code === code) {
    setMsg("hlMiniMsg", "That is already your current code.", true);
    return;
  }
  const okBtn = miniEl("hlMiniOkBtn");
  miniBusy = true;
  if (okBtn) okBtn.disabled = true;
  setMsg("hlMiniMsg", "Saving\u2026", false);
  let res;
  try {
    res = await stateSetCode(farm, code);
  } finally {
    miniBusy = false;
    if (okBtn) okBtn.disabled = false;
  }
  if (!res.ok) {
    if (res.reason === "code_exists") {
      showCodeExistsPopup(res, "edit");
      return;
    }
    setMsg("hlMiniMsg", failText(res), true);
    return;
  }
  miniClose();
  codeShown = false;
  toast("Private code saved");
  renderCode();
}
function onMiniCancel() {
  if (miniBusy) return;
  miniClose();
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
    } catch (e) {
    }
  }
}
function maybeAsk() {
  const farm = farmNow();
  if (!farm || stateCodeInfo(farm)) return;
  const layer = $("hlBackupLayer");
  if (layer && !layer.hidden) return;
  try {
    if (sessionStorage.getItem(snoozeKey(farm))) return;
  } catch (e) {
  }
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
  } catch (e) {
  }
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
    miniClose();
    resetRestoreButton();
    setStatus("", false);
  } else {
    codeShown = false;
    setMsg("hlCodeMsg", "", false);
    renderCode();
  }
}
function initHarvestBackup() {
  const closeImg = $("hlBackupCloseImg");
  if (closeImg) closeImg.src = ICON_DATA["close.png"];
  harvestStateInit();
  window.addEventListener("hlStateChange", (e) => {
    renderCode();
    if (e && e.detail && e.detail.type === "applied") toast("Daily Harvest Log restored from server");
    if (e && e.detail && e.detail.type === "required") askRequired();
  });
  window.addEventListener("guroFarmSaved", () => {
    renderCode();
    setTimeout(maybeAsk, 1500);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const id = e.target && e.target.id;
    if (id === "hlCodeInput") onSaveCode();
    else if (id === "hlAskInput") onAskSave();
    else if (id === "hlMiniInput") onMiniOk();
  });
  document.addEventListener("click", (e) => {
    const t = e.target && e.target.closest ? e.target : null;
    if (!t) return;
    if (t.id === "hlMiniDlg") onMiniCancel();
    else if (t.closest("#hlMiniOkBtn")) onMiniOk();
    else if (t.closest("#hlMiniCancelBtn")) onMiniCancel();
    else if (t.id === "hlCodeAsk") askClose(true);
    else if (t.closest("#hlAskSaveBtn")) onAskSave();
    else if (t.closest("#hlAskLaterBtn")) askClose(true);
    else if (t.closest("#hlCodeSaveBtn")) onSaveCode();
    else if (t.closest("#hlCodeEdit")) onEditCode();
    else if (t.closest("#hlCodeValue") || t.closest("#hlCodeEye")) onToggleCodeValue();
    else if (t.id === "hlBackupLayer") onToggle();
    else if (t.closest("#hlBackupToggleBtn")) onToggle();
    else if (t.closest("#hlBackupCopyBtn")) onCopy();
    else if (t.closest("#hlBackupRestoreBtn")) onRestore();
    else if (t.closest("#hlBackupCloseBtn")) {
      const panel = $("hlBackupLayer");
      if (panel && !panel.hidden) onToggle();
    }
  });
}

// src/reward_banner.js
var COIN_SRC = (COIN_ICON.match(/src="([^"]+)"/) || [])[1] || "";
var bootDone = false;
var bannerActive = false;
var lastSignature = "";
var queue = [];
var goalQueue = [];
var confettiFire = null;
var confettiCanvas = null;
var confettiTimers = [];
function layerEl() {
  return document.getElementById("guroRewardLayer");
}
function mutantIconHtml(entry) {
  const key = Object.keys(IMAGE_ICONS).find((k) => k.toLowerCase() === String(entry.name).trim().toLowerCase());
  if (key) return `<img class="guro-reward-icon" src="${IMAGE_ICONS[key]}" alt="${escapeHtml(entry.name)}">`;
  return `<span class="guro-reward-emoji">${MUTANT_TYPE_EMOJI[entry.type] || "\u2728"}</span>`;
}
function buildFrame(bodyHtml) {
  return `<div class="guro-reward-outer" role="dialog" aria-modal="true">
    <button type="button" class="guro-reward-close" id="guroRewardCloseBtn" aria-label="Close"><img src="${ICON_DATA["close.png"]}" alt="Close"></button>
    <div class="guro-reward-inner">${bodyHtml}</div>
  </div>`;
}
var MUTANT_BOOST_LABELS = {
  "Speed Chicken": "x0.9 Chicken Sleep Time",
  "Rich Chicken": "+0.1 {Egg}",
  "Fat Chicken": "x0.9 Feed to Chicken",
  "Ayam Cemani": "+0.2 {Egg}",
  "El Pollo Veloz": "-2h Chicken Sleep Time",
  "Banana Chicken": "+0.1 {Banana}",
  "Crim Peckster": "+0.1 {Crimstone}",
  "Knight Chicken": "+0.1 {Oil}",
  "Pharaoh Chicken": "+1 daily Desert Dig attempt",
  "Alien Chicken": "+0.1 {Feather}",
  "Summer Chicken": "Chickens cannot get sick during summer",
  "Janitor Chicken": "x0.95 Chicken Sleep Time",
  "Sleepy Chicken": "Chickens cannot get sick during autumn",
  "Squid Chicken": "+0.1 {Egg}",
  "Flamingo Chicken": "x0.975 Chicken Sleep Time",
  "Ascended Chicken": "+0.1 {Egg}",
  "Mushroom Chicken": "+0.5 {Crimstone} every 5th mine",
  "Mootant": "+0.1 {Leather}",
  "Frozen Cow": "Cows cannot get sick during winter",
  "Dr Cow": "x0.95 Cow Feed Cost",
  "Baby Cow": "+10 Cow XP from Animal Affection tools",
  "Spa Cow": "+0.1 {Milk}",
  "Ascended Cow": "x0.975 Cow Sleep Time",
  "Ladybug Cow": "+1 {Oil}",
  "Toxic Tuft": "+0.1 {Merino Wool}",
  "Frozen Sheep": "Sheep cannot get sick during winter",
  "Nurse Sheep": "Sheep cannot get sick during summer",
  "Astronaut Sheep": "+0.1 {Wool}",
  "Mermaid Sheep": "x0.95 Sheep Feed",
  "Spa Sheep": "+5 Sheep XP from Animal Affection tools",
  "Ascended Sheep": "+0.05 {Wool}",
  "Beetle Sheep": "x0.925 Sheep Sleep Time",
  "Desert Rose": "10% Chance for +1 Flower",
  "Chicory": "10% Chance for +1 Flower",
  "Anemone Flower": "+1 Fishing minigame attempt",
  "Salt Crystal Flower": "5% Chance for +1 Flower",
  "Ruins Flower": "+0.05 {Honey} from full beehives",
  "Cyclops Bloom": "x0.8 Fish Market processing time"
};
function mutantBadgeHtml(name) {
  const known = Object.prototype.hasOwnProperty.call(MUTANT_BOOST_LABELS, name);
  const label = known ? `Boost: ${MUTANT_BOOST_LABELS[name]}` : "Cosmetic";
  const inner = label.split(/\{([^}]+)\}/).map((part, i) => {
    if (i % 2 === 0) return escapeHtml(part);
    const src = IMAGE_ICONS[part];
    return src ? `<img class="guro-reward-boost-icon" src="${src}" alt="${escapeHtml(part)}"><span>${escapeHtml(part)}</span>` : escapeHtml(part);
  }).join("");
  return `<span class="hive-time-pill guro-frame guro-reward-boost">${inner}</span>`;
}
function buildMutantBanner(mutants) {
  const rows = mutants.map((m) => `<div class="guro-reward-item"><div class="guro-reward-row">${mutantIconHtml(m)}<span class="guro-reward-name">${escapeHtml(m.name)}${m.count > 1 ? ` \xD7${m.count}` : ""}</span></div>${mutantBadgeHtml(m.name)}</div>`).join("");
  const title = mutants.length > 1 ? "You found Mutants!" : "You found a Mutant!";
  return buildFrame(`<div class="guro-reward-title">Congratulations!<br>${title}</div><div class="guro-reward-rows">${rows}</div>`);
}
function buildMoneyTreeBanner(data) {
  const lead = data.count > 1 ? `${data.count} of your Trees found a reward of` : "One of your Tree found a reward of";
  const coins = Math.round(data.totalCoins).toLocaleString();
  const coinImg = COIN_SRC ? `<img class="guro-reward-coin" src="${COIN_SRC}" alt="Coins">` : "";
  return buildFrame(`<div class="guro-reward-title">Congratulations!<br>${lead}</div><div class="guro-reward-value"><span>+${coins}</span>${coinImg}</div>`);
}
function buildPendingMoneyTreeBanner(data) {
  const lead = data.count > 1 ? `${data.count} Tree nodes are predicted to proc a Money Tree reward of` : "One Tree node is predicted to proc a Money Tree reward of";
  const coins = Math.round(data.totalCoins).toLocaleString();
  const coinImg = COIN_SRC ? `<img class="guro-reward-coin" src="${COIN_SRC}" alt="Coins">` : "";
  return buildFrame(`<div class="guro-reward-title">Money Tree Bonus Pending!<br>${lead}</div><div class="guro-reward-value"><span>+${coins}</span>${coinImg}</div>`);
}
function pendingMoneyTree(mt) {
  if (!mt) return null;
  const batch = Array.isArray(mt.batchPredictions) ? mt.batchPredictions : [];
  if (batch.length) {
    const count = batch.reduce((n, b) => n + (b.procCount || 0), 0);
    const totalCoins = batch.reduce((n, b) => n + (b.coins || 0), 0);
    if (count > 0 && totalCoins > 0) return {
      count,
      totalCoins
    };
  }
  const types = Array.isArray(mt.predictedTypes) ? mt.predictedTypes : [];
  if (types.length && mt.predictedCoins > 0) return {
    count: types.length,
    totalCoins: mt.predictedCoins
  };
  return null;
}
function buildGoalBanner(goals) {
  const rows = goals.map((g) => `<div class="guro-reward-row">${mutantIconHtml({
    name: g.name,
    type: ""
  })}<span class="guro-reward-name">${escapeHtml(g.name)}</span></div>`).join("");
  const title = goals.length > 1 ? "You reached your SFT goals!" : "You reached your SFT goal!";
  return buildFrame(`<div class="guro-reward-title">Congratulations!<br>${title}</div><div class="guro-reward-rows">${rows}</div>`);
}
function stopConfetti() {
  confettiTimers.forEach((t) => clearTimeout(t));
  confettiTimers = [];
  if (confettiFire && typeof confettiFire.reset === "function") confettiFire.reset();
}
function ensureConfetti() {
  if (confettiFire) return confettiFire;
  if (typeof window.confetti !== "function" || typeof window.confetti.create !== "function") return null;
  confettiCanvas = document.createElement("canvas");
  confettiCanvas.id = "guroConfettiCanvas";
  document.body.appendChild(confettiCanvas);
  confettiFire = window.confetti.create(confettiCanvas, {
    resize: true,
    useWorker: true,
    disableForReducedMotion: true
  });
  return confettiFire;
}
function playConfetti() {
  const fire = ensureConfetti();
  if (!fire) return;
  stopConfetti();
  fireConfetti(fire);
}
function fireConfetti(fire) {
  const burst = (x, angle) => fire({
    particleCount: 60,
    spread: 70,
    angle,
    startVelocity: 55,
    origin: {
      x,
      y: 0.7
    },
    zIndex: 100006
  });
  burst(0.1, 60);
  burst(0.9, 120);
  confettiTimers.push(setTimeout(() => {
    fire({
      particleCount: 90,
      spread: 100,
      startVelocity: 40,
      origin: {
        x: 0.5,
        y: 0.45
      },
      zIndex: 100006
    });
  }, 250));
  confettiTimers.push(setTimeout(() => {
    burst(0.15, 65);
    burst(0.85, 115);
  }, 700));
}
function closeBanner() {
  const layer = layerEl();
  if (!layer || !bannerActive) return;
  layer.classList.remove("show");
  stopConfetti();
  setTimeout(() => {
    layer.innerHTML = "";
    bannerActive = false;
    showNext();
  }, 220);
}
function showNext() {
  if (bannerActive || !(queue.length || goalQueue.length)) return;
  const layer = layerEl();
  if (!layer) {
    queue = [];
    goalQueue = [];
    return;
  }
  bannerActive = true;
  layer.innerHTML = queue.length ? queue.shift() : goalQueue.shift();
  const btn = document.getElementById("guroRewardCloseBtn");
  if (btn) btn.addEventListener("click", closeBanner);
  void layer.offsetWidth;
  layer.classList.add("show");
  playConfetti();
}
async function scanGoals() {
  if (!bootDone) return;
  let fresh = [];
  try {
    const mod = await import("./sft_goals.DS4DRFRJ.js");
    mod.bindApi(api);
    fresh = mod.takeNewlyReachedGoals();
  } catch (e) {
    return;
  }
  if (!fresh.length) return;
  goalQueue.push(buildGoalBanner(fresh));
  showNext();
}
function scanRewards() {
  if (!bootDone || !farmPanelGameState) return;
  let mutants = [];
  let money = null;
  let pending = null;
  try {
    mutants = farmPanelDetectActiveMutants(farmPanelGameState) || [];
    const mt = farmPanelDetectMoneyTreeBonus(farmPanelGameState);
    if (mt && mt.totalCoins > 0) money = mt;
    pending = pendingMoneyTree(mt);
  } catch (e) {
    return;
  }
  const signature = JSON.stringify([mutants.map((m) => `${m.type}:${m.name}:${m.count}`).sort(), money ? [money.count, money.totalCoins] : null, pending ? [pending.count, pending.totalCoins] : null]);
  if (signature === lastSignature) {
    scanGoals();
    return;
  }
  lastSignature = signature;
  if (mutants.length) queue.push(buildMutantBanner(mutants));
  if (money) queue.push(buildMoneyTreeBanner(money));
  if (pending) queue.push(buildPendingMoneyTreeBanner(pending));
  showNext();
  scanGoals();
}
function finishBoot() {
  const loader = document.getElementById("guroBootLoader");
  const proceed = () => {
    bootDone = true;
    scanRewards();
  };
  if (!loader) {
    proceed();
    return;
  }
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    window.removeEventListener("guroFarmSaved", close);
    requestAnimationFrame(() => {
      loader.classList.add("hide");
      setTimeout(() => {
        loader.remove();
        proceed();
      }, 320);
    });
  };
  let hasSavedFarm = false;
  let hasCachedState = false;
  try {
    hasSavedFarm = !!localStorage.getItem("hl_farm_panel_id");
    hasCachedState = !!localStorage.getItem("hl_farm_panel_gamestate");
    if (!hasCachedState) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf("hl_fpgs__") === 0) {
          hasCachedState = true;
          break;
        }
      }
    }
  } catch (e) {
  }
  if (hasSavedFarm && (hasCachedState || window.guroFarmSavedDone)) {
    closed = true;
    loader.style.transitionDuration = ".12s";
    requestAnimationFrame(() => {
      loader.classList.add("hide");
      setTimeout(() => {
        loader.remove();
        proceed();
      }, 140);
    });
    return;
  }
  if (!hasSavedFarm) {
    close();
    return;
  }
  window.addEventListener("guroFarmSaved", close);
  setTimeout(close, 4e3);
}
function initRewardBanner() {
  window.addEventListener("guroFarmSaved", () => {
    if (!bootDone) return;
    setTimeout(() => {
      lastSignature = "";
      scanRewards();
    }, 900);
  });
  const rescanGoals = () => {
    if (bootDone) setTimeout(scanGoals, 400);
  };
  window.addEventListener("guroPricesUpdated", rescanGoals);
  window.addEventListener("guroGoalsChanged", rescanGoals);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && bannerActive) closeBanner();
  });
}

// src/main.js
(function restoreRedirectedPath() {
  try {
    const redirect = sessionStorage.getItem("guro_redirect_path");
    if (redirect) {
      sessionStorage.removeItem("guro_redirect_path");
      if (redirect !== window.location.pathname + window.location.search + window.location.hash) {
        window.history.replaceState(null, "", redirect);
      }
    }
  } catch (e) {
    console.error("Redirect restore failed:", e);
  }
})();
setInterval(() => {
  const real = getRealSeason();
  if (real !== currentSeason) {
    const wasFollowingReal = previewSeason === currentSeason;
    __set_currentSeason(real);
    if (wasFollowingReal) {
      setPreviewSeason(currentSeason);
    } else {
      renderSeasonToggle();
    }
  }
}, 6e4);
setTimeout(() => {
  try {
    runDeferredInitialRender();
  } catch (e) {
    console.error("runDeferredInitialRender failed:", e);
  } finally {
    __set___deferredInitialRenderDone(true);
    while (__deferredInitialRenderCallbacks.length) {
      const cb = __deferredInitialRenderCallbacks.shift();
      try {
        cb();
      } catch (e) {
        console.error("Deferred-init callback failed:", e);
      }
    }
    try {
      initNav();
      initFooter();
      initHarvestBackup();
      renderFarmPanelInfo();
      applyFontScale(getFontScale());
      initRouter();
    } catch (e) {
      console.error("initRouter failed:", e);
    }
    try {
      initRewardBanner();
    } catch (e) {
      console.error("initRewardBanner failed:", e);
    }
    try {
      initGemPacks(api);
    } catch (e) {
      console.error("initGemPacks failed:", e);
    }
    finishBoot();
  }
}, 0);
