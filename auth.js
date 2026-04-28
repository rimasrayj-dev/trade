// ── AUTH — Simple login gate ──
// Two hardcoded accounts. Blocks all app functionality until login.
// Session storage: tab-only (default) or localStorage when "Remember me" is checked.

(function () {
  const ACCOUNTS = {
    'Merv':    'ChickenKebab',
    'Andrius': 'Doubleevery6weeks',
  };

  const SESSION_KEY   = 'apex_authed_user';
  const REMEMBER_KEY  = 'apex_remember_user';   // persisted across browser restarts

  // ── Resolve active session ───────────────────────────────────────────
  // Check sessionStorage first (tab session), then localStorage (remembered).
  function _getStoredUser() {
    return sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(REMEMBER_KEY) || null;
  }

  // ── Attempt login (on window so inline onclick can reach it) ─────────
  window._apexAttemptLogin = function () {
    const rawUser  = (document.getElementById('apex-login-user')?.value || '').trim();
    const pass     = document.getElementById('apex-login-pass')?.value || '';
    const remember = document.getElementById('apex-login-remember')?.checked || false;
    const errEl    = document.getElementById('apex-login-err');

    // Match username case-insensitively, then resolve to canonical casing
    const matchedKey = Object.keys(ACCOUNTS).find(k => k.toLowerCase() === rawUser.toLowerCase());
    const user = matchedKey || rawUser;

    if (matchedKey && ACCOUNTS[matchedKey] === pass) {
      // Always write to sessionStorage (tab session)
      sessionStorage.setItem(SESSION_KEY, user);

      // Also write to localStorage when "Remember me" is checked
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, user);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }

      const overlay = document.getElementById('apex-login-overlay');
      if (overlay) {
        overlay.style.transition = 'opacity .35s';
        overlay.style.opacity    = '0';
        setTimeout(() => overlay.remove(), 380);
      }
      document.documentElement.style.overflow = '';
      _setLoggedInUI(user, remember);
      
      // ── LOAD AND RENDER TRADES AFTER LOGIN ──────────────────────────
      _loadUserData();
      // ────────────────────────────────────────────────────────────────
      
    } else {
      if (errEl) errEl.style.display = 'block';
      const passEl = document.getElementById('apex-login-pass');
      if (passEl) { passEl.value = ''; passEl.focus(); }
      const card = document.querySelector('#apex-login-overlay > div');
      if (card) {
        card.style.animation = 'none';
        requestAnimationFrame(() => { card.style.animation = 'apexShake .35s ease'; });
      }
    }
  };

  // ── Post-login UI: user pill + logout button ─────────────────────────
  function _setLoggedInUI(username, remembered) {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const navR = document.querySelector('.nav-r');
      if (!navR || document.getElementById('apex-logout-btn')) {
        if (attempts > 40) clearInterval(interval);
        return;
      }
      clearInterval(interval);

      // ── Combined username + logout button ─────────────────────────
      const logoutBtn = document.createElement('button');
      logoutBtn.id        = 'apex-logout-btn';
      logoutBtn.className = 'nbtn';
      logoutBtn.title     = 'Sign out' + (remembered ? ' (also clears remembered login)' : '');
      logoutBtn.innerHTML = `<span style="font-family:'IBM Plex Mono',monospace;font-weight:700;font-size:12px;color:#00d4ff;letter-spacing:.5px">${username}</span>${remembered ? `<span style="font-size:9px;color:#f43f5e;margin-left:6px">✓ Remembered</span>` : ''}`;
      logoutBtn.style.cssText = 'display:inline-flex!important;align-items:center;gap:5px;border-color:rgba(0,212,255,0.2);background:rgba(0,212,255,0.06)';
      logoutBtn.onmouseover = () => { logoutBtn.style.setProperty('background','rgba(244,63,94,0.12)'); logoutBtn.style.setProperty('border-color','rgba(244,63,94,0.35)'); };
      logoutBtn.onmouseout  = () => { logoutBtn.style.setProperty('background','rgba(0,212,255,0.06)'); logoutBtn.style.setProperty('border-color','rgba(0,212,255,0.2)'); };
      logoutBtn.onclick = () => {
        sessionStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(REMEMBER_KEY);
        location.reload();
      };

      navR.appendChild(logoutBtn);

      // Show mobile bottom-nav logout tab
      const mobLogout = document.getElementById('mobTab-logout');
      if (mobLogout) mobLogout.style.display = 'flex';
    }, 100);
  }

  // ── Inject shake keyframe ────────────────────────────────────────────
  function _injectStyles() {
    const s = document.createElement('style');
    s.textContent = `
      @keyframes apexShake {
        0%,100% { transform: translateX(0); }
        20%      { transform: translateX(-7px); }
        40%      { transform: translateX(7px); }
        60%      { transform: translateX(-5px); }
        80%      { transform: translateX(5px); }
      }
      #apex-login-remember-row {
        display:flex;align-items:center;gap:9px;
        margin-bottom:20px;cursor:pointer;user-select:none;
      }
      #apex-login-remember {
        appearance:none;-webkit-appearance:none;
        width:16px;height:16px;border-radius:4px;flex-shrink:0;
        border:1px solid rgba(255,255,255,0.18);
        background:rgba(0,0,0,0.35);cursor:pointer;
        transition:background .18s,border-color .18s;position:relative;
      }
      #apex-login-remember:checked {
        background:rgba(0,212,255,0.25);
        border-color:rgba(0,212,255,0.55);
      }
      /* Auth elements — always visible, override mobile hide rules */
      #apex-user-pill { display: flex !important; }
      #apex-logout-btn { display: inline-flex !important; }
      #apex-login-remember:checked::after {
        content:'✓';position:absolute;inset:0;
        display:flex;align-items:center;justify-content:center;
        font-size:10px;color:#00d4ff;font-weight:700;line-height:1;
      }
      #apex-login-remember-lbl {
        font-size:11px;color:#4a5568;cursor:pointer;transition:color .15s;
        font-family:'IBM Plex Mono',monospace;
      }
      #apex-login-remember-row:hover #apex-login-remember-lbl { color:#94a3b8; }
    `;
    document.head.appendChild(s);
  }

  // ── Show login overlay ───────────────────────────────────────────────
  function _showLoginOverlay() {
    document.documentElement.style.overflow = 'hidden';

    // Pre-fill username if remembered
    const rememberedUser = localStorage.getItem(REMEMBER_KEY);

    const overlay = document.createElement('div');
    overlay.id = 'apex-login-overlay';
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:99999',
      'display:flex', 'align-items:center', 'justify-content:center',
      'background:#03050d',
      "font-family:'IBM Plex Mono',monospace",
    ].join(';');

    overlay.innerHTML = `
      <div style="
        width:340px;
        background:rgba(10,14,28,0.98);
        border:1px solid rgba(255,255,255,0.13);
        border-radius:14px;
        padding:32px 28px 28px;
        box-shadow:0 24px 64px rgba(0,0,0,0.8);
        backdrop-filter:blur(24px);
        text-align:center;
      ">
        <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:24px">
          <div style="
            width:36px;height:36px;border-radius:10px;
            background:linear-gradient(135deg,#00d4ff,#a78bfa);
            display:flex;align-items:center;justify-content:center;
            font-size:17px;font-weight:800;color:#000;
            box-shadow:0 0 22px rgba(0,212,255,0.3);
          ">A</div>
          <div style="text-align:left">
            <div style="font-size:16px;font-weight:700;letter-spacing:2.5px;color:#eef2ff">APEX</div>
            <div style="font-size:9px;color:#4a5568;letter-spacing:1.5px;text-transform:uppercase;margin-top:1px">Paper Trading</div>
          </div>
        </div>

        <div style="font-size:11px;color:#4a5568;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:20px">Sign In</div>

        <div style="margin-bottom:12px;text-align:left">
          <div style="font-size:9px;color:#4a5568;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:6px">Username</div>
          <input id="apex-login-user" type="text" autocomplete="username" placeholder="Enter username"
            value="${rememberedUser ? rememberedUser : ''}"
            style="width:100%;padding:10px 13px;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.09);border-radius:7px;color:#eef2ff;font-family:'IBM Plex Mono',monospace;font-size:11px;outline:none;transition:border-color .18s"
            onfocus="this.style.borderColor='rgba(0,212,255,0.4)'"
            onblur="this.style.borderColor='rgba(255,255,255,0.09)'"
            onkeydown="if(event.key==='Enter')document.getElementById('apex-login-pass').focus()">
        </div>

        <div style="margin-bottom:16px;text-align:left">
          <div style="font-size:9px;color:#4a5568;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:6px">Password</div>
          <input id="apex-login-pass" type="password" autocomplete="current-password" placeholder="Enter password"
            style="width:100%;padding:10px 13px;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.09);border-radius:7px;color:#eef2ff;font-family:'IBM Plex Mono',monospace;font-size:11px;outline:none;transition:border-color .18s"
            onfocus="this.style.borderColor='rgba(0,212,255,0.4)'"
            onblur="this.style.borderColor='rgba(255,255,255,0.09)'"
            onkeydown="if(event.key==='Enter')_apexAttemptLogin()">
        </div>

        <!-- Remember me row -->
        <label id="apex-login-remember-row">
          <input id="apex-login-remember" type="checkbox" ${rememberedUser ? 'checked' : ''}>
          <span id="apex-login-remember-lbl">Remember me on this device</span>
        </label>

        <div id="apex-login-err" style="display:none;margin-bottom:14px;padding:8px 12px;background:rgba(244,63,94,0.1);border:1px solid rgba(244,63,94,0.28);border-radius:6px;color:#f43f5e;font-size:11px;font-family:inherit">
          Incorrect username or password
        </div>

        <button onclick="_apexAttemptLogin()" style="
          width:100%;padding:12px;
          background:linear-gradient(135deg,rgba(0,212,255,0.18),rgba(167,139,250,0.18));
          border:1px solid rgba(0,212,255,0.38);border-radius:8px;
          color:#00d4ff;font-family:'IBM Plex Mono',monospace;
          font-size:13px;font-weight:600;letter-spacing:.8px;
          cursor:pointer;transition:all .2s;
        "
        onmouseover="this.style.background='linear-gradient(135deg,rgba(0,212,255,0.28),rgba(167,139,250,0.28))'"
        onmouseout="this.style.background='linear-gradient(135deg,rgba(0,212,255,0.18),rgba(167,139,250,0.18))'">
          SIGN IN →
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    // Focus password if username is pre-filled, otherwise focus username
    setTimeout(() => {
      const uEl = document.getElementById('apex-login-user');
      const pEl = document.getElementById('apex-login-pass');
      if (rememberedUser && uEl && uEl.value) {
        if (pEl) pEl.focus();
      } else {
        if (uEl) uEl.focus();
      }
    }, 80);
  }

  // ── Load settings and render trades after authentication ────────────
  function _loadUserData() {
    if (typeof loadSettings === 'function') {
      loadSettings();
    }
    if (typeof _renderRestoredTrades === 'function') {
      _renderRestoredTrades();
    }
  }

  // ── Bootstrap — wait for body to exist ──────────────────────────────
  function _init() {
    _injectStyles();
    const storedUser = _getStoredUser();
    if (storedUser) {
      // Restore session storage in case it was a remembered localStorage login
      sessionStorage.setItem(SESSION_KEY, storedUser);
      const wasRemembered = !!localStorage.getItem(REMEMBER_KEY);
      _setLoggedInUI(storedUser, wasRemembered);
      
      // ── LOAD AND RENDER TRADES ON PAGE LOAD ──────────────────────────
      _loadUserData();
      // ────────────────────────────────────────────────────────────────
      
    } else {
      _showLoginOverlay();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }

})();