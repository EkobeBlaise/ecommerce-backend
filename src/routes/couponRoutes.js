import express from 'express';
import {
  getCoupons,
  getCouponById,
  getCouponByCode,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  deleteExpiredCoupons,
  validateCoupon,
  applyCoupon,
  getCouponStats,
  getCouponsByStatus,
  getActiveCoupons,
} from '../controllers/couponController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Public / validation routes (no auth needed for validation/apply)
router.post('/validate', validateCoupon);
router.post('/apply', applyCoupon);

// Admin-only CRUD and admin features
router.get('/', protect, admin, getCoupons);
router.get('/stats', protect, admin, getCouponStats);
router.get('/status/:status', protect, admin, getCouponsByStatus);
router.get('/active', protect, admin, getActiveCoupons);
router.get('/code/:code', protect, admin, getCouponByCode);
router.get('/:id', protect, admin, getCouponById);
router.post('/', protect, admin, createCoupon);
router.put('/:id', protect, admin, updateCoupon);
router.delete('/:id', protect, admin, deleteCoupon);
router.delete('/expired', protect, admin, deleteExpiredCoupons);

export default router;