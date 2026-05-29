(function () {
  'use strict';

  var BOXES = [
    { box: 'ec-box-d1', dig: 'ec-d1', stat: 'ec-status-d1' },
    { box: 'ec-box-d2', dig: 'ec-d2', stat: 'ec-status-d2' },
    { box: 'ec-box-d3', dig: 'ec-d3', stat: 'ec-status-d3' },
    { box: 'ec-box-d4', dig: 'ec-d4', stat: 'ec-status-d4' },
  ];

  function evaluate(p) {
    return [
      (p.descent_rate >= 8.0 && p.descent_rate <= 10.0) ? 0 : 1,  // D1
      p.gps_fix        ? 0 : 1,                                     // D2
      p.payload_sep    ? 0 : 1,                                     // D3
      p.chute_deployed ? 1 : 0,                                     // D4
    ];
  }

  function render(digits) {
    var hasFault = digits.some(function (d) { return d === 1; });

    digits.forEach(function (val, i) {
      var cfg    = BOXES[i];
      var boxEl  = document.getElementById(cfg.box);
      var digEl  = document.getElementById(cfg.dig);
      var statEl = document.getElementById(cfg.stat);
      if (!boxEl || !digEl || !statEl) return;

      var isFault = val === 1;
      boxEl.className    = 'ec-box ' + (isFault ? 'fault fault-pulse' : 'nominal');
      digEl.textContent  = String(val);
      statEl.textContent = isFault ? 'FAULT' : 'NOMINAL';
    });

    var overallEl   = document.getElementById('ec-overall');
    var overallText = document.getElementById('ec-overall-text');
    if (!overallEl || !overallText) return;

    if (hasFault) {
      overallEl.className    = 'ec-overall fault fault-pulse';
      overallText.textContent = '⚠ FAULT DETECTED';
    } else {
      overallEl.className    = 'ec-overall nominal';
      overallText.textContent = '◉ ALL SYSTEMS NOMINAL';
    }
  }

  document.addEventListener('telemetryPacket', function (e) {
    render(evaluate(e.detail));
  });

  // Phase 11 — reset all boxes to nominal/0
  window.resetErrorCodes = function () { render([0, 0, 0, 0]); };

})();
