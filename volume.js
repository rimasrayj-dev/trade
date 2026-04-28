// ── VOLUME INDICATOR ──
// Histogram + optional MA overlay, with full settings panel.
// Depends on: lwChart (chart.js), candles[] (chart.js / feed.js)

// ── Config ────────────────────────────────────────────────────────────
const VOL_CFG = {
  upColor:    '#10b981',
  downColor:  '#f43f5e',
  opacity:    0.40,
  paneHeight: 0.18,
  maEnabled:  false,
  maPeriod:   20,
  maColor:    '#f59e0b',
};

// ── State ─────────────────────────────────────────────────────────────
let volumeSeries  = null;
let volumeVisible = true;
let _volMASeries  = null;

// ── Helpers ───────────────────────────────────────────────────────────
function _volColor(bullish) {
  const hex = bullish ? VOL_CFG.upColor : VOL_CFG.downColor;
  return _hexToRgba(hex, VOL_CFG.opacity);
}

function _hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Init ──────────────────────────────────────────────────────────────
function initVolumeIndicator() {
  if (!lwChart || volumeSeries) return;

  volumeSeries = lwChart.addHistogramSeries({
    color:        _volColor(true),
    priceFormat:  { type: 'volume' },
    priceScaleId: 'vol',
    visible:      volumeVisible,
  });
  lwChart.priceScale('vol').applyOptions({
    scaleMargins: { top: 1 - VOL_CFG.paneHeight, bottom: 0 },
    visible:      false,
  });

  _volMASeries = lwChart.addLineSeries({
    color:                  VOL_CFG.maColor,
    lineWidth:              1,
    priceScaleId:           'vol',
    priceLineVisible:       false,
    lastValueVisible:       false,
    crosshairMarkerVisible: false,
    visible:                volumeVisible && VOL_CFG.maEnabled,
  });

  _applyVolToggleUI();
}

// ── Push data ─────────────────────────────────────────────────────────
function setVolumeData(candles) {
  if (!volumeSeries) return;
  const volData = candles.map(c => ({
    time:  Math.floor(c.t / 1000),
    value: c.v,
    color: _volColor(c.c >= c.o),
  }));
  volumeSeries.setData(volData);
  _setVolMAData(candles);
}

// ── Live tick ─────────────────────────────────────────────────────────
function updateVolumeTick(last) {
  if (!volumeSeries) return;
  volumeSeries.update({
    time:  Math.floor(last.t / 1000),
    value: last.v,
    color: _volColor(last.c >= last.o),
  });
  if (_volMASeries && VOL_CFG.maEnabled && typeof candles !== 'undefined' && candles.length >= VOL_CFG.maPeriod) {
    const vols = candles.map(c => c.v);
    const n    = VOL_CFG.maPeriod;
    const sum  = vols.slice(-n).reduce((a, b) => a + b, 0);
    _volMASeries.update({ time: Math.floor(last.t / 1000), value: sum / n });
  }
}

// ── Volume MA math ─────────────────────────────────────────────────────
function _buildVolSMA(vols, n) {
  return vols.map((_, i) => {
    if (i < n - 1) return null;
    let s = 0;
    for (let j = i - n + 1; j <= i; j++) s += vols[j];
    return s / n;
  });
}

function _setVolMAData(candles) {
  if (!_volMASeries) return;
  if (!VOL_CFG.maEnabled || !candles.length) { _volMASeries.setData([]); return; }
  const vols = candles.map(c => c.v);
  const sma  = _buildVolSMA(vols, VOL_CFG.maPeriod);
  const data = [];
  candles.forEach((c, i) => {
    if (sma[i] !== null) data.push({ time: Math.floor(c.t / 1000), value: sma[i] });
  });
  _volMASeries.setData(data);
}

// ── Toggle ────────────────────────────────────────────────────────────
function toggleVolume() {
  volumeVisible = !volumeVisible;
  if (volumeSeries)  volumeSeries.applyOptions({ visible: volumeVisible });
  if (_volMASeries)  _volMASeries.applyOptions({ visible: volumeVisible && VOL_CFG.maEnabled });
  _applyVolToggleUI();
  if (typeof _recalcSubPaneMargins === 'function') _recalcSubPaneMargins();
}

