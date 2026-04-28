// ── DATA TRANSFER — Export & Import ──────────────────────────────────
// Depends on: S, saveSettings(), toast(), renderPos(), renderHist(), updateHdr()
// Add <script src="data_transfer.js"></script> after trading.js in index.html
// Add the toolbar HTML to the histTab panel in index.html (see patch instructions)

const APEX_VERSION = '1.0';

// ─────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────

function exportTradeData() {
  try {
    const payload = {
      _meta: {
        app:       'APEX Paper Trader',
        version:   APEX_VERSION,
        exportedAt: new Date().toISOString(),
        exportedBy: _getActiveUser ? _getActiveUser() : 'guest',
      },
      account: {
        bal:      S.bal,
        startBal: S.startBal,
      },
      positions: S.positions.map(p => ({ ...p })),
      history:   S.history.map(h => ({ ...h })),
      settings: {
        pair:  S.pair,
        side:  S.side,
        otype: S.otype,
      },
    };

    const json    = JSON.stringify(payload, null, 2);
    const blob    = new Blob([json], { type: 'application/json' });
    const url     = URL.createObjectURL(blob);
    const user    = _getActiveUser ? _getActiveUser() : 'guest';
    const link    = document.createElement('a');
    link.href     = url;
    link.download = `apex_${user}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const count = payload.history.length;
    toast(`Exported ${count} trade${count !== 1 ? 's' : ''} + ${payload.positions.length} position${payload.positions.length !== 1 ? 's' : ''}`, 'success');
  } catch (e) {
    console.error('exportTradeData failed', e);
    toast('Export failed — see console', 'error');
  }
}

// ─────────────────────────────────────────────────────────────────────
// IMPORT — triggers file picker, then calls _processImport
// ─────────────────────────────────────────────────────────────────────

function importTradeData() {
  const input      = document.createElement('input');
  input.type       = 'file';
  input.accept     = '.json,application/json';
  input.onchange   = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload  = ev => _processImport(ev.target.result, file.name);
    reader.onerror = ()  => toast('Could not read file', 'error');
    reader.readAsText(file);
  };
  input.click();
}

// ─────────────────────────────────────────────────────────────────────
// PROCESS — validate, merge, apply
// ─────────────────────────────────────────────────────────────────────

function _processImport(raw, filename) {
  // ── Parse ──────────────────────────────────────────────────────────
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (_) {
    toast('Invalid file — not valid JSON', 'error');
    return;
  }

  // ── Basic validation ───────────────────────────────────────────────
  if (!payload || typeof payload !== 'object') {
    toast('Invalid file structure', 'error');
    return;
  }
  if (!payload._meta || payload._meta.app !== 'APEX Paper Trader') {
    toast('File was not exported from APEX — aborting', 'error');
    return;
  }
  if (!Array.isArray(payload.history)) {
    toast('File missing trade history array', 'error');
    return;
  }

  // ── Schema validation for trades ──────────────────────────────────
  const REQUIRED_HIST  = ['time', 'pair', 'side', 'price', 'amt', 'total', 'fee'];
  const REQUIRED_POS   = ['sym', 'size', 'entry', 'id'];

  const validHist = payload.history.filter(h =>
    h && typeof h === 'object' && REQUIRED_HIST.every(k => k in h)
  );
  const validPos  = Array.isArray(payload.positions)
    ? payload.positions.filter(p =>
        p && typeof p === 'object' && REQUIRED_POS.every(k => k in p)
      )
    : [];

  const skippedHist = payload.history.length - validHist.length;
  const skippedPos  = (Array.isArray(payload.positions) ? payload.positions.length : 0) - validPos.length;

  if (validHist.length === 0 && validPos.length === 0) {
    toast('No valid trades or positions found in file', 'error');
    return;
  }

  // ── Merge ──────────────────────────────────────────────────────────
  // History: deduplicate by (time + pair + side + price) composite key
  const existingKeys = new Set(
    S.history.map(h => `${h.time}|${h.pair}|${h.side}|${h.price}`)
  );
  const newHist = validHist.filter(
    h => !existingKeys.has(`${h.time}|${h.pair}|${h.side}|${h.price}`)
  );

  // Positions: merge by sym — imported wins if sym already open
  const existingSyms = new Set(S.positions.map(p => p.sym));
  const newPos        = validPos.filter(p => !existingSyms.has(p.sym));
  const updatedPos    = validPos.filter(p =>  existingSyms.has(p.sym));

  // Apply history (new entries prepended, then sorted newest-first by id/index)
  S.history = [...newHist, ...S.history].slice(0, 500);

  // Apply positions
  updatedPos.forEach(imp => {
    const ex = S.positions.find(p => p.sym === imp.sym);
    if (ex) { ex.entry = imp.entry; ex.size = imp.size; }
  });
  S.positions.push(...newPos);

  // Apply account balances only if file has them and we have no history yet
  if (payload.account && typeof payload.account.bal === 'number') {
    if (S.history.length === newHist.length) {          // was empty before import
      S.bal      = payload.account.bal;
      S.startBal = payload.account.startBal ?? payload.account.bal;
    }
  }

  // ── Persist & re-render ────────────────────────────────────────────
  saveSettings();
  renderPos();
  renderHist();
  if (typeof updateHdr === 'function') updateHdr();

  // ── Report ─────────────────────────────────────────────────────────
  const parts = [];
  if (newHist.length)    parts.push(`${newHist.length} new trade${newHist.length !== 1 ? 's' : ''}`);
  if (updatedPos.length) parts.push(`${updatedPos.length} position${updatedPos.length !== 1 ? 's' : ''} updated`);
  if (newPos.length)     parts.push(`${newPos.length} position${newPos.length !== 1 ? 's' : ''} added`);

  const skips = [];
  if (skippedHist) skips.push(`${skippedHist} invalid trade${skippedHist !== 1 ? 's' : ''} skipped`);
  if (skippedPos)  skips.push(`${skippedPos} invalid position${skippedPos !== 1 ? 's' : ''} skipped`);

  if (parts.length) {
    toast('Imported: ' + parts.join(', '), 'success');
  }
  if (skips.length) {
    setTimeout(() => toast(skips.join(', '), 'error'), 600);
  }
  if (!parts.length && !skips.length) {
    toast('Nothing new to import — all trades already exist', 'success');
  }

  // ── Switch to Trade History tab ────────────────────────────────────
  if (typeof _switchToHistoryTab === 'function') {
    _switchToHistoryTab();
  }
}