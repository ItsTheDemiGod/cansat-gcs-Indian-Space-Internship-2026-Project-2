(function () {
  'use strict';

  var DEG  = Math.PI / 180;
  var LERP = 0.05;

  var renderer, camera, scene, cansat;
  var targetRoll  = 0, targetPitch  = 0, targetYaw  = 0;
  var currentRoll = 0, currentPitch = 0, currentYaw = 0;

  // ── Build CanSat model from Three.js primitives ───────────────
  function buildCanSat() {
    var group = new THREE.Group();

    var bodyMat = new THREE.MeshPhongMaterial({
      color:     0x1a2a3a,
      specular:  0x00d4ff,
      shininess: 80,
    });
    var capMat = new THREE.MeshPhongMaterial({
      color:     0x0a1520,
      specular:  0x00d4ff,
      shininess: 60,
    });
    var antMat = new THREE.MeshPhongMaterial({
      color:    0x00d4ff,
      specular: 0xffffff,
      shininess: 120,
      emissive: 0x003344,
    });
    var finMat = new THREE.MeshPhongMaterial({
      color:     0x0d2035,
      specular:  0x00d4ff,
      shininess: 50,
    });

    // 1. Main body
    group.add(new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 1.2, 32),
      bodyMat
    ));

    // 2 & 3. Top / bottom caps
    var capGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 32);
    var topCap = new THREE.Mesh(capGeo, capMat);
    topCap.position.y = 0.64;
    group.add(topCap);

    var botCap = new THREE.Mesh(capGeo, capMat);
    botCap.position.y = -0.64;
    group.add(botCap);

    // 4. Antenna (top-center, pointing up)
    var ant = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.5, 8),
      antMat
    );
    ant.position.y = 0.93;
    group.add(ant);

    // 5. Fins — 4 evenly spaced using pivot groups so rotation is clean
    var finGeo = new THREE.BoxGeometry(0.08, 0.35, 0.25);
    for (var i = 0; i < 4; i++) {
      var pivot = new THREE.Group();
      pivot.rotation.y = (Math.PI / 2) * i;
      var fin = new THREE.Mesh(finGeo, finMat);
      // 0.35 body radius + 0.125 half-depth of fin = 0.475
      fin.position.set(0, -0.425, 0.475);
      pivot.add(fin);
      group.add(pivot);
    }

    // 6. Cyan wireframe overlay on the body
    var wireGeo = new THREE.WireframeGeometry(
      new THREE.CylinderGeometry(0.35, 0.35, 1.2, 32)
    );
    var wireMat = new THREE.LineBasicMaterial({
      color:       0x00d4ff,
      transparent: true,
      opacity:     0.15,
    });
    group.add(new THREE.LineSegments(wireGeo, wireMat));

    return group;
  }

  // ── Init scene ───────────────────────────────────────────────
  function init() {
    var container = document.getElementById('orientation-container');
    if (!container) return;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 4;

    // Lights
    scene.add(new THREE.AmbientLight(0x1a3a5c, 0.6));

    var keyLight = new THREE.DirectionalLight(0x00d4ff, 1.2);
    keyLight.position.set(2, 3, 2);
    scene.add(keyLight);

    var rimLight = new THREE.DirectionalLight(0x7b4fff, 0.4);
    rimLight.position.set(-2, -1, -1);
    scene.add(rimLight);

    // Renderer — alpha:true keeps background transparent so panel bg shows
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Model
    cansat = buildCanSat();
    scene.add(cansat);

    // Responsive: resize renderer to match container whenever it changes
    function resize() {
      var w = container.clientWidth;
      var h = container.clientHeight;
      if (w < 1 || h < 1) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    var ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();
  }

  // ── Render loop ──────────────────────────────────────────────
  function animate() {
    requestAnimationFrame(animate);
    if (!renderer || !cansat) return;

    if (window.telemetryActive) {
      // Smooth lerp toward telemetry targets
      currentRoll  += (targetRoll  - currentRoll)  * LERP;
      currentPitch += (targetPitch - currentPitch) * LERP;
      currentYaw   += (targetYaw   - currentYaw)   * LERP;
    } else {
      // Idle showcase spin around Y axis
      currentYaw += 0.005;
    }

    cansat.rotation.z = currentRoll;
    cansat.rotation.x = currentPitch;
    cansat.rotation.y = currentYaw;

    renderer.render(scene, camera);
  }

  // ── Event listeners ──────────────────────────────────────────
  document.addEventListener('telemetryPacket', function (e) {
    var p = e.detail;

    targetRoll  = p.roll  * DEG;
    targetPitch = p.pitch * DEG;
    targetYaw   = p.yaw   * DEG;

    var rollEl  = document.getElementById('rpy-roll');
    var pitchEl = document.getElementById('rpy-pitch');
    var yawEl   = document.getElementById('rpy-yaw');
    if (rollEl)  rollEl.textContent  = p.roll.toFixed(1)  + '°';
    if (pitchEl) pitchEl.textContent = p.pitch.toFixed(1) + '°';
    if (yawEl)   yawEl.textContent   = p.yaw.toFixed(1)   + '°';
  });

  document.addEventListener('DOMContentLoaded', function () {
    init();
    animate();
  });
})();
