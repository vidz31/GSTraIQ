import express from 'express';
import asyncHandler from 'express-async-handler';
import Business from '../models/Business.js';
import Invoice from '../models/Invoice.js';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper: check if user has access to a business
const userHasAccess = (business, userId) => {
  const idStr = userId.toString();
  if (business.owner.toString() === idStr) return true;
  return business.members.some((m) => m.user.toString() === idStr);
};

// ----------------------------------------------------------------
// GET /api/businesses/ca-dashboard — MUST be before /:id
// Returns all businesses where the user has a 'ca' role
// ----------------------------------------------------------------
router.get(
  '/ca-dashboard',
  protect,
  asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Find all businesses where user is a CA member
    const businesses = await Business.find({
      'members.user': userId,
      'members.role': 'ca',
    }).lean();

    // Also include businesses owned by user (for full flexibility)
    const ownedBusinesses = await Business.find({ owner: userId }).lean();

    const allBusinesses = [
      ...ownedBusinesses,
      ...businesses.filter(
        (b) => !ownedBusinesses.some((ob) => ob._id.toString() === b._id.toString())
      ),
    ];

    const summaries = await Promise.all(
      allBusinesses.map(async (biz) => {
        const [invoiceCount, taxAgg, anomalyCount] = await Promise.all([
          Invoice.countDocuments({ business: biz._id }),
          Invoice.aggregate([
            { $match: { business: biz._id } },
            {
              $group: {
                _id: null,
                totalTax: { $sum: { $add: ['$cgst', '$sgst', '$igst'] } },
              },
            },
          ]),
          Invoice.countDocuments({ business: biz._id, isAnomaly: true }),
        ]);

        return {
          businessId: biz._id,
          name: biz.name,
          gstin: biz.gstin,
          businessType: biz.businessType,
          invoiceCount,
          totalTaxLiability: taxAgg[0]?.totalTax || 0,
          anomalyCount,
        };
      })
    );

    res.json(summaries);
  })
);

// ----------------------------------------------------------------
// POST /api/businesses — Create a new business
// ----------------------------------------------------------------
router.post(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const { name, gstin, businessType } = req.body;

    if (!name || !gstin) {
      res.status(400);
      throw new Error('name and gstin are required');
    }

    const business = await Business.create({
      name,
      gstin: gstin.toUpperCase(),
      businessType: businessType || 'regular',
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }],
    });

    res.status(201).json(business);
  })
);

// ----------------------------------------------------------------
// GET /api/businesses — List all businesses for logged-in user
// ----------------------------------------------------------------
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const businesses = await Business.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    }).lean();

    res.json(businesses);
  })
);

// ----------------------------------------------------------------
// GET /api/businesses/:id — Get single business
// ----------------------------------------------------------------
router.get(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const business = await Business.findById(req.params.id).populate('members.user', 'name email');
    if (!business) {
      res.status(404);
      throw new Error('Business not found');
    }

    if (!userHasAccess(business, req.user._id)) {
      res.status(403);
      throw new Error('Not authorized to view this business');
    }

    res.json(business);
  })
);

// ----------------------------------------------------------------
// PUT /api/businesses/:id — Update business (owner only)
// ----------------------------------------------------------------
router.put(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const business = await Business.findById(req.params.id);
    if (!business) {
      res.status(404);
      throw new Error('Business not found');
    }

    if (business.owner.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Only the owner can update this business');
    }

    const { name, gstin, businessType } = req.body;
    if (name) business.name = name;
    if (gstin) business.gstin = gstin.toUpperCase();
    if (businessType) business.businessType = businessType;

    await business.save();
    res.json(business);
  })
);

// ----------------------------------------------------------------
// POST /api/businesses/:id/invite — Invite a CA by email
// ----------------------------------------------------------------
router.post(
  '/:id/invite',
  protect,
  asyncHandler(async (req, res) => {
    const { email, role } = req.body;

    const business = await Business.findById(req.params.id);
    if (!business) {
      res.status(404);
      throw new Error('Business not found');
    }

    if (business.owner.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Only the owner can invite members');
    }

    const invitedUser = await User.findOne({ email });
    if (!invitedUser) {
      res.status(404);
      throw new Error('User with this email not found');
    }

    // Check if already a member
    const alreadyMember = business.members.some(
      (m) => m.user.toString() === invitedUser._id.toString()
    );
    if (alreadyMember) {
      res.status(400);
      throw new Error('User is already a member of this business');
    }

    business.members.push({ user: invitedUser._id, role: role || 'ca' });
    await business.save();

    res.json({ message: `${invitedUser.name} invited as ${role || 'ca'}` });
  })
);

// ----------------------------------------------------------------
// DELETE /api/businesses/:id/members/:userId — Remove a member
// ----------------------------------------------------------------
router.delete(
  '/:id/members/:userId',
  protect,
  asyncHandler(async (req, res) => {
    const business = await Business.findById(req.params.id);
    if (!business) {
      res.status(404);
      throw new Error('Business not found');
    }

    if (business.owner.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Only the owner can remove members');
    }

    // Don't allow removing the owner
    if (req.params.userId === business.owner.toString()) {
      res.status(400);
      throw new Error('Cannot remove the owner of the business');
    }

    business.members = business.members.filter(
      (m) => m.user.toString() !== req.params.userId
    );
    await business.save();

    res.json({ message: 'Member removed successfully' });
  })
);

export default router;
