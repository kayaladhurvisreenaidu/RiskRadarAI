import numpy as np
import pandas as pd
from datetime import timedelta

np.random.seed(42)

N_ATHLETES = 60
DAYS = 60
START_DATE = pd.to_datetime("2024-01-01")

rows = []

for athlete_id in range(1, N_ATHLETES + 1):

    # ---------- Athlete baseline ----------
    height = np.random.normal(175, 7)     # cm
    weight = np.random.normal(70, 8)       # kg

    base_hr = np.random.normal(55, 5)
    base_hrv = np.random.normal(75, 10)
    base_sleep = np.random.normal(7.2, 0.6)

    past_injury = np.random.choice([0, 1], p=[0.7, 0.3])
    days_since_injury = np.random.randint(30, 300) if past_injury else 999

    # rolling buffers for ACWR
    acute_loads = []
    chronic_loads = []

    prev_hrv = base_hrv

    for day in range(DAYS):
        date = START_DATE + timedelta(days=day)

        # ---------- Training behavior ----------
        hard_day = np.random.rand() < 0.35
        spike_day = np.random.rand() < 0.08

        if hard_day:
            duration = np.random.normal(90, 20)
            rpe = np.random.uniform(6, 9)
        else:
            duration = np.random.normal(45, 15)
            rpe = np.random.uniform(2, 5)

        if spike_day:
            duration *= 1.4
            rpe = min(rpe + 2, 10)

        duration = np.clip(duration, 20, 180)
        rpe = np.clip(rpe, 1, 10)

        daily_load = duration * rpe

        # ---------- ACWR ----------
        acute_loads.append(daily_load)
        chronic_loads.append(daily_load)

        if len(acute_loads) > 7:
            acute_loads.pop(0)
        if len(chronic_loads) > 28:
            chronic_loads.pop(0)

        acute = np.mean(acute_loads)
        chronic = np.mean(chronic_loads) if len(chronic_loads) >= 7 else acute
        acwr = acute / (chronic + 1e-6)

        # ---------- HRV dynamics ----------
        hrv = (
            prev_hrv
            - 0.015 * daily_load
            + 4 * (base_sleep / 8)
            + np.random.normal(0, 2)
        )
        hrv = np.clip(hrv, 20, 120)

        # ---------- Resting HR ----------
        resting_hr = (
            base_hr
            + 0.01 * daily_load
            - 0.03 * hrv
            + np.random.normal(0, 1.5)
        )
        resting_hr = np.clip(resting_hr, 40, 80)

        # ---------- Sleep behavior ----------
        if daily_load > 700:
            sleep_hours = base_sleep - np.random.uniform(0.5, 1.5)
        else:
            sleep_hours = base_sleep + np.random.uniform(-0.3, 0.6)

        sleep_hours = np.clip(sleep_hours, 4, 9)

        sleep_quality = (
            0.5 * (sleep_hours / 9)
            + 0.3 * (hrv / 120)
            - 0.2 * (daily_load / 1200)
        )
        sleep_quality = np.clip(sleep_quality, 0, 1)

        # ---------- CNS drift (reaction / neuromuscular fatigue proxy) ----------
        cns_drift = (
            2.5 * acwr
            + 0.02 * daily_load
            - 0.05 * hrv
            + np.random.normal(0, 1)
        )
        cns_drift = max(0, cns_drift)   # minutes missed

        # ---------- Big toe stiffness ----------
        big_toe_status = 1 if (acwr > 1.5 and daily_load > 800 and np.random.rand() < 0.4) else 0

        # ---------- Injury history ----------
        if days_since_injury < 999:
            days_since_injury += 1

        # ---------- Save ----------
        rows.append({
            "athlete_id": athlete_id,
            "date": date,
            "height_cm": round(height, 1),
            "weight_kg": round(weight, 1),
            "daily_load": round(daily_load, 1),
            "acwr": round(acwr, 2),
            "resting_hr": round(resting_hr, 1),
            "hrv": round(hrv, 1),
            "sleep_quality": round(sleep_quality, 2),
            "past_injury": past_injury,
            "days_since_injury": days_since_injury,
            "cns_drift_minutes": round(cns_drift, 1),
            "big_toe_stiffness": big_toe_status
        })

        prev_hrv = hrv

df = pd.DataFrame(rows)
df.to_csv("synthetic_athlete_dataset.csv", index=False)

print(df.head())