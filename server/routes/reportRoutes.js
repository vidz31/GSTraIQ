import express from 'express';
import { generatePDFReport, generateCSVReport } from '../controllers/reportController.js';
import { protect, checkBusinessAccess } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/pdf', protect, checkBusinessAccess, generatePDFReport);
router.get('/csv', protect, checkBusinessAccess, generateCSVReport);

export default router;
