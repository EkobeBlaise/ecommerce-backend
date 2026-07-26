import express from 'express';
import {
  sendVerification,
  verifyEmail,
  resendVerification,
  checkVerificationStatus,
  cleanExpiredTokens,
} from '../controllers/emailVerificationController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/send', sendVerification);
router.get('/:token', verifyEmail);
router.post('/resend', resendVerification);
router.get('/status/:email', checkVerificationStatus);

// Admin route
router.delete('/clean', protect, admin, cleanExpiredTokens);

export default router;