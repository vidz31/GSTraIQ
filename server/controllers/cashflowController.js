import asyncHandler from 'express-async-handler';
import Invoice from '../models/Invoice.js';

// @desc  Get cash flow planner data
// @route GET /api/cashflow/planner
// @access Private
// @desc  Get cash flow planner data
// @route GET /api/cashflow/planner
// @access Private
const getCashFlowPlanner = asyncHandler(async (req, res) => {
  const matchFilter = req.business
    ? { business: req.business._id }
    : { user: req.user._id };

  // ---------- Aggregation: actual monthly tax data ----------
  const monthlyRaw = await Invoice.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
        },
        totalTax: {
          $sum: { $add: ['$cgst', '$sgst', '$igst'] },
        },
        invoiceCount: { $sum: 1 },
        avgInvoiceAmount: { $avg: '$amount' },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const monthlyActual = monthlyRaw.map((m) => ({
    month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
    totalTax: Math.round(m.totalTax),
    invoiceCount: m.invoiceCount,
    avgInvoiceAmount: Math.round(m.avgInvoiceAmount || 0),
  }));

  // ---------- Prediction: average of last 3 months ----------
  const last3 = monthlyActual.slice(-3);
  const avgTax =
    last3.length > 0
      ? last3.reduce((s, m) => s + m.totalTax, 0) / last3.length
      : 0;

  const confidenceMap = ['Low', 'Medium', 'High'];
  const confidence = confidenceMap[Math.min(last3.length - 1, 2)] || 'Low';

  const now = new Date();
  const predictions = [1, 2, 3].map((offset) => {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return {
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      predictedTax: Math.round(avgTax),
      confidence,
    };
  });

  // ---------- Reserve plan ----------
  const nextMonthLiability = predictions[0]?.predictedTax || 0;
  const recommendedBuffer = Math.round(nextMonthLiability * 1.2);
  const weeklySetAside = Math.round(nextMonthLiability / 4.33);
  const dailySetAside = Math.round(nextMonthLiability / 30);

  const reservePlan = {
    nextMonthLiability,
    weeklySetAside,
    dailySetAside,
    recommendedBuffer,
  };

  // ---------- Insights ----------
  const insights = [];

  if (monthlyActual.length === 0) {
    insights.push('Add invoices to unlock cash flow insights and predictions.');
  } else {
    // Find highest month
    const highest = [...monthlyActual].sort((a, b) => b.totalTax - a.totalTax)[0];
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const highestMonthName = monthNames[parseInt(highest.month.split('-')[1], 10) - 1];
    insights.push(`${highestMonthName} had your highest GST liability of ₹${highest.totalTax.toLocaleString('en-IN')} — plan reserves early.`);

    if (last3.length >= 2) {
      const trend = last3[last3.length - 1].totalTax - last3[0].totalTax;
      if (trend > 0) {
        insights.push(`Your tax liability has been trending upward by ₹${Math.round(trend / (last3.length - 1)).toLocaleString('en-IN')} per month — consider building a larger buffer.`);
      } else if (trend < 0) {
        insights.push(`Your tax liability is trending downward — business may be slowing or more exemptions are being applied.`);
      }
    }

    insights.push(`Set aside ₹${weeklySetAside.toLocaleString('en-IN')} every week to meet your predicted next-month GST liability of ₹${nextMonthLiability.toLocaleString('en-IN')}.`);
  }

  res.json({
    monthlyActual,
    predictions,
    reservePlan,
    insights,
  });
});

export { getCashFlowPlanner };
