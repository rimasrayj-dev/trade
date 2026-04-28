// ── SOUNDS — Web Audio API synth sounds ──
// No external files — all sounds are synthesised in real time.
// Depends on: nothing (self-contained). Load after ui.js.

// ── Audio context (lazy init on first user interaction) ───────────────
let _audioCtx     = null;
let _soundEnabled = JSON.parse(localStorage.getItem('apex_sound') ?? 'true');
let _masterGain   = parseFloat(localStorage.getItem('apex_volume') ?? '0.5');

function _getCtx() {
  if (!_soundEnabled) return null;
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function _masterGainNode(ctx) {
  const g = ctx.createGain();
  g.gain.value = _masterGain;
  g.connect(ctx.destination);
  return g;
}

// ── Public setters — called by the Settings panel ─────────────────────
function setSoundEnabled(val) {
  _soundEnabled = !!val;
  localStorage.setItem('apex_sound', JSON.stringify(_soundEnabled));
}
function setSoundVolume(val) {
  _masterGain = Math.max(0, Math.min(1, val));
  localStorage.setItem('apex_volume', String(_masterGain));
}
function getSoundEnabled() { return _soundEnabled; }
function getSoundVolume()  { return _masterGain; }

// ── Core oscillator helper ────────────────────────────────────────────
function _osc(ctx, dest, type, freq, gainVal, startTime) {
  const gainNode = ctx.createGain();
  gainNode.gain.value = gainVal;
  gainNode.connect(dest);
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gainNode);
  osc.start(startTime ?? ctx.currentTime);
  return { osc, gain: gainNode };
}

// ── BUY ORDER — rising C major chord + click transient ───────────────
function soundBuy() {
  const ctx = _getCtx(); if (!ctx) return;
  const master = _masterGainNode(ctx);
  const t = ctx.currentTime;
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const { osc, gain } = _osc(ctx, master, 'sine', freq, 0.28, t + i * 0.04);
    gain.gain.setValueAtTime(0.28, t + i * 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.55);
    osc.stop(t + i * 0.04 + 0.56);
  });
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.02), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const cg = ctx.createGain(); cg.gain.value = 0.12;
  src.connect(cg); cg.connect(master); src.start(t);
}

// ── SELL ORDER — falling minor chord ─────────────────────────────────
function soundSell() {
  const ctx = _getCtx(); if (!ctx) return;
  const master = _masterGainNode(ctx);
  const t = ctx.currentTime;
  [783.99, 622.25, 493.88].forEach((freq, i) => {
    const { osc, gain } = _osc(ctx, master, 'sine', freq, 0.25, t + i * 0.05);
    gain.gain.setValueAtTime(0.25, t + i * 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.5);
    osc.stop(t + i * 0.05 + 0.56);
  });
}

// ── PROFIT CLOSE — triumphant ascending arpeggio ─────────────────────
function soundProfit() {
  const ctx = _getCtx(); if (!ctx) return;
  const master = _masterGainNode(ctx);
  const t = ctx.currentTime;
  [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
    const { osc, gain } = _osc(ctx, master, 'sine', freq, 0.22, t + i * 0.07);
    gain.gain.setValueAtTime(0.22, t + i * 0.07);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.45);
    osc.stop(t + i * 0.07 + 0.5);
  });
}

// ── LOSS CLOSE — low muted descend ───────────────────────────────────
function soundLoss() {
  const ctx = _getCtx(); if (!ctx) return;
  const master = _masterGainNode(ctx);
  const t = ctx.currentTime;
  [329.63, 277.18, 246.94].forEach((freq, i) => {
    const { osc, gain } = _osc(ctx, master, 'triangle', freq, 0.20, t + i * 0.09);
    gain.gain.setValueAtTime(0.20, t + i * 0.09);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.09 + 0.6);
    osc.stop(t + i * 0.09 + 0.65);
  });
}

// ── INFO TOAST — soft rising ping ────────────────────────────────────
function soundInfo() {
  const ctx = _getCtx(); if (!ctx) return;
  const master = _masterGainNode(ctx);
  const t = ctx.currentTime;
  const { osc, gain } = _osc(ctx, master, 'sine', 880, 0.15, t);
  osc.frequency.setValueAtTime(880, t);
  osc.frequency.exponentialRampToValueAtTime(1100, t + 0.06);
  gain.gain.setValueAtTime(0.15, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
  osc.stop(t + 0.3);
}

// ── ERROR TOAST — triple sawtooth buzz ───────────────────────────────
function soundError() {
  const ctx = _getCtx(); if (!ctx) return;
  const master = _masterGainNode(ctx);
  const t = ctx.currentTime;
  [0, 0.08, 0.16].forEach(offset => {
    const { osc, gain } = _osc(ctx, master, 'sawtooth', 180, 0.14, t + offset);
    gain.gain.setValueAtTime(0.14, t + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.07);
    osc.stop(t + offset + 0.08);
  });
}

// ── RESET ACCOUNT — descending 8-bit game-over ───────────────────────
function soundReset() {
  const ctx = _getCtx(); if (!ctx) return;
  const master = _masterGainNode(ctx);
  const t = ctx.currentTime;
  [659.25, 587.33, 523.25, 392.00].forEach((freq, i) => {
    const { osc, gain } = _osc(ctx, master, 'square', freq, 0.10, t + i * 0.10);
    gain.gain.setValueAtTime(0.10, t + i * 0.10);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.10 + 0.09);
    osc.stop(t + i * 0.10 + 0.10);
  });
}

// ── HOOK INTO EXISTING FUNCTIONS ──────────────────────────────────────
let _suppressToastSound = false;

function _hookSounds() {
  const _origToast = window.toast;
  window.toast = function(msg, type = 'info') {
    _origToast.apply(this, arguments);
    if (_suppressToastSound) return;
    if (type === 'error') soundError();
    else soundInfo();
  };

  const _origPlaceOrder = window.placeOrder;
  window.placeOrder = function() {
    const side = S.side;
    _suppressToastSound = true;
    _origPlaceOrder.apply(this, arguments);
    _suppressToastSound = false;
    const wasCleared = (document.getElementById('amt')?.value === '');
    if (wasCleared) {
      if (side === 'buy') soundBuy();
      else soundSell();
    }
  };

  const _origClosePOS = window.closePOS;
  window.closePOS = function(id) {
    const pos = S.positions.find(p => p.id === id);
    let pnl = null;
    if (pos) pnl = (prices[pos.sym] - pos.entry) * pos.size;
    _suppressToastSound = true;
    _origClosePOS.apply(this, arguments);
    _suppressToastSound = false;
    if (pnl !== null) {
      if (pnl >= 0) soundProfit();
      else soundLoss();
    }
  };

  const _origReset = window.resetAcc;
  window.resetAcc = function() {
    const _origConfirm = window.confirm;
    let confirmed = false;
    window.confirm = function(msg) {
      confirmed = _origConfirm(msg);
      window.confirm = _origConfirm;
      return confirmed;
    };
    _suppressToastSound = true;
    _origReset.apply(this, arguments);
    _suppressToastSound = false;
    if (confirmed) soundReset();
  };
}

// ── Bootstrap ─────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _hookSounds);
} else {
  _hookSounds();
}