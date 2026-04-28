// ── STOCHASTIC RSI INDICATOR ──
// %K (cyan) · %D (red) in a virtual sub-pane.
//
// Two drag interactions:
//   1. Divider bar  — drag up/down to resize the pane height
//   2. Axis overlay — drag up to zoom in (narrow range), down to zoom out
//      Double-click axis to reset zoom to 0–100
//
// LW Charts v4 cannot expose a visible custom price scale, so we:
//   • keep 'stochrsi' scale hidden (it still places the series)
//   • drive apparent zoom by adjusting scaleMargins top/bottom within
//     the sub-pane slot, mapping _srMin/_srMax → extra margin offsets
//   • paint our own axis overlay with the correct tick labels
//
// Depends on: lwChart, candles[] (chart.js)
//             volumeVisible, volumeSeries (volume.js)

// ── State ─────────────────────────────────────────────────────────────
let stochRsiVisible = false;
let stochKSeries    = null;
let stochDSeries    = null;

let _stochFrac = 0.22;      // sub-pane height fraction of chart (resize handle)
let _dragging  = false;

// Visible value range — default full 0–100
let _srMin = 0;
let _srMax = 100;

const STOCH_RSI = { rsiPeriod: 14, stochPeriod: 14, kSmooth: 3, dSmooth: 3 };
const AXIS_W    = 65;   // must cover LW Charts' right axis column

// ── CSS ───────────────────────────────────────────────────────────────
function _injectStochStyles() {
  if (document.getElementById('stochrsi-styles')) return;
  const s = document.createElement('style');
  s.id = 'stochrsi-styles';
  s.textContent = `
    #stochrsi-divider {
      position: absolute; left: 0; right: 0; height: 8px;
      cursor: ns-resize; z-index: 22;
      display: flex; align-items: center; justify-content: center;
      background: transparent; user-select: none; touch-action: none;
    }
    .stochrsi-handle {
      width: 36px; height: 3px; border-radius: 2px;
      background: rgba(255,255,255,0.14);
      transition: background .15s, width .15s;
      pointer-events: none;
    }
    #stochrsi-divider:hover .stochrsi-handle,
    #stochrsi-divider.sr-dragging .stochrsi-handle {
      background: rgba(0,212,255,0.55); width: 56px;
    }
    #stochrsi-divider::before {
      content: '';
      position: absolute; left: 0; right: 0; top: 3px;
      height: 1px; background: rgba(255,255,255,0.08);
      pointer-events: none;
    }
    #stochrsi-vol-sep {
      position: absolute; left: 0; right: 0; height: 1px;
      background: rgba(255,255,255,0.08);
      pointer-events: none; z-index: 20;
    }
    /* Axis overlay — solid bg hides coin price labels underneath */
    #stochrsi-axis {
      position: absolute; right: 0; width: ${AXIS_W}px;
      z-index: 21;
      background: #060912;
      border-left: 1px solid rgba(255,255,255,0.045);
      box-sizing: border-box;
      cursor: ns-resize;
      user-select: none; touch-action: none;
      overflow: hidden;
    }
    #stochrsi-axis:hover {
      background: #08101f;
    }
    #stochrsi-axis.sr-scale-drag {
      background: #08101f;
      border-left-color: rgba(0,212,255,0.25);
    }
    .sr-axis-tick {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 10px; color: #4a5568;
      text-align: right; line-height: 1;
      user-select: none; pointer-events: none;
    }
    /* Reset hint on double-click */
    #stochrsi-axis-hint {
      position: absolute; right: ${AXIS_W + 4}px;
      font-size: 9px; font-family: 'IBM Plex Mono', monospace;
      color: rgba(0,212,255,0.55); pointer-events: none;
      z-index: 22; user-select: none;
      opacity: 0; transition: opacity .3s;
      white-space: nowrap;
    }
    #stochrsi-axis-hint.show { opacity: 1; }
    #stochrsi-neutral-zone {
      pointer-events: none; z-index: 6;
      background: rgba(255,255,255,0.028);
      border-top: 1px solid rgba(255,255,255,0.07);
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }
    #stochrsi-pane-label {
      position: absolute; left: 8px;
      font-size: 9px; font-family: 'IBM Plex Mono', monospace;
      font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase;
      color: rgba(0,212,255,0.4);
      pointer-events: none; z-index: 21; user-select: none;
    }
  `;
  document.head.appendChild(s);
}

