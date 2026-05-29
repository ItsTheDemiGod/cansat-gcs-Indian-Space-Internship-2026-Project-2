import serial
import time
import random
import math

# ============================================================
# CanSat GCS — Python Virtual Serial Telemetry Simulator
# Simulates a microcontroller sending telemetry over COM port
#
# SETUP INSTRUCTIONS:
# 1. pip install pyserial
# 2. Install com0com: https://sourceforge.net/projects/com0com/
# 3. In com0com, create virtual pair: COM10 <-> COM11
# 4. Run this script (writes to COM10)
# 5. In GCS browser (Chrome/Edge), click CONNECT SERIAL
# 6. Select COM11 from the port list
# ============================================================

BAUD = 9600

altitude = 400.0
gps_lat = 13.7330
gps_lon = 80.2350
roll = 0.0
pitch = 0.0
yaw = 0.0
battery = 8.4
packet_count = 0
descent_rate = 9.0

PORTS_TO_TRY = ['\\\\.\\COM10', 'COM10', '\\\\.\\CNCA0']

ser = None
for port in PORTS_TO_TRY:
    try:
        ser = serial.Serial(port, BAUD, timeout=1)
        print(f"[CANSAT-SIM] Successfully opened: {port}")
        break
    except Exception as e:
        print(f"[CANSAT-SIM] Failed {port}: {e}")

if ser is None:
    print("[ERROR] Could not open any COM port.")
    print("Try running VS Code as Administrator")
    print("Or restart your PC and try again")
    exit(1)

print("[CANSAT-SIM] Press Ctrl+C to stop\n")

try:
    while True:
        # Altitude model
        if altitude > 200:
            altitude -= random.uniform(1.0, 1.8)
        elif altitude > 40:
            altitude -= random.uniform(0.6, 1.2)
        else:
            altitude -= random.uniform(0.1, 0.3)
        altitude = max(0.0, altitude)

        # Descent rate (independent sensor, ~9 m/s)
        descent_rate = 9.0 + random.uniform(-0.5, 0.5)
        if random.random() < 0.08:
            descent_rate = random.choice([
                random.uniform(5.0, 7.5),
                random.uniform(10.8, 13.0)
            ])

        # GPS drift
        gps_lat += random.uniform(-0.00003, 0.00003)
        gps_lon += random.uniform(-0.00003, 0.00003)

        # Orientation
        roll  = max(-180, min(180, roll  + random.uniform(-2, 2)))
        pitch = max(-90,  min(90,  pitch + random.uniform(-2, 2)))
        yaw   = (yaw + random.uniform(-2, 2)) % 360

        # Battery drain
        battery = max(7.2, battery - 0.003)

        # Derived values
        pressure    = 1013.25 * ((1 - 2.2557e-5 * altitude) ** 5.2561)
        temperature = 28.0 - (altitude / 1000.0) * 6.5 + random.uniform(-0.2, 0.2)

        # Flags
        gps_fix        = 1 if random.random() > 0.05 else 0
        payload_sep    = 1 if altitude < 200 else 0
        chute_deployed = 0

        packet_count += 1

        line = (
            f"{packet_count},"
            f"{altitude:.1f},"
            f"{pressure:.2f},"
            f"{temperature:.1f},"
            f"{battery:.2f},"
            f"{descent_rate:.2f},"
            f"{gps_lat:.6f},"
            f"{gps_lon:.6f},"
            f"{altitude:.1f},"
            f"{roll:.1f},"
            f"{pitch:.1f},"
            f"{yaw:.1f},"
            f"{gps_fix},"
            f"{payload_sep},"
            f"{chute_deployed}\n"
        )

        ser.write(line.encode('utf-8'))
        print(f"[TX #{packet_count:04d}] ALT:{altitude:6.1f}m  "
              f"DR:{descent_rate:.2f}m/s  "
              f"BAT:{battery:.2f}V  "
              f"GPS:{gps_lat:.4f},{gps_lon:.4f}")
        time.sleep(1)

except KeyboardInterrupt:
    print("\n[CANSAT-SIM] Stopped by user")
finally:
    ser.close()
    print("[CANSAT-SIM] Port closed")
