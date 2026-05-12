import asyncHandler from 'express-async-handler';
import Invoice from '../models/Invoice.js';
import { predictGST, detectAnomaly } from '../services/mlService.js';
import { calculateGST } from '../services/gstEngine.js';

// @desc    Get GST prediction for next period
// @route   GET /api/predictions/gst
// @access  Private
const getGSTPrediction = asyncHandler(async (req, res) => {
  const filter = req.business
    ? { business: req.business._id }
    : { user: req.user._id };

  const invoices = await Invoice.find(filter).sort({ date: -1 }).limit(10);
  
  if (!invoices || invoices.length === 0) {
    return res.json({ predicted_gst_amount: 0, confidence: "Low (No Data)" });
  }

  // Use the average of recent invoices as base for prediction
  const avgInvoice = {
    amount: invoices.reduce((acc, inv) => acc + inv.amount, 0) / invoices.length,
    taxRate: invoices[0].taxRate,
    igst: invoices[0].igst,
    vendorName: invoices[0].vendorName,
    date: new Date()
  };

  const prediction = await predictGST(avgInvoice);

  res.json({
    predicted_gst_amount: prediction || (avgInvoice.amount * 0.18),
    confidence: "High",
    period: "Next Month"
  });
});

// @desc    Get anomalies/suspicious invoices
// @route   GET /api/predictions/anomalies
// @access  Private
const getAnomalies = asyncHandler(async (req, res) => {
  const filter = req.business
    ? { business: req.business._id, isAnomaly: true }
    : { user: req.user._id, isAnomaly: true };

  const anomalies = await Invoice.find(filter).sort({ date: -1 });
  res.json(anomalies);
});

// @desc    Resolve anomaly
// @route   PUT /api/predictions/anomalies/:id/resolve
// @access  Private
const resolveAnomaly = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  // Access check: Owner or CA (via businessId)
  const hasUserAccess = invoice.user.toString() === req.user._id.toString();
  const hasBusinessAccess = req.business && invoice.business?.toString() === req.business._id.toString();

  if (hasUserAccess || hasBusinessAccess) {
    const { vendorName, amount, taxRate, type, date } = req.body;

    if (vendorName) invoice.vendorName = vendorName;
    if (amount) invoice.amount = amount;
    if (taxRate) invoice.taxRate = taxRate;
    if (date) invoice.date = date;
    
    const { cgst, sgst, igst, totalAmount } = calculateGST(
      invoice.amount, 
      invoice.taxRate, 
      type || (invoice.igst > 0 ? 'inter' : 'intra')
    );
    
    invoice.cgst = cgst;
    invoice.sgst = sgst;
    invoice.igst = igst;
    invoice.totalAmount = totalAmount;

    invoice.isAnomaly = false;
    invoice.status = 'Verified';
    invoice.anomalyType = null;
    
    await invoice.save();
    res.json({ message: 'Anomaly resolved and data updated' });
  } else {
    res.status(403);
    throw new Error('Not authorized to resolve this anomaly');
  }
});

// @desc    Dismiss anomaly
// @route   PUT /api/predictions/anomalies/:id/dismiss
// @access  Private
const dismissAnomaly = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  const hasUserAccess = invoice.user.toString() === req.user._id.toString();
  const hasBusinessAccess = req.business && invoice.business?.toString() === req.business._id.toString();

  if (hasUserAccess || hasBusinessAccess) {
    invoice.isAnomaly = false;
    await invoice.save();
    res.json({ message: 'Anomaly dismissed' });
  } else {
    res.status(403);
    throw new Error('Not authorized to dismiss this anomaly');
  }
});

// @desc    Re-scan all invoices for anomalies
// @route   POST /api/predictions/anomalies/re-scan
// @access  Private
const reScanAnomalies = asyncHandler(async (req, res) => {
  const filter = req.business
    ? { business: req.business._id }
    : { user: req.user._id };

  const invoices = await Invoice.find(filter);
  
  let newAnomaliesCount = 0;
  for (const invoice of invoices) {
    const anomalyResult = await detectAnomaly({
      amount: invoice.amount,
      taxRate: invoice.taxRate,
      cgst: invoice.cgst,
      sgst: invoice.sgst,
      igst: invoice.igst,
      date: invoice.date
    });

    const wasAlreadyAnomaly = invoice.isAnomaly;
    invoice.isAnomaly = anomalyResult.is_fraud;
    invoice.status = anomalyResult.is_fraud ? 'Suspicious' : 'Verified';
    invoice.anomalyType = anomalyResult.is_fraud ? 'ML Flagged' : null;
    await invoice.save();
    
    if (anomalyResult.is_fraud && !wasAlreadyAnomaly) {
      newAnomaliesCount++;
    }
  }

  res.json({ 
    message: 'Re-scan completed', 
    totalScanned: invoices.length,
    newAnomaliesFound: newAnomaliesCount 
  });
});

// @desc    Predict next month GST
// @route   GET /api/predictions/predict
// @access  Private
const predictNextMonth = asyncHandler(async (req, res) => {
  const filter = req.business
    ? { business: req.business._id }
    : { user: req.user._id };

  const invoices = await Invoice.find(filter).sort({ date: -1 }).limit(20);
  
  const avgAmount = invoices.length > 0 
    ? invoices.reduce((acc, i) => acc + i.amount, 0) / invoices.length
    : 0;

  const prediction = {
    predictedAmount: Math.round(avgAmount * 1.1), // Simplified projection
    confidence: invoices.length > 10 ? 'High' : 'Medium',
    date: new Date(new Date().setMonth(new Date().getMonth() + 1))
  };

  res.json(prediction);
});

// @desc    Get prediction history
// @route   GET /api/predictions/history
// @access  Private
const getPredictionHistory = asyncHandler(async (req, res) => {
  // Currently mock data for history as we don't have a Prediction model yet
  res.json([
    { month: 'Jan', predicted: 2400, actual: 2350 },
    { month: 'Feb', predicted: 3100, actual: 3060 },
    { month: 'Mar', predicted: 2800, actual: 2900 }
  ]);
});

export { 
  getGSTPrediction, 
  getAnomalies, 
  resolveAnomaly, 
  dismissAnomaly, 
  reScanAnomalies,
  predictNextMonth,
  getPredictionHistory
};
