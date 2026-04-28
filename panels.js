// ── PANELS ──
// Injects all floating panel HTML into the document and owns their
// open / close / apply logic.
// Panels: Indicators, MA Settings, StochRSI Settings, Volume Settings.
// Depends on: state.js, ui.js, movingaverage.js, stochrsi.js, volume.js

// ── INJECT PANEL HTML ─────────────────────────────────────────────────
// Called once on DOMContentLoaded — keeps index.html free of panel markup.
function _injectPanels() {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `

  <!-- MA Settings Panel -->
  <div id="maSettingsPanel" onclick="event.stopPropagation()" style="display:none;position:fixed;z-index:1000;width:300px;
    flex-direction:column;gap:0;
    background:rgba(10,14,28,0.98);border:1px solid rgba(255,255,255,0.13);
    border-radius:10px;padding:14px 16px 16px;
    box-shadow:0 16px 48px rgba(0,0,0,0.7);backdrop-filter:blur(20px);
    font-family:'IBM Plex Mono',monospace;">

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <span style="font-size:11px;font-weight:600;color:#e2e8f0;letter-spacing:.8px;text-transform:uppercase">MA Lines</span>
      <div style="display:flex;gap:6px;align-items:center">
        <button onclick="toggleMA()"
          style="font-size:10px;padding:2px 9px;border-radius:4px;border:1px solid rgba(245,158,11,0.4);
                 background:rgba(245,158,11,0.12);color:#f59e0b;cursor:pointer;font-family:inherit;letter-spacing:.03em">
          Toggle All
        </button>
        <button onclick="openMASettings()"
          style="font-size:13px;line-height:1;padding:2px 8px;border-radius:4px;
                 border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.06);
                 color:#94a3b8;cursor:pointer;font-family:inherit">✕</button>
      </div>
    </div>

    <div id="maLinesList" style="max-height:220px;overflow-y:auto;margin-bottom:2px"></div>

    <div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.07)">
      <div style="font-size:9px;color:#4a5568;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:8px">Add New MA</div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
        <input type="color" id="maNewColor" value="#10b981"
          style="width:30px;height:30px;border:1px solid rgba(255,255,255,0.1);border-radius:5px;cursor:pointer;padding:2px;background:rgba(255,255,255,0.05);flex-shrink:0">
        <select id="maNewType"
          style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);border-radius:5px;
                 color:#e2e8f0;font-family:'IBM Plex Mono',monospace;font-size:11px;padding:6px 8px;outline:none;cursor:pointer;flex-shrink:0">
          <option value="SMA">SMA</option>
          <option value="EMA" selected>EMA</option>
          <option value="WMA">WMA</option>
        </select>
        <input type="number" id="maNewPeriod" placeholder="Period (1–500)" min="1" max="500"
          style="flex:1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);
                 border-radius:5px;color:#e2e8f0;font-family:'IBM Plex Mono',monospace;
                 font-size:11px;padding:6px 9px;outline:none;min-width:0"
          onkeydown="if(event.key==='Enter')addMALine()">
        <button onclick="addMALine()"
          style="background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.38);
                 color:#10b981;border-radius:5px;font-size:11px;padding:6px 11px;
                 cursor:pointer;font-family:inherit;white-space:nowrap;flex-shrink:0">+ Add</button>
      </div>
    </div>
  </div>

  <!-- Indicators Panel -->
  <div id="indicatorsPanel" onclick="event.stopPropagation()" style="display:none;position:fixed;z-index:1002;width:272px;
    flex-direction:column;gap:0;
    background:rgba(10,14,28,0.98);border:1px solid rgba(255,255,255,0.13);
    border-radius:10px;padding:14px 16px 14px;
    box-shadow:0 16px 48px rgba(0,0,0,0.7);backdrop-filter:blur(20px);
    font-family:'IBM Plex Mono',monospace;">

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:7px">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        <span style="font-size:11px;font-weight:600;color:#e2e8f0;letter-spacing:.8px;text-transform:uppercase">Indicators</span>
      </div>
      <button onclick="closeIndicatorsPanel()"
        style="font-size:13px;line-height:1;padding:2px 8px;border-radius:4px;
               border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.06);
               color:#94a3b8;cursor:pointer;font-family:inherit">✕</button>
    </div>

    <div class="ind-section-lbl" style="margin-top:0;border-top:none">Overlays</div>

    <div class="ind-row">
      <span class="ind-dot" style="background:#f59e0b"></span>
      <span class="ind-lbl">Moving Averages</span>
      <span id="ind-ma-count" style="font-size:9px;font-weight:700;background:rgba(245,158,11,0.15);
        color:#f59e0b;border:1px solid rgba(245,158,11,0.3);border-radius:8px;
        padding:1px 6px;font-family:'IBM Plex Mono',monospace;flex-shrink:0"></span>
      <button class="ind-cfg" onclick="openMASettings()" title="Configure MA lines">⚙</button>
      <button class="ind-tog on" id="ind-tog-ma" onclick="toggleMA();_syncIndToggles()" title="Toggle MA">
        <span class="ind-tog-knob"></span>
      </button>
    </div>

    <div class="ind-section-lbl">Sub-indicators</div>

    <div class="ind-row">
      <span class="ind-dot" style="background:#26a69a"></span>
      <span class="ind-lbl">Volume</span>
      <button class="ind-cfg" onclick="openVolumeSettings()" title="Configure Volume">⚙</button>
      <button class="ind-tog on" id="ind-tog-vol" onclick="toggleVolume();_syncIndToggles()" title="Toggle Volume">
        <span class="ind-tog-knob"></span>
      </button>
    </div>

    <div class="ind-row">
      <span class="ind-dot" style="background:#00d4ff"></span>
      <span class="ind-lbl">Stochastic RSI</span>
      <span id="ind-stochrsi-params" style="font-size:9px;color:#4a5568;font-family:'IBM Plex Mono',monospace;flex-shrink:0">14,14,3,3</span>
      <button class="ind-cfg" onclick="openStochRSISettings()" title="Configure Stoch RSI">⚙</button>
      <button class="ind-tog" id="ind-tog-stochrsi" onclick="toggleStochRSI()" title="Toggle StochRSI">
        <span class="ind-tog-knob"></span>
      </button>
    </div>
  </div>

  <!-- StochRSI Settings Panel -->
  <div id="stochRsiSettingsPanel" onclick="event.stopPropagation()" style="display:none;position:fixed;z-index:1003;width:288px;
    flex-direction:column;gap:0;
    background:rgba(10,14,28,0.98);border:1px solid rgba(255,255,255,0.13);
    border-radius:10px;padding:14px 16px 16px;
    box-shadow:0 16px 48px rgba(0,0,0,0.7);backdrop-filter:blur(20px);
    font-family:'IBM Plex Mono',monospace;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:7px">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        <span style="font-size:11px;font-weight:600;color:#e2e8f0;letter-spacing:.8px;text-transform:uppercase">Stoch RSI</span>
      </div>
      <button onclick="closeStochRSISettings()" style="font-size:13px;line-height:1;padding:2px 8px;border-radius:4px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.06);color:#94a3b8;cursor:pointer;font-family:inherit">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
      <div>
        <div style="font-size:9px;color:#4a5568;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:5px">RSI Period</div>
        <input type="number" id="sr-rsiPeriod" value="14" min="2" max="100" style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);border-radius:5px;color:#e2e8f0;font-family:'IBM Plex Mono',monospace;font-size:12px;padding:7px 9px;outline:none;box-sizing:border-box">
      </div>
      <div>
        <div style="font-size:9px;color:#4a5568;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:5px">Stoch Period</div>
        <input type="number" id="sr-stochPeriod" value="14" min="2" max="100" style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);border-radius:5px;color:#e2e8f0;font-family:'IBM Plex Mono',monospace;font-size:12px;padding:7px 9px;outline:none;box-sizing:border-box">
      </div>
      <div>
        <div style="font-size:9px;color:#4a5568;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:5px">%K Smooth</div>
        <input type="number" id="sr-kSmooth" value="3" min="1" max="50" style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);border-radius:5px;color:#e2e8f0;font-family:'IBM Plex Mono',monospace;font-size:12px;padding:7px 9px;outline:none;box-sizing:border-box">
      </div>
      <div>
        <div style="font-size:9px;color:#4a5568;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:5px">%D Smooth</div>
        <input type="number" id="sr-dSmooth" value="3" min="1" max="50" style="width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);border-radius:5px;color:#e2e8f0;font-family:'IBM Plex Mono',monospace;font-size:12px;padding:7px 9px;outline:none;box-sizing:border-box">
      </div>
    </div>
    <div style="padding-top:10px;border-top:1px solid rgba(255,255,255,0.07);margin-bottom:12px">
      <div style="font-size:9px;color:#4a5568;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:8px">Colours</div>
      <div style="display:flex;gap:12px;align-items:center">
        <div style="display:flex;align-items:center;gap:7px">
          <input type="color" id="sr-kColor" value="#00d4ff" style="width:28px;height:28px;border:1px solid rgba(255,255,255,0.12);border-radius:5px;cursor:pointer;padding:2px;background:rgba(255,255,255,0.05);flex-shrink:0">
          <span style="font-size:11px;color:#94a3b8">%K line</span>
        </div>
        <div style="display:flex;align-items:center;gap:7px">
          <input type="color" id="sr-dColor" value="#f43f5e" style="width:28px;height:28px;border:1px solid rgba(255,255,255,0.12);border-radius:5px;cursor:pointer;padding:2px;background:rgba(255,255,255,0.05);flex-shrink:0">
          <span style="font-size:11px;color:#94a3b8">%D line</span>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:8px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.07)">
      <button onclick="applyStochRSISettings()" style="flex:1;background:rgba(0,212,255,0.15);border:1px solid rgba(0,212,255,0.38);color:#00d4ff;border-radius:6px;font-size:11px;padding:8px;cursor:pointer;font-family:inherit;font-weight:600;letter-spacing:.4px">Apply</button>
      <button onclick="resetStochRSISettings()" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#4a5568;border-radius:6px;font-size:11px;padding:8px 12px;cursor:pointer;font-family:inherit">Reset</button>
    </div>
  </div>

  <!-- Volume Settings Panel -->
  <div id="volSettingsPanel" onclick="event.stopPropagation()" style="display:none;position:fixed;z-index:1003;width:292px;
    flex-direction:column;gap:0;
    background:rgba(10,14,28,0.98);border:1px solid rgba(255,255,255,0.13);
    border-radius:10px;padding:14px 16px 16px;
    box-shadow:0 16px 48px rgba(0,0,0,0.7);backdrop-filter:blur(20px);
    font-family:'IBM Plex Mono',monospace;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:7px">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#26a69a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="4" height="20" rx="1"/><rect x="10" y="8" width="4" height="14" rx="1"/><rect x="18" y="5" width="4" height="17" rx="1"/></svg>
        <span style="font-size:11px;font-weight:600;color:#e2e8f0;letter-spacing:.8px;text-transform:uppercase">Volume</span>
      </div>
      <button onclick="_cancelVolumeSettings()" style="font-size:13px;line-height:1;padding:2px 8px;border-radius:4px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.06);color:#94a3b8;cursor:pointer;font-family:inherit" title="Cancel — revert changes">✕</button>
    </div>
    <div style="padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.07);margin-bottom:12px">
      <div style="font-size:9px;color:#4a5568;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:8px">Bar Colours</div>
      <div style="display:flex;gap:16px;align-items:center">
        <div style="display:flex;align-items:center;gap:7px">
          <input type="color" id="vs-upColor" value="#10b981" oninput="_previewVolumeSettings()" style="width:28px;height:28px;border:1px solid rgba(255,255,255,0.12);border-radius:5px;cursor:pointer;padding:2px;background:rgba(255,255,255,0.05);flex-shrink:0">
          <span style="font-size:11px;color:#94a3b8">Bull</span>
        </div>
        <div style="display:flex;align-items:center;gap:7px">
          <input type="color" id="vs-downColor" value="#f43f5e" oninput="_previewVolumeSettings()" style="width:28px;height:28px;border:1px solid rgba(255,255,255,0.12);border-radius:5px;cursor:pointer;padding:2px;background:rgba(255,255,255,0.05);flex-shrink:0">
          <span style="font-size:11px;color:#94a3b8">Bear</span>
        </div>
      </div>
    </div>
    <div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div style="font-size:9px;color:#4a5568;text-transform:uppercase;letter-spacing:1.2px">Opacity</div>
        <span id="vs-opacityVal" style="font-size:10px;color:#94a3b8;font-family:'IBM Plex Mono',monospace">40%</span>
      </div>
      <input type="range" id="vs-opacity" min="5" max="100" value="40" step="1"
        oninput="document.getElementById('vs-opacityVal').textContent=this.value+'%';_previewVolumeSettings()"
        style="width:100%;accent-color:#26a69a">
    </div>
    <div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.07)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div style="font-size:9px;color:#4a5568;text-transform:uppercase;letter-spacing:1.2px">Pane Height</div>
        <span id="vs-paneHeightVal" style="font-size:10px;color:#94a3b8;font-family:'IBM Plex Mono',monospace">18%</span>
      </div>
      <input type="range" id="vs-paneHeight" min="8" max="40" value="18" step="1"
        oninput="document.getElementById('vs-paneHeightVal').textContent=this.value+'%';_previewVolumeSettings()"
        style="width:100%;accent-color:#26a69a">
    </div>
    <div style="margin-bottom:12px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div style="font-size:9px;color:#4a5568;text-transform:uppercase;letter-spacing:1.2px">Volume MA</div>
        <button class="ind-tog" id="vs-maEnabled"
          onclick="this.classList.toggle('on');_syncVolMARowVisibility();_previewVolumeSettings()"
          style="position:relative;width:32px;height:17px;border-radius:9px;flex-shrink:0;
                 background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.14);
                 cursor:pointer;transition:background .2s,border-color .2s;padding:0">
          <span class="ind-tog-knob"></span>
        </button>
      </div>
      <div id="vs-maRow" style="display:none;align-items:center;gap:8px">
        <input type="color" id="vs-maColor" value="#f59e0b" oninput="_previewVolumeSettings()"
          style="width:28px;height:28px;border:1px solid rgba(255,255,255,0.12);border-radius:5px;cursor:pointer;padding:2px;background:rgba(255,255,255,0.05);flex-shrink:0">
        <div style="font-size:9px;color:#4a5568;text-transform:uppercase;letter-spacing:1px;flex-shrink:0">Period</div>
        <input type="number" id="vs-maPeriod" value="20" min="2" max="500"
          oninput="_previewVolumeSettings()"
          style="flex:1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);
                 border-radius:5px;color:#e2e8f0;font-family:'IBM Plex Mono',monospace;
                 font-size:11px;padding:6px 9px;outline:none;min-width:0">
      </div>
    </div>
    <div style="display:flex;gap:8px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.07)">
      <button onclick="applyVolumeSettings()" style="flex:1;background:rgba(38,166,154,0.15);border:1px solid rgba(38,166,154,0.38);color:#26a69a;border-radius:6px;font-size:11px;padding:8px;cursor:pointer;font-family:inherit;font-weight:600;letter-spacing:.4px">Apply</button>
      <button onclick="resetVolumeSettings()" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#4a5568;border-radius:6px;font-size:11px;padding:8px 12px;cursor:pointer;font-family:inherit" title="Restore factory defaults">Defaults</button>
      <button onclick="_cancelVolumeSettings()" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:#4a5568;border-radius:6px;font-size:11px;padding:8px 12px;cursor:pointer;font-family:inherit" title="Revert to settings before opening">Cancel</button>
    </div>
  </div>

  <!-- App Settings Panel -->
  <div id="appSettingsPanel" onclick="event.stopPropagation()" style="display:none;position:fixed;z-index:1010;width:290px;
    flex-direction:column;gap:0;
    background:rgba(10,14,28,0.98);border:1px solid rgba(255,255,255,0.13);
    border-radius:10px;padding:14px 16px 16px;
    box-shadow:0 16px 48px rgba(0,0,0,0.7);backdrop-filter:blur(20px);
    font-family:'IBM Plex Mono',monospace;">

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:7px">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        <span style="font-size:11px;font-weight:600;color:#e2e8f0;letter-spacing:.8px;text-transform:uppercase">Settings</span>
      </div>
      <button onclick="closeAppSettings()" style="font-size:13px;line-height:1;padding:2px 8px;border-radius:4px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.06);color:#94a3b8;cursor:pointer;font-family:inherit">&#x2715;</button>
    </div>

    <div style="font-size:9px;color:#4a5568;text-transform:uppercase;letter-spacing:1.6px;font-weight:700;margin-bottom:10px">&#x1F508; Sound</div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <span style="font-size:11px;color:#c4cdd8">Enable Sounds</span>
      <button class="ind-tog" id="as-soundEnabled"
        onclick="this.classList.toggle('on');_liveApplySoundSettings()"
        style="position:relative;width:32px;height:17px;border-radius:9px;
               background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.14);
               cursor:pointer;transition:background .2s,border-color .2s;padding:0;flex-shrink:0">
        <span class="ind-tog-knob"></span>
      </button>
    </div>

    <div id="as-volumeRow">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span style="font-size:11px;color:#c4cdd8">Volume</span>
        <span id="as-volumeVal" style="font-size:10px;color:#94a3b8;font-family:'IBM Plex Mono',monospace">50%</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4a5568" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/></svg>
        <input type="range" id="as-volume" min="0" max="100" value="50" step="1"
          oninput="document.getElementById('as-volumeVal').textContent=this.value+'%';_liveApplySoundSettings()"
          style="flex:1;accent-color:#a78bfa">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4a5568" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
      </div>
      <button onclick="if(typeof soundInfo==='function')soundInfo()"
        style="margin-top:9px;width:100%;background:rgba(167,139,250,0.1);border:1px solid rgba(167,139,250,0.25);
               color:#a78bfa;border-radius:5px;font-size:10px;padding:6px;cursor:pointer;
               font-family:'IBM Plex Mono',monospace;letter-spacing:.4px">
        &#x25B6; Test sound
      </button>
    </div>

    <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.07);display:flex;justify-content:flex-end">
      <button onclick="_resetAppSoundSettings()"
        style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);
               color:#4a5568;border-radius:6px;font-size:11px;padding:6px 14px;
               cursor:pointer;font-family:inherit">Defaults</button>
    </div>
  </div>`;

  document.body.appendChild(wrapper);
}

