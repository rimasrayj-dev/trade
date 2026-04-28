// ── MOVING AVERAGE INDICATOR ──
// Fully dynamic: add/remove MAs, custom period + colour + type, toggle on/off
// Types: SMA (simple), EMA (exponential), WMA (weighted)
// Depends on: lwChart (chart.js), candles[], fp() (main script)

// ── State ────────────────────────────────────────────────────────────
let maVisible = true;

// Each MA: { id, period, color, type, series }
let maLines = [
  { id: 1, period: 7,  color: '#f59e0b', type: 'EMA' },
  { id: 2, period: 25, color: '#a78bfa', type: 'EMA' },
  { id: 3, period: 99, color: '#38bdf8', type: 'SMA' },
];
let _maNextId = 4;

const MA_TYPES = ['SMA', 'EMA', 'WMA'];

// ── Init — called by initChart() in chart.js ─────────────────────────
function initMAIndicator() {
  if (!lwChart) return;

  maLines.forEach(ma => _createSeries(ma));

  lwChart.subscribeCrosshairMove(param => {
    if (!param || !param.time) return;
    const idx = candles.findIndex(x => Math.floor(x.t / 1000) === param.time);
    _updateLabelBar(idx >= 0 ? candles.map(x => x.c) : null, idx);
  });

  _renderLabelBar();
  _renderSettingsRows();
  _applyMAToggleUI();

  // Apply restored visibility to the label bar
  const bar = document.getElementById('ma-bar');
  if (bar) bar.style.display = maVisible ? 'flex' : 'none';
}

// ── Push data — called by applyCandles() in chart.js ─────────────────
function setMAData(candles) {
  if (!maLines.length) return;
  const closes = candles.map(c => c.c);
  maLines.forEach(ma => {
    if (!ma.series) return;
    const vals = _buildMA(closes, ma.period, ma.type);
    const data = [];
    candles.forEach((c, i) => {
      if (vals[i] !== null) data.push({ time: Math.floor(c.t / 1000), value: vals[i] });
    });
    ma.series.setData(data);
  });
  _updateLabelBar(closes, closes.length - 1);
}

// ── Reset to factory defaults ─────────────────────────────────────────
function resetMADefaults() {
  maLines.forEach(ma => {
    if (ma.series) { try { lwChart.removeSeries(ma.series); } catch(_){} }
  });
  maLines = [
    { id: 1, period: 7,  color: '#f59e0b', type: 'EMA' },
    { id: 2, period: 25, color: '#a78bfa', type: 'EMA' },
    { id: 3, period: 99, color: '#38bdf8', type: 'SMA' },
  ];
  _maNextId = 4;
  maLines.forEach(ma => {
    _createSeries(ma);
    ma.series.applyOptions({ visible: maVisible });
  });
  if (candles.length) setMAData(candles);
  _renderLabelBar();
  _renderSettingsRows();
  if (typeof _syncIndToggles === 'function') _syncIndToggles();
  if (typeof saveSettings === 'function') saveSettings();
  if (typeof toast === 'function') toast('MA lines reset to defaults', 'info');
}

// ── Global toggle ─────────────────────────────────────────────────────
function toggleMA() {
  maVisible = !maVisible;
  maLines.forEach(ma => ma.series && ma.series.applyOptions({ visible: maVisible }));
  const bar = document.getElementById('ma-bar');
  if (bar) bar.style.display = maVisible ? 'flex' : 'none';
  _applyMAToggleUI();
}

// ── Settings panel toggle ─────────────────────────────────────────────
function openMASettings() {
  const panel    = document.getElementById('maSettingsPanel');
  const indPanel = document.getElementById('indicatorsPanel');
  if (!panel) return;
  const isOpen = panel.style.display === 'flex';
  if (isOpen) { panel.style.display = 'none'; return; }
  if (indPanel && indPanel.style.display === 'flex') {
    const r = indPanel.getBoundingClientRect();
    panel.style.top  = r.top + 'px';
    panel.style.left = Math.max(8, r.left - 308) + 'px';
  } else {
    const btn = document.getElementById('indicatorsBtn');
    const r = btn ? btn.getBoundingClientRect() : { bottom: 60, right: window.innerWidth - 8 };
    panel.style.top  = (r.bottom + 6) + 'px';
    panel.style.left = Math.max(8, Math.min(r.right - 300, window.innerWidth - 308)) + 'px';
  }
  panel.style.display = 'flex';
}

