# src/train_model.py

import pandas as pd
import joblib
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

from src.feature_engineering import (
    engineer_features,
    compute_risk_score,
    assign_risk_zone
)

# -----------------------
# Config
# -----------------------
DATA_PATH = "data/raw/synthetic_athlete_dataset.csv"
RANDOM_STATE = 42

# -----------------------
# Load dataset
# -----------------------
df = pd.read_csv(DATA_PATH)

# Basic sanity check
# -----------------------
# Column validation (robust)
# -----------------------
required_cols = {
    "athlete_id",
    "date",
    "daily_load",
    "hrv",
    "sleep_quality",
    "resting_hr",
    "past_injury",
    "days_since_injury"
}

missing = required_cols - set(df.columns)
if missing:
    raise ValueError(
        f"Missing required columns for feature engineering: {missing}"
    )

# -----------------------
# Feature engineering
# -----------------------
df = engineer_features(df)
df = compute_risk_score(df)
df = assign_risk_zone(df)



# -----------------------
# Sort by time (CRITICAL)
# -----------------------
df = df.sort_values("date").reset_index(drop=True)

# -----------------------
# Feature selection
# -----------------------
features = [
    "load_7d",
    "hrv_drop",
    "training_monotony_log",
    "recovery_score",
    "history_risk"
]

X = df[features]
y = df["risk_zone"]

# -----------------------
# Time-based train-test split (80-20)
# -----------------------
train_parts = []
test_parts = []

for athlete_id, g in df.groupby("athlete_id"):
    g = g.sort_values("date").reset_index(drop=True)
    split_idx = int(len(g) * 0.8)

    train_parts.append(g.iloc[:split_idx])
    test_parts.append(g.iloc[split_idx:])

train_df = pd.concat(train_parts).reset_index(drop=True)
test_df  = pd.concat(test_parts).reset_index(drop=True)

X_train = train_df[features]
y_train = train_df["risk_zone"]

X_test  = test_df[features]
y_test  = test_df["risk_zone"]


# Sanity check (no leakage)
assert df.loc[:split_idx - 1, "date"].max() <= df.loc[split_idx, "date"]

# -----------------------
# Encode target
# -----------------------
le = LabelEncoder()
le.fit(y)  # fit on full target to ensure all classes are known

y_train_enc = le.transform(y_train)
y_test_enc  = le.transform(y_test)

# -----------------------
# Train Logistic Regression
# -----------------------
logreg = LogisticRegression(
    class_weight="balanced",
    max_iter=1000,
    random_state=RANDOM_STATE
)
logreg.fit(X_train, y_train_enc)

# -----------------------
# Train Random Forest
# -----------------------
rf = RandomForestClassifier(
    class_weight="balanced",
    n_estimators=300,
    random_state=RANDOM_STATE,
    n_jobs=-1
)
rf.fit(X_train, y_train_enc)

# -----------------------
# Save models
# -----------------------
joblib.dump(logreg, "models/risk_model_logreg.pkl")
joblib.dump(rf, "models/risk_model_rf.pkl")
joblib.dump(le, "models/label_encoder.pkl")

print("✅ Training complete")
print(f"Train size: {len(X_train)} | Test size: {len(X_test)}")
print("Classes:", list(le.classes_))
