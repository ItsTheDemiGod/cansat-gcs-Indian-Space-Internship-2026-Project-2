(function () {
  'use strict';

  var videoEl, rocketVideoEl, selectEl, btnStart, btnStop, statusEl, placeholderEl, errorEl;
  var rocketCamActive = false;
  var ROCKET_CAM_VAL  = 'rocket-cam';

  // ── Camera enumeration ────────────────────────────────────────
  function populateCameras() {
    return navigator.mediaDevices.enumerateDevices()
      .then(function (devices) {
        var cameras = devices.filter(function (d) { return d.kind === 'videoinput'; });
        selectEl.innerHTML = '';

        // ROCKET CAM is always the first option
        var rocketOpt = document.createElement('option');
        rocketOpt.value       = ROCKET_CAM_VAL;
        rocketOpt.textContent = '🚀 ROCKET CAM (DEMO)';
        selectEl.appendChild(rocketOpt);

        cameras.forEach(function (cam, i) {
          var opt = document.createElement('option');
          opt.value       = cam.deviceId;
          opt.textContent = cam.label || ('Camera ' + (i + 1));
          selectEl.appendChild(opt);
        });

        btnStart.disabled = false;
      })
      .catch(function (err) {
        console.warn('[GCS] enumerateDevices:', err);
      });
  }

  // ── Start rocket cam ──────────────────────────────────────────
  function startRocketCam() {
    rocketCamActive = true;
    showRocketCam();
    rocketVideoEl.play().catch(function (e) {
      console.warn('[GCS] rocketVideo.play():', e);
    });
    btnStart.disabled = true;
    btnStop.disabled  = false;
    setStatus('live');
  }

  // ── Start webcam stream ───────────────────────────────────────
  function startStream() {
    if (selectEl.value === ROCKET_CAM_VAL) {
      startRocketCam();
      return;
    }

    var deviceId = selectEl.value;
    var constraints = {
      video: {
        deviceId: deviceId ? { exact: deviceId } : true,
        width:    { ideal: 1280 },
        height:   { ideal: 720  },
      }
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then(function (stream) {
        window.activeStream = stream;
        videoEl.srcObject   = stream;

        showVideo();
        // Labels become available after permission — repopulate then re-select
        populateCameras().then(function () {
          if (deviceId) selectEl.value = deviceId;
        });

        btnStart.disabled = true;
        btnStop.disabled  = false;
        setStatus('live');
      })
      .catch(function (err) {
        console.warn('[GCS] getUserMedia:', err);
        var msg;
        switch (err.name) {
          case 'NotAllowedError':
          case 'PermissionDeniedError':
            msg = 'CAMERA ACCESS DENIED'; break;
          case 'NotFoundError':
          case 'DevicesNotFoundError':
            msg = 'CAMERA NOT FOUND'; break;
          case 'NotReadableError':
          case 'TrackStartError':
            msg = 'CAMERA IN USE'; break;
          default:
            msg = 'STREAM ERROR: ' + err.name;
        }
        showError(msg);
      });
  }

  // ── Stop all sources ──────────────────────────────────────────
  function stopStream() {
    if (window.activeStream) {
      window.activeStream.getTracks().forEach(function (t) { t.stop(); });
      window.activeStream = null;
    }
    videoEl.srcObject = null;

    rocketVideoEl.pause();
    rocketCamActive = false;

    showPlaceholder();
    btnStart.disabled = false;
    btnStop.disabled  = true;
    setStatus('offline');
  }

  // ── View state helpers ────────────────────────────────────────
  function showVideo() {
    videoEl.style.display            = '';
    rocketVideoEl.style.display      = 'none';
    placeholderEl.style.display      = 'none';
    errorEl.style.display            = 'none';
  }

  function showRocketCam() {
    videoEl.style.display            = 'none';
    rocketVideoEl.style.display      = '';
    placeholderEl.style.display      = 'none';
    errorEl.style.display            = 'none';
  }

  function showPlaceholder() {
    videoEl.style.display            = 'none';
    rocketVideoEl.style.display      = 'none';
    placeholderEl.style.display      = '';
    errorEl.style.display            = 'none';
  }

  function showError(msg) {
    videoEl.style.display            = 'none';
    rocketVideoEl.style.display      = 'none';
    placeholderEl.style.display      = 'none';
    errorEl.style.display            = '';
    errorEl.textContent              = msg;
  }

  // ── Status indicator ──────────────────────────────────────────
  function setStatus(state) {
    if (!statusEl) return;
    statusEl.textContent = state === 'live' ? '● LIVE' : '○ OFFLINE';
    statusEl.className   = 'stream-status ' + state;
  }

  // ── Init ──────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    videoEl       = document.getElementById('stream-video');
    rocketVideoEl = document.getElementById('rocket-cam-video');
    selectEl      = document.getElementById('camera-select');
    btnStart      = document.getElementById('btn-stream-start');
    btnStop       = document.getElementById('btn-stream-stop');
    statusEl      = document.getElementById('stream-status');
    placeholderEl = document.getElementById('vid-placeholder');
    errorEl       = document.getElementById('vid-error');

    // Buttons work for both rocket cam and webcam
    btnStart.addEventListener('click', startStream);
    btnStop.addEventListener('click',  stopStream);

    // Source switch while active: stop cleanly so user can restart
    selectEl.addEventListener('change', function () {
      if (window.activeStream || rocketCamActive) stopStream();
    });

    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      // No webcam API — rocket cam still works
      selectEl.innerHTML =
        '<option value="' + ROCKET_CAM_VAL + '">🚀 ROCKET CAM (DEMO)</option>';
      btnStart.disabled = false;
      return;
    }

    populateCameras();
  });
})();
