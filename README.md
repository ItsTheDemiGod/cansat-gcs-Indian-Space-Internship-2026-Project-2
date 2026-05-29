<div align="center">

```
 ██████╗ █████╗ ███╗   ██╗███████╗ █████╗ ████████╗      ██████╗  ██████╗███████╗
██╔════╝██╔══██╗████╗  ██║██╔════╝██╔══██╗╚══██╔══╝     ██╔════╝ ██╔════╝██╔════╝
██║     ███████║██╔██╗ ██║███████╗███████║   ██║        ██║  ███╗██║     ███████╗
██║     ██╔══██║██║╚██╗██║╚════██║██╔══██║   ██║        ██║   ██║██║     ╚════██║
╚██████╗██║  ██║██║ ╚████║███████║██║  ██║   ██║        ╚██████╔╝╚██████╗███████║
 ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝  ╚═╝         ╚═════╝  ╚═════╝╚══════╝
```

# 🛰️ CANSAT-GCS
### Ground Control Software — India Space Lab Mission Operations Dashboard

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://chartjs.org)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white)](https://threejs.org)
[![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com)

**A professional single-page aerospace mission operations dashboard for CanSat telemetry monitoring, GPS tracking, 3D orientation visualization, and real-time mission control.**

[🚀 Live Demo](#-quick-start) • [📖 Documentation](#-features) • [🛠 Setup](#-installation) • [📡 Hardware Integration](#-hardware--serial-integration)

---

![Dashboard Preview](assets/preview.png)
> *← Add a screenshot of your running dashboard here*

</div>

---

## 🌌 Overview

**CANSAT-GCS** is a browser-based Ground Control Software built for the India Space Lab CanSat & CubeSat Satellite Project. It simulates a professional aerospace mission operations center — think ISRO PSLV launch dashboards and SpaceX Dragon mission ops — running entirely in the browser with no backend required.

The software receives live telemetry from a CanSat (either simulated or from real hardware via WebSocket bridge), displays it across 8 simultaneous panels, and provides full mission command capability.

---

## ✨ Features

### 🖥️ Interface
- **Deep Space Operations** aesthetic — glassmorphism panels, animated starfield (220+ particles), nebula gradient blobs, CRT scanline overlay
- Full single-page dashboard — all 8 panels visible simultaneously at 1920×1080, no scrolling
- Responsive CSS Grid layout (3 columns × 4 rows)
- Corner bracket panel decorations, mission elapsed time counter, UTC live clock

### 📡 Telemetry
- Real-time packet reception at 1Hz — 15 sensor fields per packet
- Separate **Container Telemetry** and **Payload Telemetry** sections
- Value flash animation on every update (cyan pulse)
- Dual source: JavaScript simulator OR Python WebSocket bridge

### 📊 Real-Time Graphs
- 5 simultaneously updating **Chart.js** line graphs
- Rolling 60-point window with smooth curve animation
- Charts: Altitude · Pressure · Temperature · Descent Rate · Battery Voltage

### 🗺️ GPS Tracking Map
- **Leaflet.js** + CartoDB Dark Matter tiles
- Live position marker with pulsing cyan ring animation
- Full trajectory polyline growing with each packet
- Launch site marker at SDSC Sriharikota

### 🧭 Orientation Visualization
- **Three.js** 3D CanSat model responding to live Roll / Pitch / Yaw
- Smooth lerp interpolation — no snapping
- Custom model built from primitives: cylinder body, fins, antenna, wireframe overlay

### ⚠️ Error Code System
A 4-digit live fault monitor:

| Digit | Condition | 0 = Nominal | 1 = Fault |
|-------|-----------|-------------|-----------|
| D1 | Descent Rate | Within 8–10 m/s | Outside safe range |
| D2 | GPS Availability | Fix available | Unavailable |
| D3 | Payload Separation | Separated | Failure |
| D4 | Emergency Parachute | Inactive | Activated |

### 🎮 Mission Control
- 3 critical commands: **Manual Separation** · **Emergency Chute** · **Redundant Activation**
- Confirmation modal required before execution
- Command log with timestamps and executed badges
- Live mission state indicators

### 📹 Live Video Feed
- Browser camera via **MediaDevices API**
- Camera selector dropdown, start/stop controls
- Status indicator: `● LIVE` / `○ OFFLINE`
- Rocket Cam demo mode included

### 💾 Data Management
- **Export CSV** — timestamped 16-column telemetry log download
- **Export Graph** — combined 5-chart PNG export
- **Reset Packet** — full system clear with confirmation
- In-memory telemetry log (`window.telemetryLog[]`)

---

## 🗂️ Project Structure

```
cansat-gcs/
├── index.html                  # Main HTML shell
├── css/
│   └── style.css               # Full design system, animations, CSS variables
├── js/
│   ├── telemetry.js            # Packet simulator + WebSocket receiver
│   ├── display.js              # Telemetry display panel
│   ├── errorcode.js            # 4-digit fault monitor
│   ├── graphs.js               # Chart.js real-time graphs
│   ├── controls.js             # Control bar + mission commands
│   ├── map.js                  # Leaflet GPS tracking map
│   ├── orientation.js          # Three.js 3D orientation model
│   ├── video.js                # Camera stream (MediaDevices API)
│   └── datamanager.js          # CSV/graph export, reset, logging
├── serial_simulator/
│   ├── ws_bridge.py            # Python WebSocket telemetry bridge
│   ├── cansat_serial_sim.py    # Serial port simulator (com0com)
│   └── README.md               # Hardware setup guide
├── arduino/
│   └── cansat_telemetry.ino    # Arduino firmware for WeGyanik Kit
└── CLAUDE.md                   # Development log
```

---

## ⚡ Quick Start

### Option 1 — JavaScript Simulator (no setup needed)

```bash
# Clone the repo
git clone https://github.com/ItsTheDemiGod/cansat-gcs.git
cd cansat-gcs

# Open in Chrome or Edge
# (double-click index.html, or use Live Server in VS Code)
```

1. Open `index.html` in **Chrome or Edge**
2. Click **▶ START TELEMETRY**
3. All 8 panels begin updating immediately

> ⚠️ Must use **Chrome or Edge** — Firefox does not support Web Serial API or some camera APIs used.

---

## 🔧 Installation

### Prerequisites
- Chrome or Edge browser (v89+)
- Python 3.8+ (for WebSocket bridge)
- VS Code with Live Server extension (recommended)

### Python WebSocket Bridge

```bash
pip install websockets
cd serial_simulator
python ws_bridge.py
```

Then in the GCS browser, click **🔌 CONNECT WS** and watch live telemetry flow in.

---

## 📡 Hardware & Serial Integration

### Using the WeGyanik Kit Microcontroller

Upload the provided Arduino sketch to your microcontroller:

```
arduino/cansat_telemetry.ino
```

The sketch generates and transmits telemetry packets over Serial at **9600 baud** in CSV format:

```
packet_count,altitude,pressure,temperature,battery_voltage,
descent_rate,gps_lat,gps_lon,gps_alt,roll,pitch,yaw,
gps_fix,payload_sep,chute_deployed
```

### Virtual Serial Port Testing (no hardware needed)

```bash
# 1. Install com0com from https://sourceforge.net/projects/com0com/
# 2. Create virtual pair: COM10 <-> COM11
# 3. Run simulator
pip install pyserial
python serial_simulator/cansat_serial_sim.py

# 4. In Chrome, click CONNECT WS → select COM11
```

### WebSocket Bridge Architecture

```
Python ws_bridge.py              Browser GCS
────────────────────             ─────────────
asyncio + websockets     ──►     WebSocket('ws://localhost:8765')
generates JSON packets            fires CustomEvent('telemetryPacket')
every 1 second                    all modules update independently
```

---

## 🏗️ Architecture

The GCS uses a **modular event-driven architecture**. All 9 JavaScript modules communicate exclusively through browser CustomEvents — no direct imports between modules.

```
telemetry.js ──fires──► CustomEvent('telemetryPacket')
                                    │
              ┌─────────────────────┼──────────────────────┐
              ▼                     ▼                       ▼
         display.js           errorcode.js            graphs.js
         (telemetry panel)    (fault monitor)         (5 charts)
              ▼                     ▼                       ▼
           map.js            orientation.js          (all independent)
         (GPS tracking)      (3D model)
```

This means:
- Any module can be replaced without touching others
- WebSocket and simulator data flows identically through the system
- New data sources just need to fire the same CustomEvent

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-deep` | `#010a14` | Main background |
| `--border-glow` | `#00d4ff` | Panel borders, accents |
| `--accent-primary` | `#00d4ff` (cyan) | Interactive elements |
| `--accent-secondary` | `#7b4fff` (purple) | Graphs, highlights |
| `--accent-amber` | `#ffaa00` | Warnings |
| `--accent-green` | `#00ff88` | Nominal states |
| `--accent-red` | `#ff3b3b` | Faults, errors |

**Fonts:**
- `Orbitron` — Panel headers, mission labels
- `Share Tech Mono` — Live telemetry values
- `Exo 2` — Body text, button labels

---

## 📦 External Libraries

| Library | Version | CDN |
|---------|---------|-----|
| Chart.js | 4.4.0 | jsdelivr |
| Leaflet.js | 1.9.4 | unpkg |
| Three.js | r128 | jsdelivr |
| Google Fonts | — | fonts.googleapis.com |

No npm, no build step. All CDN links in `index.html` `<head>`.

---

## 📋 Telemetry Packet Format

Every packet is a JavaScript/JSON object:

```js
{
  packet_count:    1,           // Auto-incrementing ID
  timestamp:       "19:42:00", // HH:MM:SS
  altitude:        399.2,       // meters
  pressure:        970.1,       // hPa
  temperature:     25.4,        // °C
  battery_voltage: 8.40,        // V (7.2–8.4)
  descent_rate:    9.02,        // m/s (nominal: 8–10)
  gps_lat:         13.733012,   // decimal degrees
  gps_lon:         80.235303,   // decimal degrees
  gps_alt:         399.2,       // meters
  roll:            2.1,         // degrees (-180 to 180)
  pitch:           -0.5,        // degrees (-90 to 90)
  yaw:             45.3,        // degrees (0 to 360)
  gps_fix:         true,        // GPS lock status
  payload_sep:     false,       // Payload separation (true below 200m)
  chute_deployed:  false        // Emergency parachute state
}
```

---

## 🧪 Testing

| Test | Method | Status |
|------|--------|--------|
| Telemetry start/stop | Click START/STOP | ✅ |
| Graph rolling window | Run 60+ seconds | ✅ |
| Descent rate fault (D1) | Wait for random spike | ✅ |
| GPS fault (D2) | 5% random packet drop | ✅ |
| Payload sep (D3) | Altitude < 200m | ✅ |
| Mission commands | Click + Confirm | ✅ |
| GPS map trajectory | 60+ packets | ✅ |
| 3D orientation | Live RPY values | ✅ |
| CSV export | Click Export CSV | ✅ |
| Graph PNG export | Click Export Graph | ✅ |
| Full reset | Click Reset + Confirm | ✅ |
| WebSocket bridge | python ws_bridge.py | ✅ |
| Camera stream | Click START stream | ✅ |

---

## 📁 Deliverables

- ✅ Ground Control Software Source Code
- ✅ Executable Application (`index.html` — open in Chrome)
- ✅ Project Documentation / Report (PDF)
- ✅ Arduino Firmware (`arduino/cansat_telemetry.ino`)
- ✅ Python WebSocket Bridge (`serial_simulator/ws_bridge.py`)
- ✅ Sample Telemetry CSV
- ✅ Graph Export PNG
- ✅ Development Log (`CLAUDE.md`)

---

## 📊 Evaluation Criteria

| Criteria | Weight | Implementation |
|----------|--------|----------------|
| UI/UX Design | 15% | Deep Space Operations theme, glassmorphism, starfield |
| Telemetry Handling | 20% | JS simulator + Python WebSocket, 15-field packets |
| Real-Time Visualization | 20% | 5 Chart.js charts, 60-point rolling window |
| Mission Control Features | 15% | 3 commands, confirmation modal, command log |
| Graphing and Tracking | 10% | Leaflet dark map, GPS trajectory polyline |
| Orientation & Video | 10% | Three.js 3D model, MediaDevices camera |
| Code Quality | 10% | Modular JS, CustomEvent architecture |

---

## 👤 Author

**Demian Sharwin Xaxa**
B.Tech Artificial Intelligence & Machine Learning
Karunya Institute of Technology and Sciences, Coimbatore
Roll No: URK23CS7011

[![GitHub](https://img.shields.io/badge/GitHub-ItsTheDemiGod-181717?style=for-the-badge&logo=github)](https://github.com/ItsTheDemiGod)

---

## 🏛️ Assigned By

**India Space Lab (ISL)**
BA/14B, Janakpuri, New Delhi, India
📞 011-44749707, 9211293116
📧 office@isl.ac.in
🌐 www.isl.ac.in

---

## 📄 License

This project was developed as an academic assignment for the India Space Lab CanSat & CubeSat Satellite Project.

---

<div align="center">

**Built with ☕ and 🚀 by Demian Sharwin Xaxa**

*"The cosmos is within us. We are made of star-stuff."*

</div>