// ── Init ──────────────────────────────────────────────────────────────
function initStochRSIIndicator() {
  if (!lwChart || stochKSeries) return;
  _injectStochStyles();

  stochKSeries = lwChart.addLineSeries({
    color: '#00d4ff', lineWidth: 1.5,
    priceScaleId: 'stochrsi',
    priceLineVisible: false, lastValueVisible: false,
    crosshairMarkerVisible: true, crosshairMarkerRadius: 3,
    visible: stochRsiVisible,
  });
  stochDSeries = lwChart.addLineSeries({
    color: '#f43f5e', lineWidth: 1.5,
    priceScaleId: 'stochrsi',
    priceLineVisible: false, lastValueVisible: false,
    crosshairMarkerVisible: true, crosshairMarkerRadius: 3,
    visible: stochRsiVisible,
  });

  stochKSeries.createPriceLine({ price: 80, color: 'rgba(244,63,94,0.30)',    lineWidth: 1, lineStyle: LightweightCharts.LineStyle.Dashed, axisLabelVisible: false });
  stochKSeries.createPriceLine({ price: 50, color: 'rgba(255,255,255,0.35)', lineWidth: 1, lineStyle: LightweightCharts.LineStyle.Dashed, axisLabelVisible: false });
  stochKSeries.createPriceLine({ price: 20, color: 'rgba(16,185,129,0.30)',  lineWidth: 1, lineStyle: LightweightCharts.LineStyle.Dashed, axisLabelVisible: false });

  lwChart.priceScale('stochrsi').applyOptions({ scaleMargins: { top: 0.80, bottom: 0 }, visible: false });

  lwChart.subscribeCrosshairMove(param => {
    if (!stochRsiVisible || !param || !param.time) return;
    const kVal = param.seriesData?.get(stochKSeries);
    const dVal = param.seriesData?.get(stochDSeries);
    _updateStochLabel(kVal?.value ?? null, dVal?.value ?? null);
  });

  window.addEventListener('resize', () => { if (stochRsiVisible) _updateOverlayPositions(); });
}

// ── Push data ─────────────────────────────────────────────────────────
function setStochRSIData(candles) {
  if (!stochKSeries || !stochDSeries || !stochRsiVisible || !candles.length) return;
  const closes = candles.map(c => c.c);
  const { k, d } = _buildStochRSI(closes, STOCH_RSI);
  const kData = [], dData = [];
  candles.forEach((c, i) => {
    const t = Math.floor(c.t / 1000);
    if (k[i] !== null) kData.push({ time: t, value: k[i] });
    if (d[i] !== null) dData.push({ time: t, value: d[i] });
  });
  stochKSeries.setData(kData);
  stochDSeries.setData(dData);
  _updateStochLabel(kData.at(-1)?.value ?? null, dData.at(-1)?.value ?? null);
  // setData resets LW Charts scale margins — re-apply after pushing data
  if (typeof _recalcSubPaneMargins === 'function') _recalcSubPaneMargins();
}

// ── Live tick — update only the last point without full setData ───────
function updateStochRSITick() {
  if (!stochKSeries || !stochDSeries || !stochRsiVisible || !candles.length) return;

  const { rsiPeriod, stochPeriod, kSmooth, dSmooth } = STOCH_RSI;
  const minBars = rsiPeriod + stochPeriod + kSmooth + dSmooth;
  if (candles.length < minBars) return;

  // Use full history for correct Wilder RSI warmup — only push the last value.
  const closes = candles.map(c => c.c);
  const { k, d } = _buildStochRSI(closes, STOCH_RSI);

  const last = candles[candles.length - 1];
  const t    = Math.floor(last.t / 1000);
  const kVal = k[k.length - 1];
  const dVal = d[d.length - 1];

  if (kVal !== null && kVal !== undefined) stochKSeries.update({ time: t, value: kVal });
  if (dVal !== null && dVal !== undefined) stochDSeries.update({ time: t, value: dVal });

  _updateStochLabel(kVal ?? null, dVal ?? null);
}

