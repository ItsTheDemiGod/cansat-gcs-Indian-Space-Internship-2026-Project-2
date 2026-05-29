// ─────────────────────────────────────────────────────────────────
//  js/telemetry.js
//  Phase 3 — Telemetry Simulation Engine
//
//  Exposes:  window.startTelemetry()  window.stopTelemetry()
//            window.telemetryLog      window.missionState
//
//  Fires:    document CustomEvent 'telemetryPacket' each second
//  Never import this file — other modules listen to the event only.
// ─────────────────────────────────────────────────────────────────

(function () {
  'use strict';

  // ── Launch-site origin (SDSC Sriharikota) ────────────────────
  const LAUNCH_LAT = 13.7330;
  const LAUNCH_LON = 80.2350;

  // ── Mission state flags (Phase 7 commands write here) ────────
  window.missionState = {
    emergencyChute: false,
    manualSep:      false,
    redundantAct:   false,
  };

  // ── Telemetry log (all packets) ───────────────────────────────
  window.telemetryLog = [];

  // ── Simulation state ─────────────────────────────────────────
  const sim = {
    intervalId:   null,
    packetCount:  0,

    // Container altitude
    altitude:     400.0,

    // GPS position + drift vector
    gpsLat:       LAUNCH_LAT,
    gpsLon:       LAUNCH_LON,
    driftLat:     0.0,
    driftLon:     0.0,

    // Payload sensor — descent rate (independent from altitude rate)
    descentRate:  9.0,
    drSpikeCD:    0,      // spike countdown (packets remaining)
    drSpikeTarget:9.0,

    // Orientation
    roll:         0.0,
    pitch:        5.0,    // slight initial pitch
    yaw:          45.0,

    // Power
    battVoltage:  8.4,

    // Mission flags
    payloadSep:   false,
    chuteDeployed:false,
  };

  // ─────────────────────────────────────────────────────────────
  //  resetSim — restore all state to mission-start values
  // ─────────────────────────────────────────────────────────────
  function resetSim() {
    sim.packetCount   = 0;
    sim.altitude      = 400.0;

    sim.gpsLat        = LAUNCH_LAT;
    sim.gpsLon        = LAUNCH_LON;
    // Randomise initial wind drift direction each mission
    sim.driftLat      = (Math.random() - 0.5) * 0.00010;
    sim.driftLon      = (Math.random() - 0.5) * 0.00010;

    sim.descentRate   = 10.5; // starts slightly fast, settles to ~9
    sim.drSpikeCD     = 0;
    sim.drSpikeTarget = 9.0;

    sim.roll          = 0.0;
    sim.pitch         = 5.0;
    sim.yaw           = 45.0;

    sim.battVoltage   = 8.4;
    sim.payloadSep    = false;
    sim.chuteDeployed = false;

    window.missionState.emergencyChute = false;
    window.missionState.manualSep      = false;
    window.missionState.redundantAct   = false;
  }

  // ─────────────────────────────────────────────────────────────
  //  altitudeRate — container descent speed in m/s
  //  "faster at first, slows near ground"
  //  Designed so 400 m → 0 m takes ≈ 400 packets
  // ─────────────────────────────────────────────────────────────
  function altitudeRate(h) {
    var noise = (Math.random() - 0.5) * 0.25;
    if (h > 200) {
      // Upper phase: 1.3–1.5 m/s
      return 1.3 + ((h - 200) / 200) * 0.20 + noise;
    } else if (h > 40) {
      // Mid phase: ~1.0 m/s
      return 0.95 + noise * 0.6;
    } else {
      // Near-ground: slow to a crawl (ground-effect / lower wind)
      return Math.max(0.15, (h / 40) * 0.70 + (Math.random() * 0.10));
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  updateDescentRate — payload sensor reading, mean ~9 m/s
  //  Occasionally spikes outside 8–10 to trigger D1 error
  // ─────────────────────────────────────────────────────────────
  function updateDescentRate() {
    if (sim.drSpikeCD > 0) {
      // Ramp toward spike target
      sim.drSpikeCD--;
      sim.descentRate += (sim.drSpikeTarget - sim.descentRate) * 0.30;
    } else if (Math.random() < 0.08) {
      // Fire a new spike (low or high)
      sim.drSpikeCD     = 2 + Math.floor(Math.random() * 3); // lasts 2–4 pkts
      sim.drSpikeTarget = Math.random() < 0.5
        ? 5.0 + Math.random() * 2.5    // under-speed: 5–7.5 m/s
        : 10.8 + Math.random() * 3.2;  // over-speed:  10.8–14 m/s
    } else {
      // Normal: mean-revert to 9 with ±0.5 noise
      sim.descentRate += (9.0 - sim.descentRate) * 0.18
                       + (Math.random() - 0.5) * 0.50;
    }
    sim.descentRate = Math.max(0.0, Math.min(20.0, sim.descentRate));
  }

  // ─────────────────────────────────────────────────────────────
  //  tick — generate one telemetry packet
  // ─────────────────────────────────────────────────────────────
  function tick() {
    sim.packetCount++;

    // ── Altitude ────────────────────────────────────────────────
    if (sim.altitude > 0) {
      sim.altitude = Math.max(0, sim.altitude - altitudeRate(sim.altitude));
    }

    // ── Payload descent rate (sensor) ───────────────────────────
    updateDescentRate();

    // ── GPS drift ───────────────────────────────────────────────
    // Occasionally shift wind direction (≈4% per packet)
    if (Math.random() < 0.04) {
      sim.driftLat += (Math.random() - 0.5) * 0.000030;
      sim.driftLon += (Math.random() - 0.5) * 0.000030;
      // Dampen drift so it doesn't run away
      sim.driftLat *= 0.95;
      sim.driftLon *= 0.95;
    }
    sim.gpsLat += sim.driftLat + (Math.random() - 0.5) * 0.000018;
    sim.gpsLon += sim.driftLon + (Math.random() - 0.5) * 0.000018;

    // ── Orientation — smooth ±2° per tick ───────────────────────
    sim.roll  += (Math.random() - 0.5) * 4.0;
    sim.pitch += (Math.random() - 0.5) * 4.0;
    sim.yaw   += (Math.random() - 0.5) * 4.0;
    sim.roll   = Math.max(-180, Math.min(180, sim.roll));
    sim.pitch  = Math.max(-90,  Math.min(90,  sim.pitch));
    sim.yaw    = ((sim.yaw % 360) + 360) % 360;

    // ── Battery — drains from 8.4 V to 7.2 V over ~400 pkts ────
    // 1.2 V / 400 = 0.003 V/pkt
    sim.battVoltage = Math.max(7.20, sim.battVoltage - 0.003);

    // ── Barometric pressure (ISA formula) ───────────────────────
    // P = P₀ × (1 − 2.2557×10⁻⁵ × h)^5.2561
    var pressure = 1013.25 * Math.pow(
      Math.max(0, 1 - 2.2557e-5 * sim.altitude), 5.2561
    );

    // ── Temperature — ISA lapse -6.5°C/km, ground baseline 28°C
    var temperature = 28.0
      - (sim.altitude / 1000) * 6.5
      + (Math.random() - 0.5) * 0.4;

    // ── GPS fix — 95% availability ───────────────────────────────
    var gpsFix = Math.random() > 0.05;

    // ── Payload separation — armed below 200 m ───────────────────
    if (sim.altitude < 200 || window.missionState.manualSep) {
      sim.payloadSep = true;
    }

    // ── Chute deployed — driven by Emergency Parachute command ───
    if (window.missionState.emergencyChute) {
      sim.chuteDeployed = true;
    }

    // ── GPS altitude: barometric + small GPS error ───────────────
    var gpsAlt = sim.altitude + (Math.random() - 0.5) * 3.0;

    // ── Timestamp ────────────────────────────────────────────────
    var now = new Date();
    var ts  = [
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0'),
    ].join(':');

    return {
      packet_count:    sim.packetCount,
      timestamp:       ts,
      altitude:        +sim.altitude.toFixed(1),
      pressure:        +pressure.toFixed(2),
      temperature:     +temperature.toFixed(1),
      battery_voltage: +sim.battVoltage.toFixed(2),
      descent_rate:    +sim.descentRate.toFixed(2),
      gps_lat:         +sim.gpsLat.toFixed(6),
      gps_lon:         +sim.gpsLon.toFixed(6),
      gps_alt:         +gpsAlt.toFixed(1),
      roll:            +sim.roll.toFixed(1),
      pitch:           +sim.pitch.toFixed(1),
      yaw:             +sim.yaw.toFixed(1),
      gps_fix:         gpsFix,
      payload_sep:     sim.payloadSep,
      chute_deployed:  sim.chuteDeployed,
    };
  }

  // ─────────────────────────────────────────────────────────────
  //  Public API
  // ─────────────────────────────────────────────────────────────
  window.startTelemetry = function () {
    if (sim.intervalId !== null) return; // guard against double-start
    resetSim();
    window.telemetryLog = [];

    sim.intervalId = setInterval(function () {
      var pkt = tick();
      window.telemetryLog.push(pkt);
      document.dispatchEvent(
        new CustomEvent('telemetryPacket', { detail: pkt })
      );
      console.log(
        '[TELEMETRY] #' + pkt.packet_count
        + ' | ALT: ' + pkt.altitude + 'm'
        + ' | DR: '  + pkt.descent_rate + 'm/s'
        + ' | BAT: ' + pkt.battery_voltage + 'V'
        + ' | GPS: ' + pkt.gps_fix
      );
    }, 1000);

    console.log('[TELEMETRY] Engine started. Interval ID:', sim.intervalId);
  };

  window.stopTelemetry = function () {
    if (sim.intervalId !== null) {
      clearInterval(sim.intervalId);
      sim.intervalId = null;
      console.log(
        '[TELEMETRY] Engine stopped. Total packets dispatched:', sim.packetCount
      );
    }
  };

  // Expose sim read-only for debugging
  window._simState = sim;

  // Phase 11 — reset hook (called by datamanager.resetAll)
  window.resetPacketCount = function () {
    sim.packetCount = 0;
  };

})();

// ─────────────────────────────────────────────────────────────────
//  WebSocket bridge — connects to ws_bridge.py at localhost:8765
//  Packets arrive as JSON and are dispatched as telemetryPacket
//  events, identical to the built-in simulation engine.
// ─────────────────────────────────────────────────────────────────

window.wsConnection = null;
window.wsActive     = false;

window.connectWebSocket = function () {
  if (window.wsConnection) {
    window.wsConnection.close();
  }

  var ws = new WebSocket('ws://localhost:8765');

  ws.onopen = function () {
    window.wsActive = true;
    var statusEl = document.getElementById('serial-status');
    var btnEl    = document.getElementById('btn-serial-connect');
    if (statusEl) {
      statusEl.textContent = '● WS LIVE';
      statusEl.style.color = 'var(--accent-green)';
    }
    if (btnEl) btnEl.textContent = '🔌 DISCONNECT WS';
    if (typeof showToast === 'function')
      showToast('WebSocket connected — live telemetry active', 'success');
  };

  ws.onmessage = function (event) {
    try {
      var packet = JSON.parse(event.data);
      window.telemetryLog.push(packet);
      document.dispatchEvent(
        new CustomEvent('telemetryPacket', { detail: packet })
      );
    } catch (e) {
      console.error('WS parse error:', e);
    }
  };

  ws.onerror = function () {
    if (typeof showToast === 'function')
      showToast('WS Error — is ws_bridge.py running?', 'error');
  };

  ws.onclose = function () {
    window.wsActive = false;
    var statusEl = document.getElementById('serial-status');
    var btnEl    = document.getElementById('btn-serial-connect');
    if (statusEl) {
      statusEl.textContent = '○ WS OFFLINE';
      statusEl.style.color = 'var(--text-secondary)';
    }
    if (btnEl) btnEl.textContent = '🔌 CONNECT WS';
    window.wsConnection = null;
  };

  window.wsConnection = ws;
};

window.disconnectWebSocket = function () {
  if (window.wsConnection) {
    window.wsConnection.close();
    window.wsConnection = null;
  }
};

document.addEventListener('DOMContentLoaded', function () {
  var btn = document.getElementById('btn-serial-connect');
  if (!btn) return;
  btn.addEventListener('click', function () {
    if (window.wsActive) {
      window.disconnectWebSocket();
    } else {
      window.connectWebSocket();
    }
  });
});