// ── APP SETTINGS PANEL ────────────────────────────────────────────────
function openAppSettings() {
  const panel = document.getElementById('appSettingsPanel');
  if (!panel) return;
  if (panel.style.display === 'flex') { closeAppSettings(); return; }

  // Read current state from sounds.js public getters
  const enabled = typeof getSoundEnabled === 'function' ? getSoundEnabled() : true;
  const volume  = typeof getSoundVolume  === 'function' ? getSoundVolume()  : 0.5;

  const tog = document.getElementById('as-soundEnabled');
  if (tog) tog.classList.toggle('on', enabled);
  const slider = document.getElementById('as-volume');
  if (slider) slider.value = Math.round(volume * 100);
  const label = document.getElementById('as-volumeVal');
  if (label) label.textContent = Math.round(volume * 100) + '%';
  _syncSoundRowOpacity();

  const btn = document.getElementById('settingsNavBtn');
  const r   = btn ? btn.getBoundingClientRect() : { bottom: 52, right: window.innerWidth - 16 };
  panel.style.top  = (r.bottom + 8) + 'px';
  panel.style.left = Math.max(8, r.right - 290) + 'px';
  panel.style.display = 'flex';
}

function closeAppSettings() {
  const p = document.getElementById('appSettingsPanel');
  if (p) p.style.display = 'none';
}

