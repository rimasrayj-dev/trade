// ── UI ──
// Sidebar pair list, header updates, tabs, toast, candle timer, mobile nav.
// Depends on: state.js, feed.js (updateHdr moved here from feed.js),
//             chart.js, trading.js, orderbook.js, stocks.js

// ── CACHED DOM REFS — resolved once, reused every tick ───────────────
let _hdrEls = null;
function _getHdrEls() {
  if (_hdrEls) return _hdrEls;
  _hdrEls = {
    hPrice:  document.getElementById('hPrice'),
    hChg:    document.getElementById('hChg'),
    s24h:    document.getElementById('s24h'),
    s24l:    document.getElementById('s24l'),
    sVol:    document.getElementById('sVol'),
    sMark:   document.getElementById('sMark'),
    navBal:  document.getElementById('navBal'),
    avShow:  document.getElementById('avShow'),
    sPnl:    document.getElementById('sPnl'),
  };
  return _hdrEls;
}

// ── HEADER ────────────────────────────────────────────────────────────
function updateHdr() {
  const el = _getHdrEls();

  // Resolve current pair from either PAIRS or STOCK_PAIRS
  let pr, ch, high24, low24, vol;
  if (typeof stockMode !== 'undefined' && stockMode) {
    const sp = STOCK_PAIRS.find(x => x.sym === S.pair);
    if (!sp) return;
    pr     = prices[S.pair] || sp.p || 0;
    ch     = sp.ch    || 0;
    high24 = sp.high24 || pr * 1.02;
    low24  = sp.low24  || pr * 0.98;
    vol    = sp.vol   || '—';
  } else {
    const p = PAIRS.find(x => x.sym === S.pair);
    if (!p) return;
    pr     = prices[S.pair];
    ch     = p.ch;
    high24 = p.high24 || pr * 1.026;
    low24  = p.low24  || pr * 0.974;
    vol    = p.vol    || '—';
  }

  el.hPrice.textContent = '$' + fp(pr);
  const chgTxt = (ch >= 0 ? '+' : '') + ch.toFixed(2) + '%';
  const chgCls = 'ptag ' + (ch >= 0 ? 'up' : 'dn');
  if (el.hChg.textContent !== chgTxt) el.hChg.textContent = chgTxt;
  if (el.hChg.className   !== chgCls) el.hChg.className   = chgCls;
  el.s24h.textContent  = '$' + fp(high24);
  el.s24l.textContent  = '$' + fp(low24);
  el.sVol.textContent  = vol;
  el.sMark.textContent = '$' + fp(pr * 1.0001);

  const balTxt = fu(S.bal);
  if (el.navBal.textContent !== balTxt) el.navBal.textContent = balTxt;
  el.avShow.textContent = 'Avail: ' + balTxt;

  const sp    = S.bal - S.startBal;
  const spTxt = (sp >= 0 ? '+' : '') + fu(sp);
  const spCol = sp >= 0 ? 'var(--green)' : sp < 0 ? 'var(--red)' : 'var(--t3)';
  if (el.sPnl.textContent !== spTxt) el.sPnl.textContent = spTxt;
  if (el.sPnl.style.color !== spCol) el.sPnl.style.color = spCol;
}

// ── FEED STATUS ───────────────────────────────────────────────────────
function setFeedStatus(state) {
  const dot = document.getElementById('feedDot');
  const lbl = document.getElementById('feedLbl');
  if (!dot) return;
  dot.className = 'feed-dot ' + state;
  const labels = { live: 'Live', error: 'Error', reconnecting: 'Connecting…' };
  if (lbl) lbl.textContent = labels[state] || state;
}

// ── MARKET SWITCHER ───────────────────────────────────────────────────
function switchToStocksTab() {
  document.getElementById('msw-stocks').classList.add('on');
  document.getElementById('msw-crypto').classList.remove('on');
  document.getElementById('cryptoSbHead').style.display  = 'none';
  document.getElementById('stocksSbHead').style.display  = '';
  document.getElementById('pairList').style.display      = 'none';
  document.getElementById('stockPairList').style.display = '';
  if (typeof switchToStocks === 'function') switchToStocks();
}