// ── Toggle ────────────────────────────────────────────────────────────
function toggleStochRSI() {
  stochRsiVisible = !stochRsiVisible;
  if (stochKSeries) stochKSeries.applyOptions({ visible: stochRsiVisible });
  if (stochDSeries) stochDSeries.applyOptions({ visible: stochRsiVisible });

  if (stochRsiVisible) {
    if (typeof candles !== 'undefined' && candles.length) setStochRSIData(candles);
    _createDivider();
    _createAxisOverlay();
    _createPaneLabel();
  } else {
    _removeDivider();
    _removeAxisOverlay();
    _removePaneLabel();
    const nz = document.getElementById('stochrsi-neutral-zone');
    if (nz) nz.remove();
    const sep = document.getElementById('stochrsi-vol-sep');
    if (sep) sep.remove();
  }

  _renderStochLabelSeg();
  _recalcSubPaneMargins();
  if (typeof _syncIndToggles === 'function') _syncIndToggles();
}

// ── Scale zoom helpers ────────────────────────────────────────────────
// LW Charts places the 'stochrsi' series in the bottom _stochFrac of
// the chart. Within that slot, scaleMargins top/bottom control how much
// of the slot the data fills — we abuse this to fake range zoom.
//
// Given _srMin/_srMax (e.g. 20–80 when zoomed in), we calculate extra
// top/bottom padding as fractions of the sub-pane slot so that:
//   value=_srMax maps to the top of the pane
//   value=_srMin maps to the bottom
//
// Formula: extraTop  = (_srMax - 100) / (_srMin - _srMax)  [clamped ≥0]
//          extraBot  = _srMin          / (_srMax - _srMin)  [clamped ≥0]
// These add empty space above/below the data region.

function _applyScaleZoom() {
  if (!lwChart) return;
  const range = _srMax - _srMin;
  if (range <= 0) return;

  const sf        = _stochFrac;
  const SLOT_TOP  = 1 - sf;
  const INNER_PAD = 0.04;

  const hiddenTop = (100 - _srMax) / 100;
  const hiddenBot = _srMin         / 100;

  let topMargin = SLOT_TOP + hiddenTop * sf;
  let botMargin =            hiddenBot * sf;

  topMargin = Math.min(topMargin, 1 - INNER_PAD);
  topMargin = Math.max(topMargin, SLOT_TOP);
  botMargin = Math.min(botMargin, sf - INNER_PAD);
  botMargin = Math.max(botMargin, 0);

  if (topMargin + botMargin > 1 - INNER_PAD) {
    const excess = (topMargin + botMargin) - (1 - INNER_PAD);
    topMargin -= excess / 2;
    botMargin -= excess / 2;
    topMargin = Math.max(topMargin, SLOT_TOP);
    botMargin = Math.max(botMargin, 0);
  }

  lwChart.priceScale('stochrsi').applyOptions({
    scaleMargins: { top: topMargin, bottom: botMargin },
  });

  // Use rAF so LW Charts finishes its layout before we call priceToCoordinate
  requestAnimationFrame(_updateAxisTicks);
}



// Rebuild tick labels + live value pills using LW Charts' actual coordinate mapping.
function _updateAxisTicks() {
  const axis = document.getElementById('stochrsi-axis');
  if (!axis) return;
  axis.innerHTML = '';

  const range = _srMax - _srMin;
  if (range <= 0) return;

  const step  = _niceStep(range / 4);
  const first = Math.ceil(_srMin / step) * step;
  const ticks = [];
  for (let v = first; v <= _srMax + 0.001; v = Math.round((v + step) * 1e6) / 1e6) {
    ticks.push(Math.round(v));
  }
  if (!ticks.includes(Math.round(_srMin))) ticks.unshift(Math.round(_srMin));
  if (!ticks.includes(Math.round(_srMax))) ticks.push(Math.round(_srMax));

  // paneTop: pixel offset of sub-pane top within #cw
  const cw = document.getElementById('cw');
  const paneTop = cw ? Math.round(cw.clientHeight * (1 - _stochFrac)) : 0;

  ticks.forEach(v => {
    let absY = null;
    try { absY = stochKSeries ? stochKSeries.priceToCoordinate(v) : null; } catch(_){}
    if (absY === null || absY === undefined) return;
    const y = absY - paneTop;  // relative to axis/pane top
    const el = document.createElement('div');
    el.className = 'sr-axis-tick';
    el.style.cssText = `position:absolute;right:6px;top:${y}px;transform:translateY(-50%)`;
    el.textContent = v;
    if      (v >= 79 && v <= 81) el.style.color = 'rgba(244,63,94,0.65)';
    else if (v >= 19 && v <= 21) el.style.color = 'rgba(16,185,129,0.65)';
    else if (v >= 49 && v <= 51) el.style.color = 'rgba(255,255,255,0.22)';
    axis.appendChild(el);
  });

  _renderLiveValuePills(axis, paneTop);
  _updateNeutralZone();
}

