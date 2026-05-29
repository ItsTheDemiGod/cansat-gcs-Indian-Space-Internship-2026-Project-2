# CanSat Ground Control Software (GCS)
## Project Memory File — Read this at the start of EVERY session. Update after every phase.

---

## Project Overview
**STATUS: ✅ ALL 11 PHASES COMPLETE — PROJECT DELIVERED**

A professional, single-page Ground Control Software (SPA) for a CanSat mission.
Assigned by: India Space Lab (ISL), New Delhi
The interface must feel like a real NASA/ISRO mission operations center — dark, immersive,
space-themed with live animations, glowing UI elements, and cinematic visual quality.

---

## Critical Rules for Claude Code
- Read this file at the start of every session before writing any code
- Never redo a phase already marked ✅ Done
- After every phase, update the Phase Tracker table AND the Update Log at the bottom
- Every JS module must be imported in index.html as a script tag
- Never inline large JS blocks inside index.html — keep them in their respective js/ files
- All CDN libraries go in index.html <head> only
- If a bug is found mid-phase, fix it and note it in Known Issues before moving on

---

## File Structure
```
cansat-gcs/
├── index.html                  # Main HTML shell — layout only, no logic
├── css/
│   └── style.css               # All styling, animations, design system
├── js/
│   ├── telemetry.js            # Phase 3 — simulation engine, packet generator
│   ├── display.js              # Phase 4 — telemetry display panel updater
│   ├── errorcode.js            # Phase 5 — 4-digit fault monitor
│   ├── graphs.js               # Phase 6 — Chart.js real-time graphs
│   ├── controls.js             # Phase 7 — mission control panel + commands
│   ├── map.js                  # Phase 8 — Leaflet.js GPS tracking map
│   ├── orientation.js          # Phase 9 — Three.js orientation visualization
│   ├── video.js                # Phase 10 — MediaDevices camera stream
│   └── datamanager.js          # Phase 11 — CSV export, graph export, logging
├── serial_simulator/
│   ├── cansat_serial_sim.py    # Python virtual serial telemetry simulator (pyserial, legacy)
│   ├── ws_bridge.py            # WebSocket bridge — preferred over com0com (ws://localhost:8765)
│   └── README.md               # Setup guide for com0com + Web Serial API testing
└── CLAUDE.md                   # This file
```

---

## Design System & Visual Identity

### Theme
**"Deep Space Operations"** — The UI should feel like you are inside a real space mission
control room. Think: ISS telemetry screens, ISRO PSLV launch dashboards, SpaceX Dragon
mission ops. Dark, dense, data-rich but beautiful.

### Aesthetic Direction
- **Tone:** Retro-futuristic mission ops — cinematic dark dashboard with glowing accents
- **Unforgettable element:** Animated star field background (CSS/canvas particles) that
  slowly drifts, giving the feeling of being in space. Subtle nebula-like gradient blobs
  pulse in the background behind panels.
- **Panel style:** Glassmorphism panels — semi-transparent dark glass with glowing cyan
  borders and subtle inner glow. Feels like holographic screens floating in space.
- **Data readout style:** Monospace font for all telemetry values (like real mission screens)
- **Animations:** Smooth, not flashy. Data values should count up/transition. Charts animate
  in. Map marker pulses. Error codes flash on fault.

### Color Palette (CSS Variables)
```css
--bg-deep:        #010a14;       /* deepest background — near black with blue tint */
--bg-panel:       rgba(5, 18, 35, 0.75);  /* glassmorphism panel base */
--border-glow:    #00d4ff;       /* primary cyan glow — panel borders, accents */
--accent-primary: #00d4ff;       /* cyan — main interactive elements */
--accent-secondary: #7b4fff;     /* purple — secondary highlights, graph lines */
--accent-amber:   #ffaa00;       /* amber — warnings */
--accent-green:   #00ff88;       /* green — nominal/success states */
--accent-red:     #ff3b3b;       /* red — faults, errors */
--text-primary:   #e8f4fd;       /* near-white for main labels */
--text-secondary: #7aaec8;       /* muted blue-white for secondary labels */
--text-mono:      #00d4ff;       /* cyan monospace for live data values */
--grid-line:      rgba(0, 212, 255, 0.08); /* subtle grid lines on panels */
```

