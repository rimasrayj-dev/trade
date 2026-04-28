// ── CHART — Lightweight Charts v4 ──
// Depends on: prices, S, PAIRS, fp() from main script
// Volume indicator  : volume.js        (volumeSeries lives there)
// MA indicator      : movingaverage.js (ma*Series live there)
// StochRSI indicator: stochrsi.js      (stochK/DSeries live there)

let lwChart      = null;  // IChartApi
let candleSeries = null;  // ISeriesApi<'Candlestick'>
let priceLine    = null;  // IPriceLine on candleSeries

// Shared candles array — mutated by feed.js for live tick updates
let candles = [];

// ── INIT ────────────────────────────────────────────────────────────
function initChart() {
  const container = document.getElementById('cw');
  if (!container || lwChart) return;

  lwChart = LightweightCharts.createChart(container, {
    width:  container.clientWidth,
    height: container.clientHeight,
    layout: {
      background:  { type: 'solid', color: 'transparent' },
      textColor:   '#4a5568',
      fontFamily:  "'IBM Plex Mono', monospace",
      fontSize:    10,
    },
    grid: {
      vertLines: { color: 'rgba(255,255,255,0.03)' },
      horzLines: { color: 'rgba(255,255,255,0.04)' },
    },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal,
      vertLine: {
        color: 'rgba(255,255,255,0.15)',
        labelBackgroundColor: '#0a0e1c',
      },
      horzLine: {
        color: 'rgba(255,255,255,0.15)',
        labelBackgroundColor: '#0a0e1c',
      },
    },
    rightPriceScale: {
      borderColor:  'rgba(255,255,255,0.045)',
      textColor:    '#4a5568',
      scaleMargins: { top: 0.08, bottom: 0.22 },
    },
    timeScale: {
      borderColor:    'rgba(255,255,255,0.045)',
      timeVisible:    true,
      secondsVisible: false,
    },
    handleScroll: true,
    handleScale:  true,
  });

  // ── Candlestick series ──────────────────────────────────────────
  candleSeries = lwChart.addCandlestickSeries({
    upColor:          '#10b981',
    downColor:        '#f43f5e',
    borderUpColor:    '#10b981',
    borderDownColor:  '#f43f5e',
    wickUpColor:      '#10b981',
    wickDownColor:    '#f43f5e',
    priceLineVisible: false,
    lastValueVisible: false,
  });

  // ── Indicators (own files) ──────────────────────────────────────
  initVolumeIndicator();
  initMAIndicator();
  initStochRSIIndicator();

  // ── Resize observer ─────────────────────────────────────────────
  new ResizeObserver(() => {
    if (lwChart && container.clientWidth && container.clientHeight) {
      lwChart.resize(container.clientWidth, container.clientHeight);
    }
  }).observe(container);
}

// ── Push candles[] into the chart ───────────────────────────────────
let _chartInitialised = false;  // true after first fitContent for current pair

// ── Dynamic price format — fixes invisible labels for micro-price coins (e.g. PEPE) ──
function updatePriceFormat() {
  if (!candleSeries || !candles.length) return;
  const pr = candles.at(-1).c;
  let precision, minMove;
  if      (pr >= 10000)   { precision = 0; minMove = 1;          }
  else if (pr >= 1000)    { precision = 1; minMove = 0.1;        }
  else if (pr >= 100)     { precision = 2; minMove = 0.01;       }
  else if (pr >= 1)       { precision = 3; minMove = 0.001;      }
  else if (pr >= 0.1)     { precision = 4; minMove = 0.0001;     }
  else if (pr >= 0.01)    { precision = 5; minMove = 0.00001;    }
  else if (pr >= 0.001)   { precision = 6; minMove = 0.000001;   }
  else if (pr >= 0.0001)  { precision = 7; minMove = 0.0000001;  }
  else if (pr >= 0.00001) { precision = 8; minMove = 0.00000001; }
  else                    { precision = 10; minMove = 0.0000000001; }
  candleSeries.applyOptions({ priceFormat: { type: 'price', precision, minMove } });
}

