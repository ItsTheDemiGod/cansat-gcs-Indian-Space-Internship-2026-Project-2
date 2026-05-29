// ─────────────────────────────────────────────────────────────────
//  js/controls.js
//  Phase 2 — Top Control Bar handlers
//  Phase 7 will extend this file with Mission Control panel logic
// ─────────────────────────────────────────────────────────────────

window.telemetryActive = false;
// window.missionState is initialised by telemetry.js (loaded first)

(function () {
  'use strict';

  // ── DOM references ────────────────────────────────────────────
  const btnStart       = document.getElementById('btn-start');
  const btnStop        = document.getElementById('btn-stop');
  const btnExportCSV   = document.getElementById('btn-export-csv');
  const btnExportGraph = document.getElementById('btn-export-graph');
  const btnReset       = document.getElementById('btn-reset');
  const btnSyncTime    = document.getElementById('btn-sync-time');
  const syncDisplay    = document.getElementById('sync-time-display');
  const statusDot      = document.getElementById('status-dot');
  const statusText     = document.getElementById('status-text');
  const metDisplay     = document.getElementById('met-display');

  // ── MET (Mission Elapsed Time) timer ─────────────────────────
  let metIntervalId = null;
  let metStartTime  = 0;

  function tickMET() {
    const elapsed = Math.floor((Date.now() - metStartTime) / 1000);
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    if (metDisplay) {
      metDisplay.textContent =
        'T+' + String(h).padStart(2,'0') + ':' +
               String(m).padStart(2,'0') + ':' +
               String(s).padStart(2,'0');
    }
  }

  function startMET() {
    metStartTime = Date.now();
    tickMET();
    metIntervalId = setInterval(tickMET, 1000);
  }

  function stopMET() {
    if (metIntervalId !== null) { clearInterval(metIntervalId); metIntervalId = null; }
  }

  // Exposed so datamanager.resetAll() can reset the MET display
  window.resetMET = function () {
    stopMET();
    if (metDisplay) metDisplay.textContent = 'T+00:00:00';
  };

  // ── START TELEMETRY ──────────────────────────────────────────
  btnStart.addEventListener('click', function () {
    window.telemetryActive = true;

    btnStart.disabled = true;
    btnStop.disabled  = false;

    statusDot.className    = 'status-dot active';
    statusText.textContent = 'TELEMETRY ACTIVE';

    startMET();

    if (typeof window.startTelemetry === 'function') window.startTelemetry();

    console.log('[GCS] CMD: START TELEMETRY');
  });

  // ── STOP TELEMETRY ───────────────────────────────────────────
  btnStop.addEventListener('click', function () {
    window.telemetryActive = false;

    btnStop.disabled  = true;
    btnStart.disabled = false;

    statusDot.className    = 'status-dot standby';
    statusText.textContent = 'STANDBY';

    stopMET();

    if (typeof window.stopTelemetry === 'function') window.stopTelemetry();

    console.log('[GCS] CMD: STOP TELEMETRY');
  });

  // ── EXPORT CSV ──────────────────────────────────────────────
  btnExportCSV.addEventListener('click', function () {
    if (typeof window.exportCSV === 'function') {
      window.exportCSV();
    } else {
      console.log('[GCS] CMD: EXPORT CSV — Phase 11 not loaded');
    }
  });

  // ── EXPORT GRAPH ─────────────────────────────────────────────
  btnExportGraph.addEventListener('click', function () {
    if (typeof window.exportGraphs === 'function') {
      window.exportGraphs();
    } else {
      console.log('[GCS] CMD: EXPORT GRAPH — Phase 11 not loaded');
    }
  });

  // ── RESET PACKET ─────────────────────────────────────────────
  btnReset.addEventListener('click', function () {
    if (typeof window.resetAll === 'function') {
      window.resetAll();
    } else {
      console.log('[GCS] CMD: RESET PACKET — Phase 11 not loaded');
    }
  });

  // ── SYNC PC TIME ─────────────────────────────────────────────
  btnSyncTime.addEventListener('click', function () {
    const now = new Date();
    const h   = String(now.getHours()).padStart(2, '0');
    const m   = String(now.getMinutes()).padStart(2, '0');
    const s   = String(now.getSeconds()).padStart(2, '0');
    const ts  = `${h}:${m}:${s}`;

    syncDisplay.textContent = ts;
    syncDisplay.classList.remove('sync-flash');
    // Force reflow so re-adding the class restarts the animation
    void syncDisplay.offsetWidth;
    syncDisplay.classList.add('sync-flash');
    syncDisplay.addEventListener('animationend', () => {
      syncDisplay.classList.remove('sync-flash');
    }, { once: true });

    console.log('[GCS] CMD: SYNC PC TIME —', ts);
  });

})();