function _liveApplySoundSettings() {
  const enabled = document.getElementById('as-soundEnabled').classList.contains('on');
  const volume  = parseInt(document.getElementById('as-volume').value) / 100;
  if (typeof setSoundEnabled === 'function') setSoundEnabled(enabled);
  if (typeof setSoundVolume  === 'function') setSoundVolume(volume);
  _syncSoundRowOpacity();
  if (typeof saveSettings === 'function') saveSettings();
}

function _syncSoundRowOpacity() {
  const enabled = document.getElementById('as-soundEnabled').classList.contains('on');
  const row = document.getElementById('as-volumeRow');
  if (row) row.style.opacity = enabled ? '1' : '0.38';
}

function _resetAppSoundSettings() {
  if (typeof setSoundEnabled === 'function') setSoundEnabled(true);
  if (typeof setSoundVolume  === 'function') setSoundVolume(0.5);
  const tog = document.getElementById('as-soundEnabled');
  if (tog) tog.classList.add('on');
  const slider = document.getElementById('as-volume');
  if (slider) slider.value = 50;
  const label = document.getElementById('as-volumeVal');
  if (label) label.textContent = '50%';
  _syncSoundRowOpacity();
  if (typeof saveSettings === 'function') saveSettings();
  if (typeof toast        === 'function') toast('Sound settings reset', 'info');
}