// ── Settings panel ────────────────────────────────────────────────────
function openVolumeSettings() {
  const panel    = document.getElementById('volSettingsPanel');
  const indPanel = document.getElementById('indicatorsPanel');
  if (!panel) return;
  if (panel.style.display === 'flex') { panel.style.display = 'none'; return; }

  document.getElementById('vs-upColor').value              = VOL_CFG.upColor;
  document.getElementById('vs-downColor').value            = VOL_CFG.downColor;
  document.getElementById('vs-opacity').value              = Math.round(VOL_CFG.opacity * 100);
  document.getElementById('vs-opacityVal').textContent     = Math.round(VOL_CFG.opacity * 100) + '%';
  document.getElementById('vs-paneHeight').value           = Math.round(VOL_CFG.paneHeight * 100);
  document.getElementById('vs-paneHeightVal').textContent  = Math.round(VOL_CFG.paneHeight * 100) + '%';
  document.getElementById('vs-maEnabled').classList.toggle('on', VOL_CFG.maEnabled);
  document.getElementById('vs-maPeriod').value             = VOL_CFG.maPeriod;
  document.getElementById('vs-maColor').value              = VOL_CFG.maColor;
  _syncVolMARowVisibility();

  if (indPanel && indPanel.style.display === 'flex') {
    const r = indPanel.getBoundingClientRect();
    panel.style.top  = r.top + 'px';
    panel.style.left = Math.max(8, r.left - 304) + 'px';
  } else {
    const btn = document.getElementById('indicatorsBtn');
    const r   = btn ? btn.getBoundingClientRect() : { bottom: 100, right: 500 };
    panel.style.top  = (r.bottom + 6) + 'px';
    panel.style.left = Math.max(8, r.right - 580) + 'px';
  }
  panel.style.display = 'flex';
}

function closeVolumeSettings() {
  const p = document.getElementById('volSettingsPanel');
  if (p) p.style.display = 'none';
}

function applyVolumeSettings() {
  const upColor    = document.getElementById('vs-upColor').value;
  const downColor  = document.getElementById('vs-downColor').value;
  const opacity    = parseInt(document.getElementById('vs-opacity').value) / 100;
  const paneHeight = parseInt(document.getElementById('vs-paneHeight').value) / 100;
  const maEnabled  = document.getElementById('vs-maEnabled').classList.contains('on');
  const maPeriod   = parseInt(document.getElementById('vs-maPeriod').value);
  const maColor    = document.getElementById('vs-maColor').value;

  if (!maPeriod || maPeriod < 2 || maPeriod > 500) {
    const el = document.getElementById('vs-maPeriod');
    el.style.borderColor = '#f43f5e';
    setTimeout(() => el.style.borderColor = '', 1000);
    return;
  }

  VOL_CFG.upColor    = upColor;
  VOL_CFG.downColor  = downColor;
  VOL_CFG.opacity    = opacity;
  VOL_CFG.paneHeight = paneHeight;
  VOL_CFG.maEnabled  = maEnabled;
  VOL_CFG.maPeriod   = maPeriod;
  VOL_CFG.maColor    = maColor;

  if (_volMASeries) _volMASeries.applyOptions({ color: maColor, visible: volumeVisible && maEnabled });
  if (typeof candles !== 'undefined' && candles.length) setVolumeData(candles);
  if (typeof _recalcSubPaneMargins === 'function') _recalcSubPaneMargins();
  if (typeof saveSettings === 'function') saveSettings();
  if (typeof toast === 'function') toast('Volume settings updated', 'success');
  closeVolumeSettings();
}

function resetVolumeSettings() {
  document.getElementById('vs-upColor').value             = '#10b981';
  document.getElementById('vs-downColor').value           = '#f43f5e';
  document.getElementById('vs-opacity').value             = 40;
  document.getElementById('vs-opacityVal').textContent    = '40%';
  document.getElementById('vs-paneHeight').value          = 18;
  document.getElementById('vs-paneHeightVal').textContent = '18%';
  document.getElementById('vs-maEnabled').classList.remove('on');
  document.getElementById('vs-maPeriod').value            = 20;
  document.getElementById('vs-maColor').value             = '#f59e0b';
  _syncVolMARowVisibility();
  applyVolumeSettings();
}

function _syncVolMARowVisibility() {
  const row = document.getElementById('vs-maRow');
  if (row) row.style.display = document.getElementById('vs-maEnabled').classList.contains('on') ? 'flex' : 'none';
}

// ── UI ────────────────────────────────────────────────────────────────
function _applyVolToggleUI() {
  if (typeof _syncIndToggles === 'function') _syncIndToggles();
}

// Called by stochrsi.js _recalcSubPaneMargins to read current pane height
function getVolPaneHeight() { return VOL_CFG.paneHeight; }