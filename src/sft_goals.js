let A = null;

export function bindApi(api) {
  A = api;
}

const GOALS_KEY = "hl_sft_goals";

const DONE_KEY = "hl_sft_goals_notified";

const SOURCE_KEY = "hl_sft_goals_source";

export function loadSource() {
  try {
    const raw = JSON.parse(localStorage.getItem(SOURCE_KEY) || "null");
    if (raw && typeof raw === "object") return {
      balance: raw.balance !== false,
      inventory: raw.inventory !== false
    };
  } catch (e) {}
  return {
    balance: true,
    inventory: true
  };
}

export function saveSource(src) {
  try {
    localStorage.setItem(SOURCE_KEY, JSON.stringify({
      balance: !!src.balance,
      inventory: !!src.inventory
    }));
  } catch (e) {}
}

export function loadGoals() {
  try {
    const raw = JSON.parse(localStorage.getItem(GOALS_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter(g => g && typeof g.name === "string" && g.name);
  } catch (e) {
    return [];
  }
}

export function saveGoals(list) {
  try {
    localStorage.setItem(GOALS_KEY, JSON.stringify(list));
  } catch (e) {}
}

function loadDone() {
  try {
    const raw = JSON.parse(localStorage.getItem(DONE_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch (e) {
    return [];
  }
}

function saveDone(list) {
  try {
    localStorage.setItem(DONE_KEY, JSON.stringify(list));
  } catch (e) {}
}

function panelItems() {
  return Array.isArray(A.prices.marketItems) ? A.prices.marketItems : [];
}

function isSftItem(m) {
  return !!(m && (m.isNftCollectible || m.isWearable));
}

export function sftPrice(name) {
  const live = A.prices.findLiveNftPriceForName(name);
  if (live != null) return live;
  const cosmetic = A.prices.findCosmeticPriceForName(name);
  if (cosmetic != null) return cosmetic;
  const lower = String(name).toLowerCase();
  const m = panelItems().find(x => isSftItem(x) && String(x.name).toLowerCase() === lower);
  return m && m.flowerPrice > 0 ? m.flowerPrice : null;
}

export function sftCandidates() {
  const out = [];
  const seen = new Set;
  panelItems().forEach(m => {
    if (!isSftItem(m) || seen.has(m.name)) return;
    if (sftPrice(m.name) == null) return;
    seen.add(m.name);
    out.push({
      name: m.name,
      kind: m.isWearable ? "wearable" : "collectible"
    });
  });
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

const LOVE_CHARM_PER_FLOWER = 80;

export function computeInventory() {
  let g = null;
  try {
    g = A.calc.profileGetG();
  } catch (e) {
    g = null;
  }
  if (!g) return {
    rows: [],
    gross: 0,
    net: 0,
    ready: false
  };
  const rows = [];
  panelItems().forEach(m => {
    if (isSftItem(m)) return;
    const qty = A.calc.profileGetInventoryAmount(g, m.name);
    if (!(qty > 0)) return;
    const live = A.prices.findLivePriceForItem(m);
    const price = live != null ? live : m.flowerPrice;
    if (!(price > 0)) return;
    rows.push({
      name: m.name,
      qty: qty,
      value: qty * price
    });
  });
  const gross = rows.reduce((t, r) => t + r.value, 0);
  const fee = Math.min(Math.max(Number(A.calc.feePercent) || 0, 0), 100);
  const loveCharms = A.calc.profileGetInventoryAmount(g, "Love Charm");
  const loveValue = loveCharms > 0 ? loveCharms / LOVE_CHARM_PER_FLOWER : 0;
  if (loveValue > 0) rows.push({
    name: "Love Charm",
    qty: loveCharms,
    value: loveValue
  });
  rows.sort((a, b) => b.value - a.value);
  return {
    rows: rows,
    gross: gross + loveValue,
    net: gross * (1 - fee / 100) + loveValue,
    ready: true
  };
}

const WHALE_ITEMS = [ "Foreman Beaver", "Kuebiko", "Quarry", "Golden Sheep", "Golden Egg", "Golden Cow", "Crimstone Spikes Hair", "Ascended Idol" ];

function toNum(v) {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return isFinite(n) ? n : 0;
}

function lookupAmount(map, name) {
  if (!map || typeof map !== "object") return 0;
  const lower = name.toLowerCase();
  const key = Object.keys(map).find(k => k.toLowerCase() === lower);
  return key == null ? 0 : toNum(map[key]);
}

function ownsWhaleItem(g) {
  const equipped = g && g.bumpkin && g.bumpkin.equipped && typeof g.bumpkin.equipped === "object" ? Object.values(g.bumpkin.equipped).map(v => String(v).toLowerCase()) : [];
  return WHALE_ITEMS.some(name => lookupAmount(g.inventory, name) > 0 || lookupAmount(g.wardrobe, name) > 0 || equipped.indexOf(name.toLowerCase()) !== -1);
}

export function computeChainHistory() {
  let g = null;
  try {
    g = A.calc.profileGetG();
  } catch (e) {
    g = null;
  }
  if (!g) return {
    ready: false,
    deposit: 0,
    withdraw: 0,
    balance: 0,
    type: null
  };
  const activity = g.farmActivity && typeof g.farmActivity === "object" ? g.farmActivity : {};
  const deposit = toNum(activity["FLOWER Deposited"]);
  const withdraw = toNum(activity["FLOWER Withdrawn"]);
  const whale = ownsWhaleItem(g);
  let type = "Neutral";
  if (whale) type = "Whale"; else if (withdraw > 0 && withdraw >= deposit * 1.8) type = "Extractor"; else if (deposit > withdraw) type = "Investor";
  return {
    ready: true,
    deposit: deposit,
    withdraw: withdraw,
    balance: toNum(g.balance),
    type: type
  };
}

export function goalProgress(net, price) {
  if (!(price > 0)) return {
    pct: 0,
    missing: 0,
    reached: false
  };
  const pct = net / price * 100;
  return {
    pct: pct,
    missing: Math.max(price - net, 0),
    reached: net >= price
  };
}

export function evaluateGoals() {
  const inv = computeInventory();
  const chain = computeChainHistory();
  const source = loadSource();
  const total = (source.inventory ? inv.net : 0) + (source.balance ? chain.balance : 0);
  const goals = loadGoals().map(g => {
    const price = sftPrice(g.name);
    const prog = goalProgress(total, price);
    return Object.assign({}, g, {
      price: price,
      pct: prog.pct,
      missing: prog.missing,
      reached: price != null && prog.reached
    });
  });
  return {
    inv: inv,
    chain: chain,
    total: total,
    source: source,
    goals: goals
  };
}

export function takeNewlyReachedGoals() {
  const {inv: inv, goals: goals} = evaluateGoals();
  if (!inv.ready) return [];
  const priced = goals.filter(g => g.price != null);
  const done = loadDone();
  const reachedNames = priced.filter(g => g.reached).map(g => g.name);
  const fresh = priced.filter(g => g.reached && done.indexOf(g.name) === -1);
  const next = done.filter(n => reachedNames.indexOf(n) !== -1).concat(fresh.map(g => g.name));
  if (next.length !== done.length || next.some((n, i) => n !== done[i])) saveDone(next);
  return fresh;
}