// Coloured pill labels for current %K / %D on the axis overlay.
let _lastKVal = null;
let _lastDVal = null;

function _renderLiveValuePills(axis, paneTop) {
  [
    [_lastKVal, '#00d4ff', 'rgba(0,212,255,0.25)',  'rgba(0,212,255,0.6)' ],
    [_lastDVal, '#f59e0b', 'rgba(245,158,11,0.25)', 'rgba(245,158,11,0.6)'],
  ].forEach(([val, color, bg, border]) => {
    if (val === null || val === undefined) return;
    let absY = null;
    try { absY = stochKSeries ? stochKSeries.priceToCoordinate(val) : null; } catch(_){}
    if (absY === null) return;
    const y = absY - paneTop;
    const pill = document.createElement('div');
    pill.style.cssText = [
      'position:absolute', 'right:0', `top:${y}px`,
      'transform:translateY(-50%)',
      `background:${bg}`, `border:1px solid ${border}`,
      `color:${color}`, "font-family:'IBM Plex Mono',monospace",
      'font-size:10px', 'font-weight:700',
      'padding:1px 5px', 'border-radius:3px',
      'pointer-events:none', 'white-space:nowrap', 'z-index:2',
      'box-shadow:0 1px 4px rgba(0,0,0,0.4)',
      'line-height:16px',
    ].join(';');
    pill.textContent = val.toFixed(2);
    axis.appendChild(pill);
  });
}

// Neutral zone band (20–80) — positioned by asking LW Charts for actual pixel coords.
function _updateNeutralZone() {
  const existing = document.getElementById('stochrsi-neutral-zone');
  if (!stochRsiVisible) { if (existing) existing.remove(); return; }

  const cw = document.getElementById('cw');
  if (!cw) return;

  const band80 = Math.min(80, _srMax);
  const band20 = Math.max(20, _srMin);
  if (band20 >= band80) { if (existing) existing.style.display = 'none'; return; }

  // stochKSeries.priceToCoordinate returns the Y pixel (from chart top) that LW
  // Charts actually uses to draw that value — guaranteed to match the lines.
  let yTop = null, yBot = null;
  try { yTop = stochKSeries ? stochKSeries.priceToCoordinate(band80) : null; } catch(_){}
  try { yBot = stochKSeries ? stochKSeries.priceToCoordinate(band20) : null; } catch(_){}
  if (yTop === null || yBot === null || yBot <= yTop) {
    if (existing) existing.style.display = 'none';
    return;
  }

  let zone = existing;
  if (!zone) {
    zone = document.createElement('div');
    zone.id = 'stochrsi-neutral-zone';
    cw.appendChild(zone);
  }
  zone.style.display  = 'block';
  zone.style.position = 'absolute';
  zone.style.left     = '0';
  zone.style.right    = AXIS_W + 'px';
  zone.style.top      = Math.round(yTop) + 'px';
  zone.style.height   = Math.max(1, Math.round(yBot - yTop)) + 'px';
}

function _niceStep(rawStep) {
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / magnitude;
  if (norm < 1.5) return magnitude;
  if (norm < 3.5) return 2 * magnitude;
  if (norm < 7.5) return 5 * magnitude;
  return 10 * magnitude;
}