// ── Add a new MA line ─────────────────────────────────────────────────
function addMALine() {
  const periodEl = document.getElementById('maNewPeriod');
  const colorEl  = document.getElementById('maNewColor');
  const typeEl   = document.getElementById('maNewType');
  const period   = parseInt(periodEl.value);
  if (!period || period < 1 || period > 500) {
    periodEl.style.borderColor = '#f43f5e';
    setTimeout(() => periodEl.style.borderColor = '', 1000);
    return;
  }
  if (maLines.length >= 6) { toast('Max 6 MAs allowed', 'error'); return; }
  const ma = { id: _maNextId++, period, color: colorEl.value, type: typeEl.value };
  maLines.push(ma);
  _createSeries(ma);
  if (candles.length) {
    const closes = candles.map(c => c.c);
    const vals   = _buildMA(closes, ma.period, ma.type);
    const data   = [];
    candles.forEach((c, i) => {
      if (vals[i] !== null) data.push({ time: Math.floor(c.t / 1000), value: vals[i] });
    });
    ma.series.setData(data);
  }
  periodEl.value = '';
  _renderLabelBar();
  _renderSettingsRows();
}

// ── Remove an MA line ─────────────────────────────────────────────────
function removeMALine(id) {
  const ma = maLines.find(m => m.id === id);
  if (!ma) return;
  if (ma.series) { try { lwChart.removeSeries(ma.series); } catch(_){} }
  maLines = maLines.filter(m => m.id !== id);
  _renderLabelBar();
  _renderSettingsRows();
}

// ── Update period live ────────────────────────────────────────────────
function updateMAPeriod(id, val) {
  const period = parseInt(val);
  if (!period || period < 1 || period > 500) return;
  const ma = maLines.find(m => m.id === id);
  if (!ma) return;
  ma.period = period;
  _refreshSeries(ma);
  _renderLabelBar();
  _renderSettingsRows();
}

// ── Update colour live ────────────────────────────────────────────────
function updateMAColor(id, color) {
  const ma = maLines.find(m => m.id === id);
  if (!ma) return;
  ma.color = color;
  if (ma.series) ma.series.applyOptions({ color });
  _renderLabelBar();
  _renderSettingsRows();
}

// ── Update type live ─────────────────────────────────────────────────
function updateMAType(id, type) {
  const ma = maLines.find(m => m.id === id);
  if (!ma) return;
  ma.type = type;
  _refreshSeries(ma);
  _renderLabelBar();
  _renderSettingsRows();
}

// ── Internal: recalculate + push data for one MA ──────────────────────
function _refreshSeries(ma) {
  if (!candles.length || !ma.series) return;
  const closes = candles.map(c => c.c);
  const vals   = _buildMA(closes, ma.period, ma.type);
  const data   = [];
  candles.forEach((c, i) => {
    if (vals[i] !== null) data.push({ time: Math.floor(c.t / 1000), value: vals[i] });
  });
  ma.series.setData(data);
}

// ── Internal: create a Lightweight Charts line series ─────────────────
function _createSeries(ma) {
  if (!lwChart) return;
  ma.series = lwChart.addLineSeries({
    color:                  ma.color,
    lineWidth:              ma.period >= 50 ? 1.5 : 1,
    priceLineVisible:       false,
    lastValueVisible:       false,
    crosshairMarkerVisible: false,
    visible:                maVisible,
  });
}

// ── Internal: SMA/EMA/WMA pill buttons ───────────────────────────────
function _typePills(id, current) {
  return MA_TYPES.map(t => {
    const on = t === current;
    const s  = on
      ? 'background:rgba(0,212,255,0.18);border:1px solid rgba(0,212,255,0.55);color:#00d4ff;'
      : 'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);color:#4a5568;';
    return `<button onclick="event.stopPropagation();updateMAType(${id},'${t}')"
      style="${s}font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:700;
             padding:3px 10px;border-radius:4px;cursor:pointer;letter-spacing:.6px;"
      >${t}</button>`;
  }).join('');
}

// ── Internal: rerender the ma-bar label row ───────────────────────────
function _renderLabelBar() {
  const bar = document.getElementById('ma-bar');
  if (!bar) return;
  bar.innerHTML = maLines.map(ma =>
    `<div class="ma-seg">
      <div class="ma-line" style="background:${ma.color}"></div>
      <span style="color:${ma.color};font-size:10px">${ma.type}${ma.period}</span>
      <span id="mav-${ma.id}" style="color:var(--t2);font-size:10px;margin-left:2px"></span>
    </div>`
  ).join('');
}

