(function () {
  'use strict';

  function flash(el) {
    el.classList.remove('value-flash');
    void el.offsetWidth; // force reflow so animation restarts every packet
    el.classList.add('value-flash');
  }

  function set(id, text) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    flash(el);
  }

  // Phase 11 — reset all telemetry display values to placeholder state
  window.resetDisplayValues = function () {
    var defaults = {
      'tele-altitude':     '---',   'tele-pressure':    '---',
      'tele-temperature':  '---',   'tele-battery':     '---',
      'tele-pkt-count':    '----',  'tele-timestamp':   '--:--:--',
      'tele-descent-rate': '---',   'tele-gps-lat':     '---',
      'tele-gps-lon':      '---',   'tele-gps-alt':     '---',
      'tele-roll':         '---',   'tele-pitch':       '---',
      'tele-yaw':          '---',
    };
    Object.keys(defaults).forEach(function (id) {
      const el = document.getElementById(id);
      if (el) { el.textContent = defaults[id]; el.classList.remove('value-flash'); }
    });
  };

  document.addEventListener('telemetryPacket', function (e) {
    const p = e.detail;

    // Container telemetry
    set('tele-altitude',    p.altitude.toFixed(1));
    set('tele-pressure',    p.pressure.toFixed(2));
    set('tele-temperature', p.temperature.toFixed(1));
    set('tele-battery',     p.battery_voltage.toFixed(2));
    set('tele-pkt-count',   String(p.packet_count).padStart(4, '0'));
    set('tele-timestamp',   p.timestamp);

    // Payload telemetry
    set('tele-descent-rate', p.descent_rate.toFixed(2));
    set('tele-gps-lat',      p.gps_lat.toFixed(6));
    set('tele-gps-lon',      p.gps_lon.toFixed(6));
    set('tele-gps-alt',      p.gps_alt.toFixed(1));
    set('tele-roll',         p.roll.toFixed(1));
    set('tele-pitch',        p.pitch.toFixed(1));
    set('tele-yaw',          p.yaw.toFixed(1));
  });
})();
