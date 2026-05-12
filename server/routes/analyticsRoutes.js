import express from 'express';
import { 
  getGSTSummary, 
  getVendorContributions, 
  getMonthlyTrends,
  getAdvancedAnalytics
} from '../controllers/analyticsController.js';
import { protect, checkBusinessAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/summary', protect, checkBusinessAccess, getGSTSummary);
router.get('/vendors', protect, checkBusinessAccess, getVendorContributions);
router.get('/trends', protect, checkBusinessAccess, getMonthlyTrends);
router.get('/advanced', protect, checkBusinessAccess, getAdvancedAnalytics);

export default router;