// ── INDICATORS PANEL ──────────────────────────────────────────────────
function openIndicatorsPanel() {
  const panel = document.getElementById('indicatorsPanel');
  const btn   = document.getElementById('indicatorsBtn');
  if (!panel || !btn) return;
  const isOpen = panel.style.display === 'flex';
  if (isOpen) { panel.style.display = 'none'; return; }
  const maPanel = document.getElementById('maSettingsPanel');
  if (maPanel) maPanel.style.display = 'none';
  const r = btn.getBoundingClientRect();
  panel.style.top  = (r.bottom + 6) + 'px';
  panel.style.left = Math.max(8, r.right - 272) + 'px';
  panel.style.display = 'flex';
  _syncIndToggles();
}

function closeIndicatorsPanel() {
  const panel = document.getElementById('indicatorsPanel');
  if (panel) panel.style.display = 'none';
}

function _syncIndToggles() {
  const maTog    = document.getElementById('ind-tog-ma');
  const volTog   = document.getElementById('ind-tog-vol');
  const stochTog = document.getElementById('ind-tog-stochrsi');
  if (maTog)    maTog.classList.toggle('on',    typeof maVisible       !== 'undefined' ? maVisible       : true);
  if (volTog)   volTog.classList.toggle('on',   typeof volumeVisible   !== 'undefined' ? volumeVisible   : true);
  if (stochTog) stochTog.classList.toggle('on', typeof stochRsiVisible !== 'undefined' ? stochRsiVisible : false);
  const cnt = document.getElementById('ind-ma-count');
  if (cnt) {
    const n = typeof maLines !== 'undefined' ? maLines.length : 0;
    cnt.textContent = n > 0 ? n : '';
    cnt.style.display = n > 0 ? 'inline' : 'none';
  }
  if (typeof STOCH_RSI !== 'undefined') {
    const badge = document.getElementById('ind-stochrsi-params');
    if (badge) badge.textContent = `${STOCH_RSI.rsiPeriod},${STOCH_RSI.stochPeriod},${STOCH_RSI.kSmooth},${STOCH_RSI.dSmooth}`;
  }
}

