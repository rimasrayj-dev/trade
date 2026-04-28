// ── SETTINGS PERSISTENCE ──
// Saves and restores all user preferences to localStorage.
// All keys are prefixed with the logged-in username so each user's
// data is fully isolated (e.g. apex_Merv_account, apex_Andrius_account).
//
// On first run after this update, any existing unprefixed legacy keys
// (apex_account, apex_pair, etc.) are migrated to the current user's
// prefixed keys, then the legacy keys are removed.

// ── Auth key constants (must match auth.js) ───────────────────────────
const _AUTH_SESSION_KEY  = 'apex_authed_user';
const _AUTH_REMEMBER_KEY = 'apex_remember_user';

// ── Resolve the active username ───────────────────────────────────────
function _getActiveUser() {
  return sessionStorage.getItem(_AUTH_SESSION_KEY)
      || localStorage.getItem(_AUTH_REMEMBER_KEY)
      || 'guest';
}

// ── Legacy (unprefixed) key names for one-time migration ──────────────
const _LEGACY_KEYS = {
  pair:         'apex_pair',
  tf:           'apex_tf',
  maLines:      'apex_ma_lines',
  maVisible:    'apex_ma_visible',
  volVisible:   'apex_vol_visible',
  stochVisible: 'apex_stoch_visible',
  stochCfg:     'apex_stoch_cfg',
  volCfg:       'apex_vol_cfg',
  account:      'apex_account',
};

// ── Build per-user key map ────────────────────────────────────────────
function _makeKeys(username) {
  const u = username || _getActiveUser();
  const p = `apex_${u}_`;
  return {
    pair:         p + 'pair',
    tf:           p + 'tf',
    maLines:      p + 'ma_lines',
    maVisible:    p + 'ma_visible',
    volVisible:   p + 'vol_visible',
    stochVisible: p + 'stoch_visible',
    stochCfg:     p + 'stoch_cfg',
    volCfg:       p + 'vol_cfg',
    account:      p + 'account',
    migrated:     p + 'migrated_v1',  // sentinel: migration already done for this user
  };
}

// Lazy getter — always reflects whoever is currently logged in
function _keys() { return _makeKeys(); }

// ── One-time migration of legacy unprefixed keys ──────────────────────
// Runs once per user (guarded by a sentinel key).
// Copies any existing legacy data into this user's own namespace,
// then removes the shared legacy keys so they can't bleed into
// whichever user logs in next.
function _migrateLegacyKeys() {
  const K = _keys();
  if (localStorage.getItem(K.migrated)) return; // already done for this user

  let didMigrate = false;
  Object.entries(_LEGACY_KEYS).forEach(([name, legacyKey]) => {
    const val = localStorage.getItem(legacyKey);
    if (val !== null) {
      // Only copy if the user doesn't already have their own value
      if (localStorage.getItem(K[name]) === null) {
        localStorage.setItem(K[name], val);
      }
      didMigrate = true;
    }
  });

  // Mark migration done for this user
  localStorage.setItem(K.migrated, '1');

  // Remove the shared legacy keys immediately so the next user
  // doesn't inherit this user's data.
  if (didMigrate) {
    Object.values(_LEGACY_KEYS).forEach(k => localStorage.removeItem(k));
  }
}

// ── Save helpers ──────────────────────────────────────────────────────
function saveSettings() {
  try {
    const K = _keys();

    // Pair & TF
    localStorage.setItem(K.pair, S.pair);
    localStorage.setItem(K.tf,   currentTF);

    // MA lines — strip the non-serialisable `series` ref
    if (typeof maLines !== 'undefined') {
      const slim = maLines.map(({ id, period, color, type }) => ({ id, period, color, type }));
      localStorage.setItem(K.maLines, JSON.stringify(slim));
    }

    // Toggle states
    if (typeof maVisible       !== 'undefined') localStorage.setItem(K.maVisible,    JSON.stringify(maVisible));
    if (typeof volumeVisible   !== 'undefined') localStorage.setItem(K.volVisible,   JSON.stringify(volumeVisible));
    if (typeof stochRsiVisible !== 'undefined') localStorage.setItem(K.stochVisible, JSON.stringify(stochRsiVisible));

    // StochRSI config
    if (typeof STOCH_RSI !== 'undefined') {
      localStorage.setItem(K.stochCfg, JSON.stringify(STOCH_RSI));
    }

    // Volume config
    if (typeof VOL_CFG !== 'undefined') {
      localStorage.setItem(K.volCfg, JSON.stringify(VOL_CFG));
    }

    // Account state — THIS IS THE CRITICAL PART FOR TRADES
    localStorage.setItem(K.account, JSON.stringify({
      bal:       S.bal,
      startBal:  S.startBal,
      positions: S.positions,
      history:   S.history.slice(0, 200),
    }));

  } catch(e) {
    console.warn('saveSettings failed', e);
  }
}

