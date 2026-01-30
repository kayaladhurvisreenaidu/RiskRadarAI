import pandas as pd
import numpy as np


MODEL_FEATURES = [
    "load_7d",
    "hrv_drop",
    "training_monotony_log",
    "recovery_score",
    "history_risk"
]


def minmax(series):
    return (series - series.min()) / (series.max() - series.min() + 1e-6)


def build_features(today_data: dict, history_path: str):

    # -----------------------------
    # Load + filter athlete
    # -----------------------------
    history_df = pd.read_csv(history_path)

    athlete_df = history_df[
        history_df["athlete_id"] == today_data["athlete_id"]
    ].copy()

    if len(athlete_df) < 60:
        raise ValueError("Athlete must have at least 60 days of history.")

    # -----------------------------
    # Append today's row
    # -----------------------------
    today_df = pd.DataFrame([today_data])

    df = pd.concat([athlete_df, today_df], ignore_index=True)

    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values(["athlete_id", "date"])

    # -----------------------------
    # Feature Engineering
    # -----------------------------

    # HRV z-score
    df["hrv_z"] = df.groupby("athlete_id")["hrv"].transform(
        lambda x: (x - x.mean()) / x.std()
    )

    # log load
    df["daily_load_log"] = np.log1p(df["daily_load"])

    # rolling load mean
    df["load_7d"] = (
        df.groupby("athlete_id")["daily_load_log"]
        .rolling(7, min_periods=1)
        .mean()
        .reset_index(level=0, drop=True)
    )

    # rolling HRV
    df["hrv_7d_mean"] = (
        df.groupby("athlete_id")["hrv_z"]
        .rolling(7, min_periods=1)
        .mean()
        .reset_index(level=0, drop=True)
    )

    df["hrv_drop"] = df["hrv_z"] - df["hrv_7d_mean"]

    # variability
    df["load_7d_std"] = (
        df.groupby("athlete_id")["daily_load_log"]
        .rolling(7, min_periods=1)
        .std()
        .reset_index(level=0, drop=True)
    )

    df["training_monotony"] = df["load_7d"] / (df["load_7d_std"] + 1e-6)

    df["training_monotony_log"] = np.log1p(df["training_monotony"])

    # recovery
    df["recovery_score"] = (
        0.5 * df["sleep_quality"] +
        0.3 * (df["hrv_z"] / df["hrv_z"].max()) -
        0.2 * (df["resting_hr"] / df["resting_hr"].max())
    )

    # injury decay
    df["history_risk"] = (
        df["past_injury"] *
        np.exp(-df["days_since_injury"] / 60)
    )

    # -----------------------------
    # Return ONLY latest row
    # -----------------------------
    latest_row = df.iloc[-1]

    features = latest_row[MODEL_FEATURES].to_frame().T

    return features
