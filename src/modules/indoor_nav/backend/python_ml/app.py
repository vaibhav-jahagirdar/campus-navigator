from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
import os

app = FastAPI(title="Indoor Navigation ML API", version="1.0")

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
model = joblib.load(MODEL_PATH) if os.path.exists(MODEL_PATH) else None

class WifiFingerprint(BaseModel):
    features: list[float]

@app.get("/")
def root():
    return {"status": "ok", "message": "Indoor ML API running"}

@app.post("/predict")
def predict(data: WifiFingerprint):
    if model is None:
        return {"error": "Model not loaded"}
    X = np.array([data.features])
    pred = model.predict(X)[0]
    return {"predicted_coords": pred.tolist()}

@app.get("/health")
def health_check():
    return {"model_loaded": model is not None}