### Typography
```
Display / Headers:  'Orbitron', sans-serif  (Google Fonts — space/tech feel)
Telemetry Values:   'Share Tech Mono', monospace  (Google Fonts — terminal readout)
Body / Labels:      'Exo 2', sans-serif  (Google Fonts — clean sci-fi UI font)
```
Add to index.html:
```html
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;900&family=Share+Tech+Mono&family=Exo+2:wght@300;400;600&display=swap" rel="stylesheet">
```

### Background Animation
- Full-page canvas (`#starfield`) positioned fixed behind everything
- Renders 200+ slow-drifting star particles (white dots, varying opacity and size)
- 3–4 large radial gradient "nebula" blobs (deep purple, deep cyan) that slowly pulse/breathe
  using CSS keyframe scale + opacity animation
- Scanline overlay: a repeating CSS linear-gradient of ultra-subtle horizontal lines (1px)
  over the entire viewport for a CRT/mission-screen feel

### Panel Design
Every panel card must have:
- `background: var(--bg-panel)`
- `backdrop-filter: blur(12px)`
- `border: 1px solid rgba(0, 212, 255, 0.25)`
- `box-shadow: 0 0 20px rgba(0, 212, 255, 0.08), inset 0 0 40px rgba(0, 0, 0, 0.4)`
- Panel header bar with `var(--border-glow)` left-border accent and section title in Orbitron
- Corner decorations: small L-shaped CSS brackets in the 4 corners of each panel (pure CSS)

### Micro-animations
- Telemetry values: when a value changes, briefly flash `var(--accent-primary)` then settle
- Error digits: fault state (1) triggers a CSS pulse/blink animation in red
- Mission status indicator in header: animated blinking dot (green = active, red = stopped)
- Buttons: hover state with glow box-shadow, active state with depressed scale(0.97)
- Chart lines: smooth curve animation on data entry
- Map marker: pulsing CSS ring animation around current GPS position

---

## Dashboard Layout (CSS Grid)

```
┌─────────────────────────────────────────────────────────────────┐
│                    HEADER BAR (mission name, time, status)       │
├─────────────────────────────────────────────────────────────────┤
│                    TOP CONTROL BAR (buttons row)                 │
├──────────────┬──────────────────────────────┬───────────────────┤
│  TELEMETRY   │      REAL-TIME GRAPHS        │  MISSION CONTROL  │
│  DISPLAY     │      (Chart.js — 5 charts)   │  PANEL            │
│  PANEL       │                              │                   │
│  (left col)  │      (center col — wide)     │  (right col)      │
├──────────────┴──────────┬───────────────────┴───────────────────┤
│  TRACKING MAP           │  ORIENTATION VIZ   │  VIDEO STREAM     │
│  (Leaflet.js)           │  (Three.js)        │  (camera feed)   │
└─────────────────────────┴────────────────────┴──────────────────┘
```

Grid spec for index.html:
```css
.dashboard-grid {
  display: grid;
  grid-template-rows: auto auto 1fr 1fr;
  grid-template-columns: 280px 1fr 260px;
  gap: 12px;
  padding: 12px;
  height: 100vh;
}
```

---

## CDN Libraries (All go in index.html `<head>`)
```html
<!-- Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;900&family=Share+Tech+Mono&family=Exo+2:wght@300;400;600&display=swap" rel="stylesheet">

<!-- Leaflet CSS (must come before Leaflet JS) -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>

<!-- Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>

<!-- Leaflet JS -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<!-- Three.js -->
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js"></script>
```

---

## Telemetry Packet Format
Every simulated packet is a JS object with these fields:

```js
{
  packet_count:    Number,   // increments each packet
  timestamp:       String,   // HH:MM:SS format
  // Container telemetry
  altitude:        Number,   // meters, starts ~400, descends
  pressure:        Number,   // hPa, ~1013 at ground, decreases with altitude
  temperature:     Number,   // °C, varies with altitude
  battery_voltage: Number,   // V, 7.2–8.4V range
  // Payload telemetry
  descent_rate:    Number,   // m/s, target 8–10 during descent
  gps_lat:         Number,   // decimal degrees
  gps_lon:         Number,   // decimal degrees
  gps_alt:         Number,   // GPS altitude in meters
  roll:            Number,   // degrees -180 to 180
  pitch:           Number,   // degrees -90 to 90
  yaw:             Number,   // degrees 0 to 360
  // Mission state flags
  gps_fix:         Boolean,  // true = GPS available
  payload_sep:     Boolean,  // true = payload separated successfully
  chute_deployed:  Boolean,  // true = emergency parachute activated
}
```