// ── Internal: rerender settings rows ─────────────────────────────────
function _renderSettingsRows() {
  const list = document.getElementById('maLinesList');
  if (!list) return;
  list.innerHTML = maLines.map(ma => `
    <div style="padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
      <div style="display:flex;align-items:center;gap:7px;margin-bottom:7px">
        <input type="color" value="${ma.color}" onchange="event.stopPropagation();updateMAColor(${ma.id},this.value)" onclick="event.stopPropagation()"
          style="width:24px;height:24px;border:none;border-radius:4px;cursor:pointer;padding:0;background:none;flex-shrink:0">
        <span style="font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:1px;flex-shrink:0">Period</span>
        <input type="number" value="${ma.period}" min="1" max="500"
          onchange="event.stopPropagation();updateMAPeriod(${ma.id},this.value)" onclick="event.stopPropagation()"
          style="width:52px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);
                 border-radius:4px;color:var(--t1);font-family:'IBM Plex Mono',monospace;font-size:11px;
                 padding:3px 6px;outline:none;flex-shrink:0">
        <span style="font-size:10px;color:${ma.color};flex:1;font-weight:600">${ma.type} ${ma.period}</span>
        <button onclick="event.stopPropagation();removeMALine(${ma.id})"
          style="background:rgba(244,63,94,0.12);border:1px solid rgba(244,63,94,0.3);color:#f43f5e;
                 border-radius:4px;font-size:10px;padding:2px 8px;cursor:pointer;font-family:inherit;flex-shrink:0">✕</button>
      </div>
      <div style="display:flex;align-items:center;gap:5px;padding-left:31px">
        <span style="font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:1px;margin-right:3px;flex-shrink:0">Type</span>
        ${_typePills(ma.id, ma.type)}
      </div>
    </div>
  `).join('');
}

// ── Internal: update label bar values ────────────────────────────────
function _updateLabelBar(closes, idx) {
  maLines.forEach(ma => {
    const el = document.getElementById(`mav-${ma.id}`);
    if (!el) return;
    if (closes === null || idx < 0) { el.textContent = ''; return; }
    const v = _maAt(closes, ma.period, ma.type, idx);
    el.textContent = v ? fp(v) : '';
  });
}

// ── Internal: MA toggle button appearance ────────────────────────────
function _applyMAToggleUI() {
  if (typeof _syncIndToggles === 'function') _syncIndToggles();
}

// ── Math helpers ──────────────────────────────────────────────────────

// Build full array of MA values
function _buildMA(closes, n, type) {
  switch (type) {
    case 'EMA': return _buildEMA(closes, n);
    case 'WMA': return _buildWMA(closes, n);
    default:    return _buildSMA(closes, n);
  }
}

// Value at a single index (used for crosshair label)
function _maAt(closes, n, type, idx) {
  switch (type) {
    case 'EMA': {
      const arr = _buildEMA(closes, n);
      return arr[idx];
    }
    case 'WMA': {
      const arr = _buildWMA(closes, n);
      return arr[idx];
    }
    default: {
      if (idx < n - 1) return null;
      let sum = 0;
      for (let i = idx - n + 1; i <= idx; i++) sum += closes[i];
      return sum / n;
    }
  }
}

// SMA
function _buildSMA(closes, n) {
  return closes.map((_, i) => {
    if (i < n - 1) return null;
    let s = 0;
    for (let j = i - n + 1; j <= i; j++) s += closes[j];
    return s / n;
  });
}

// EMA — uses standard smoothing factor k = 2/(n+1), seeds from first SMA
function _buildEMA(closes, n) {
  const result = new Array(closes.length).fill(null);
  if (closes.length < n) return result;
  const k = 2 / (n + 1);
  // seed: first EMA = SMA of first n closes
  let ema = 0;
  for (let i = 0; i < n; i++) ema += closes[i];
  ema /= n;
  result[n - 1] = ema;
  for (let i = n; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
    result[i] = ema;
  }
  return result;
}

// WMA — linearly weighted: most recent bar has weight n, oldest has weight 1
function _buildWMA(closes, n) {
  const denom = (n * (n + 1)) / 2;
  return closes.map((_, i) => {
    if (i < n - 1) return null;
    let sum = 0;
    for (let j = 0; j < n; j++) sum += closes[i - j] * (n - j);
    return sum / denom;
  });
}