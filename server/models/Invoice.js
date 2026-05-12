import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    vendorName: {
      type: String,
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0.0,
    },
    taxRate: {
      type: Number,
      required: true,
      default: 18,
    },
    cgst: {
      type: Number,
      required: true,
      default: 0.0,
    },
    sgst: {
      type: Number,
      required: true,
      default: 0.0,
    },
    igst: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0.0,
    },
    status: {
      type: String,
      required: true,
      default: 'Pending',
    },
    isAnomaly: {
      type: Boolean,
      default: false,
    },
    anomalyType: {
      type: String,
    },
    // Multi-business support — optional for backward compatibility
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;