---

## Error Code System (4-digit)

| Digit | Condition | 0 = Nominal | 1 = Fault |
|-------|-----------|-------------|-----------|
| 1 | Descent Rate | Within 8–10 m/s | Outside safe range |
| 2 | GPS Availability | GPS fix available | GPS unavailable |
| 3 | Payload Separation | Separated successfully | Separation failure |
| 4 | Emergency Parachute | Parachute inactive | Parachute activated |

Display format: `[D1][D2][D3][D4]` — each digit is its own colored box.

---

## Mission Control Commands

| Command | Button Label | Confirm Required | Log Message |
|---------|-------------|-----------------|-------------|
| Manual Separation | MANUAL SEP | Yes | "CMD: MANUAL_SEPARATION — EXECUTED" |
| Emergency Parachute | EMRG CHUTE | Yes | "CMD: EMERGENCY_PARACHUTE — DEPLOYED" |
| Redundant Activation | REDUNDANT ACT | Yes | "CMD: REDUNDANT_ACTIVATION — SENT" |

Command log shows last 5 commands with timestamp + status badge.

---

## Phase Tracker

| Phase | Name | Status |
|-------|------|--------|
| 1 | Project Scaffolding & Interface Layout | ✅ Done |
| 2 | Top Control Bar | ✅ Done |
| 3 | Telemetry Simulation Engine | ✅ Done |
| 4 | Telemetry Display Panel | ✅ Done |
| 5 | Error Code System | ✅ Done |
| 6 | Real-Time Graphs | ✅ Done |
| 7 | Mission Control Panel | ✅ Done |
| 8 | Tracking Map | ✅ Done |
| 9 | Orientation Visualization | ✅ Done |
| 10 | Live Video Stream | ✅ Done |
| 11 | Data Management & Export | ✅ Done |

---

## Phase Details

### Phase 1 — Project Scaffolding & Interface Layout
**Status:** ✅ Done
**Files to create:** `index.html`, `css/style.css`
**Goal:**
- Full HTML shell with all 8 panel placeholders in correct CSS Grid layout
- Starfield canvas background (animated JS particles — put in a `<script>` at bottom of index.html for now, move to bg.js if needed)
- Nebula gradient blobs (CSS only, animated pulse)
- Scanline overlay (CSS only)
- All Google Fonts loaded
- All CDN libraries loaded
- Design system CSS variables defined in :root
- Panel glassmorphism styling applied to all cards
- Corner bracket decorations on panels (CSS pseudo-elements)
- Header bar with: mission logo/name "CANSAT-GCS | INDIA SPACE LAB", live clock (JS), mission elapsed time, connection status dot
- Each panel has a header with section title in Orbitron font
**Done when:** Opens in browser, looks stunning, all panels visible, starfield animating, clock ticking. No functionality yet.

---

### Phase 2 — Top Control Bar
**Status:** ✅ Done
**Files:** `index.html` (HTML), `css/style.css` (styling), `js/controls.js` (handlers)
**Goal:**
- 6 styled buttons: START TELEMETRY, STOP TELEMETRY, EXPORT CSV, EXPORT GRAPH, SYNC PC TIME, RESET PACKET
- START is green-glowing, STOP is red-glowing, others are cyan-glowing
- START/STOP are mutually toggled (one active at a time)
- Telemetry running state stored as `window.telemetryActive = false`
- Sync PC Time updates a displayed timestamp
- All buttons log to console for now
**Done when:** All buttons render beautifully, state toggles correctly, no broken layout

---

### Phase 3 — Telemetry Simulation Engine
**Status:** ✅ Done
**File:** `js/telemetry.js`
**Goal:**
- `startTelemetry()` and `stopTelemetry()` functions (called by controls.js)
- Uses `setInterval` at 1000ms
- Generates realistic packet per format above
- Altitude descends gradually from 400m to 0m over ~400 packets
- descent_rate fluctuates around 9 m/s with small noise
- GPS coordinates drift slightly from a start point (simulate movement)
- roll/pitch/yaw change smoothly with small random deltas
- battery_voltage slowly drains from 8.4V to 7.2V
- Fires a custom event: `document.dispatchEvent(new CustomEvent('telemetryPacket', { detail: packet }))`
- All other modules listen to this event — they never call telemetry.js directly
**Done when:** Packets firing in console at 1s interval, all fields realistic, event fires correctly

