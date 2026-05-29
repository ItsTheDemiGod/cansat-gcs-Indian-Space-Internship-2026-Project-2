(function () {
  'use strict';

  var WINDOW_SIZE = 60;

  var CHART_DEFS = [
    { id: 'chart-altitude',     field: 'altitude',         color: '#00d4ff', rgba: '0,212,255',   unit: 'm'   },
    { id: 'chart-pressure',     field: 'pressure',         color: '#7b4fff', rgba: '123,79,255',  unit: 'hPa' },
    { id: 'chart-temperature',  field: 'temperature',      color: '#ffaa00', rgba: '255,170,0',   unit: '°C'  },
    { id: 'chart-descent-rate', field: 'descent_rate',     color: '#00ff88', rgba: '0,255,136',   unit: 'm/s' },
    { id: 'chart-battery',      field: 'battery_voltage',  color: '#ff3b3b', rgba: '255,59,59',   unit: 'V'   },
  ];

  // Returns a backgroundColor callback that creates a top-to-transparent gradient.
  // The gradient is rebuilt only when the chart area dimensions change.
  function makeBgFn(rgba) {
    var cached = null;
    return function (context) {
      var chart     = context.chart;
      var area      = chart.chartArea;
      if (!area) return 'transparent';
      if (!cached || cached.w !== area.width || cached.h !== area.height) {
        var g = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
        g.addColorStop(0, 'rgba(' + rgba + ',0.22)');
        g.addColorStop(1, 'rgba(' + rgba + ',0.0)');
        cached = { gradient: g, w: area.width, h: area.height };
      }
      return cached.gradient;
    };
  }

  var TICK_STYLE = {
    color: '#7aaec8',
    font:  { size: 8, family: "'Exo 2', sans-serif" },
  };

  var GRID_COLOR   = 'rgba(0,212,255,0.07)';
  var BORDER_COLOR = 'rgba(0,212,255,0.14)';

  function makeConfig(def) {
    return {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          data:            [],
          borderColor:     def.color,
          borderWidth:     2,
          tension:         0.4,
          pointRadius:     0,
          fill:            true,
          backgroundColor: makeBgFn(def.rgba),
        }]
      },
      options: {
        animation:           false,
        responsive:          true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(1,10,20,0.92)',
            borderColor:     def.color,
            borderWidth:     1,
            titleColor:      '#7aaec8',
            bodyColor:       def.color,
            titleFont: { family: "'Exo 2', sans-serif",         size: 9,  weight: '600' },
            bodyFont:  { family: "'Share Tech Mono', monospace", size: 11 },
            padding:   6,
            callbacks: {
              label: function (item) {
                return ' ' + item.formattedValue + ' ' + def.unit;
              }
            }
          }
        },
        scales: {
          x: {
            border: { color: BORDER_COLOR },
            grid:   { color: GRID_COLOR   },
            ticks:  Object.assign({}, TICK_STYLE, {
              maxTicksLimit: 6,
              maxRotation:   0,
              autoSkip:      true,
            })
          },
          y: {
            border: { color: BORDER_COLOR },
            grid:   { color: GRID_COLOR   },
            ticks:  Object.assign({}, TICK_STYLE, { maxTicksLimit: 4 }),
          }
        }
      }
    };
  }

  document.addEventListener('DOMContentLoaded', function () {
    Chart.defaults.color       = '#7aaec8';
    Chart.defaults.font.family = "'Exo 2', sans-serif";
    Chart.defaults.font.size   = 9;

    window.charts = {};

    CHART_DEFS.forEach(function (def) {
      var canvas = document.getElementById(def.id);
      if (!canvas) return;
      window.charts[def.field] = new Chart(canvas, makeConfig(def));
    });
  });

  document.addEventListener('telemetryPacket', function (e) {
    var p = e.detail;
    if (!window.charts) return;

    CHART_DEFS.forEach(function (def) {
      var chart = window.charts[def.field];
      if (!chart) return;
      chart.data.labels.push(p.timestamp);
      chart.data.datasets[0].data.push(p[def.field]);
      if (chart.data.labels.length > WINDOW_SIZE) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
      }
      chart.update('none');
    });
  });
})();
