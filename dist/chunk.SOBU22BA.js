// src/font_scale.js
var FONT_SCALE_KEY = "guro_font_scale";
var FONT_SCALE_OPTIONS = ["10", "20", "30"];
function getFontScale() {
  try {
    const v = localStorage.getItem(FONT_SCALE_KEY);
    return FONT_SCALE_OPTIONS.includes(v) ? v : "";
  } catch (e) {
    return "";
  }
}
function applyFontScale(value) {
  const v = FONT_SCALE_OPTIONS.includes(value) ? value : "";
  const root = document.documentElement;
  if (v) root.setAttribute("data-fs", v);
  else root.removeAttribute("data-fs");
  return v;
}
function setFontScale(value) {
  const v = applyFontScale(value);
  try {
    if (v) localStorage.setItem(FONT_SCALE_KEY, v);
    else localStorage.removeItem(FONT_SCALE_KEY);
  } catch (e) {
  }
  try {
    window.dispatchEvent(new Event("resize"));
  } catch (e) {
  }
  return v;
}

export {
  FONT_SCALE_OPTIONS,
  getFontScale,
  applyFontScale,
  setFontScale
};
