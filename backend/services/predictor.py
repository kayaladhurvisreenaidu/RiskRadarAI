from pathlib import Path
import joblib


# -------------------------------------------------
# Resolve project root safely
# -------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent.parent

MODEL_PATH = BASE_DIR / "models" / "risk_model_rf.pkl"
ENCODER_PATH = BASE_DIR / "models" / "label_encoder.pkl"


# -------------------------------------------------
# Load once at startup
# -------------------------------------------------
model = joblib.load(MODEL_PATH)
label_encoder = joblib.load(ENCODER_PATH)


# -------------------------------------------------
# Prediction function
# -------------------------------------------------
def predict(features_df):

    probabilities = model.predict_proba(features_df)

    predicted_class_index = probabilities.argmax(axis=1)[0]
    confidence = probabilities.max(axis=1)[0]

    risk_label = label_encoder.inverse_transform([predicted_class_index])[0]

    return risk_label, float(confidence)
