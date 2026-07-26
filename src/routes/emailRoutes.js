import express from 'express';
import {
  getEmails,
  getEmailById,
  sendTestEmail,
  previewEmail,
  getTemplates,
  resendEmail,
  deleteEmailLog,
} from '../controllers/emailController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Admin-only routes
router.get('/', protect, admin, getEmails);
router.get('/templates', protect, admin, getTemplates);
router.get('/:id', protect, admin, getEmailById);
router.post('/send', protect, admin, sendTestEmail);
router.post('/preview', protect, admin, previewEmail);
router.post('/:id/resend', protect, admin, resendEmail);
router.delete('/:id', protect, admin, deleteEmailLog);

export default router;