// ── Sub-pane margin coordinator ───────────────────────────────────────
function _recalcSubPaneMargins() {
  if (!lwChart) return;
  const hasVol   = typeof volumeVisible !== 'undefined' && volumeVisible;
  const hasStoch = stochRsiVisible;
  const sf = _stochFrac;
  // Volume pane height — read from VOL_CFG so it respects user settings.
  // Cap vf so candles always get at least 20% of the chart.
  const _vfRaw = typeof getVolPaneHeight === 'function' ? getVolPaneHeight() : 0.18;
  const vf = Math.min(_vfRaw, Math.max(0.06, 1 - 0.08 - 0.20 - sf));

  if (hasVol && hasStoch) {
    // Three dedicated panes: Candles | Volume (vf) | StochRSI (sf)
    lwChart.priceScale('right').applyOptions({ scaleMargins: { top: 0.08, bottom: sf + vf } });
    // Volume fills the vf-wide band immediately above the stochRSI slot.
    if (typeof volumeSeries !== 'undefined' && volumeSeries)
      lwChart.priceScale('vol').applyOptions({ scaleMargins: { top: 1 - sf - vf, bottom: sf } });
  } else if (hasStoch) {
    lwChart.priceScale('right').applyOptions({ scaleMargins: { top: 0.08, bottom: sf } });
  } else if (hasVol) {
    lwChart.priceScale('right').applyOptions({ scaleMargins: { top: 0.08, bottom: 0.22 } });
    if (typeof volumeSeries !== 'undefined' && volumeSeries)
      lwChart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
  } else {
    lwChart.priceScale('right').applyOptions({ scaleMargins: { top: 0.08, bottom: 0.22 } });
  }

  _applyScaleZoom();   // sets stochrsi margins taking zoom into account
  _updateOverlayPositions();
}

// ── Axis overlay + scale-drag ─────────────────────────────────────────
function _createAxisOverlay() {
  _removeAxisOverlay();
  const cw = document.getElementById('cw');
  if (!cw) return;

  const axis = document.createElement('div');
  axis.id = 'stochrsi-axis';

  // Initial ticks rendered by _updateAxisTicks after append
  cw.appendChild(axis);

  // ── Scale drag on axis ──────────────────────────────────────────────
  // Drag up   → zoom in  (range shrinks, centre stays)
  // Drag down → zoom out (range expands toward 0–100)
  let _axisDragStartY  = 0;
  let _axisDragStartMin = 0;
  let _axisDragStartMax = 0;
  let _axisScaleDragging = false;

  const onAxisDragMove = e => {
    if (!_axisScaleDragging) return;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dy = clientY - _axisDragStartY;   // +ve = dragged down = zoom out

    // Each pixel = 0.5 units of range change (tune to taste)
    const delta = dy * 0.5;
    const centre = (_axisDragStartMin + _axisDragStartMax) / 2;
    const halfRange = (_axisDragStartMax - _axisDragStartMin) / 2;

    // MIN_HALF: smallest half-range allowed. Must ensure the data stays
    // inside the sub-pane after _applyScaleZoom clamps margins.
    // With a 2% MIN_STRIP and sf~0.22, the narrowest safe range is ~10 units.
    const MIN_HALF = 10;
    let newHalf = Math.max(MIN_HALF, Math.min(55, halfRange + delta));
    _srMin = Math.max(0,   centre - newHalf);
    _srMax = Math.min(100, centre + newHalf);
    _applyScaleZoom();
  };

  const onAxisDragEnd = () => {
    _axisScaleDragging = false;
    axis.classList.remove('sr-scale-drag');
    window.removeEventListener('mousemove', onAxisDragMove);
    window.removeEventListener('mouseup',   onAxisDragEnd);
    axis.removeEventListener('touchmove',   onAxisDragMove);
    axis.removeEventListener('touchend',    onAxisDragEnd);
  };

  axis.addEventListener('mousedown', e => {
    e.preventDefault();
    _axisScaleDragging = true;
    _axisDragStartY    = e.clientY;
    _axisDragStartMin  = _srMin;
    _axisDragStartMax  = _srMax;
    axis.classList.add('sr-scale-drag');
    window.addEventListener('mousemove', onAxisDragMove);
    window.addEventListener('mouseup',   onAxisDragEnd);
  });

  axis.addEventListener('touchstart', e => {
    e.preventDefault();
    _axisScaleDragging = true;
    _axisDragStartY    = e.touches[0].clientY;
    _axisDragStartMin  = _srMin;
    _axisDragStartMax  = _srMax;
    axis.addEventListener('touchmove', onAxisDragMove, { passive: false });
    axis.addEventListener('touchend',  onAxisDragEnd);
  }, { passive: false });

  // Double-click resets to full 0–100
  axis.addEventListener('dblclick', () => {
    _srMin = 0; _srMax = 100;
    _applyScaleZoom();
    _showAxisHint('Reset to 0 – 100');
  });

  _updateOverlayPositions();
  _updateAxisTicks();
}