---

### Phase 4 — Telemetry Display Panel
**Status:** ⬜ Not Started
**File:** `js/display.js`
**Goal:**
- Listens to `telemetryPacket` event
- Updates all telemetry value elements in the DOM
- Container Telemetry section: Altitude, Pressure, Temperature, Battery Voltage, Packet Count, Timestamp
- Payload Telemetry section: Descent Rate, GPS Lat, GPS Lon, GPS Alt, Roll, Pitch, Yaw
- Values display in `Share Tech Mono` font in cyan
- On value change: briefly add CSS class `.value-flash` (keyframe: cyan → white → cyan)
- Units shown next to each value in smaller muted text
**Done when:** All 13 fields update live every second, flash animation works

---

### Phase 5 — Error Code System
**Status:** ⬜ Not Started
**File:** `js/errorcode.js`
**Goal:**
- Listens to `telemetryPacket` event
- Evaluates all 4 conditions per packet
- Renders error code display: 4 boxes side by side labeled D1 D2 D3 D4
- Each box: large digit (0 or 1), condition name below
- Nominal (0): green glow, green text
- Fault (1): red glow, red text, CSS pulse blink animation
- Overall status line: "ALL SYSTEMS NOMINAL" (green) or "FAULT DETECTED" (red, blinking)
**Done when:** Error digits respond correctly to telemetry values, animations work

---

### Phase 6 — Real-Time Graphs
**Status:** ⬜ Not Started
**File:** `js/graphs.js`
**Goal:**
- Initialize 5 Chart.js line charts on page load
- Charts: Altitude (m), Pressure (hPa), Temperature (°C), Descent Rate (m/s), Battery Voltage (V)
- Chart.js global defaults: dark background, cyan grid lines, cyan line color (use accent-secondary for some variety)
- Rolling window: keep last 60 data points max (shift oldest when full)
- Listens to `telemetryPacket` event, pushes new data point to each chart
- Charts use `animation: false` for smooth real-time feel (no per-point animation lag)
- Chart titles in Orbitron font, axis labels in Exo 2
**Done when:** All 5 charts update in real time, look dark and styled, no performance lag

---

### Phase 7 — Mission Control Panel
**Status:** ⬜ Not Started
**File:** `js/controls.js` (extend this file)
**Goal:**
- 3 command buttons as styled in design system (amber/red for critical commands)
- Each click: show a confirmation modal overlay ("CONFIRM COMMAND: MANUAL SEPARATION?")
- Modal has CONFIRM (green) and CANCEL (red) buttons
- On confirm: log command to command log panel
- Command log: shows last 5 commands, each entry has timestamp + command name + green "EXECUTED" badge
- Commands set relevant flags in `window.missionState` object
**Done when:** All 3 commands work with confirmation, log displays correctly

---

