import {
  farmPanelCardCatalog,
  farmPanelHiddenCards,
  farmPanelSetHiddenCards,
  renderFarmPanelTabContent
} from "./chunk.ZPFDQQG6.js";
import "./chunk.LPEVZJ4B.js";
import "./chunk.VR6FV3KR.js";
import "./chunk.AS3VMXOQ.js";

// src/pages/settings.js
var rootEl = null;
var calc = null;
var GEM_PACKS = [];
var loadSelection = () => "1350";
var setSelection = () => {
};
var packFlowerPrice = () => null;
var currentRatio = () => ({
  gems: 0
});
var listening = false;
var restockMode = () => "shared";
var growDraft = null;
var growBtnState = "idle";
var growSaveTimer = null;
var applyRestockMode = () => {
};
function num(n) {
  if (n == null || !isFinite(n)) return "\u2014";
  return n.toLocaleString(void 0, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
function packHtml(pack, sel) {
  const on = sel === String(pack.gems);
  const price = packFlowerPrice(pack);
  return `<label class="st-pack guro-frame${on ? " is-on" : ""}">
    <span class="st-pack-top"><span class="st-pack-amt">${pack.gems.toLocaleString()}${calc.GEM_ICON}</span><input type="checkbox" data-st-pack="${pack.gems}"${on ? " checked" : ""} aria-label="${pack.gems} gem pack"></span>
    <span class="st-pack-price">${num(price)}${calc.FLOWER_ICON}</span>
  </label>`;
}
function freeHtml(sel) {
  const on = sel === "free";
  return `<label class="st-pack guro-frame${on ? " is-on" : ""}">
    <span class="st-pack-top"><span class="st-pack-amt">Free Gem</span><input type="checkbox" data-st-pack="free"${on ? " checked" : ""} aria-label="Free Gem"></span>
    <span class="st-pack-price">0${calc.FLOWER_ICON}</span>
  </label>`;
}
function modeCardHtml(id, title, on, lines) {
  return `<label class="st-mode guro-frame${on ? " is-on" : ""}">
    <span class="st-mode-top"><span class="st-mode-title">${title}</span><input type="checkbox" data-st-mode="${id}"${on ? " checked" : ""} aria-label="${title}"></span>
    ${lines.map((t) => `<p class="st-mode-text">${t}</p>`).join("")}
  </label>`;
}
function modesHtml() {
  const shared = restockMode() === "shared";
  const perRestock = ["One seed restock costs a fixed amount of gems and refreshes the stock of every seed. In this mode that cost is split equally between all the seeds in the seed pool (crops, fruits, greenhouse and flower seeds, minus any seeds you excluded in the restock settings).", "Net is worked out chain to chain: the harvest is sold for Gross, then the seed cost, the shrine cost and the crop's small share of the restock cost are taken away. Net = Gross - Seed Cost - Shrine Cost - Restock Share.", "Best for a fair profit of one full restock when you plant many different seeds."];
  const twentyFour = ["The crop keeps growing and being replanted for a full 24 hours, so it keeps restocking every time its stock runs out. The more restocks it needs, the more restock cost it has.", "The restock cost is not split: this one crop shoulders the full gem cost of every restock by itself. Restocks per day = seeds planted per day / stock per restock, rounded up to a whole number (1.01 restocks counts as 2), so the cost is always whole restocks of gems (at 15 gems per restock, 2 restocks = 30 gems).", "Net = Gross - Seed Cost - Shrine Cost - the full Restock Cost of all restocks in 24 hours."];
  return `<div class="st-outer guro-frame st-modes-outer">
      <div class="st-inner guro-frame">
        <div class="st-label">Restock Cost Mode</div>
        <p class="st-modes-note">The mode ticked here is used for the restock cost across the whole app. The mode buttons inside the Resource Calculators only change that calculator.</p>
        <div class="st-modes">${modeCardHtml("shared", "PER RESTOCK MODE", shared, perRestock)}${modeCardHtml("individual", "24HR MODE", !shared, twentyFour)}</div>
      </div>
    </div>`;
}
function growAllKeys() {
  return farmPanelCardCatalog().flatMap((g) => g.cards.map((c) => c.key));
}
function growSavedVisible() {
  return growAllKeys().filter((k) => !farmPanelHiddenCards.has(k));
}
function growIsDirty() {
  const saved = growSavedVisible();
  return saved.length !== growDraft.size || saved.some((k) => !growDraft.has(k));
}
function growCardHtml(c) {
  const on = growDraft.has(c.key);
  return `<label class="st-grow-card guro-frame${on ? " is-on" : ""}">
    <span class="st-grow-name"><span class="st-grow-icon">${c.icon}</span><span class="st-grow-text">${c.label}</span></span>
    <input type="checkbox" data-st-grow="${c.key}"${on ? " checked" : ""} aria-label="${c.label}">
  </label>`;
}
function growGroupHtml(g) {
  return `<div class="st-grow-group">
    <div class="st-label st-grow-group-label">${g.label}</div>
    <div class="st-grow-list">${g.cards.map(growCardHtml).join("")}</div>
  </div>`;
}
function growBtnHtml() {
  if (growBtnState === "saving") return `<span class="st-save-spinner"></span> Saving\u2026`;
  if (growBtnState === "saved") return `<span class="st-save-check">\u2714</span> Saved`;
  return "Save";
}
function growHtml() {
  if (!growDraft) growDraft = new Set(growSavedVisible());
  const dirty = growIsDirty();
  const cls = growBtnState === "saving" ? " is-saving" : growBtnState === "saved" ? " is-saved" : dirty ? " is-dirty" : "";
  const disabled = growBtnState === "saving" || growBtnState === "saved" || !dirty ? " disabled" : "";
  return `<div class="st-outer guro-frame st-grow-outer">
      <div class="st-inner guro-frame">
        <div class="st-label">Growing Display Settings</div>
        <p class="st-grow-note">Adding a check to the check box will display the card in the Growing Panel. Removing the check hides it. Hidden cards are still computed and still included in the Logs, they are only hidden from the display. Click Save to apply your changes.</p>
        ${farmPanelCardCatalog().map(growGroupHtml).join("")}
        <div class="st-save-row"><button type="button" class="st-save-btn guro-frame${cls}" data-st-grow-save${disabled}>${growBtnHtml()}</button></div>
      </div>
    </div>`;
}
function growSyncUi() {
  if (!rootEl) return;
  rootEl.querySelectorAll("[data-st-grow]").forEach((box) => {
    const card = box.closest(".st-grow-card");
    if (card) card.classList.toggle("is-on", box.checked);
  });
  const btn = rootEl.querySelector("[data-st-grow-save]");
  if (!btn) return;
  const dirty = growIsDirty();
  btn.classList.toggle("is-dirty", dirty && growBtnState === "idle");
  btn.disabled = growBtnState !== "idle" || !dirty;
}
function growSave() {
  if (growBtnState !== "idle" || !growIsDirty()) return;
  growBtnState = "saving";
  render();
  clearTimeout(growSaveTimer);
  growSaveTimer = setTimeout(() => {
    farmPanelSetHiddenCards(growAllKeys().filter((k) => !growDraft.has(k)));
    try {
      renderFarmPanelTabContent();
    } catch (e) {
    }
    growBtnState = "saved";
    render();
    growSaveTimer = setTimeout(() => {
      growBtnState = "idle";
      render();
    }, 1100);
  }, 450);
}
function render() {
  if (!rootEl) return;
  const sel = loadSelection();
  const r = currentRatio();
  rootEl.innerHTML = `<div class="st-wrap">
    <div class="st-outer guro-frame">
      <div class="st-inner guro-frame">
        <div class="st-label">Gem Pack</div>
        <div class="st-packs">${GEM_PACKS.map((p) => packHtml(p, sel)).join("")}${freeHtml(sel)}</div>
        <div class="st-label">Flower/Gem Ratio</div>
        <div class="st-ratio">${r.free ? `1${calc.GEM_ICON} = 0${calc.FLOWER_ICON}` : `1${calc.FLOWER_ICON} = ${num(r.gems)}${calc.GEM_ICON}`}</div>
      </div>
    </div>
    ${modesHtml()}
    ${growHtml()}
  </div>`;
}
function onChange(e) {
  const t = e.target;
  if (!t || !t.dataset) return;
  if (t.dataset.stGrow != null) {
    if (t.checked) growDraft.add(t.dataset.stGrow);
    else growDraft.delete(t.dataset.stGrow);
    growSyncUi();
    return;
  }
  if (t.dataset.stMode != null) {
    applyRestockMode(t.dataset.stMode);
    render();
    return;
  }
  if (t.dataset.stPack == null) return;
  setSelection(t.dataset.stPack);
  render();
}
function onClick(e) {
  const btn = e.target && e.target.closest ? e.target.closest("[data-st-grow-save]") : null;
  if (btn) growSave();
}
function refresh() {
  if (rootEl && document.body.contains(rootEl)) render();
}
function mount(root, api) {
  rootEl = root;
  calc = api.calc;
  const gp = api.gempacks;
  GEM_PACKS = gp.GEM_PACKS;
  loadSelection = gp.loadSelection;
  setSelection = gp.setSelection;
  packFlowerPrice = gp.packFlowerPrice;
  currentRatio = gp.currentRatio;
  restockMode = () => api.prices.restockCostMode;
  applyRestockMode = (mode) => api.calc.applyRestockCostMode(mode === "individual" ? "individual" : "shared");
  growDraft = null;
  growBtnState = "idle";
  root.addEventListener("change", onChange);
  root.addEventListener("click", onClick);
  try {
    if (!(typeof api.prices.marketplaceFlowerUsdPrice === "number" && api.prices.marketplaceFlowerUsdPrice > 0)) api.prices.refreshMarketplaceFlowerUsdPrice();
  } catch (e) {
  }
  if (!listening) {
    listening = true;
    window.addEventListener("guroGemPackChanged", refresh);
  }
  render();
}
function canLeave(nextId, api) {
  if (!rootEl || !growDraft || !growIsDirty()) return true;
  try {
    api.calc.toast("\u26A0\uFE0F Save your changes first");
  } catch (e) {
  }
  const btn = rootEl.querySelector("[data-st-grow-save]");
  if (btn) {
    btn.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
    btn.classList.remove("is-nudge");
    void btn.offsetWidth;
    btn.classList.add("is-nudge");
    setTimeout(() => btn.classList.remove("is-nudge"), 1300);
  }
  return false;
}
function unmount() {
  if (rootEl) {
    rootEl.removeEventListener("change", onChange);
    rootEl.removeEventListener("click", onClick);
  }
  clearTimeout(growSaveTimer);
  rootEl = null;
}
export {
  canLeave,
  mount,
  unmount
};