function _removeAxisOverlay() {
  const el = document.getElementById('stochrsi-axis');
  if (el) el.remove();
  const hint = document.getElementById('stochrsi-axis-hint');
  if (hint) hint.remove();
}

function _showAxisHint(msg) {
  let hint = document.getElementById('stochrsi-axis-hint');
  const cw = document.getElementById('cw');
  if (!hint && cw) {
    hint = document.createElement('div');
    hint.id = 'stochrsi-axis-hint';
    cw.appendChild(hint);
  }
  if (!hint) return;
  const paneTop = Math.round(cw.clientHeight * (1 - _stochFrac));
  hint.style.top = (paneTop + 8) + 'px';
  hint.textContent = msg;
  hint.classList.add('show');
  setTimeout(() => hint.classList.remove('show'), 1400);
}

function _updateOverlayPositions() {
  const cw = document.getElementById('cw');
  if (!cw) return;
  const h       = cw.clientHeight;
  const paneTop = Math.round(h * (1 - _stochFrac));
  const paneH   = h - paneTop;

  const axis = document.getElementById('stochrsi-axis');
  if (axis) { axis.style.top = paneTop + 'px'; axis.style.height = paneH + 'px'; }

  const div = document.getElementById('stochrsi-divider');
  if (div) div.style.top = (paneTop - 4) + 'px';

  const lbl = document.getElementById('stochrsi-pane-label');
  if (lbl) lbl.style.top = (paneTop + 6) + 'px';

  const hint = document.getElementById('stochrsi-axis-hint');
  if (hint) hint.style.top = (paneTop + 8) + 'px';

  // Separator between volume and StochRSI (only when both visible)
  const hasVol = typeof volumeVisible !== 'undefined' && volumeVisible;
  let sep = document.getElementById('stochrsi-vol-sep');
  if (hasVol) {
    if (!sep) {
      sep = document.createElement('div');
      sep.id = 'stochrsi-vol-sep';
      const cw2 = document.getElementById('cw');
      if (cw2) cw2.appendChild(sep);
    }
    if (sep) sep.style.top = paneTop + 'px';
  } else {
    if (sep) sep.remove();
  }

  _updateNeutralZone(paneH);
}

// ── Pane label ────────────────────────────────────────────────────────
function _createPaneLabel() {
  _removePaneLabel();
  const cw = document.getElementById('cw');
  if (!cw) return;
  const lbl = document.createElement('div');
  lbl.id = 'stochrsi-pane-label';
  lbl.textContent = 'Stoch RSI';
  cw.appendChild(lbl);
  _updateOverlayPositions();
}
function _removePaneLabel() {
  const el = document.getElementById('stochrsi-pane-label');
  if (el) el.remove();
}

