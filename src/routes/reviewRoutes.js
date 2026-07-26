import express from 'express';
import {
  getReviews,
  getReviewById,
  getReviewStats,
  getProductReviews,
  createReview,
  updateReview,
  updateReviewStatus,
  deleteReview,
  moderateReview,
} from '../controllers/reviewController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// ============================================================
// PUBLIC ROUTES
// ============================================================
router.get('/product/:productId', getProductReviews);

// ============================================================
// AUTHENTICATED ROUTES
// ============================================================
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

// ============================================================
// ADMIN ROUTES
// ============================================================
router.get('/', protect, admin, getReviews);
router.get('/stats', protect, admin, getReviewStats);
router.get('/:id', protect, admin, getReviewById);
router.put('/:id/status', protect, admin, updateReviewStatus);
router.put('/:id/moderate', protect, admin, moderateReview);

export default router;