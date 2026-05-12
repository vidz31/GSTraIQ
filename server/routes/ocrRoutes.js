import express from 'express';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// --------------- Multer (memory storage) ---------------
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WEBP or PDF files are allowed'), false);
    }
  },
});

// --------------- GSTIN validator ---------------
const validateGSTIN = (gstin) => {
  if (!gstin || typeof gstin !== 'string') return false;
  // 15-char: 2-digit state code + 10-char PAN + entity number + Z + checksum
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin.toUpperCase());
};

// --------------- Gemini client ---------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --------------- POST /api/invoices/scan-ocr ---------------
router.post('/scan-ocr', protect, upload.single('invoice'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const base64Image = req.file.buffer.toString('base64');
    const mediaType = req.file.mimetype; // Gemini 1.5 supports PDF natively!

    const prompt = `You are an expert OCR and invoice data extraction assistant. 
Analyze the provided invoice image and extract all available information.

Return ONLY valid JSON (no markdown, no explanation) in this exact schema:
{
  "vendorName": "string or null",
  "GSTIN": "15-char GSTIN string or null",
  "invoiceNumber": "string or null",
  "date": "YYYY-MM-DD or null",
  "amount": number_or_null,
  "taxRate": number_between_0_and_100_or_null,
  "confidence": {
    "vendorName": 0_to_1_float,
    "GSTIN": 0_to_1_float,
    "invoiceNumber": 0_to_1_float,
    "date": 0_to_1_float,
    "amount": 0_to_1_float,
    "taxRate": 0_to_1_float
  }
}

Rules:
- confidence 0.9+ means clearly visible and unambiguous
- confidence 0.5-0.89 means partially visible or slightly unclear
- confidence <0.5 means very unclear, guessed, or not found (set field to null)
- taxRate should be extracted from GST percentage lines (CGST+SGST rate *2 or IGST rate)
- amount should be the base taxable amount (before GST)
- GSTIN must be exactly 15 characters if present`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-3.1-flash-lite'];
    let result;
    let lastError;
    let usedModel = '';

    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying Gemini model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const imagePart = {
          inlineData: {
            data: base64Image,
            mimeType: mediaType,
          },
        };
        result = await model.generateContent([prompt, imagePart]);
        usedModel = modelName;
        break; // Success!
      } catch (err) {
        console.warn(`Model ${modelName} failed, trying next...`, err.message);
        lastError = err;
      }
    }

    if (!result) {
      throw lastError || new Error('All Gemini models failed');
    }

    const rawText = result.response.text().trim();
    console.log(`OCR Success with model: ${usedModel}`);

    let extracted;
    try {
      // Strip potential markdown code fences
      const jsonStr = rawText.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
      extracted = JSON.parse(jsonStr);
    } catch {
      return res.status(422).json({
        message: 'Gemini returned non-JSON response',
        raw: rawText,
      });
    }

    // Validate and annotate GSTIN
    const gstinValid = validateGSTIN(extracted.GSTIN);
    if (extracted.GSTIN && !gstinValid) {
      extracted.gstinValidationError = 'GSTIN format is invalid (should be 15-char: 2-digit state code + 10-char PAN + entity + Z + checksum)';
      extracted.confidence.GSTIN = Math.min(extracted.confidence.GSTIN, 0.3);
    } else if (gstinValid) {
      extracted.gstinValid = true;
    }

    return res.json({
      success: true,
      data: extracted,
    });
  } catch (error) {
    console.error('OCR scan error:', error);
    res.status(500).json({
      message: 'OCR processing failed',
      error: error.message,
    });
  }
});

export default router;
