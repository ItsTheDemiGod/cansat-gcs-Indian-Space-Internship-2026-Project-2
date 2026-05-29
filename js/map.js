(function () {
  'use strict';

  var LAUNCH_LAT = 13.7330;
  var LAUNCH_LON = 80.2350;

  var map, gpsMarker, trajectory;

  document.addEventListener('DOMContentLoaded', function () {
    map = L.map('map-container', {
      center:          [LAUNCH_LAT, LAUNCH_LON],
      zoom:            13,
      zoomControl:     false,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution:  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains:   'abcd',
      maxZoom:      19,
      detectRetina: true,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Enable scroll-zoom only when the user is actively interacting with the map
    map.on('click',    function () { map.scrollWheelZoom.enable();  });
    map.on('mouseout', function () { map.scrollWheelZoom.disable(); });

    // Static launch-site marker
    L.circleMarker([LAUNCH_LAT, LAUNCH_LON], {
      radius:      5,
      color:       '#ff3b3b',
      fillColor:   '#ff3b3b',
      fillOpacity: 0.75,
      weight:      2,
    })
    .addTo(map)
    .bindPopup('<div class="map-popup-text">LAUNCH SITE — SDSC SRIHARIKOTA</div>');

    // Trajectory polyline — grows with each telemetry point
    trajectory = L.polyline([], {
      color:   '#00d4ff',
      weight:  2,
      opacity: 0.8,
    }).addTo(map);

    // Custom glowing GPS marker
    var markerIcon = L.divIcon({
      className: '',   // removes default white Leaflet box
      html: '<div class="map-marker">' +
              '<div class="map-marker-dot"></div>'  +
              '<div class="map-marker-ring"></div>' +
            '</div>',
      iconSize:   [16, 16],
      iconAnchor: [8, 8],
    });

    gpsMarker = L.marker([LAUNCH_LAT, LAUNCH_LON], { icon: markerIcon }).addTo(map);

    // Let the browser finish flex layout before Leaflet measures the container
    setTimeout(function () { map.invalidateSize(); }, 150);
  });

  document.addEventListener('telemetryPacket', function (e) {
    if (!map || !gpsMarker || !trajectory) return;

    var p      = e.detail;
    var latlng = L.latLng(p.gps_lat, p.gps_lon);

    gpsMarker.setLatLng(latlng);
    trajectory.addLatLng(latlng);
    map.panTo(latlng);

    var latEl = document.getElementById('map-lat');
    var lonEl = document.getElementById('map-lon');
    var altEl = document.getElementById('map-alt');
    if (latEl) latEl.textContent = p.gps_lat.toFixed(6);
    if (lonEl) lonEl.textContent = p.gps_lon.toFixed(6);
    if (altEl) altEl.textContent = p.gps_alt.toFixed(1) + ' m';
  });

  // Phase 11 — clear trajectory and return marker to launch site
  window.resetMapTrajectory = function () {
    if (trajectory) trajectory.setLatLngs([]);
    if (gpsMarker)  gpsMarker.setLatLng([LAUNCH_LAT, LAUNCH_LON]);
    if (map)        map.panTo([LAUNCH_LAT, LAUNCH_LON]);
    var latEl = document.getElementById('map-lat');
    var lonEl = document.getElementById('map-lon');
    var altEl = document.getElementById('map-alt');
    if (latEl) latEl.textContent = '---';
    if (lonEl) lonEl.textContent = '---';
    if (altEl) altEl.textContent = '---';
  };

})();
