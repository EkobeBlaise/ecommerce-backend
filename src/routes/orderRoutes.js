import express from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus, // <-- Make sure this matches the export
  updatePaymentStatus,
  deleteOrder,
  getOrderStats,
  getDashboardStats,
  getRecentOrders,
  getOrdersByDateRange
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, admin, getOrders);
router.get('/stats', protect, admin, getOrderStats);
router.get('/dashboard', protect, admin, getDashboardStats);
router.get('/recent', protect, admin, getRecentOrders);
router.get('/date-range', protect, admin, getOrdersByDateRange);
router.get('/:id', protect, admin, getOrderById);
router.post('/', createOrder);
router.put('/:id/status', protect, admin, updateOrderStatus); // <-- Matches the exported function
router.put('/:id/payment', protect, admin, updatePaymentStatus);
router.delete('/:id', protect, admin, deleteOrder);

export default router;