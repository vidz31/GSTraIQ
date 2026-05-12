from fastapi import APIRouter, HTTPException
from schemas.prediction import (
    GSTPredictionInput, 
    GSTPredictionOutput,
    FraudDetectionInput,
    FraudDetectionOutput
)
from services.model_service import model_service

router = APIRouter()

@router.post("/predict-gst", response_model=GSTPredictionOutput)
async def predict_gst(payload: GSTPredictionInput):
    try:
        result = model_service.predict_gst(payload)
        return GSTPredictionOutput(predicted_gst_amount=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/detect-fraud", response_model=FraudDetectionOutput)
async def detect_fraud(payload: FraudDetectionInput):
    try:
        result = model_service.detect_fraud(payload)
        return FraudDetectionOutput(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "models_loaded": {
            "gst_prediction": model_service.gst_model is not None,
            "anomaly_detection": model_service.anomaly_model is not None,
            "anomaly_scaler": model_service.anomaly_scaler is not None
        }
    }
