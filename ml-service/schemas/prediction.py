from pydantic import BaseModel
from typing import Optional

class GSTPredictionInput(BaseModel):
    Sales: float
    GST_Rate: float
    Ship_Mode: str
    Segment: str
    Country: str
    City: str
    State: str
    Region: str
    Category: str
    Sub_Category: str
    Product_Name: str
    GST_Type: str
    Order_Month: int
    Order_Day: int
    Order_Weekday: int

class GSTPredictionOutput(BaseModel):
    predicted_gst_amount: float

class FraudDetectionInput(BaseModel):
    Sales: float
    GST_Amount: float
    GST_Rate: float
    GST_Ratio: float
    High_Value: int
    Order_Month: int

class FraudDetectionOutput(BaseModel):
    is_fraud: bool
    prediction: str
    confidence_score: float
