# src/feature_engineering.py

import pandas as pd
import numpy as np

# -----------------------
# Utility functions
# -----------------------

def minmax(series: pd.Series) -> pd.Series:
    """NaN-safe min-max normalization"""
    return (series - series.min()) / (series.max() - series.min() + 1e-6)


# -----------------------
# Feature engineering
# -----------------------

import pandas as pd
import numpy as np

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineer features for athlete injury risk model.
    Includes log-transform, rolling features, HRV z-score, recovery score,
    training monotony/strain, history risk, and NaN handling.
    """
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])

    # -----------------------
    # Log transform of daily load
    # -----------------------
    df["daily_load_log"] = np.log1p(df["daily_load"])

    # -----------------------
    # HRV z-score
    # -----------------------
    df["hrv_z"] = df.groupby("athlete_id")["hrv"].transform(
        lambda x: (x - x.mean()) / (x.std() + 1e-6)
    )

    # -----------------------
    # Recovery score (derived)
    # -----------------------
    df["recovery_score"] = (
        0.5 * df["sleep_quality"] +
        0.3 * (df["hrv_z"] / (df["hrv_z"].abs().max() + 1e-6)) -
        0.2 * (df["resting_hr"] / (df["resting_hr"].max() + 1e-6))
    )
    # Optional: clip to [0,1] if you want normalized range
    # df["recovery_score"] = df["recovery_score"].clip(0,1)

    # -----------------------
    # Rolling features (with proper alignment)
    # -----------------------
    df["load_7d"] = (
        df.groupby("athlete_id")["daily_load_log"]
        .rolling(7, min_periods=3)
        .mean()
        .reset_index(level=0, drop=True)
    )

    df["load_14d"] = (
        df.groupby("athlete_id")["daily_load_log"]
        .rolling(14, min_periods=5)
        .mean()
        .reset_index(level=0, drop=True)
    )

    df["hrv_7d_mean"] = (
        df.groupby("athlete_id")["hrv_z"]
        .rolling(7, min_periods=3)
        .mean()
        .reset_index(level=0, drop=True)
    )

    df["hrv_drop"] = df["hrv_z"] - df["hrv_7d_mean"]

    # -----------------------
    # Training monotony and strain
    # -----------------------
    load_7d_std = (
        df.groupby("athlete_id")["load_7d"]
        .rolling(7, min_periods=3)
        .std()
        .reset_index(level=0, drop=True)
    )

    df["training_monotony"] = df["load_7d"] / (load_7d_std + 1e-6)
    df["training_strain"] = df["load_7d"] * df["training_monotony"]

    df["training_monotony_log"] = np.log1p(df["training_monotony"])
    df["training_strain_log"] = np.log1p(df["training_strain"])

    # -----------------------
    # History risk
    # -----------------------
    df["history_risk"] = (
        df["past_injury"] *
        np.exp(-df["days_since_injury"] / 60)
    )

    # -----------------------
    # Forward fill/bfill NaNs after rolling
    # -----------------------
    rolling_features = [
        "load_7d", "load_14d", "hrv_7d_mean", "hrv_drop",
        "training_monotony", "training_strain",
        "training_monotony_log", "training_strain_log"
    ]

    df[rolling_features] = (
        df.groupby("athlete_id")[rolling_features]
        .apply(lambda grp: grp.ffill().bfill())
        .reset_index(level=0, drop=True)
    )

    return df



# -----------------------
# Risk score and classification
# -----------------------

def compute_risk_score(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute continuous risk score using weighted combination of features
    """
    df = df.copy()

    load_risk     = minmax(df["load_7d"])
    fatigue_risk  = minmax(-df["hrv_drop"])
    monotony_risk = minmax(df["training_monotony_log"])
    recovery_risk = 1 - minmax(df["recovery_score"])

    df["risk_score"] = (
        0.25 * load_risk +
        0.25 * fatigue_risk +
        0.15 * monotony_risk +
        0.20 * recovery_risk +
        0.15 * df["history_risk"]
    )

    return df


def classify_risk(score: float) -> str:
    """
    Classify risk score into categories
    Safe / Moderate / High
    Thresholds from your notebooks (tuned)
    """
    if pd.isna(score):
        return "Unknown"
    elif score < 0.4:
        return "Safe"
    elif score < 0.9:
        return "Moderate"
    else:
        return "High"


def assign_risk_zone(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add categorical risk zone to dataframe
    """
    df = df.copy()
    df["risk_zone"] = df["risk_score"].apply(classify_risk)
    return df