### Phase 8 — Tracking Map
**Status:** ⬜ Not Started
**File:** `js/map.js`
**Goal:**
- Initialize Leaflet map in its panel div on page load
- Use OpenStreetMap tiles with a dark tile layer (CartoDB Dark Matter preferred):
  `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
- Start position: use a launch site coordinate (e.g. SDSC Sriharikota: 13.7330, 80.2350)
- On each `telemetryPacket` event: update marker to new GPS lat/lon
- Draw trajectory as a cyan polyline, add each new point to it
- Custom marker: glowing cyan dot with CSS pulse ring (use Leaflet divIcon)
- Map auto-pans to keep marker centered
**Done when:** Map loads dark, marker moves with GPS data, trajectory line grows

---

### Phase 9 — Orientation Visualization
**Status:** ⬜ Not Started
**File:** `js/orientation.js`
**Goal:**
- Initialize Three.js scene in its panel div
- Create a CanSat-like 3D model: a cylinder (main body) with small fins (box geometries)
  painted in metallic dark gray with cyan wireframe outline overlay
- Ambient + directional light with cyan tint
- On each `telemetryPacket` event: apply roll/pitch/yaw as Euler rotation to the model
  (smooth interpolation using lerp — don't snap)
- Background of Three.js canvas: transparent (panel bg shows through)
- RPY values also displayed as text readout below the 3D view
**Done when:** 3D model rotates correctly in real time, looks polished

---

### Phase 10 — Live Video Stream
**Status:** ⬜ Not Started
**File:** `js/video.js`
**Goal:**
- On page load: enumerate available cameras using `MediaDevices.enumerateDevices()`
- Populate a `<select>` dropdown with camera options
- START STREAM button: calls `getUserMedia()`, pipes stream to `<video>` element
- STOP STREAM button: stops all tracks, clears video src
- Status indicator: "● LIVE" (red dot, blinking) when active, "○ OFFLINE" when not
- Graceful fallback: if no camera, show "NO CAMERA DETECTED" message in panel
**Done when:** Camera feed shows in panel, start/stop work, status updates correctly

---

### Phase 11 — Data Management & Export
**Status:** ⬜ Not Started
**File:** `js/datamanager.js`
**Goal:**
- Maintain `window.telemetryLog = []` array — push every packet to it
- **Export CSV:** Build CSV string from telemetryLog array, trigger download as
  `cansat_telemetry_[timestamp].csv` using Blob API
- **Export Graph:** Use `chart.toBase64Image()` on each Chart.js instance,
  compile all 5 into a single canvas, download as `cansat_graphs_[timestamp].png`
- **Reset Packet:** Clear telemetryLog, reset packet_count to 0, clear all chart data,
  clear map trajectory polyline, reset all telemetry display values to `---`
- Wire Export CSV button (Phase 2) to `exportCSV()` from this module
- Wire Export Graph button (Phase 2) to `exportGraphs()` from this module
- Wire Reset Packet button (Phase 2) to `resetAll()` from this module
**Done when:** CSV downloads with correct data, graph image downloads, reset clears everything

---

## Module Communication Pattern
All modules communicate through the telemetry event system:
```
telemetry.js  →  fires 'telemetryPacket' CustomEvent
                        ↓
    display.js    errorcode.js    graphs.js    map.js    orientation.js
    (all listen to the same event independently)

controls.js   →  calls startTelemetry() / stopTelemetry() from telemetry.js
datamanager.js → reads window.telemetryLog (written by telemetry.js)
```
**Never import one module into another. Use window globals and CustomEvents only.**

---

## Known Issues / Notes
- **Graph export font**: The offscreen canvas for graph export uses `"Orbitron"` and `"Exo 2"` font names. If Google Fonts haven't finished loading at export time, the browser may fall back to sans-serif for the title/labels on the composite image. This is non-critical.
- **enumerateDevices labels**: Camera labels may appear as empty strings on first load (before permissions are granted). They populate correctly after the first successful `getUserMedia` call. Labels show "Camera N" as fallback until then.
- **Leaflet popup clip**: `overflow: hidden` on `.panel` may clip popups or the pulsing marker ring near panel edges. Cosmetic only.
- **Yaw lerp wrap-around**: When yaw crosses 0°/360°, the orientation lerp will rotate the long way around. Delta is ≤4° per packet so this is rarely noticeable in practice.

### Bugs Fixed During Polish Pass (2026-05-28)
- **FIXED**: `controls.js` was re-initialising `window.missionState` on load, overwriting the copy set by `telemetry.js`. Removed the duplicate initialisation; `telemetry.js` is now the sole owner.
- **FIXED**: MET (Mission Elapsed Time) display was static — never started or stopped. Added `startMET()` / `stopMET()` / `window.resetMET()` to the Phase 2 IIFE in controls.js, wired to START/STOP buttons.
- **FIXED**: `resetAll()` in datamanager.js was clearing the command-log `innerHTML` directly but not the `logStack` array inside controls.js's closure, meaning old entries would re-appear on the next command. Added `window.resetCommandLog()` exposed from controls.js and called from `resetAll()`.
- **FIXED**: `resetAll()` now also calls `window.resetMET()` to reset the MET counter.
- **FIXED**: `#map-info-overlay` CSS had a dead `position: fixed` declaration above `position: absolute`. Removed the redundant line.
- **FIXED**: HTML `<title>` was mixed-case ("India Space Lab"). Updated to "INDIA SPACE LAB" per spec.
- **ADDED**: Responsive CSS — at ≤900px viewports the body allows scrolling (instead of clipping) and columns compress. At ≤680px a single-column stacked layout activates for basic phone compatibility.

---

## External Libraries Reference

