import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { protect } from '../middleware/authMiddleware.js';
import Invoice from '../models/Invoice.js';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Build a rich GST system prompt injected with live user data
const buildSystemPrompt = (context) => `You are GST Copilot — an expert AI assistant for Indian Goods & Services Tax (GST) law.
You help small business owners with GST compliance, ITC claims, filing deadlines, and tax planning.

COMPREHENSIVE GST KNOWLEDGE BASE:

1. CGST/SGST vs IGST:
   - Intra-state (same state) transactions: CGST (Central) + SGST (State), each = half the total GST rate.
   - Inter-state (different state) transactions: IGST (Integrated) = full GST rate.
   - Import of goods/services: IGST applicable (Sec 5, IGST Act).

2. INPUT TAX CREDIT (ITC):
   - Eligibility under Section 16: registered taxpayer, goods/services used for business, tax invoice held, tax paid by supplier.
   - Blocked credits under Section 17(5): motor vehicles (unless for resale/transport/training), food & beverages, health services (unless mandatory by law), works contract for immovable property, personal use items.
   - ITC must be claimed within earlier of: annual return of that year or November 30 of following financial year.

3. FILING DEADLINES & LATE FEES:
   - GSTR-1 (outward supplies): monthly by 11th, quarterly by 13th of following month.
   - GSTR-3B (summary return): monthly by 20th, quarterly by 22nd/24th depending on state.
   - GSTR-9 (annual return): by December 31 of following financial year.
   - Late fees: ₹50/day (₹25 CGST + ₹25 SGST) for normal returns; ₹20/day for nil returns; maximum ₹5,000.
   - Interest on late payment: 18% p.a.

4. PLACE OF SUPPLY RULES:
   - Goods: location where goods are delivered.
   - Services: generally location of recipient. Special rules for immovable property, events, transport.
   - Online services to unregistered persons: location of recipient.

5. REVERSE CHARGE MECHANISM (RCM):
   - Notified goods/services where recipient pays GST (not supplier).
   - Examples: legal services by advocate, goods transport by GTA, sponsorship services.
   - Supplies from unregistered suppliers to registered businesses (for certain categories).
   - ITC on RCM payments is available.

6. E-WAY BILL:
   - Required for movement of goods valued over ₹50,000.
   - Generated on e-waybill.nic.in before goods movement begins.
   - Valid for: up to 100 km = 1 day; every 100 km thereafter = 1 additional day.
   - Not required for: non-motorized transport, goods exempted under Annexure to Rule 138.

7. COMPOSITION SCHEME:
   - Eligibility: annual aggregate turnover ≤ ₹1.5 crore (₹75 lakh for special category states).
   - Tax rates: Manufacturers 1% (0.5% CGST + 0.5% SGST); Traders 1%; Restaurants 5%; Service providers 6%.
   - Cannot claim ITC; cannot make inter-state supply; cannot issue tax invoice.

8. HSN/SAC CODE REQUIREMENTS:
   - Turnover ≤ ₹5 crore: 4-digit HSN.
   - Turnover > ₹5 crore: 6-digit HSN.
   - Services: SAC code mandatory.

9. GST RATES:
   - 0%: Essential items — rice, wheat, milk, eggs, vegetables, books.
   - 5%: Packaged food, footwear <₹1000, transport services.
   - 12%: Processed food, mobile phones, computers.
   - 18%: Most services, electronics, engineering goods (most common rate).
   - 28%: Luxury goods, automobiles, cigarettes, aerated drinks + cess.

USER'S BUSINESS CONTEXT (live data):
${context}

RESPONSE GUIDELINES:
- Always cite relevant GST section/rule (e.g., "Under Section 16(2) of CGST Act...").
- Keep responses concise, practical, and actionable for small business owners.
- Use ₹ for amounts, format numbers with Indian number system.
- If a question is outside GST scope, gently redirect.
- Do NOT give legal advice; recommend consulting a CA for complex matters.`;

// POST /api/copilot/chat
router.post('/chat', protect, async (req, res) => {
  try {
    const { messages, userId } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'messages array is required' });
    }

    // Fetch user's last 10 invoices for context
    const recentInvoices = await Invoice.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(10)
      .lean();

    // Build context summary
    let contextStr = 'No invoices found for this user yet.';
    if (recentInvoices.length > 0) {
      const totalTax = recentInvoices.reduce(
        (sum, inv) => sum + (inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0),
        0
      );
      const anomalyCount = recentInvoices.filter((inv) => inv.isAnomaly).length;
      const vendorNames = [...new Set(recentInvoices.map((inv) => inv.vendorName))].slice(0, 5);
      const taxRates = [...new Set(recentInvoices.map((inv) => inv.taxRate))].sort();

      contextStr = `
- Total invoices in context: ${recentInvoices.length}
- Total GST paid (last 10 invoices): ₹${totalTax.toLocaleString('en-IN')}
- Anomaly flags: ${anomalyCount} invoice(s) flagged
- Common tax rates used: ${taxRates.join('%, ')}%
- Top vendors: ${vendorNames.join(', ')}
      `.trim();
    }

    const systemPrompt = buildSystemPrompt(contextStr);

    // Convert messages to Gemini format (role: user/model, parts: [{text}])
    // Gemini history MUST start with a user message.
    let geminiHistory = messages.slice(0, -1).map(({ role, content }) => ({
      role: role === 'assistant' ? 'model' : 'user',
      parts: [{ text: content }],
    }));

    // Find the first index where role is 'user' and slice from there
    const firstUserIndex = geminiHistory.findIndex(m => m.role === 'user');
    if (firstUserIndex !== -1) {
      geminiHistory = geminiHistory.slice(firstUserIndex);
    } else {
      geminiHistory = []; // No user messages yet in history
    }

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-3.1-flash-lite'];
    let reply = '';
    let lastError;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Copilot trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
        });
        const chat = model.startChat({ history: geminiHistory });
        const lastMessage = messages[messages.length - 1];
        const result = await chat.sendMessage(lastMessage.content);
        reply = result.response.text();
        break;
      } catch (err) {
        console.warn(`Copilot model ${modelName} failed...`, err.message);
        lastError = err;
      }
    }

    if (!reply) {
      throw lastError || new Error('All Copilot models failed');
    }

    res.json({ reply, role: 'assistant' });
  } catch (error) {
    console.error('Copilot chat error:', error);
    res.status(500).json({ message: 'GST Copilot failed', error: error.message });
  }
});

export default router;
