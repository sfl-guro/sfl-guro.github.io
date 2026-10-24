import * as calc from "./calculator.js";
import * as ui from "./ui.js";

const FLOWER_SEED_SEASONS = {
  Lavender: [ "Spring" ],
  Gladiolus: [ "Summer" ],
  Clover: [ "Autumn" ],
  Edelweiss: [ "Winter" ]
};

function flowerSeedSeasons(name) {
  return FLOWER_SEED_SEASONS[name] || calc.SEASON_ORDER;
}

export function normalizeSeason(season) {
  return calc.SEASON_ORDER.includes(season) ? season : calc.previewSeason || calc.SEASON_ORDER[0];
}

export function restockSeedsForSeason(season) {
  const s = normalizeSeason(season);
  const stocked = bag => Object.keys(bag).filter(n => (bag[n] || 0) > 0);
  const crops = stocked(calc.BASE_STOCK_CROPS).filter(n => calc.getCropSeasons(n).includes(s)).map(n => ({
    name: n,
    icon: n
  }));
  const fruits = stocked(calc.BASE_STOCK_FRUITS).filter(n => !(calc.BASE_FRUITS[n] && calc.BASE_FRUITS[n].moonOnly) && calc.getFruitSeasons(n).includes(s)).map(n => ({
    name: n,
    icon: n
  }));
  const greenhouse = stocked(calc.BASE_STOCK_GREENHOUSE).map(n => ({
    name: n,
    icon: n
  }));
  const flowers = stocked(calc.BASE_STOCK_FLOWERS).filter(n => flowerSeedSeasons(n).includes(s)).map(n => ({
    name: n,
    icon: `${n} Seed`
  }));
  return crops.concat(fruits, greenhouse, flowers);
}

export function restockShareCount(season) {
  return Math.max(1, restockSeedsForSeason(season).length);
}

export function restockSeedIconsHtml(season) {
  return `(${restockSeedsForSeason(season).map(s => `<span class="rc-share-icon">${ui.getIcon(s.icon)}</span>`).join("")})`;
}

export function toolRestockShareCount() {
  return Math.max(1, Object.keys(calc.BASE_STOCK_TOOLS).filter(n => (calc.BASE_STOCK_TOOLS[n] || 0) > 0).length);
}

export function toolRestockIconsHtml() {
  const names = Object.keys(calc.BASE_STOCK_TOOLS).filter(n => (calc.BASE_STOCK_TOOLS[n] || 0) > 0);
  return `(${names.map(n => `<span class="rc-share-icon">${ui.getIcon(n)}</span>`).join("")})`;
}
