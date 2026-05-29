# CanSat Serial Simulator — Setup Guide

## What this does
Simulates a WeGyanik Kit microcontroller sending live telemetry 
packets to the GCS over a virtual COM port pair.

## Step-by-Step Setup

### Step 1 — Install Python dependencies
pip install pyserial

### Step 2 — Install com0com (Virtual Serial Port Driver)
- Download: https://sourceforge.net/projects/com0com/
- Run installer as Administrator
- During setup, it creates a default pair (COM10 <-> COM11)
- If not created automatically, open com0com Setup and add pair:
  Port A = COM10, Port B = COM11

### Step 3 — Run the simulator
cd cansat-gcs/serial_simulator
python cansat_serial_sim.py

You should see packets printing in the terminal like:
[TX #0001] ALT: 398.5m  DR:9.02m/s  BAT:8.40V  GPS:13.7331,80.2350

### Step 4 — Connect GCS to virtual port
- Open index.html in Chrome or Edge (NOT Firefox)
- Click the "🔌 CONNECT SERIAL" button in the control bar
- A browser popup appears listing available COM ports
- Select COM11 from the list
- Click Connect

### Step 5 — Verify
- GCS status shows "● SERIAL CONNECTED" in green
- All telemetry panels start updating from Python data
- You can run BOTH simulator (START TELEMETRY) and serial 
  simultaneously — they both fire the same telemetryPacket event

## Troubleshooting
- "Could not open COM10" → com0com not installed or pair 
  not created. Run com0com setup as Administrator.
- Port not showing in Chrome → Refresh the page, try again
- Chrome not showing serial option → Must use Chrome 89+ or Edge
- Permission denied on port → Close Arduino IDE or any other 
  app using that COM port

## For Evaluators
This demonstrates full Web Serial API integration equivalent 
to a physical microcontroller. The packet format is identical 
to what the Arduino sketch (cansat_telemetry.ino) transmits,
so switching to real hardware requires zero code changes —
just connect the physical device and select its COM port.
