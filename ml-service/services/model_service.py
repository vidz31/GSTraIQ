import joblib
import os
import pandas as pd
import numpy as np
from pathlib import Path

# Path to models directory
MODEL_DIR = Path(__file__).resolve().parent.parent / "models"

class ModelService:
    def __init__(self):
        self.gst_model = None
        self.anomaly_model = None
        self.anomaly_scaler = None
        self.load_models()

    def load_models(self):
        try:
            gst_model_path = MODEL_DIR / "gst_prediction_model.pkl"
            anomaly_model_path = MODEL_DIR / "anomaly_detection_model.pkl"
            scaler_path = MODEL_DIR / "anomaly_scaler.pkl"

            if gst_model_path.exists():
                self.gst_model = joblib.load(gst_model_path)
                print("GST Prediction model loaded successfully.")
            
            if anomaly_model_path.exists():
                self.anomaly_model = joblib.load(anomaly_model_path)
                print("Anomaly Detection model loaded successfully.")

            if scaler_path.exists():
                self.anomaly_scaler = joblib.load(scaler_path)
                print("Anomaly Scaler loaded successfully.")
        
        except Exception as e:
            print(f"Error loading models: {str(e)}")

    def predict_gst(self, input_data):
        if not self.gst_model:
            raise Exception("GST Prediction model not loaded.")
        
        # Convert input to DataFrame for model compatibility
        df = pd.DataFrame([input_data.dict()])
        
        # In real scenario, you might need to handle categorical encoding here
        # depending on how your model was trained. 
        # Assuming the model pipeline handles encoding.
        
        prediction = self.gst_model.predict(df)
        return float(prediction[0])

    def detect_fraud(self, input_data):
        if not self.anomaly_model or not self.anomaly_scaler:
            raise Exception("Anomaly Detection model or scaler not loaded.")
        
        # Convert input to array
        data_dict = input_data.dict()
        features = np.array([[
            data_dict['Sales'],
            data_dict['GST_Amount'],
            data_dict['GST_Rate'],
            data_dict['GST_Ratio'],
            data_dict['High_Value'],
            data_dict['Order_Month']
        ]])
        
        # Scale features
        scaled_features = self.anomaly_scaler.transform(features)
        
        # Predict (Isolation Forest usually returns -1 for anomaly, 1 for normal)
        prediction_val = self.anomaly_model.predict(scaled_features)
        
        is_fraud = bool(prediction_val[0] == -1)
        prediction_str = "Fraud" if is_fraud else "Normal"
        
        # Confidence score (using decision_function for Isolation Forest)
        score = self.anomaly_model.decision_function(scaled_features)
        # Normalize score to 0-1 range (heuristic)
        confidence = float(1 / (1 + np.exp(-score[0])))
        
        return {
            "is_fraud": is_fraud,
            "prediction": prediction_str,
            "confidence_score": round(confidence, 4)
        }

# Singleton instance
model_service = ModelService()
