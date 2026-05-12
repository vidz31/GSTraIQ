import mongoose from 'mongoose';

const businessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    gstin: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (v) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v),
        message: 'Invalid GSTIN format',
      },
    },
    businessType: {
      type: String,
      enum: ['regular', 'composition', 'qrmp'],
      default: 'regular',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        role: {
          type: String,
          enum: ['owner', 'ca', 'viewer'],
          default: 'viewer',
        },
      },
    ],
  },
  { timestamps: true }
);

const Business = mongoose.model('Business', businessSchema);
export default Business;