// ── Load helpers ──────────────────────────────────────────────────────
function loadSettings() {
  try {
    // Migrate legacy unprefixed keys before reading anything
    _migrateLegacyKeys();

    const K = _keys();

    // ── Pair ──────────────────────────────────────────────────────────
    const savedPair = localStorage.getItem(K.pair);
    if (savedPair) S.pair = savedPair;

    // ── Timeframe ─────────────────────────────────────────────────────
    const savedTF = localStorage.getItem(K.tf);
    if (savedTF) {
      currentTF = savedTF;
      document.querySelectorAll('.tfb').forEach(b => {
        b.classList.toggle('on', b.textContent.trim() === savedTF);
      });
    }

    // ── MA lines ──────────────────────────────────────────────────────
    const savedMA = localStorage.getItem(K.maLines);
    if (savedMA) {
      const parsed = JSON.parse(savedMA);
      if (Array.isArray(parsed) && parsed.length) {
        maLines   = parsed.map(m => ({ id: m.id, period: m.period, color: m.color, type: m.type }));
        _maNextId = Math.max(...maLines.map(m => m.id)) + 1;
      }
    }

    // ── MA visible ────────────────────────────────────────────────────
    const savedMAVis = localStorage.getItem(K.maVisible);
    if (savedMAVis !== null) maVisible = JSON.parse(savedMAVis);

    // ── Volume visible ────────────────────────────────────────────────
    const savedVolVis = localStorage.getItem(K.volVisible);
    if (savedVolVis !== null) volumeVisible = JSON.parse(savedVolVis);

    // ── StochRSI visible ──────────────────────────────────────────────
    const savedStochVis = localStorage.getItem(K.stochVisible);
    if (savedStochVis !== null) _pendingStochVisible = JSON.parse(savedStochVis);

    // ── StochRSI config ───────────────────────────────────────────────
    const savedStochCfg = localStorage.getItem(K.stochCfg);
    if (savedStochCfg) {
      const cfg = JSON.parse(savedStochCfg);
      Object.assign(STOCH_RSI, cfg);
      _syncStochRSIInputs();
    }

    // ── Volume config ─────────────────────────────────────────────────
    const savedVolCfg = localStorage.getItem(K.volCfg);
    if (savedVolCfg && typeof VOL_CFG !== 'undefined') {
      Object.assign(VOL_CFG, JSON.parse(savedVolCfg));
    }

    // ── Account state — RESTORE TRADES HERE ───────────────────────────
    const savedAccount = localStorage.getItem(K.account);
    if (savedAccount) {
      const acc = JSON.parse(savedAccount);
      if (typeof acc.bal      === 'number') S.bal       = acc.bal;
      if (typeof acc.startBal === 'number') S.startBal  = acc.startBal;
      if (Array.isArray(acc.positions))     S.positions = acc.positions;
      if (Array.isArray(acc.history))       S.history   = acc.history;
    }

  } catch(e) {
    console.warn('loadSettings failed', e);
  }
}

// ── DEFERRED RENDER AFTER LOAD ────────────────────────────────────────
// Call this AFTER all UI functions are defined to render restored trades
function _renderRestoredTrades() {
  if (typeof renderPos === 'function') renderPos();
  if (typeof renderHist === 'function') renderHist();
  if (typeof updateHdr === 'function') updateHdr();
}

// ── StochRSI deferred restore ─────────────────────────────────────────
let _pendingStochVisible = false;

function _restoreStochRSIVisibility() {
  if (_pendingStochVisible && typeof toggleStochRSI === 'function') {
    toggleStochRSI();
  }
}

// ── Sync StochRSI settings panel inputs with current STOCH_RSI values ─
function _syncStochRSIInputs() {
  const fields = {
    'sr-rsiPeriod':   'rsiPeriod',
    'sr-stochPeriod': 'stochPeriod',
    'sr-kSmooth':     'kSmooth',
    'sr-dSmooth':     'dSmooth',
    'sr-kColor':      '_kColor',
    'sr-dColor':      '_dColor',
  };
  Object.entries(fields).forEach(([elId, key]) => {
    const el = document.getElementById(elId);
    if (el && STOCH_RSI[key] !== undefined) el.value = STOCH_RSI[key];
  });
  const badge = document.getElementById('ind-stochrsi-params');
  if (badge) {
    badge.textContent = `${STOCH_RSI.rsiPeriod},${STOCH_RSI.stochPeriod},${STOCH_RSI.kSmooth},${STOCH_RSI.dSmooth}`;
  }
}

// ── Auto-save on any relevant change ─────────────────────────────────
function _wrapFn(name, after) {
  if (typeof window[name] !== 'function') return;
  const orig = window[name];
  window[name] = function(...args) {
    const result = orig.apply(this, args);
    after();
    return result;
  };
}

function _initAutoSave() {
  const savingFns = [
    'toggleMA', 'addMALine', 'removeMALine',
    'updateMAPeriod', 'updateMAColor', 'updateMAType',
    'toggleVolume',
    'toggleStochRSI', 'applyStochRSISettings', 'resetStochRSISettings',
    'applyVolumeSettings', 'resetVolumeSettings',
    'selPair',
    // Trading actions
    'placeOrder', 'closePOS', 'resetAcc',
    // Data transfer — save after import so state is immediately persisted
    'importTradeData',
  ];
  savingFns.forEach(fn => _wrapFn(fn, saveSettings));

  const origSetTF = window.setTF;
  if (origSetTF) {
    window.setTF = function(el) {
      origSetTF.call(this, el);
      saveSettings();
    };
  }
}