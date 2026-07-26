import express from 'express';
import {
  getCustomers,
  getCustomerById,
  getCustomerStats,
  getTopCustomers,
  getRecentCustomers,
  updateCustomerStatus,
} from '../controllers/customerController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// All customer routes require admin authentication
router.get('/', protect, admin, getCustomers);
router.get('/stats', protect, admin, getCustomerStats);
router.get('/top', protect, admin, getTopCustomers);
router.get('/recent', protect, admin, getRecentCustomers);
router.get('/:id', protect, admin, getCustomerById);
router.put('/:id/status', protect, admin, updateCustomerStatus);

export default router;