// ── STOCHRSI SETTINGS PANEL ───────────────────────────────────────────
function openStochRSISettings() {
  const panel    = document.getElementById('stochRsiSettingsPanel');
  const indPanel = document.getElementById('indicatorsPanel');
  if (!panel) return;
  if (panel.style.display === 'flex') { panel.style.display = 'none'; return; }
  if (typeof STOCH_RSI !== 'undefined') {
    document.getElementById('sr-rsiPeriod').value   = STOCH_RSI.rsiPeriod;
    document.getElementById('sr-stochPeriod').value = STOCH_RSI.stochPeriod;
    document.getElementById('sr-kSmooth').value     = STOCH_RSI.kSmooth;
    document.getElementById('sr-dSmooth').value     = STOCH_RSI.dSmooth;
    document.getElementById('sr-kColor').value      = STOCH_RSI._kColor || '#00d4ff';
    document.getElementById('sr-dColor').value      = STOCH_RSI._dColor || '#f43f5e';
  }
  if (indPanel && indPanel.style.display === 'flex') {
    const r = indPanel.getBoundingClientRect();
    panel.style.top  = r.top + 'px';
    panel.style.left = Math.max(8, r.left - 296) + 'px';
  } else {
    const btn = document.getElementById('indicatorsBtn');
    const r = btn ? btn.getBoundingClientRect() : { bottom: 100, right: 500 };
    panel.style.top  = (r.bottom + 6) + 'px';
    panel.style.left = Math.max(8, r.right - 576) + 'px';
  }
  panel.style.display = 'flex';
}