// ─────────────────────────────────────────────────────────────────
//  Phase 7 — Mission Control Panel: commands, modal, log, state
// ─────────────────────────────────────────────────────────────────
(function () {
  'use strict';

  var modal        = document.getElementById('cmd-modal');
  var modalName    = document.getElementById('cmd-modal-name');
  var modalConfirm = document.getElementById('cmd-modal-confirm');
  var modalCancel  = document.getElementById('cmd-modal-cancel');

  var pendingCmd = null;

  var COMMANDS = {
    'cmd-manual-sep': {
      display: 'MANUAL SEPARATION',
      logName: 'MANUAL_SEPARATION',
      action: function () {
        window.missionState.manualSep = true;
        refreshStateIndicators();
      }
    },
    'cmd-emrg-chute': {
      display: 'EMERGENCY PARACHUTE',
      logName: 'EMERGENCY_PARACHUTE',
      action: function () {
        window.missionState.emergencyChute = true;
        refreshStateIndicators();
      }
    },
    'cmd-redundant-act': {
      display: 'REDUNDANT ACTIVATION',
      logName: 'REDUNDANT_ACTIVATION',
      action: function () {
        window.missionState.redundantAct = true;
        refreshStateIndicators();
      }
    },
  };

  // ── Modal helpers ─────────────────────────────────────────────
  function showModal(cmdId) {
    var cmd = COMMANDS[cmdId];
    if (!cmd) return;
    pendingCmd            = cmd;
    modalName.textContent = cmd.display;
    modal.style.display   = '';   // removes inline display:none → CSS flex takes over
  }

  function hideModal() {
    modal.style.display = 'none';
    pendingCmd = null;
  }

  // ── Modal controls ────────────────────────────────────────────
  modalConfirm.addEventListener('click', function () {
    if (pendingCmd) {
      pendingCmd.action();
      appendLog(pendingCmd.logName);
    }
    hideModal();
  });

  modalCancel.addEventListener('click', hideModal);

  // ESC key cancels
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.style.display !== 'none') hideModal();
  });

  // Click on the dark backdrop (not on the card) also cancels
  modal.addEventListener('click', function (e) {
    if (e.target === modal) hideModal();
  });

  // ── Wire command buttons ──────────────────────────────────────
  Object.keys(COMMANDS).forEach(function (id) {
    var btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', function () { showModal(id); });
    }
  });

  // ── Command log ───────────────────────────────────────────────
  var logEl    = document.getElementById('cmd-log');
  var logStack = [];
  var MAX_LOG  = 3;

  function appendLog(name) {
    var now = new Date();
    var ts  = String(now.getHours()).padStart(2,'0')   + ':' +
              String(now.getMinutes()).padStart(2,'0') + ':' +
              String(now.getSeconds()).padStart(2,'0');

    logStack.unshift({ ts: ts, name: name });
    if (logStack.length > MAX_LOG) logStack.pop();
    renderLog();
  }

  function renderLog() {
    if (!logEl) return;
    if (logStack.length === 0) {
      logEl.innerHTML = '<div class="cmd-log-empty">NO COMMANDS EXECUTED</div>';
      return;
    }
    logEl.innerHTML = logStack.map(function (e) {
      return '<div class="cmd-log-entry">'                                    +
               '<span class="cmd-log-time">'  + e.ts   + '</span>'           +
               '<span class="cmd-log-name">'  + e.name + '</span>'           +
               '<span class="cmd-log-badge">EXECUTED</span>'                  +
             '</div>';
    }).join('');
  }

  // ── Mission state indicators ──────────────────────────────────
  function setIndicator(id, active, activeClass) {
    var el = document.getElementById(id);
    if (!el) return;
    el.className = 'mc-state-pill ' + (active ? activeClass : 'inactive');
  }

  function refreshStateIndicators() {
    var ms = window.missionState;
    setIndicator('state-sep',       ms.manualSep,      'active-green');
    setIndicator('state-chute',     ms.emergencyChute, 'active-red');
    setIndicator('state-redundant', ms.redundantAct,   'active-amber');
  }

  // Phase 11 — exposed for datamanager.resetAll()
  window.refreshStateIndicators = refreshStateIndicators;

  window.resetCommandLog = function () {
    logStack = [];
    renderLog();
  };

})();
