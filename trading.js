// ── TRADING ──
// Depends on: S, PAIRS, prices, fp(), fu(), toast(), renderPos(), renderHist(), updateHdr()

// ── ORDER FORM ──
function setSide(s) {
  S.side = s;
  document.getElementById('buyBtn').className = 'bsb buy' + (s === 'buy' ? ' on' : '');
  document.getElementById('sellBtn').className = 'bsb sell' + (s === 'sell' ? ' on' : '');
  const p = PAIRS.find(x => x.sym === S.pair), btn = document.getElementById('placeBtn');
  btn.className = `pob ${s}`; btn.textContent = (s === 'buy' ? 'BUY ' : 'SELL ') + p.base;
}

function setOT(el, t) {
  S.otype = t;
  document.querySelectorAll('.otb').forEach(b => b.classList.remove('on'));
  el.classList.add('on');
  document.getElementById('lpf').style.display = t !== 'market' ? 'flex' : 'none';
  document.getElementById('sPrice').textContent = t === 'market' ? 'Market' : '—';
}

function slPct(p) {
  document.getElementById('psl').value = p;
  const pr = prices[S.pair];
  if (S.side === 'buy') {
    document.getElementById('amt').value = (S.bal * p / 100 / pr).toFixed(6);
  } else {
    const pos = S.positions.find(x => x.sym === S.pair);
    document.getElementById('amt').value = pos ? (pos.size * p / 100).toFixed(6) : '';
  }
  calcT();
}

function calcT() {
  const a = parseFloat(document.getElementById('amt').value) || 0, pr = prices[S.pair];
  const t = a * pr, fee = t * .001;
  document.getElementById('sTotal').textContent = fu(t);
  document.getElementById('sFee').textContent = fu(fee);
  document.getElementById('sPrice').textContent = S.otype === 'market' ? 'Market' : '$' + fp(pr);
}

function placeOrder() {
  const a = parseFloat(document.getElementById('amt').value);
  if (!a || a <= 0) { toast('Enter a valid amount', 'error'); return; }
  const pr = prices[S.pair], t = a * pr, fee = t * .001;
  if (S.side === 'buy') {
    if (t + fee > S.bal) { toast('Insufficient balance', 'error'); return; }
    S.bal -= (t + fee);
    const ex = S.positions.find(p => p.sym === S.pair);
    if (ex) { const ns = ex.size + a; ex.entry = (ex.entry * ex.size + pr * a) / ns; ex.size = ns; }
    else S.positions.push({ sym: S.pair, size: a, entry: pr, id: Date.now() });
    const p = PAIRS.find(x => x.sym === S.pair);
    toast(`Bought ${a.toFixed(5)} ${p.base} @ $${fp(pr)}`, 'success');
    S.history.unshift({ time: new Date().toLocaleTimeString(), pair: S.pair, side: 'BUY', price: pr, amt: a, total: t, fee, pnl: null });
  } else {
    const pos = S.positions.find(p => p.sym === S.pair);
    if (!pos || pos.size < a) { toast('Insufficient position', 'error'); return; }
    const pnl = (pr - pos.entry) * a - fee; S.bal += t - fee; pos.size -= a;
    if (pos.size < 1e-6) S.positions = S.positions.filter(p => p !== pos);
    S.history.unshift({ time: new Date().toLocaleTimeString(), pair: S.pair, side: 'SELL', price: pr, amt: a, total: t, fee, pnl });
    toast(`${pnl >= 0 ? 'Profit' : 'Loss'}: ${pnl >= 0 ? '+' : ''}${fu(pnl)}`, pnl >= 0 ? 'success' : 'error');
  }
  document.getElementById('amt').value = ''; document.getElementById('psl').value = 0; calcT();
  renderPos(); renderHist(); updateHdr();
  saveSettings();
  
  // ✅ CRITICAL FIX: Switch to Trade History tab to show the new trade immediately
  _switchToHistoryTab();
}

// ── POSITIONS ──
function renderPos() {
  const tb = document.getElementById('posTb');
  document.getElementById('posBdg').textContent = S.positions.length;
  if (!S.positions.length) { tb.innerHTML = '<tr class="empty"><td colspan="9">No open positions · Place a trade to get started</td></tr>'; return; }
  tb.innerHTML = S.positions.map(p => {
    const mk = prices[p.sym], pnl = (mk - p.entry) * p.size, roe = ((mk - p.entry) / p.entry * 100), val = mk * p.size;
    return `<tr><td style="font-weight:600">${p.sym}</td><td><span class="chip long">LONG</span></td><td>${p.size.toFixed(5)}</td><td style="color:var(--t2)">$${fp(p.entry)}</td><td>$${fp(mk)}</td><td class="${pnl >= 0 ? 'up' : 'dn'}">${pnl >= 0 ? '+' : ''}${fu(pnl)}</td><td class="${roe >= 0 ? 'up' : 'dn'}">${roe >= 0 ? '+' : ''}${roe.toFixed(2)}%</td><td>${fu(val)}</td><td><button class="abt" onclick="closePOS(${p.id})">Close</button></td></tr>`;
  }).join('');
}

function closePOS(id) {
  const pos = S.positions.find(p => p.id === id); if (!pos) return;
  const pr = prices[pos.sym], t = pr * pos.size, fee = t * .001, pnl = (pr - pos.entry) * pos.size - fee;
  S.bal += t - fee;
  S.history.unshift({ time: new Date().toLocaleTimeString(), pair: pos.sym, side: 'SELL', price: pr, amt: pos.size, total: t, fee, pnl });
  S.positions = S.positions.filter(p => p.id !== id);
  toast(`Closed: ${pnl >= 0 ? '+' : ''}${fu(pnl)} PnL`, pnl >= 0 ? 'success' : 'error');
  renderPos(); renderHist(); updateHdr();
  saveSettings();
  
  // ✅ CRITICAL FIX: Switch to Trade History tab to show the closed trade immediately
  _switchToHistoryTab();
}

// ── TRADE HISTORY ──
function renderHist() {
  const tb = document.getElementById('histTb');
  if (!S.history.length) { tb.innerHTML = '<tr class="empty"><td colspan="8">No trade history yet</td></tr>'; return; }
  tb.innerHTML = S.history.slice(0, 60).map(h =>
    `<tr><td class="dim">${h.time}</td><td style="font-weight:600">${h.pair}</td><td><span class="chip ${h.side === 'BUY' ? 'buy' : 'sell'}">${h.side}</span></td><td>$${fp(h.price)}</td><td>${h.amt.toFixed(5)}</td><td>${fu(h.total)}</td><td class="dim">${fu(h.fee)}</td><td class="${h.pnl == null ? 'dim' : h.pnl >= 0 ? 'up' : 'dn'}">${h.pnl == null ? '—' : (h.pnl >= 0 ? '+' : '') + fu(h.pnl)}</td></tr>`
  ).join('');
}

// ── HELPER: Switch to History Tab ──────────────────────────────────────
function _switchToHistoryTab() {
  // Remove 'on' class from all bottom tabs and panels
  document.querySelectorAll('.bt').forEach(t => t.classList.remove('on'));
  document.querySelectorAll('.bc').forEach(c => c.classList.remove('on'));
  
  // Add 'on' class to Trade History tab and panel
  const histBtn = Array.from(document.querySelectorAll('.bt')).find(btn => btn.textContent.includes('Trade History'));
  const histPanel = document.getElementById('histTab');
  
  if (histBtn) histBtn.classList.add('on');
  if (histPanel) histPanel.classList.add('on');
}