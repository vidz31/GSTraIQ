import express from 'express';
import { 
  getGSTPrediction, 
  getAnomalies,
  resolveAnomaly,
  dismissAnomaly,
  reScanAnomalies,
  predictNextMonth,
  getPredictionHistory
} from '../controllers/predictionController.js';
import { protect, checkBusinessAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/gst', protect, checkBusinessAccess, getGSTPrediction);
router.get('/anomalies', protect, checkBusinessAccess, getAnomalies);
router.get('/predict', protect, checkBusinessAccess, predictNextMonth);
router.get('/history', protect, checkBusinessAccess, getPredictionHistory);
router.put('/anomalies/:id/resolve', protect, checkBusinessAccess, resolveAnomaly);
router.put('/anomalies/:id/dismiss', protect, checkBusinessAccess, dismissAnomaly);
router.post('/anomalies/re-scan', protect, checkBusinessAccess, reScanAnomalies);

export default router;
