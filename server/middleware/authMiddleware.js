import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Business from '../models/Business.js';

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Reads X-Business-ID header and verifies the logged-in user has access.
// If header is present but access is denied → 403.
// If header is absent → just continue (single-business mode).
const checkBusinessAccess = asyncHandler(async (req, res, next) => {
  const businessId = req.headers['x-business-id'];
  if (!businessId) {
    return next();
  }

  const business = await Business.findById(businessId);
  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }

  const userId = req.user._id.toString();
  const isOwner = business.owner.toString() === userId;
  const isMember = business.members.some((m) => m.user.toString() === userId);

  if (!isOwner && !isMember) {
    res.status(403);
    throw new Error('Not authorized to access this business');
  }

  req.business = business;
  next();
});

export { protect, checkBusinessAccess };