| Library | Purpose | CDN |
|---------|---------|-----|
| Chart.js 4.4 | Real-time graphs | `https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js` |
| Leaflet.js 1.9.4 | GPS tracking map | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` |
| Three.js r128 | 3D orientation viz | `https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js` |
| Orbitron | Display font | Google Fonts |
| Share Tech Mono | Telemetry readout font | Google Fonts |
| Exo 2 | UI body font | Google Fonts |

---

## Update Log

| Date | Phase | What Was Built / Changed |
|------|-------|--------------------------|
| — | Init | Project initialized, CLAUDE.md created |
| 2026-05-28 | Phase 1 | Built index.html + css/style.css: 3-column CSS Grid layout, animated starfield canvas (220+ particles), 4 CSS nebula blobs with breathe animation, CRT scanline overlay, glassmorphism panels with corner brackets, header bar with SVG logo + UTC live clock + MET display + blinking status dot. All 8 panel placeholders in place. |
| 2026-05-28 | Phase 2 | Built top control bar: 6 styled buttons (START green, STOP red, others cyan), START/STOP mutual toggle with window.telemetryActive, STOP has subtle ready-pulse animation when enabled, SYNC PC TIME updates Local timestamp with green flash, all utility buttons forward to Phase 11 hooks. Created js/controls.js with full handlers. |
| 2026-05-28 | Phase 3 | Created js/telemetry.js: startTelemetry/stopTelemetry on window, setInterval 1000ms, full packet format. Altitude ~1-1.5 m/s descent (faster high, slower near ground, ~400 packets total). descent_rate ~9 m/s with mean-reversion + 8% spike events (2-4 pkts each) for error code triggering. GPS Sriharikota origin with directional wind drift. roll/pitch/yaw ±2°/tick. Battery 8.4→7.2V over 400 pkts. ISA barometric pressure + temperature. gps_fix 95% true. payload_sep below 200m. chuteDeployed driven by window.missionState.emergencyChute. Dispatches telemetryPacket CustomEvent + pushes to window.telemetryLog. Script loaded before controls.js. |
| 2026-05-28 | Polish | Fixed 7 bugs found during code review: duplicate missionState init (controls.js), static MET timer (added startMET/stopMET/resetMET), resetAll logStack not cleared (added window.resetCommandLog), MET not reset on resetAll, dead CSS position:fixed on map-info-overlay, title casing. Added responsive CSS for ≤900px (scroll) and ≤680px (single-column stack). Project complete — all 11 phases built and integration-reviewed. |
| 2026-05-28 | Phase 11 | Created js/datamanager.js: exportCSV reads window.telemetryLog, builds CSV with 16-column header, downloads via Blob+createObjectURL. exportGraphs draws 5 chart canvases onto 1200×900 offscreen canvas (chart.canvas direct drawImage — synchronous, no async image loading needed), 2+2+1 grid layout with label overlays, downloads as PNG. resetAll: window.confirm() → stops telemetry via btn-stop.click(), clears log/charts/map/display/errorcodes/missionState/commandLog/RPY display using 10 exposed reset hooks. Toast system: dynamically created #toast-container, double-rAF trick for reliable slide-in transition, 3s auto-dismiss. Exposed window.exportCSV / exportGraphs / resetAll (controls.js was already stubbed to call these). Added reset hooks to telemetry.js (resetPacketCount), display.js (resetDisplayValues), errorcode.js (resetErrorCodes via render([0,0,0,0])), map.js (resetMapTrajectory), controls.js (refreshStateIndicators exposed). |
| 2026-05-28 | Phase 10 | Created js/video.js: enumerateDevices() on DOMContentLoaded populates select with videoinput devices (labels empty until permission granted, fallback "Camera N"). getUserMedia with exact deviceId + 1280×720 ideal; on success pipes stream to #stream-video and repopulates select (labels now available). Error switch covers NotAllowedError/NotFoundError/NotReadableError + generic fallback. stopStream() calls getTracks().forEach(stop). View state managed by showVideo/showPlaceholder/showError helpers (set style.display directly, empty-string lets CSS display property take over). Status badge in panel header: 'live' class + vid-live-blink animation, 'offline' class muted. Camera change while streaming auto-calls stopStream(). |
| 2026-05-28 | Phase 9 | Created js/orientation.js: Three.js r128 scene with WebGLRenderer(alpha:true), PerspectiveCamera FOV45 z:4, ambient + key(cyan) + rim(purple) lights. buildCanSat() assembles 6-part model: body CylinderGeo, top/bottom caps (shared capGeo), antenna, 4 fins via pivot Groups (rotation.y * i handles even spacing cleanly), cyan wireframe LineSegments opacity:0.15. animate() lerps current→target RPY at factor 0.05; idle spin (yaw += 0.005) when telemetryActive is false. ResizeObserver drives renderer.setSize() + camera.updateProjectionMatrix() on every container resize. RPY readout below canvas in Share Tech Mono, 3-item flex row. |
| 2026-05-28 | Phase 8 | Created js/map.js: Leaflet map on DOMContentLoaded with CartoDB Dark Matter tiles + subdomains abcd. Zoom control bottom-right; scroll wheel disabled until user clicks map, re-disabled on mouseout. Static red circleMarker at Sriharikota with popup. Empty cyan polyline grows each packet via trajectory.addLatLng(). Custom L.divIcon: className:'' removes default white box; .map-marker-dot (cyan glow) + .map-marker-ring (uses existing marker-ring keyframe). map.invalidateSize() in setTimeout(150) ensures Leaflet measures container after flex layout settles. #map-info-overlay absolute bottom-left z-index:1000 updates LAT/LON/ALT each packet. Leaflet controls/popups restyled dark via !important overrides. |
| 2026-05-28 | Phase 7 | Extended js/controls.js: added window.missionState object; Phase 7 IIFE handles modal show/hide (style.display trick avoids hidden-attr specificity conflict), ESC key + backdrop-click cancel, command confirmation → action() + appendLog(). Command log renders last 5 entries (newest first) as Share Tech Mono entries with EXECUTED badge. refreshStateIndicators() updates 3 mc-state-pill elements (inactive → active-green/red/amber). Modal HTML added in index.html with glassmorphism card, CONFIRM COMMAND pretitle, large command name, warning line, CONFIRM+CANCEL buttons. |
| 2026-05-28 | Phase 6 | Created js/graphs.js: 5 Chart.js line charts (Altitude cyan, Pressure purple, Temperature amber, Descent Rate green, Battery red). Global Chart.defaults set on DOMContentLoaded. makeBgFn() returns a backgroundColor callback that lazily builds a top-to-transparent gradient, caching by chart area dimensions so resize works correctly. chart.update('none') skips animation on each packet push. Rolling 60-point window via shift(). window.charts keyed by field name for Phase 11 export. Layout: 2-col grid (2+2+1), graph-cell uses flex+min-height:0 to fill height without overflow. |
| 2026-05-28 | Phase 5 | Created js/errorcode.js: evaluates D1–D4 per packet (D1: descent_rate 8–10 m/s, D2: gps_fix, D3: payload_sep, D4: chute_deployed). render() sets ec-box class to 'nominal'/'fault fault-pulse', updates digit and status text. Overall status line switches between ◉ ALL SYSTEMS NOMINAL (green) and ⚠ FAULT DETECTED (red+pulse). Error code section lives at top of mission control panel; Phase 7 command placeholder fills remaining space below a divider. Added Phase 5 CSS: 4-column digit grid, Orbitron 26px digits, color transitions green↔red. |
| 2026-05-29 | Serial Sim | Added serial_simulator/cansat_serial_sim.py (Python pyserial simulator writing CSV packets to COM10 at 1 Hz) and serial_simulator/README.md (com0com install + Web Serial API connect walkthrough). Packet format matches telemetry.js fields exactly — zero GCS code changes needed to switch from simulated to real hardware. |
| 2026-05-29 | WS Bridge | Replaced com0com serial approach with WebSocket bridge: created serial_simulator/ws_bridge.py (asyncio + websockets, serves JSON packets at ws://localhost:8765). Added window.connectWebSocket / disconnectWebSocket to telemetry.js; wired to new CONNECT WS button + serial-status span in the control bar. com0com/pyserial path kept as cansat_serial_sim.py (legacy) but no longer the recommended approach. |
| 2026-05-28 | Phase 4 | Created js/display.js: listens to telemetryPacket, updates all 13 telemetry fields (6 container + 7 payload) via set() helper. Reflow trick (void el.offsetWidth) re-triggers value-flash animation on every packet. Added Phase 4 CSS — tele-section/tele-grid/tele-card layout in telemetry panel: 2-column card grid, Share Tech Mono values in cyan, Exo 2 labels in muted text-secondary, separate unit spans, GPS lat/lon cards span full width for readability. Panel body set to overflow-y:auto with thin cyan scrollbar. |