function closeStochRSISettings() {
  const panel = document.getElementById('stochRsiSettingsPanel');
  if (panel) panel.style.display = 'none';
}

function applyStochRSISettings() {
  const rsiPeriod   = parseInt(document.getElementById('sr-rsiPeriod').value);
  const stochPeriod = parseInt(document.getElementById('sr-stochPeriod').value);
  const kSmooth     = parseInt(document.getElementById('sr-kSmooth').value);
  const dSmooth     = parseInt(document.getElementById('sr-dSmooth').value);
  const kColor      = document.getElementById('sr-kColor').value;
  const dColor      = document.getElementById('sr-dColor').value;
  const checks = [
    [rsiPeriod,2,100,'sr-rsiPeriod'],[stochPeriod,2,100,'sr-stochPeriod'],
    [kSmooth,1,50,'sr-kSmooth'],[dSmooth,1,50,'sr-dSmooth'],
  ];
  let valid = true;
  checks.forEach(([v, mn, mx, id]) => {
    const el = document.getElementById(id);
    if (!v || v < mn || v > mx) {
      el.style.borderColor = '#f43f5e';
      setTimeout(() => el.style.borderColor = '', 1000);
      valid = false;
    }
  });
  if (!valid) return;
  if (typeof STOCH_RSI !== 'undefined') {
    STOCH_RSI.rsiPeriod = rsiPeriod; STOCH_RSI.stochPeriod = stochPeriod;
    STOCH_RSI.kSmooth   = kSmooth;   STOCH_RSI.dSmooth     = dSmooth;
    STOCH_RSI._kColor   = kColor;    STOCH_RSI._dColor     = dColor;
  }
  if (typeof stochKSeries !== 'undefined' && stochKSeries) stochKSeries.applyOptions({ color: kColor });
  if (typeof stochDSeries !== 'undefined' && stochDSeries) stochDSeries.applyOptions({ color: dColor });
  const badge = document.getElementById('ind-stochrsi-params');
  if (badge) badge.textContent = `${rsiPeriod},${stochPeriod},${kSmooth},${dSmooth}`;
  if (typeof stochRsiVisible !== 'undefined' && stochRsiVisible && typeof candles !== 'undefined' && candles.length) {
    if (typeof setStochRSIData === 'function') setStochRSIData(candles);
  }
  if (typeof _renderStochLabelSeg === 'function') _renderStochLabelSeg();
  if (typeof saveSettings === 'function') saveSettings();
  toast('Stoch RSI updated', 'success');
  closeStochRSISettings();
}

