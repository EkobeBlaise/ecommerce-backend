import express from 'express';
import {
  requestReset,
  validateToken,
  resetPassword,
  cleanExpiredTokens,
} from '../controllers/passwordResetController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/request', requestReset);
router.get('/validate/:token', validateToken);
router.post('/reset', resetPassword);

// Admin route (optional)
router.delete('/clean', protect, admin, cleanExpiredTokens);

export default router;