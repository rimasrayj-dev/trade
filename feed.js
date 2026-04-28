// ── LIVE DATA FEED ──
// Binance public WebSocket + REST — no API key required
// Writes into: prices[], PAIRS[].ch, PAIRS[].vol, PAIRS[].high24, PAIRS[].low24
// Note: fmtVol() lives in state.js | setFeedStatus() + updateHdr() live in ui.js

const BINANCE_WS   = 'wss://data-stream.binance.vision/stream';
const BINANCE_REST = 'https://data-api.binance.vision/api/v3';

const symToStream  = sym => sym.replace('/', '').toLowerCase() + '@miniTicker';
const symToBinance = sym => sym.replace('/', '');

let feedWs         = null;
let feedConnected  = false;
let reconnectTimer = null;

// ── TF interval durations in milliseconds ────────────────────────────
const TF_MS = {
  '1m':60000,'3m':180000,'5m':300000,'15m':900000,'30m':1800000,
  '1h':3600000,'2h':7200000,'4h':14400000,'6h':21600000,'12h':43200000,
  '1D':86400000,'3D':259200000,'1W':604800000,'1M':2592000000
};

// ── WebSocket feed ────────────────────────────────────────────────────
function startFeed() {
  if (feedWs) { try { feedWs.close(); } catch(_){} }

  const streams = PAIRS.map(p => symToStream(p.sym)).join('/');
  feedWs = new WebSocket(`${BINANCE_WS}?streams=${streams}`);

  feedWs.onopen = () => {
    feedConnected = true;
    clearTimeout(reconnectTimer);
    setFeedStatus('live');
  };

  feedWs.onmessage = e => {
    const msg = JSON.parse(e.data);
    const d   = msg.data;
    if (!d || d.e !== '24hrMiniTicker') return;

    const sym  = d.s.replace('USDT', '/USDT');
    const pair = PAIRS.find(p => p.sym === sym);
    if (!pair) return;

    const now    = parseFloat(d.c);
    prices[sym]  = now;
    pair.high24  = parseFloat(d.h);
    pair.low24   = parseFloat(d.l);
    pair.vol     = fmtVol(parseFloat(d.q));
    pair.ch      = ((now - parseFloat(d.o)) / parseFloat(d.o)) * 100;

    if (sym === S.pair && candles.length) {
      const intervalMs         = TF_MS[currentTF] || 60000;
      const nowMs              = Date.now();
      const currentPeriodStart = Math.floor(nowMs / intervalMs) * intervalMs;
      const last               = candles.at(-1);

      if (last.t < currentPeriodStart) {
        candles.push({ t: currentPeriodStart, o: now, h: now, l: now, c: now, v: 0 });
      } else {
        last.c = now;
        last.h = Math.max(last.h, now);
        last.l = Math.min(last.l, now);
      }
      updateLiveTick(sym);
    }
  };

  feedWs.onerror = () => setFeedStatus('error');

  feedWs.onclose = () => {
    feedConnected = false;
    setFeedStatus('reconnecting');
    reconnectTimer = setTimeout(startFeed, 3000);
  };

  // Binance disconnects after 24 h — reconnect at 23 h
  setTimeout(startFeed, 23 * 60 * 60 * 1000);
}

// ── REST kline history ────────────────────────────────────────────────
const TF_MAP = {
  '1m':'1m','3m':'3m','5m':'5m','15m':'15m','30m':'30m',
  '1h':'1h','2h':'2h','4h':'4h','6h':'6h','12h':'12h',
  '1D':'1d','3D':'3d','1W':'1w','1M':'1M'
};
const TF_MAX_PAGES = {
  '1m':200,'3m':300,'5m':400,'15m':500,'30m':500,
  '1h':500,'2h':500,'4h':500,'6h':500,'12h':500,
  '1D':500,'3D':500,'1W':500,'1M':500
};

let currentTF  = '1m';
let klineAbort = null;

async function loadKlines(sym, interval) {
  if (klineAbort) klineAbort.abort();
  klineAbort = new AbortController();
  const signal = klineAbort.signal;

  const binSym   = symToBinance(sym);
  const int      = TF_MAP[interval] || '1m';
  const maxPages = TF_MAX_PAGES[interval] || 20;
  const LIMIT    = 1000;

  try {
    let allCandles = [];
    let endTime    = undefined;
    let page       = 0;
    let firstDraw  = true;

    while (page < maxPages) {
      if (signal.aborted || sym !== S.pair) return;

      const url = `${BINANCE_REST}/klines?symbol=${binSym}&interval=${int}&limit=${LIMIT}`
                + (endTime ? `&endTime=${endTime}` : '');

      const res  = await fetch(url, { signal });
      if (signal.aborted || sym !== S.pair) return;
      const data = await res.json();
      if (signal.aborted || sym !== S.pair) return;
      if (!Array.isArray(data) || !data.length) break;

      const mapped = data.map(k => ({
        t: k[0],
        o: parseFloat(k[1]),
        h: parseFloat(k[2]),
        l: parseFloat(k[3]),
        c: parseFloat(k[4]),
        v: parseFloat(k[5]),
      }));

      allCandles = [...mapped, ...allCandles];
      endTime    = data[0][0] - 1;
      page++;

      _mergeAndDraw(sym, allCandles, firstDraw);
      firstDraw = false;

      if (data.length < LIMIT) break;
    }

  } catch (err) {
    if (err.name === 'AbortError') return;
    console.warn('klines fetch failed, falling back to sim', err);
    if (sym === S.pair) genCandlesSim();
  }
}

function _mergeAndDraw(sym, raw, isNewPair = false) {
  if (sym !== S.pair) return;
  const seen = new Set();
  candles = raw
    .filter(c => { if (seen.has(c.t)) return false; seen.add(c.t); return true; })
    .sort((a, b) => a.t - b.t);
  if (candles.length) prices[sym] = candles.at(-1).c;
  drawChart(isNewPair);
}