// ── Resize-pane divider ───────────────────────────────────────────────
function _createDivider() {
  const cw = document.getElementById('cw');
  if (!cw) return;
  _removeDivider();

  const div = document.createElement('div');
  div.id = 'stochrsi-divider';
  div.innerHTML = '<div class="stochrsi-handle"></div>';

  div.addEventListener('mousedown', e => {
    e.preventDefault();
    _dragging = true;
    div.classList.add('sr-dragging');
    const onMove = e => {
      if (!_dragging) return;
      const rect = cw.getBoundingClientRect();
      _stochFrac = 1 - (e.clientY - rect.top) / rect.height;
      _stochFrac = Math.max(0.12, Math.min(0.55, _stochFrac));
      _recalcSubPaneMargins();
    };
    const onUp = () => {
      _dragging = false;
      div.classList.remove('sr-dragging');
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  });

  div.addEventListener('touchstart', e => {
    e.preventDefault();
    _dragging = true;
    const onMove = e => {
      const rect = cw.getBoundingClientRect();
      _stochFrac = 1 - (e.touches[0].clientY - rect.top) / rect.height;
      _stochFrac = Math.max(0.12, Math.min(0.55, _stochFrac));
      _recalcSubPaneMargins();
    };
    const onEnd = () => {
      _dragging = false;
      div.removeEventListener('touchmove', onMove);
      div.removeEventListener('touchend', onEnd);
    };
    div.addEventListener('touchmove', onMove, { passive: false });
    div.addEventListener('touchend', onEnd);
  }, { passive: false });

  cw.appendChild(div);
  _updateOverlayPositions();
}
function _removeDivider() {
  const el = document.getElementById('stochrsi-divider');
  if (el) el.remove();
}

// ── MA-bar label segment ──────────────────────────────────────────────
function _renderStochLabelSeg() {
  const existing = document.getElementById('stochrsi-seg');
  if (!stochRsiVisible) { if (existing) existing.remove(); return; }
  if (existing) return;
  const bar = document.getElementById('ma-bar');
  if (!bar) return;
  const seg = document.createElement('div');
  seg.id = 'stochrsi-seg';
  seg.className = 'ma-seg';
  seg.innerHTML =
    `<div class="ma-line" style="background:#00d4ff"></div>` +
    `<span style="color:#00d4ff;font-size:10px">%K</span>` +
    `<span id="stochrsi-k" style="color:#00d4ff;font-size:10px;margin-left:2px"></span>` +
    `<span style="color:var(--t3);font-size:10px;margin-left:5px">%D</span>` +
    `<span id="stochrsi-d" style="color:#f43f5e;font-size:10px;margin-left:2px"></span>`;
  bar.appendChild(seg);
}

function _updateStochLabel(kVal, dVal) {
  const kEl = document.getElementById('stochrsi-k');
  const dEl = document.getElementById('stochrsi-d');
  if (kEl) kEl.textContent = kVal !== null ? kVal.toFixed(2) : '';
  if (dEl) dEl.textContent = dVal !== null ? dVal.toFixed(2) : '';
  // Keep cached values so axis pills stay current
  if (kVal !== null) _lastKVal = kVal;
  if (dVal !== null) _lastDVal = dVal;
  _updateAxisTicks();
}

// ── Math: RSI (Wilder smoothing — seeds from bar 1) ───────────────────
// Starts from the very first bar diff so the output covers the full candle
// range — the same approach TradingView uses.  Values stabilise after
// roughly rsiPeriod bars; earlier values are approximate but visible.
function _calcRSI(closes, period) {
  const out = new Array(closes.length).fill(null);
  if (closes.length < 2) return out;
  const alpha = 1 / period;   // Wilder factor
  const d0 = closes[1] - closes[0];
  let ag = Math.max(d0, 0);
  let al = Math.max(-d0, 0);
  out[1] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  for (let i = 2; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    ag = ag * (1 - alpha) + Math.max(d, 0) * alpha;
    al = al * (1 - alpha) + Math.max(-d, 0) * alpha;
    out[i] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  }
  return out;
}

// ── Math: progressive SMA ─────────────────────────────────────────────
// Equivalent to a standard SMA once a full window is available; before
// that, averages however many non-null values are present so the output
// begins from the very first non-null input rather than waiting n bars.
function _srSMA(arr, n) {
  return arr.map((_, i) => {
    const start = Math.max(0, i - n + 1);
    const sl = arr.slice(start, i + 1).filter(v => v !== null);
    if (!sl.length) return null;
    return sl.reduce((a, b) => a + b, 0) / sl.length;
  });
}

// ── Math: Stochastic RSI ──────────────────────────────────────────────
// Uses a progressive Stoch window so rawK starts as soon as the first
// RSI value is available (bar 1), matching TradingView behaviour.
function _buildStochRSI(closes, { rsiPeriod, stochPeriod, kSmooth, dSmooth }) {
  const rsi  = _calcRSI(closes, rsiPeriod);
  const rawK = new Array(closes.length).fill(null);
  for (let i = 1; i < closes.length; i++) {
    if (rsi[i] === null) continue;
    // Allow a partial Stoch window at the very start
    const start = Math.max(1, i - stochPeriod + 1);
    const sl = [];
    for (let j = start; j <= i; j++) {
      if (rsi[j] !== null) sl.push(rsi[j]);
    }
    if (!sl.length) continue;
    const lo = Math.min(...sl), hi = Math.max(...sl);
    rawK[i] = hi === lo ? 50 : ((rsi[i] - lo) / (hi - lo)) * 100;
  }
  const k = _srSMA(rawK, kSmooth);
  const d = _srSMA(k,    dSmooth);
  return { k, d };
}