function switchToCryptoTab() {
  document.getElementById('msw-crypto').classList.add('on');
  document.getElementById('msw-stocks').classList.remove('on');
  document.getElementById('cryptoSbHead').style.display  = '';
  document.getElementById('stocksSbHead').style.display  = 'none';
  document.getElementById('pairList').style.display      = '';
  document.getElementById('stockPairList').style.display = 'none';
  if (typeof switchToCrypto === 'function') switchToCrypto();
}

// ── FAVORITES ─────────────────────────────────────────────────────────
let favorites   = JSON.parse(localStorage.getItem('apex_favs') || '[]');
let _sbTab      = 'all';
let _pairFilter = '';

function setSbTab(tab) {
  _sbTab = tab;
  document.querySelectorAll('.sbt').forEach(b => b.classList.remove('on'));
  document.getElementById('sbt-' + tab).classList.add('on');
  renderPairs(_pairFilter);
}
function toggleFav(sym, e) {
  e.stopPropagation();
  favorites = favorites.includes(sym)
    ? favorites.filter(s => s !== sym)
    : [...favorites, sym];
  localStorage.setItem('apex_favs', JSON.stringify(favorites));
  _updateFavCount();
  renderPairs(_pairFilter);
}
function _updateFavCount() {
  const el = document.getElementById('favCount');
  if (!el) return;
  el.textContent = favorites.length;
  el.style.display = favorites.length ? 'inline-flex' : 'none';
}

// ── PAIR ROW ──────────────────────────────────────────────────────────
function _pairRow(p) {
  const isFav = favorites.includes(p.sym);
  return `<div class="pi ${p.sym === S.pair ? 'on' : ''}" data-sym="${p.sym}" onclick="selPair('${p.sym}')">
    <div class="ci">
      <div class="coin" style="${_coinStyle(p.base)}">${p.base.slice(0, 3)}</div>
      <div><div class="p-base">${p.base}</div><div class="p-quote">USDT</div></div>
    </div>
    <div class="p-right">
      <div class="p-nums">
        <div class="p-price ${p.ch >= 0 ? 'up' : 'dn'}">$${fp(prices[p.sym])}</div>
        <div class="p-chg ${p.ch >= 0 ? 'up' : 'dn'}">${p.ch >= 0 ? '+' : ''}${p.ch.toFixed(2)}%</div>
      </div>
      <button class="fav-btn ${isFav ? 'on' : ''}" onclick="toggleFav('${p.sym}',event)"
        title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">★</button>
    </div>
  </div>`;
}

// ── SIDEBAR RENDER ────────────────────────────────────────────────────
function renderPairs(f = '') {
  const el = document.getElementById('pairList');
  const q  = f.toLowerCase();
  let list = PAIRS.filter(p => p.sym.toLowerCase().includes(q) || p.base.toLowerCase().includes(q));

  if (_sbTab === 'fav') {
    list = list.filter(p => favorites.includes(p.sym));
    if (!list.length) {
      el.innerHTML = '<div class="fav-empty">★ Star any token to add it to your favorites</div>';
      return;
    }
    el.innerHTML = list.map(p => _pairRow(p)).join('');
    return;
  }

  if (!q && favorites.length) {
    const favList = list.filter(p => favorites.includes(p.sym));
    const rest    = list.filter(p => !favorites.includes(p.sym));
    el.innerHTML =
      '<div class="sb-section-lbl">★ Favorites</div>' +
      favList.map(p => _pairRow(p)).join('') +
      '<div class="sb-section-lbl">All Markets</div>' +
      rest.map(p => _pairRow(p)).join('');
    return;
  }

  el.innerHTML = list.map(p => _pairRow(p)).join('');
}

// ── IN-PLACE PRICE UPDATE ─────────────────────────────────────────────
const _prevPairState = {};

function _updatePairPricesOnly() {
  const pairList = document.getElementById('pairList');
  if (!pairList) return;

  PAIRS.forEach(p => {
    const pr   = prices[p.sym];
    const ch   = p.ch;
    const prev = _prevPairState[p.sym];
    if (prev && prev.pr === pr && prev.ch === ch) return;
    _prevPairState[p.sym] = { pr, ch };

    const row = pairList.querySelector(`.pi[data-sym="${p.sym}"]`);
    if (!row) return;

    const priceEl = row.querySelector('.p-price');
    const chgEl   = row.querySelector('.p-chg');
    if (!priceEl || !chgEl) return;

    const priceTxt = '$' + fp(pr);
    const chgTxt   = (ch >= 0 ? '+' : '') + ch.toFixed(2) + '%';
    const cls      = ch >= 0 ? 'up' : 'dn';

    if (priceEl.textContent !== priceTxt) priceEl.textContent = priceTxt;
    if (priceEl.className !== 'p-price ' + cls) priceEl.className = 'p-price ' + cls;
    if (chgEl.textContent !== chgTxt) chgEl.textContent = chgTxt;
    if (chgEl.className !== 'p-chg ' + cls) chgEl.className = 'p-chg ' + cls;
  });
}

