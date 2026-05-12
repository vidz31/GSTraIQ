import asyncHandler from 'express-async-handler';
import Invoice from '../models/Invoice.js';
import PDFDocument from 'pdfkit';
import { createObjectCsvStringifier } from 'csv-writer';

// @desc    Generate PDF report of invoices
// @route   GET /api/reports/pdf
// @access  Private
// @desc    Generate PDF report of invoices
// @route   GET /api/reports/pdf
// @access  Private
const generatePDFReport = asyncHandler(async (req, res) => {
  const { vendor, startDate, endDate, minAmount, status } = req.query;
  
  let query = req.business 
    ? { business: req.business._id } 
    : { user: req.user._id };
  
  if (vendor) query.vendorName = { $regex: vendor, $options: 'i' };
  if (status) query.status = status;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  if (minAmount) query.amount = { $gte: Number(minAmount) };

  const invoices = await Invoice.find(query).sort({ date: -1 });

  const doc = new PDFDocument({ margin: 50 });
  const filename = `GST_Report_${Date.now()}.pdf`;

  res.setHeader('Content-disposition', `attachment; filename=${filename}`);
  res.setHeader('Content-type', 'application/pdf');

  doc.pipe(res);

  // Header
  doc.fontSize(25).text('GSTraIQ - Tax Summary Report', { align: 'center' });
  doc.moveDown();
  if (req.business) {
    doc.fontSize(14).text(`Business: ${req.business.name}`, { align: 'left' });
    doc.fontSize(10).text(`GSTIN: ${req.business.gstin}`, { align: 'left' });
  } else {
    doc.fontSize(12).text(`User: ${req.user.email}`, { align: 'left' });
  }
  doc.text(`Generated on: ${new Date().toLocaleString()}`);
  doc.moveDown();

  // Table header
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Date', 50, 180);
  doc.text('Vendor', 120, 180);
  doc.text('Inv #', 250, 180);
  doc.text('Amount', 350, 180);
  doc.text('GST', 450, 180);
  doc.moveDown();
  doc.moveTo(50, 195).lineTo(550, 195).stroke();

  // Table rows
  doc.font('Helvetica');
  let y = 210;
  invoices.forEach(inv => {
    if (y > 700) { doc.addPage(); y = 50; }
    doc.text(new Date(inv.date).toLocaleDateString(), 50, y);
    doc.text(inv.vendorName.substring(0, 20), 120, y);
    doc.text(inv.invoiceNumber, 250, y);
    doc.text(`INR ${inv.amount.toLocaleString()}`, 350, y);
    doc.text(`INR ${(inv.cgst + inv.sgst + inv.igst).toLocaleString()}`, 450, y);
    y += 20;
  });

  doc.end();
});

// @desc    Generate CSV report of invoices
// @route   GET /api/reports/csv
// @access  Private
const generateCSVReport = asyncHandler(async (req, res) => {
  const { vendor, startDate, endDate, minAmount, status } = req.query;
  
  let query = req.business 
    ? { business: req.business._id } 
    : { user: req.user._id };
  
  if (vendor) query.vendorName = { $regex: vendor, $options: 'i' };
  if (status) query.status = status;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  if (minAmount) query.amount = { $gte: Number(minAmount) };

  const invoices = await Invoice.find(query).sort({ date: -1 });

  const csvStringifier = createObjectCsvStringifier({
    header: [
      { id: 'date', title: 'DATE' },
      { id: 'vendorName', title: 'VENDOR' },
      { id: 'invoiceNumber', title: 'INVOICE NO' },
      { id: 'amount', title: 'BASE AMOUNT' },
      { id: 'tax', title: 'TAX AMOUNT' },
      { id: 'total', title: 'TOTAL AMOUNT' },
      { id: 'status', title: 'STATUS' }
    ]
  });

  const records = invoices.map(inv => ({
    date: new Date(inv.date).toLocaleDateString(),
    vendorName: inv.vendorName,
    invoiceNumber: inv.invoiceNumber,
    amount: inv.amount,
    tax: inv.cgst + inv.sgst + inv.igst,
    total: inv.totalAmount,
    status: inv.status
  }));

  const csvString = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
  const filename = `GST_Report_${Date.now()}.csv`;

  res.setHeader('Content-disposition', `attachment; filename=${filename}`);
  res.setHeader('Content-type', 'text/csv');
  res.send(csvString);
});

export { generatePDFReport, generateCSVReport };
