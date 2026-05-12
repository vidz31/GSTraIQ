import express from 'express';
import { getCashFlowPlanner } from '../controllers/cashflowController.js';
import { protect, checkBusinessAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/planner', protect, checkBusinessAccess, getCashFlowPlanner);

export default router;