// ── SELECT PAIR (crypto) ──────────────────────────────────────────────
function selPair(sym) {
  if (typeof klineAbort !== 'undefined' && klineAbort) klineAbort.abort();
  S.pair = sym;
  const p = PAIRS.find(x => x.sym === sym);
  if (!p) return;
  _updateSymHeader(p.base, currentTF);
  document.getElementById('aunit').textContent = p.base;
  document.getElementById('placeBtn').textContent = (S.side === 'buy' ? 'BUY ' : 'SELL ') + p.base;
  candles = [];
  _chartInitialised = false;
  if (typeof priceLine !== 'undefined' && priceLine && candleSeries) {
    try { candleSeries.removePriceLine(priceLine); } catch (_) {}
    priceLine = null;
  }
  if (candleSeries)  { try { candleSeries.setData([]); }  catch (_) {} }
  if (volumeSeries)  { try { volumeSeries.setData([]); }  catch (_) {} }
  if (typeof maLines !== 'undefined') {
    maLines.forEach(ma => { if (ma.series) { try { ma.series.setData([]); } catch (_) {} } });
  }
  if (typeof _resetPriceLineCache === 'function') _resetPriceLineCache();
  genCandles();
  renderPairs(_pairFilter);
  updateHdr();
  renderBook();
}

// ── TAB SWITCHERS ─────────────────────────────────────────────────────
function switchTab(el, id) {
  document.querySelectorAll('.tbi').forEach(t => t.classList.remove('on'));
  document.querySelectorAll('.tpanel').forEach(p => p.classList.remove('on'));
  el.classList.add('on');
  document.getElementById(id).classList.add('on');
}
function switchBot(el, id) {
  document.querySelectorAll('.bt').forEach(t => t.classList.remove('on'));
  document.querySelectorAll('.bc').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
  document.getElementById(id).classList.add('on');
}

function setTF(el) {
  document.querySelectorAll('.tfb').forEach(b => b.classList.remove('on'));
  el.classList.add('on');
  currentTF = el.textContent.trim();

  if (typeof stockMode !== 'undefined' && stockMode) {
    // Update header for stocks
    const sp = typeof STOCK_PAIRS !== 'undefined' && STOCK_PAIRS.find(x => x.sym === S.pair);
    if (sp) {
      const symEl = document.getElementById('hSym');
      const exch  = typeof _exchLabel === 'function' ? _exchLabel(S.pair) : 'NYSE/NASDAQ';
      if (symEl) symEl.innerHTML =
        `${sp.name}<span class="sym-sep"> / USD</span>` +
        `<span class="sym-meta"> · ${currentTF} · ${exch}</span>`;
    }
  } else {
    const p = PAIRS.find(x => x.sym === S.pair);
    if (p) _updateSymHeader(p.base, currentTF);
  }
  genCandles();
}

// ── TOAST ─────────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const s = document.getElementById('tstack');
  const d = document.createElement('div');
  d.className = `ti ${type}`;
  d.textContent = msg;
  s.appendChild(d);
  requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('show')));
  setTimeout(() => { d.classList.remove('show'); setTimeout(() => d.remove(), 400); }, 3400);
}

// ── RESET ACCOUNT ─────────────────────────────────────────────────────
function resetAcc() {
  if (!confirm('Reset to $100,000?')) return;
  S.bal = INIT; S.startBal = INIT; S.positions = []; S.history = [];
  renderPos(); renderHist(); updateHdr();
  toast('Account reset — $100,000 ready', 'info');
}

// ── MAIN LOOP ─────────────────────────────────────────────────────────
let tick = 0;
function loop() {
  tick++;
  updateHdr();
  updatePriceLine();
  if (tick % 4  === 0) {
    _updatePairPricesOnly();
  }
  if (tick % 10 === 0) renderPos();
  if (tick % 20 === 0) renderBook();
}

