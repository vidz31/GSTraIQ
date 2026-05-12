import express from 'express';
import { 
  addInvoice, 
  getInvoices, 
  getInvoiceById, 
  updateInvoice, 
  deleteInvoice 
} from '../controllers/invoiceController.js';
import { protect, checkBusinessAccess } from '../middleware/authMiddleware.js';
import ocrRouter from './ocrRoutes.js';

const router = express.Router();

// Mount OCR sub-router
router.use('/', ocrRouter);

router.route('/')
  .post(protect, checkBusinessAccess, addInvoice)
  .get(protect, checkBusinessAccess, getInvoices);

router.route('/:id')
  .get(protect, checkBusinessAccess, getInvoiceById)
  .put(protect, checkBusinessAccess, updateInvoice)
  .delete(protect, checkBusinessAccess, deleteInvoice);

export default router;
