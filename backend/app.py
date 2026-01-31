from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel
from pathlib import Path

from services.feature_builder import build_features
from services.predictor import predict


app = FastAPI(
    title="RiskRadar AI",
    description="AI-powered athlete injury risk prediction system",
    version="1.0"
)

# --------------------------
# Add CORS middleware here
# --------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for demo allow all origins; later use your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------
# Resolve history path safely
# -------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
HISTORY_PATH = BASE_DIR / "data" / "raw"/ "athlete_history.csv"


# -------------------------------------------------
# Request Schema
# -------------------------------------------------
class AthleteInput(BaseModel):

    athlete_id: int
    date: str
    daily_load: float
    resting_hr: float
    hrv: float
    sleep_quality: float
    past_injury: int
    days_since_injury: int


# -------------------------------------------------
# Endpoint
# -------------------------------------------------
@app.post("/predict-risk")
def predict_risk(data: AthleteInput):

    try:

        features = build_features(
            today_data=data.dict(),
            history_path=HISTORY_PATH
        )

        label, confidence = predict(features)

        return {
            "athlete_id": data.athlete_id,
            "next_7_days_predicted_risk": label,
            "confidence": round(confidence, 2),
            "status": "success"
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
