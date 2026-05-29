import asyncio
import websockets
import random
import json
import time

clients = set()

async def handler(websocket):
    clients.add(websocket)
    print(f"[WS] Client connected. Total: {len(clients)}")
    try:
        await websocket.wait_closed()
    finally:
        clients.discard(websocket)

async def telemetry_sender():
    altitude = 400.0
    gps_lat = 13.7330
    gps_lon = 80.2350
    roll = pitch = yaw = 0.0
    battery = 8.4
    packet_count = 0

    while True:
        await asyncio.sleep(1)
        if altitude > 200:
            altitude -= random.uniform(1.0, 1.8)
        elif altitude > 40:
            altitude -= random.uniform(0.6, 1.2)
        else:
            altitude -= random.uniform(0.1, 0.3)
        altitude = max(0.0, altitude)

        descent_rate = 9.0 + random.uniform(-0.5, 0.5)
        if random.random() < 0.08:
            descent_rate = random.choice([
                random.uniform(5.0, 7.5),
                random.uniform(10.8, 13.0)
            ])

        gps_lat += random.uniform(-0.00003, 0.00003)
        gps_lon += random.uniform(-0.00003, 0.00003)
        roll = max(-180, min(180, roll + random.uniform(-2, 2)))
        pitch = max(-90, min(90, pitch + random.uniform(-2, 2)))
        yaw = (yaw + random.uniform(-2, 2)) % 360
        battery = max(7.2, battery - 0.003)
        pressure = 1013.25 * ((1 - 2.2557e-5 * altitude) ** 5.2561)
        temperature = 28.0 - (altitude / 1000.0) * 6.5
        packet_count += 1

        packet = {
            "packet_count": packet_count,
            "altitude": round(altitude, 1),
            "pressure": round(pressure, 2),
            "temperature": round(temperature, 1),
            "battery_voltage": round(battery, 2),
            "descent_rate": round(descent_rate, 2),
            "gps_lat": round(gps_lat, 6),
            "gps_lon": round(gps_lon, 6),
            "gps_alt": round(altitude, 1),
            "roll": round(roll, 1),
            "pitch": round(pitch, 1),
            "yaw": round(yaw, 1),
            "gps_fix": 0 if random.random() < 0.05 else 1,
            "payload_sep": 1 if altitude < 200 else 0,
            "chute_deployed": 0,
            "timestamp": time.strftime("%H:%M:%S")
        }

        if clients:
            msg = json.dumps(packet)
            await asyncio.gather(
                *[c.send(msg) for c in clients],
                return_exceptions=True
            )
            print(f"[TX #{packet_count:04d}] "
                  f"ALT:{altitude:6.1f}m "
                  f"DR:{descent_rate:.2f}m/s "
                  f"BAT:{battery:.2f}V")
        else:
            print(f"[WAITING] No clients connected... "
                  f"Open GCS and click CONNECT WS")

async def main():
    print("=" * 50)
    print(" CanSat GCS — WebSocket Telemetry Bridge")
    print(" ws://localhost:8765")
    print(" Open GCS in Chrome, click CONNECT WS")
    print(" Ctrl+C to stop")
    print("=" * 50 + "\n")
    async with websockets.serve(handler, "localhost", 8765):
        await telemetry_sender()

asyncio.run(main())