// ── CANDLE COUNTDOWN TIMER ────────────────────────────────────────────
function updateCandleTimer() {
  const intervalMs = TF_MS[currentTF] || 60000;
  const now        = Date.now();
  const periodEnd  = (Math.floor(now / intervalMs) + 1) * intervalMs;
  const remaining  = periodEnd - now;
  const totalSec   = Math.floor(remaining / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  let label;
  if (d > 0)      label = `${d}d ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  else if (h > 0) label = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  else            label = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  if (typeof _lastTimerLabel !== 'undefined') _lastTimerLabel = label;
  if (typeof updatePriceLine === 'function') updatePriceLine(label);
}

// ── DEVICE DETECTION ─────────────────────────────────────────────────
// Uses the stamp set by the early-detection script in <head>.
// Falls back to UA + touch + width if the global isn't set (e.g. hot reload).
function _isMobileDevice() {
  if (window._APEX_DEVICE) return window._APEX_DEVICE === 'mobile';
  const ua      = navigator.userAgent;
  const isPhone = /iPhone|Android.*Mobile|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const hasTouch= ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  const narrow  = window.innerWidth <= 768;
  return isPhone || (hasTouch && narrow) || narrow;
}

function _isTabletDevice() {
  if (window._APEX_DEVICE) return window._APEX_DEVICE === 'tablet';
  const ua       = navigator.userAgent;
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua));
  const hasTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  return !_isMobileDevice() && (isTablet || (hasTouch && window.innerWidth <= 1024));
}

function _isTouchDevice() {
  return ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
}

// ── MOBILE NAV ────────────────────────────────────────────────────────
const MOB_VIEWS = {
  chart:     '.main',
  markets:   '.sidebar',
  trade:     '.rp',
  positions: '.bot',
};
let _mobCurrent = 'chart';

function mobSwitch(view) {
  if (!_isMobileDevice()) return;
  Object.values(MOB_VIEWS).forEach(sel => {
    const el = document.querySelector(sel);
    if (el) el.classList.remove('mob-active');
  });
  document.querySelectorAll('.mob-tab').forEach(t => t.classList.remove('on'));
  const panel = document.querySelector(MOB_VIEWS[view]);
  if (panel) panel.classList.add('mob-active');
  const tab = document.getElementById('mobTab-' + view);
  if (tab) tab.classList.add('on');
  _mobCurrent = view;
  if (view === 'chart' && typeof lwChart !== 'undefined' && lwChart) {
    setTimeout(() => {
      const cw = document.getElementById('cw');
      if (cw) lwChart.resize(cw.clientWidth, cw.clientHeight);
    }, 30);
  }
}

function _initMobile() {
  const mobile  = _isMobileDevice();
  const tablet  = _isTabletDevice();
  const touch   = _isTouchDevice();

  // Stamp body with device class for optional CSS targeting
  document.body.classList.remove('device-mobile', 'device-tablet', 'device-desktop');
  document.body.classList.add(mobile ? 'device-mobile' : tablet ? 'device-tablet' : 'device-desktop');

  // Add touch class for hover/tap style overrides
  if (touch) document.body.classList.add('device-touch');

  if (mobile) {
    mobSwitch('chart');
  }
}

// Re-evaluate on orientation change and significant resize
let _resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => {
    // Update device stamp in case orientation flipped a tablet into mobile range
    window._APEX_DEVICE = _computeDevice();
    document.documentElement.className = document.documentElement.className
      .replace(/\bis-mobile\b|\bis-tablet\b|\bis-desktop\b/g, '').trim();
    document.documentElement.classList.add('is-' + window._APEX_DEVICE);

    if (_isMobileDevice()) {
      mobSwitch(_mobCurrent);
    } else {
      document.querySelectorAll('.mob-active').forEach(el => el.classList.remove('mob-active'));
    }
  }, 120);
});

window.addEventListener('orientationchange', () => {
  // Short delay lets the browser finish rotating before we read innerWidth
  setTimeout(() => {
    window._APEX_DEVICE = _computeDevice();
    _initMobile();
  }, 200);
});

function _computeDevice() {
  const ua      = navigator.userAgent;
  const isPhone = /iPhone|Android.*Mobile|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet= /iPad|Android(?!.*Mobile)/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua));
  const hasTouch= ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  const narrow  = window.innerWidth <= 768;
  const mobile  = isPhone || (hasTouch && narrow) || narrow;
  const tablet  = !mobile && (isTablet || (hasTouch && window.innerWidth <= 1024));
  return mobile ? 'mobile' : tablet ? 'tablet' : 'desktop';
}
// ── NAV TAB SWITCHER ──────────────────────────────────────────────────
// Manages the top nav tabs including the new "Paper Trader" chartless view.

let _activeNavTab = 'trade';

function switchNavTab(tab) {
  _activeNavTab = tab;

  // Update nav button active states
  document.querySelectorAll('.nav-links .nl').forEach(b => b.classList.remove('on'));
  const activeBtn = document.getElementById('navTab-' + tab);
  if (activeBtn) activeBtn.classList.add('on');

  const app    = document.querySelector('.app');
  const ptView = document.getElementById('ptView');

  if (tab === 'papertrader') {
    // Show Paper Trader view, hide normal chart grid
    app.classList.add('pt-mode');
    ptView.style.display = 'flex';
    _syncPTView();
  } else {
    // Hide Paper Trader view, restore normal grid
    app.classList.remove('pt-mode');
    ptView.style.display = 'none';
  }
}

// ── Sync PT view elements with current S state ────────────────────────
function _syncPTView() {
  // Keep order form inputs mirrored
  const ptAmt  = document.getElementById('ptAmt');
  const ptPsl  = document.getElementById('ptPsl');
  const mainAmt = document.getElementById('amt');
  const mainPsl = document.getElementById('psl');

  // Sync pair badge
  const badge = document.getElementById('ptPairBadge');
  if (badge) badge.textContent = S.pair;
  const ptSPair = document.getElementById('ptSPair');
  if (ptSPair) ptSPair.textContent = S.pair;

  // Sync unit labels
  const p = (typeof stockMode !== 'undefined' && stockMode)
    ? STOCK_PAIRS?.find(x => x.sym === S.pair)
    : PAIRS.find(x => x.sym === S.pair);
  const base = p ? (p.base || p.sym) : S.pair.split('/')[0];

  const ptAunit = document.getElementById('ptAunit');
  if (ptAunit) ptAunit.textContent = base;

  // Sync buy/sell button states
  _syncPTButtons();

  // Sync available balance
  const ptAvShow = document.getElementById('ptAvShow');
  if (ptAvShow) ptAvShow.textContent = 'Avail: ' + fu(S.bal);

  // Render positions and history in PT tables
  _ptRenderPos();
  _ptRenderHist();
  _ptUpdateStats();

  // Mirror the main order-type UI (lpf visibility)
  const mainLpf = document.getElementById('lpf');
  const ptLpf   = document.getElementById('ptLpf');
  if (mainLpf && ptLpf) ptLpf.style.display = mainLpf.style.display;

  // Render order book into PT book panels
  _ptRenderBook();
}

function _syncPTButtons() {
  const buyBtn  = document.getElementById('ptBuyBtn');
  const sellBtn = document.getElementById('ptSellBtn');
  const placeBtn = document.getElementById('ptPlaceBtn');
  if (buyBtn)  buyBtn.className  = 'bsb buy'  + (S.side === 'buy'  ? ' on' : '');
  if (sellBtn) sellBtn.className = 'bsb sell' + (S.side === 'sell' ? ' on' : '');
  if (placeBtn) {
    placeBtn.className = 'pob ' + S.side;
    const p = PAIRS.find(x => x.sym === S.pair);
    const base = p ? p.base : S.pair.split('/')[0];
    placeBtn.textContent = (S.side === 'buy' ? 'BUY ' : 'SELL ') + base;
  }
}

// ── PT-specific slider / calc helpers ─────────────────────────────────
// These mirror slPct/calcT but write into the PT input fields, then
// also update the main hidden inputs so placeOrder() reads the right values.

function _ptSlPct(pct) {
  document.getElementById('ptPsl').value = pct;
  // Also drive the main form slider/amount
  slPct(pct);
  // Mirror back into PT amount field
  const mainAmt = document.getElementById('amt');
  const ptAmt   = document.getElementById('ptAmt');
  if (mainAmt && ptAmt) ptAmt.value = mainAmt.value;
  _ptCalcT();
}

function _ptCalcT() {
  // Mirror PT amount into the main form so placeOrder() picks it up
  const ptAmt  = document.getElementById('ptAmt');
  const mainAmt = document.getElementById('amt');
  if (ptAmt && mainAmt) mainAmt.value = ptAmt.value;
  calcT();   // updates main form summary

  // Also update PT summary fields
  const a   = parseFloat(ptAmt?.value) || 0;
  const pr  = prices[S.pair];
  const t   = a * pr;
  const fee = t * 0.001;
  const ptSPrice = document.getElementById('ptSPrice');
  const ptSTotal = document.getElementById('ptSTotal');
  const ptSFee   = document.getElementById('ptSFee');
  if (ptSPrice) ptSPrice.textContent = S.otype === 'market' ? 'Market' : '$' + fp(pr);
  if (ptSTotal) ptSTotal.textContent = fu(t);
  if (ptSFee)   ptSFee.textContent   = fu(fee);
}

// ── PT positions table ────────────────────────────────────────────────
function _ptRenderPos() {
  const tb  = document.getElementById('ptPosTb');
  const bdg = document.getElementById('ptPosBdg');
  if (!tb) return;
  if (bdg) bdg.textContent = S.positions.length;

  if (!S.positions.length) {
    tb.innerHTML = '<tr class="empty"><td colspan="9">No open positions · Place a trade to get started</td></tr>';
    return;
  }
  tb.innerHTML = S.positions.map(p => {
    const mk  = prices[p.sym];
    const pnl = (mk - p.entry) * p.size;
    const roe = (mk - p.entry) / p.entry * 100;
    const val = mk * p.size;
    return `<tr>
      <td style="font-weight:600">${p.sym}</td>
      <td><span class="chip long">LONG</span></td>
      <td>${p.size.toFixed(5)}</td>
      <td style="color:var(--t2)">$${fp(p.entry)}</td>
      <td>$${fp(mk)}</td>
      <td class="${pnl >= 0 ? 'up' : 'dn'}">${pnl >= 0 ? '+' : ''}${fu(pnl)}</td>
      <td class="${roe >= 0 ? 'up' : 'dn'}">${roe >= 0 ? '+' : ''}${roe.toFixed(2)}%</td>
      <td>${fu(val)}</td>
      <td><button class="abt" onclick="closePOS(${p.id})">Close</button></td>
    </tr>`;
  }).join('');
}

// ── PT history table ──────────────────────────────────────────────────
function _ptRenderHist() {
  const tb = document.getElementById('ptHistTb');
  if (!tb) return;
  if (!S.history.length) {
    tb.innerHTML = '<tr class="empty"><td colspan="8">No trade history yet</td></tr>';
    return;
  }
  tb.innerHTML = S.history.slice(0, 60).map(h =>
    `<tr>
      <td class="dim">${h.time}</td>
      <td style="font-weight:600">${h.pair}</td>
      <td><span class="chip ${h.side === 'BUY' ? 'buy' : 'sell'}">${h.side}</span></td>
      <td>$${fp(h.price)}</td>
      <td>${h.amt.toFixed(5)}</td>
      <td>${fu(h.total)}</td>
      <td class="dim">${fu(h.fee)}</td>
      <td class="${h.pnl == null ? 'dim' : h.pnl >= 0 ? 'up' : 'dn'}">
        ${h.pnl == null ? '—' : (h.pnl >= 0 ? '+' : '') + fu(h.pnl)}
      </td>
    </tr>`
  ).join('');
}

// ── PT stats bar ──────────────────────────────────────────────────────
function _ptUpdateStats() {
  const balEl    = document.getElementById('ptStatBal');
  const pnlEl    = document.getElementById('ptStatPnl');
  const posEl    = document.getElementById('ptStatPos');
  const tradeEl  = document.getElementById('ptStatTrades');
  const avShow   = document.getElementById('ptAvShow');

  if (balEl)   balEl.textContent   = fu(S.bal);
  if (avShow)  avShow.textContent  = 'Avail: ' + fu(S.bal);
  if (posEl)   posEl.textContent   = S.positions.length;
  if (tradeEl) tradeEl.textContent = S.history.length;

  const sp     = S.bal - S.startBal;
  const spTxt  = (sp >= 0 ? '+' : '') + fu(sp);
  const spCol  = sp >= 0 ? 'var(--green)' : sp < 0 ? 'var(--red)' : 'var(--t3)';
  if (pnlEl) { pnlEl.textContent = spTxt; pnlEl.style.color = spCol; }
}

// ── PT order book (mirrors renderBook into PT-specific elements) ───────
function _ptRenderBook() {
  const pr = prices[S.pair];
  if (!pr) return;
  const asks = [], bids = [];
  for (let i = 0; i < 8; i++) {
    const ap = pr * (1 + (4e-4 + i * 2.5e-4) * (1 + Math.random() * .4));
    const av = +(Math.random() * 6 + .05).toFixed(4);
    asks.push({ p: ap, q: av, t: ap * av });
  }
  for (let i = 0; i < 8; i++) {
    const bp = pr * (1 - (4e-4 + i * 2.5e-4) * (1 + Math.random() * .4));
    const bv = +(Math.random() * 6 + .05).toFixed(4);
    bids.push({ p: bp, q: bv, t: bp * bv });
  }
  const mx = Math.max(...[...asks, ...bids].map(r => r.q));
  const ptObA = document.getElementById('ptObA');
  const ptObB = document.getElementById('ptObB');
  const ptObP = document.getElementById('ptObP');
  const ptObT = document.getElementById('ptObT');
  if (ptObA) ptObA.innerHTML = [...asks].reverse().map(r => {
    const w = (r.q / mx * 100).toFixed(0);
    return `<div class="obr ask" onclick="setLP(${r.p.toFixed(2)})"><div class="obf" style="width:${w}%"></div><span>${fp(r.p)}</span><span style="color:var(--t2)">${r.q}</span><span class="dim">${(r.t / 1000).toFixed(1)}K</span></div>`;
  }).join('');
  if (ptObB) ptObB.innerHTML = bids.map(r => {
    const w = (r.q / mx * 100).toFixed(0);
    return `<div class="obr bid" onclick="setLP(${r.p.toFixed(2)})"><div class="obf" style="width:${w}%"></div><span>${fp(r.p)}</span><span style="color:var(--t2)">${r.q}</span><span class="dim">${(r.t / 1000).toFixed(1)}K</span></div>`;
  }).join('');
  const pair = PAIRS.find(x => x.sym === S.pair);
  if (ptObP) ptObP.textContent = '$' + fp(pr);
  if (ptObT && pair) {
    ptObT.textContent = (pair.ch >= 0 ? '+' : '') + pair.ch.toFixed(2) + '%';
    ptObT.className   = 'ob-mt ' + (pair.ch >= 0 ? 'up' : 'dn');
  }
}

// ── Hook PT view into the main render/loop cycle ──────────────────────
// Wrap the existing renderPos / renderHist / updateHdr so PT tables
// stay in sync whenever a trade fires, even from the main form.
(function _patchForPTSync() {
  const _origRenderPos  = window.renderPos;
  const _origRenderHist = window.renderHist;
  const _origUpdateHdr  = window.updateHdr;
  const _origResetAcc   = window.resetAcc;

  window.renderPos = function() {
    _origRenderPos.apply(this, arguments);
    if (_activeNavTab === 'papertrader') { _ptRenderPos(); _ptUpdateStats(); }
  };
  window.renderHist = function() {
    _origRenderHist.apply(this, arguments);
    if (_activeNavTab === 'papertrader') { _ptRenderHist(); _ptUpdateStats(); }
  };
  window.updateHdr = function() {
    _origUpdateHdr.apply(this, arguments);
    if (_activeNavTab === 'papertrader') {
      _ptUpdateStats();
      // Keep PT pair badge + unit current
      const badge = document.getElementById('ptPairBadge');
      if (badge) badge.textContent = S.pair;
      const ptSPair = document.getElementById('ptSPair');
      if (ptSPair) ptSPair.textContent = S.pair;
    }
  };
  window.resetAcc = function() {
    _origResetAcc.apply(this, arguments);
    if (_activeNavTab === 'papertrader') { _ptRenderPos(); _ptRenderHist(); _ptUpdateStats(); }
  };
})();

// Periodically refresh PT order book when the tab is active
setInterval(() => {
  if (_activeNavTab === 'papertrader') _ptRenderBook();
}, 1500);