import { setOpenClass } from "./shared.js";
import { toggle as toggleGodMode, close as closeGodMode } from "../dig_godmode.js";

let onTitleClick = null;

function setDataMode(root, on) {
  root.classList.toggle("dig-show-data", on);
  const btn = document.getElementById("digDataToggleBtn");
  if (btn) btn.textContent = on ? "Map" : "Data";
}

function setPercentMode(root, on) {
  root.classList.toggle("dig-pct-mode", on);
  const btn = document.getElementById("digPctToggleBtn");
  if (btn) btn.classList.toggle("active", on);
}

function setMarkMode(root, on) {
  root.classList.toggle("dig-show-pl", on);
  const btn = document.getElementById("digPlToggleBtn");
  if (btn) btn.classList.toggle("active", on);
  if (!on) {
    const card = document.getElementById("digPlInfo");
    if (card) {
      clearTimeout(card._t);
      card.style.display = "none";
    }
  }
}

export function mount(root, api) {
  setOpenClass("digSidePanel", true);
  setDataMode(root, false);
  setPercentMode(root, false);
  setMarkMode(root, false);
  const bar = document.getElementById("guroPageTitle");
  if (bar) {
    onTitleClick = ev => {
      if (ev.target.closest("#digGodToggleBtn")) {
        toggleGodMode();
        return;
      }
      if (ev.target.closest("#digPctToggleBtn")) {
        setPercentMode(root, !root.classList.contains("dig-pct-mode"));
        api.ui.renderDigTreasurePanel();
        return;
      }
      if (ev.target.closest("#digPlToggleBtn")) {
        setMarkMode(root, !root.classList.contains("dig-show-pl"));
        return;
      }
      if (!ev.target.closest("#digDataToggleBtn")) return;
      setDataMode(root, !root.classList.contains("dig-show-data"));
    };
    bar.addEventListener("click", onTitleClick);
  }
  api.ui.renderDigTreasurePanel();
}

export function unmount() {
  closeGodMode();
  setOpenClass("digSidePanel", false);
  const bar = document.getElementById("guroPageTitle");
  if (bar && onTitleClick) bar.removeEventListener("click", onTitleClick);
  onTitleClick = null;
  const root = document.getElementById("pageDigging");
  if (root) {
    root.classList.remove("dig-show-data");
    root.classList.remove("dig-pct-mode");
    root.classList.remove("dig-show-pl");
  }
}
