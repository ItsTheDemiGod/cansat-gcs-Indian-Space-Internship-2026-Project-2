(function () {
  'use strict';

  // ── Chart field order (must match graphs.js CHART_DEFS) ───────
  var CHART_FIELDS = [
    { field: 'altitude',        label: 'ALTITUDE'     },
    { field: 'pressure',        label: 'PRESSURE'     },
    { field: 'temperature',     label: 'TEMPERATURE'  },
    { field: 'descent_rate',    label: 'DESCENT RATE' },
    { field: 'battery_voltage', label: 'BATTERY VOLT' },
  ];

  // ── CSV column order ─────────────────────────────────────────
  var CSV_HEADER = [
    'packet_count','timestamp','altitude','pressure','temperature',
    'battery_voltage','descent_rate','gps_lat','gps_lon','gps_alt',
    'roll','pitch','yaw','gps_fix','payload_sep','chute_deployed',
  ];

  // ─────────────────────────────────────────────────────────────
  //  Toast notification system
  // ─────────────────────────────────────────────────────────────
  var toastContainer = null;

  function getContainer() {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    return toastContainer;
  }

  function showToast(message, type) {
    var toast = document.createElement('div');
    toast.className   = 'toast toast-' + (type || 'success');
    toast.textContent = message;
    getContainer().appendChild(toast);

    // Slide in on next frame (so transition fires)
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { toast.classList.add('toast-in'); });
    });

    // Auto-dismiss after 3 s
    setTimeout(function () {
      toast.classList.remove('toast-in');
      toast.addEventListener('transitionend', function () { toast.remove(); }, { once: true });
    }, 3000);
  }

  // ─────────────────────────────────────────────────────────────
  //  Helpers
  // ─────────────────────────────────────────────────────────────
  function getTimestamp() {
    var d   = new Date();
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return String(d.getFullYear()) +
           pad(d.getMonth() + 1)  +
           pad(d.getDate())        + '_' +
           pad(d.getHours())       +
           pad(d.getMinutes())     +
           pad(d.getSeconds());
  }

  function triggerDownload(url, filename) {
    var a = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ─────────────────────────────────────────────────────────────
  //  exportCSV
  // ─────────────────────────────────────────────────────────────
  function exportCSV() {
    var log = window.telemetryLog || [];

    if (log.length === 0) {
      showToast('⚠ NO DATA TO EXPORT', 'warning');
      return;
    }

    var rows = log.map(function (p) {
      return CSV_HEADER.map(function (key) { return p[key]; }).join(',');
    });

    var csv  = CSV_HEADER.join(',') + '\n' + rows.join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var url  = URL.createObjectURL(blob);

    triggerDownload(url, 'cansat_telemetry_' + getTimestamp() + '.csv');
    URL.revokeObjectURL(url);

    showToast('✓ CSV EXPORTED — ' + log.length + ' PACKETS', 'success');
  }

  // ─────────────────────────────────────────────────────────────
  //  exportGraphs
  // ─────────────────────────────────────────────────────────────
  function exportGraphs() {
    var charts = window.charts;
    if (!charts || Object.keys(charts).length === 0) {
      showToast('⚠ NO GRAPH DATA', 'warning');
      return;
    }

    var W = 1200, H = 900;
    var offscreen   = document.createElement('canvas');
    offscreen.width  = W;
    offscreen.height = H;
    var ctx = offscreen.getContext('2d');

    // Dark background
    ctx.fillStyle = '#010a14';
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.fillStyle   = '#e8f4fd';
    ctx.font        = 'bold 16px "Orbitron", sans-serif';
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CANSAT-GCS  TELEMETRY GRAPHS', W / 2, 26);

    // Timestamp subtitle
    ctx.fillStyle = '#7aaec8';
    ctx.font      = '10px "Exo 2", sans-serif';
    ctx.fillText(new Date().toUTCString(), W / 2, 50);

    // Grid layout: 2 cols, 3 rows (last row: chart[4] centred)
    var PAD    = 18;
    var TITLE_H = 68;
    var chartW = (W - PAD * 3) / 2;          // ~582 px
    var chartH = (H - TITLE_H - PAD * 4) / 3; // ~234 px

    CHART_FIELDS.forEach(function (def, i) {
      var chart = charts[def.field];
      if (!chart || !chart.canvas) return;

      var x, y;
      if (i < 4) {
        var col = i % 2;
        var row = Math.floor(i / 2);
        x = PAD + col * (chartW + PAD);
        y = TITLE_H + row * (chartH + PAD);
      } else {
        // 5th chart centred in bottom row
        x = (W - chartW) / 2;
        y = TITLE_H + 2 * (chartH + PAD);
      }

      // Chart border
      ctx.strokeStyle = 'rgba(0,212,255,0.18)';
      ctx.lineWidth   = 1;
      ctx.strokeRect(x, y, chartW, chartH);

      // Chart image (synchronous — canvas is already rendered)
      ctx.drawImage(chart.canvas, x, y, chartW, chartH);

      // Chart label overlay
      ctx.fillStyle    = 'rgba(1,10,20,0.7)';
      ctx.fillRect(x, y, chartW, 18);
      ctx.fillStyle    = '#7aaec8';
      ctx.font         = '700 9px "Exo 2", sans-serif';
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(def.label, x + 6, y + 9);
    });

    var dataUrl  = offscreen.toDataURL('image/png');
    triggerDownload(dataUrl, 'cansat_graphs_' + getTimestamp() + '.png');
    showToast('✓ GRAPHS EXPORTED', 'success');
  }

  // ─────────────────────────────────────────────────────────────
  //  resetAll
  // ─────────────────────────────────────────────────────────────
  function resetAll() {
    if (!window.confirm(
      'RESET ALL TELEMETRY DATA?\n\n' +
      'This will clear all packets, charts, map trajectory,\n' +
      'and reset the simulation to mission-start state.'
    )) return;

    // 1. Stop telemetry engine + update header UI
    if (window.telemetryActive) {
      var btnStop = document.getElementById('btn-stop');
      if (btnStop && !btnStop.disabled) btnStop.click();
    }

    // 2. Clear telemetry log
    window.telemetryLog = [];

    // 3. Reset packet counter in simulation engine
    if (typeof window.resetPacketCount === 'function') {
      window.resetPacketCount();
    }

    // 4. Clear all Chart.js datasets
    var charts = window.charts || {};
    Object.keys(charts).forEach(function (key) {
      var c = charts[key];
      c.data.labels            = [];
      c.data.datasets[0].data  = [];
      c.update('none');
    });

    // 5. Clear map trajectory + reset marker
    if (typeof window.resetMapTrajectory === 'function') {
      window.resetMapTrajectory();
    }

    // 6. Reset telemetry display panel values
    if (typeof window.resetDisplayValues === 'function') {
      window.resetDisplayValues();
    }

    // 7. Reset error code digits to nominal
    if (typeof window.resetErrorCodes === 'function') {
      window.resetErrorCodes();
    }

    // 8. Reset mission state flags + state indicator pills
    window.missionState.manualSep      = false;
    window.missionState.emergencyChute = false;
    window.missionState.redundantAct   = false;
    if (typeof window.refreshStateIndicators === 'function') {
      window.refreshStateIndicators();
    }

    // 9. Clear command log (also clears the logStack array inside controls.js)
    if (typeof window.resetCommandLog === 'function') {
      window.resetCommandLog();
    }

    // 10. Reset MET timer and display
    if (typeof window.resetMET === 'function') window.resetMET();

    // 11. Reset orientation RPY readout
    ['rpy-roll', 'rpy-pitch', 'rpy-yaw'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = '0.0°';
    });

    showToast('⚠ TELEMETRY RESET COMPLETE', 'warning');
  }

  // ─────────────────────────────────────────────────────────────
  //  Wire buttons (the controls.js stubs already call these via
  //  window.exportCSV / window.exportGraphs / window.resetAll)
  // ─────────────────────────────────────────────────────────────
  window.exportCSV    = exportCSV;
  window.exportGraphs = exportGraphs;
  window.resetAll     = resetAll;

})();
