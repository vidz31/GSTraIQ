import Invoice from '../models/Invoice.js';
import asyncHandler from 'express-async-handler';
import { calculateGST } from '../services/gstEngine.js';
import { detectAnomaly } from '../services/mlService.js';

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private
// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Private
const addInvoice = asyncHandler(async (req, res) => {
  let { vendorName, invoiceNumber, date, amount, taxRate, type } = req.body;

  if (!amount) amount = 0;
  if (!taxRate) taxRate = 18;
  if (!vendorName) vendorName = "Unknown Vendor";
  if (!date) date = new Date().toISOString();

  // Duplicate Detection (Check within the business context if available)
  const filter = req.business 
    ? { business: req.business._id, invoiceNumber, vendorName } 
    : { user: req.user._id, invoiceNumber, vendorName };

  const duplicate = await Invoice.findOne(filter);

  const { cgst, sgst, igst, totalAmount } = calculateGST(Number(amount), Number(taxRate), type);

  const anomalyResult = await detectAnomaly({
    amount,
    taxRate,
    cgst,
    sgst,
    igst,
    date
  });

  const isDuplicate = !!duplicate;

  const invoice = new Invoice({
    user: req.user._id, // The person who uploaded it
    business: req.business ? req.business._id : null,
    vendorName,
    invoiceNumber,
    date,
    amount,
    taxRate,
    cgst,
    sgst,
    igst,
    totalAmount,
    status: (anomalyResult.is_fraud || isDuplicate) ? 'Suspicious' : 'Verified',
    isAnomaly: anomalyResult.is_fraud || isDuplicate,
    anomalyType: isDuplicate ? 'Duplicate Invoice' : (anomalyResult.is_fraud ? 'ML Flagged' : null)
  });

  const createdInvoice = await invoice.save();
  res.status(201).json(createdInvoice);
});

// @desc    Get all invoices for the current context
// @route   GET /api/invoices
// @access  Private
const getInvoices = asyncHandler(async (req, res) => {
  // Logic: 
  // 1. If business context exists: Return invoices for THAT business 
  //    AND return "orphaned" invoices (business: null) if the user is the owner.
  // 2. If no business context: Return all invoices for the user.
  
  let filter;
  if (req.business) {
    const isOwner = req.business.owner.toString() === req.user._id.toString();
    if (isOwner) {
      filter = { 
        $or: [
          { business: req.business._id }, 
          { user: req.user._id, business: { $exists: false } },
          { user: req.user._id, business: null }
        ] 
      };
    } else {
      filter = { business: req.business._id };
    }
  } else {
    filter = { user: req.user._id };
  }
    
  const invoices = await Invoice.find(filter).sort({ date: -1 });
  res.json(invoices);
});

// @desc    Get invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  // Verify access: Either user is the one who uploaded it, OR user has access to the business
  const hasUserAccess = invoice.user.toString() === req.user._id.toString();
  const hasBusinessAccess = req.business && invoice.business?.toString() === req.business._id.toString();

  if (hasUserAccess || hasBusinessAccess) {
    res.json(invoice);
  } else {
    res.status(403);
    throw new Error('Not authorized to view this invoice');
  }
});

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
const updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  const hasUserAccess = invoice.user.toString() === req.user._id.toString();
  const hasBusinessAccess = req.business && invoice.business?.toString() === req.business._id.toString();

  if (hasUserAccess || hasBusinessAccess) {
    invoice.vendorName = req.body.vendorName || invoice.vendorName;
    invoice.amount = req.body.amount || invoice.amount;
    
    if (req.body.amount || req.body.taxRate) {
      const { cgst, sgst, igst, totalAmount } = calculateGST(
        Number(req.body.amount || invoice.amount), 
        Number(req.body.taxRate || invoice.taxRate),
        req.body.type || (invoice.igst > 0 ? 'inter' : 'intra')
      );
      invoice.cgst = cgst;
      invoice.sgst = sgst;
      invoice.igst = igst;
      invoice.totalAmount = totalAmount;
    }

    const updatedInvoice = await invoice.save();
    res.json(updatedInvoice);
  } else {
    res.status(403);
    throw new Error('Not authorized to update this invoice');
  }
});

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private
const deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  const hasUserAccess = invoice.user.toString() === req.user._id.toString();
  const hasBusinessAccess = req.business && invoice.business?.toString() === req.business._id.toString();

  if (hasUserAccess || hasBusinessAccess) {
    await invoice.deleteOne();
    res.json({ message: 'Invoice removed' });
  } else {
    res.status(403);
    throw new Error('Not authorized to delete this invoice');
  }
});

export { addInvoice, getInvoices, getInvoiceById, updateInvoice, deleteInvoice };
