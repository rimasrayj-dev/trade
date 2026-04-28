// ── STATE ──
// Global state, utility functions, coin metadata, and pair loading.
// Must be the first script loaded — everything else depends on these globals.

const INIT = 100000;
let S = { bal: INIT, startBal: INIT, positions: [], history: [], pair: 'BTC/USDT', side: 'buy', otype: 'market' };

// PAIRS is populated dynamically from Binance 24hr ticker on load.
// Starts with a minimal seed so the app can render before fetch completes.
let PAIRS = [
  { sym: 'BTC/USDT', base: 'BTC', cls: 'btc', p: 67420, ch: 2.34, vol: '32.4B' },
  { sym: 'ETH/USDT', base: 'ETH', cls: 'eth', p: 3512,  ch: 1.87, vol: '14.2B' },
];
let prices = {};
PAIRS.forEach(p => prices[p.sym] = p.p);

// ── UTILS ─────────────────────────────────────────────────────────────
function fp(n) {
  if (!n && n !== 0) return '—';
  if (n >= 10000)  return n.toLocaleString('en', { maximumFractionDigits: 0 });
  if (n >= 1000)   return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 100)    return n.toFixed(2);
  if (n >= 1)      return n.toFixed(3);
  if (n >= 0.01)   return n.toFixed(4);
  if (n >= 0.0001) return n.toFixed(6);
  const d = Math.max(2, Math.ceil(-Math.log10(n)) + 3);
  return n.toFixed(Math.min(d, 12));
}
function fu(n) {
  return '$' + Math.abs(n).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtVol(v) {
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  return v.toFixed(0);
}

// ── COIN NAMES ────────────────────────────────────────────────────────
const COIN_NAMES = {
  BTC:'Bitcoin',ETH:'Ethereum',BNB:'BNB',SOL:'Solana',XRP:'XRP',DOGE:'Dogecoin',
  ADA:'Cardano',AVAX:'Avalanche',DOT:'Polkadot',LINK:'Chainlink',TRX:'TRON',
  MATIC:'Polygon',LTC:'Litecoin',SHIB:'Shiba Inu',BCH:'Bitcoin Cash',UNI:'Uniswap',
  ATOM:'Cosmos',XLM:'Stellar',ETC:'Ethereum Classic',FIL:'Filecoin',APT:'Aptos',
  ARB:'Arbitrum',OP:'Optimism',SUI:'Sui',INJ:'Injective',NEAR:'NEAR Protocol',
  ICP:'Internet Computer',HBAR:'Hedera',VET:'VeChain',MKR:'Maker',AAVE:'Aave',
  GRT:'The Graph',SAND:'The Sandbox',MANA:'Decentraland',AXS:'Axie Infinity',
  RUNE:'THORChain',FTM:'Fantom',ALGO:'Algorand',EGLD:'MultiversX',XTZ:'Tezos',
  WIF:'dogwifhat',BONK:'Bonk',PEPE:'Pepe',SEI:'Sei',TIA:'Celestia',
  PYTH:'Pyth Network',BLUR:'Blur',IMX:'Immutable',RNDR:'Render',LDO:'Lido DAO',
  ENA:'Ethena',WLD:'Worldcoin',PENDLE:'Pendle',JUP:'Jupiter',STRK:'Starknet',
};
function _coinFullName(b) { return COIN_NAMES[b] || b; }
function _updateSymHeader(base, tf) {
  document.getElementById('hSym').innerHTML =
    _coinFullName(base) +
    '<span class="sym-sep"> / TetherUS</span>' +
    '<span class="sym-meta"> · ' + tf + ' · Binance</span>';
}

// ── COIN COLOURS ──────────────────────────────────────────────────────
function _coinHue(base) {
  let h = 0;
  for (let i = 0; i < base.length; i++) h = (h * 31 + base.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h) % 360;
}
function _coinStyle(base) {
  const known = {
    BTC:'#f7931a,#ffb74d', ETH:'#627eea,#a29bfe', BNB:'#f3ba2f,#f8d57e',
    SOL:'#9945ff,#14f195', XRP:'#00aae4,#00d4ff', DOGE:'#c2a633,#e8c742',
    ADA:'#0033ad,#2a6fff', AVAX:'#e84142,#ff7070', DOT:'#e6007a,#ff65b5',
    LINK:'#2a5ada,#6090ff', TRX:'#ef0027,#ff5577', MATIC:'#7b3fe4,#a855f7',
    LTC:'#838383,#bdbdbd',  SHIB:'#ff6b00,#ff9c3c', BCH:'#4dcc4d,#84e884',
    UNI:'#ff007a,#ff6eb4',  ATOM:'#6f4e9c,#a78bfa', XLM:'#08b5e5,#6dd5ed',
    ETC:'#328432,#66bb6a',  FIL:'#0090ff,#40b3ff',  APT:'#ff5733,#ff8c66',
    ARB:'#1b4add,#4d79ff',  OP:'#ff0420,#ff5566',   SUI:'#4da2ff,#91c8ff',
    INJ:'#00a3ff,#0047ff',  NEAR:'#00c08b,#00e6a8', ICP:'#29abe2,#522785',
    HBAR:'#222,#555',       VET:'#15bdff,#00e5ff',  MKR:'#1aaa6a,#30d98a',
    AAVE:'#b6509e,#2ebac6', GRT:'#6747ed,#9b7fff',  SAND:'#04adef,#fa982a',
    MANA:'#ff2d55,#ff6b35', AXS:'#0055d4,#2b9fd8',  RUNE:'#33ff99,#00cc77',
    FTM:'#1969ff,#4d8eff',  ALGO:'#fff,#ccc',       EGLD:'#1b46c2,#23f7dd',
    XTZ:'#2c7df7,#63a4ff',  WIF:'#9945ff,#f5a623',  BONK:'#f5a623,#ff6b35',
    PEPE:'#00a550,#7fc94f', SEI:'#c22d52,#ff4d79',  TIA:'#7b2d8b,#c45edd',
    PYTH:'#6233a2,#9d62d8', BLUR:'#ff5500,#ff8844', IMX:'#17b5cb,#00e5ff',
    RNDR:'#ff4400,#ff7733', LDO:'#f08c00,#f5c842',  ENA:'#000,#1a1a2e',
    WLD:'#000,#444',        PENDLE:'#00d2a8,#00fff2',JUP:'#c7f284,#52a647',
    STRK:'#0c0c4f,#ec796b',
  };
  if (known[base]) {
    const [a, b] = known[base].split(',');
    const light = ['BTC','BNB','DOGE','LTC','ALGO','BONK','SUI','JUP','PENDLE'].includes(base);
    return `background:linear-gradient(135deg,${a},${b});color:${light ? '#000' : '#fff'}`;
  }
  const hue = _coinHue(base);
  return `background:linear-gradient(135deg,hsl(${hue},70%,35%),hsl(${(hue + 30) % 360},80%,55%));color:#fff`;
}

// ── LOAD ALL PAIRS FROM BINANCE ───────────────────────────────────────
async function loadAllPairs() {
  try {
    const res  = await fetch(`${BINANCE_REST}/ticker/24hr`);
    const data = await res.json();
    if (!Array.isArray(data)) return;

    const usdt = data
      .filter(x => x.symbol.endsWith('USDT') && parseFloat(x.quoteVolume) > 50000)
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume));

    PAIRS = usdt.map(x => {
      const base = x.symbol.replace('USDT', '');
      const pr   = parseFloat(x.lastPrice);
      const ch   = parseFloat(x.priceChangePercent);
      const vol  = fmtVol(parseFloat(x.quoteVolume));
      return {
        sym: base + '/USDT', base, cls: base.toLowerCase(), p: pr, ch, vol,
        high24: parseFloat(x.highPrice), low24: parseFloat(x.lowPrice),
      };
    });

    PAIRS.forEach(p => prices[p.sym] = p.p);
    renderPairs();
    startFeed();
  } catch (e) {
    console.warn('loadAllPairs failed', e);
  }
}

// ── LAZY PAIR LOADER ──────────────────────────────────────────────────
// Call loadAllPairsLazy() from switchToCryptoTab() instead of loadAllPairs().
// Fetches only on the first invocation; subsequent calls are silent no-ops.
let _pairsLoaded = false;
async function loadAllPairsLazy() {
  if (_pairsLoaded) return;
  _pairsLoaded = true;   // set early to prevent a double-fetch on rapid clicks

  // Spinning toast while the request is in-flight
  const toastId = '_pairsLoadingToast';
  const stack = document.getElementById('tstack');
  if (stack) {
    const t = document.createElement('div');
    t.id = toastId;
    t.className = 'toast';
    t.style.cssText = 'background:rgba(30,30,46,.96);border:1px solid rgba(167,139,250,.3);color:#a78bfa;display:flex;align-items:center;gap:8px;pointer-events:none';
    t.innerHTML = '<span style="animation:spin 1s linear infinite;display:inline-block">⟳</span> Loading pairs\u2026';
    stack.appendChild(t);
  }

  try {
    await loadAllPairs();
  } finally {
    const t = document.getElementById(toastId);
    if (t) t.remove();
  }
}