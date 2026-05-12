import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000/api/ml';

const predictGST = async (invoiceData) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict-gst`, {
      Sales: invoiceData.amount,
      GST_Rate: invoiceData.taxRate,
      Ship_Mode: "Standard Class", // Default or from profile
      Segment: "Consumer",
      Country: "India",
      City: "Mumbai",
      State: "Maharashtra",
      Region: "West",
      Category: "Office Supplies",
      Sub_Category: "Paper",
      Product_Name: invoiceData.vendorName,
      GST_Type: invoiceData.igst > 0 ? "Inter-state" : "Intra-state",
      Order_Month: new Date(invoiceData.date).getMonth() + 1,
      Order_Day: new Date(invoiceData.date).getDate(),
      Order_Weekday: new Date(invoiceData.date).getDay()
    });
    return response.data.predicted_gst_amount;
  } catch (error) {
    console.error('ML Predict GST Error:', error.message);
    return null;
  }
};

const detectAnomaly = async (invoiceData) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/detect-fraud`, {
      Sales: invoiceData.amount,
      GST_Amount: invoiceData.cgst + invoiceData.sgst + invoiceData.igst,
      GST_Rate: invoiceData.taxRate,
      GST_Ratio: (invoiceData.cgst + invoiceData.sgst + invoiceData.igst) / (invoiceData.amount || 1),
      High_Value: invoiceData.amount > 50000 ? 1 : 0,
      Order_Month: new Date(invoiceData.date).getMonth() + 1
    });
    return response.data;
  } catch (error) {
    console.error('ML Anomaly Detection Error:', error.message);
    return { is_fraud: false, confidence_score: 0 };
  }
};

export { predictGST, detectAnomaly };