function applyCandles(isNewPair = false) {
  if (!lwChart || !candles.length) return;

  const cdData = candles.map(c => ({
    time:  Math.floor(c.t / 1000),
    open:  c.o, high: c.h, low: c.l, close: c.c,
  }));

  updatePriceFormat();   // ← set decimal precision before pushing data
  candleSeries.setData(cdData);
  setVolumeData(candles);
  setMAData(candles);
  setStochRSIData(candles);

  // setData() on any series causes LW Charts to reset that series' price scale
  // margins back to defaults — re-apply our layout after all data is pushed.
  if (typeof _recalcSubPaneMargins === 'function') _recalcSubPaneMargins();

  updatePriceLine();

  if (isNewPair || !_chartInitialised) {
    // Reset price scale to auto so the new coin's range is always visible,
    // not stuck on the previous pair's price range.
    lwChart.priceScale('right').applyOptions({ autoScale: true });
    lwChart.timeScale().fitContent();
    _chartInitialised = true;
  }
}

// ── Live tick (called from feed.js WebSocket onmessage) ─────────────
function updateLiveTick(sym) {
  if (!lwChart || !candleSeries || sym !== S.pair || !candles.length) return;
  const last = candles.at(-1);
  const t    = Math.floor(last.t / 1000);
  candleSeries.update({ time: t, open: last.o, high: last.h, low: last.l, close: last.c });
  updateVolumeTick(last);
  updateStochRSITick();
  updatePriceLine();
}

// ── Price line — reuse existing line; only recreate when price/colour changes ──
// timerLabel (optional) — shown inside the axis pill alongside the price
let _lastPriceLineVal   = null;
let _lastPriceLineColor = null;
let _lastTimerLabel     = '';

// Called by selPair() so a new pair always gets a fresh line
function _resetPriceLineCache() {
  _lastPriceLineVal   = null;
  _lastPriceLineColor = null;
}

function updatePriceLine(timerLabel) {
  if (!candleSeries) return;
  const pr = prices[S.pair];
  if (!pr) return;

  if (timerLabel !== undefined) _lastTimerLabel = timerLabel;
  const label = _lastTimerLabel || '';
  const last  = candles.length ? candles.at(-1) : null;
  const color = last && last.c >= last.o ? '#10b981' : '#f43f5e';

  // Only the timer label changed — update in-place, no remove/create needed
  if (priceLine && pr === _lastPriceLineVal && color === _lastPriceLineColor) {
    try { priceLine.applyOptions({ title: label }); } catch(_) {}
    return;
  }

  // Price or colour changed — recreate the line
  if (priceLine) { try { candleSeries.removePriceLine(priceLine); } catch(_) {} }
  priceLine = candleSeries.createPriceLine({
    price:            pr,
    color:            color,
    lineWidth:        1,
    lineStyle:        LightweightCharts.LineStyle.Dashed,
    axisLabelVisible: true,
    title:            label,
  });
  _lastPriceLineVal   = pr;
  _lastPriceLineColor = color;
}

// ── Public surface expected by feed.js / main script ────────────────

function drawChart(isNewPair = false) {
  if (!lwChart) initChart();
  applyCandles(isNewPair);
}

function genCandlesSim() {
  candles = [];
  let p = prices[S.pair];
  for (let i = 200; i >= 0; i--) {
    const o = p * (1 + (Math.random() - .5) * .018);
    const c = o * (1 + (Math.random() - .5) * .022);
    const h = Math.max(o, c) * (1 + Math.random() * .008);
    const l = Math.min(o, c) * (1 - Math.random() * .008);
    candles.push({ o, h, l, c, v: Math.random() * 800 + 100, t: Date.now() - i * 60000 });
    p = c;
  }
  drawChart(true);
}

function genCandles() {
  if (typeof loadKlines === 'function') {
    loadKlines(S.pair, currentTF);
  } else {
    genCandlesSim();
  }
}