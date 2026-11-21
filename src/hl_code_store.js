const CODES_KEY = "hl_hlog_codes_v1";

const CODE_RE = /^[\x21-\x7e]{4,32}$/;

const required = {};

function isPlain(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function loadCodes() {
  try {
    const c = JSON.parse(localStorage.getItem(CODES_KEY) || "null");
    return isPlain(c) ? c : {};
  } catch (e) {
    return {};
  }
}

function writeCodes(codes) {
  try {
    localStorage.setItem(CODES_KEY, JSON.stringify(codes));
  } catch (e) {}
}

export function stateEmit(type) {
  try {
    window.dispatchEvent(new CustomEvent("hlStateChange", {
      detail: {
        type: type
      }
    }));
  } catch (e) {}
}

export function stateCodeValid(code) {
  return CODE_RE.test(String(code == null ? "" : code));
}

export function stateCodeInfo(farm) {
  const e = loadCodes()[String(farm || "")];
  if (!isPlain(e) || typeof e.code !== "string" || !CODE_RE.test(e.code)) return null;
  return {
    code: e.code,
    bad: e.bad === true
  };
}

export function stateSaveLocalCode(farm, code, bad) {
  const codes = loadCodes();
  codes[farm] = {
    code: code,
    bad: bad === true
  };
  writeCodes(codes);
  delete required[farm];
}

export function stateRemoveLocalCode(farm) {
  const codes = loadCodes();
  delete codes[String(farm || "")];
  writeCodes(codes);
  stateEmit("code");
}

export function stateMarkBad(farm) {
  const info = stateCodeInfo(farm);
  if (info && !info.bad) stateSaveLocalCode(farm, info.code, true);
  stateEmit("code");
}

export function stateCodeRequired(farm) {
  return required[String(farm || "")] === true;
}

export function stateHeaderCode(farm) {
  const info = stateCodeInfo(farm);
  return info && !info.bad ? info.code : "";
}

export function stateNoteRejected(farm, errorName) {
  const f = String(farm || "");
  if (!f) return;
  if (errorName === "code_required") {
    required[f] = true;
    stateEmit("required");
  } else if (errorName === "code_mismatch") {
    if (stateCodeInfo(f)) stateMarkBad(f); else {
      required[f] = true;
      stateEmit("required");
    }
  }
}