function resetStochRSISettings() {
  document.getElementById('sr-rsiPeriod').value   = 14;
  document.getElementById('sr-stochPeriod').value = 14;
  document.getElementById('sr-kSmooth').value     = 3;
  document.getElementById('sr-dSmooth').value     = 3;
  document.getElementById('sr-kColor').value      = '#00d4ff';
  document.getElementById('sr-dColor').value      = '#f43f5e';
  applyStochRSISettings();
}

// ── OUTSIDE CLICK — close all panels ─────────────────────────────────
document.addEventListener('click', e => {
  const maPanel   = document.getElementById('maSettingsPanel');
  const srPanel   = document.getElementById('stochRsiSettingsPanel');
  const volPanel  = document.getElementById('volSettingsPanel');
  const indPanel  = document.getElementById('indicatorsPanel');
  const indBtn    = document.getElementById('indicatorsBtn');
  const appPanel  = document.getElementById('appSettingsPanel');
  const settBtn   = document.getElementById('settingsNavBtn');

  if (appPanel && appPanel.style.display !== 'none' &&
      !appPanel.contains(e.target) && settBtn && !settBtn.contains(e.target))
    appPanel.style.display = 'none';

  if (maPanel && maPanel.style.display !== 'none' && !maPanel.contains(e.target))
    maPanel.style.display = 'none';

  if (indPanel && indPanel.style.display !== 'none' &&
      !indPanel.contains(e.target) && indBtn && !indBtn.contains(e.target)) {
    const subOpen = (srPanel  && srPanel.style.display  === 'flex' && srPanel.contains(e.target))
                 || (volPanel && volPanel.style.display === 'flex' && volPanel.contains(e.target));
    if (!subOpen) indPanel.style.display = 'none';
  }
  if (srPanel && srPanel.style.display !== 'none' && !srPanel.contains(e.target)) {
    if (!indPanel || !indPanel.contains(e.target)) srPanel.style.display = 'none';
  }
  if (volPanel && volPanel.style.display !== 'none' && !volPanel.contains(e.target)) {
    if (!indPanel || !indPanel.contains(e.target)) _cancelVolumeSettings();
  }
});