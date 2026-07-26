import express from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder,
  getOrderStats,
  getDashboardStats,
  getRecentOrders,
  getOrdersByDateRange,
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Public (create order) - no auth required
router.post('/', createOrder);

// Admin routes
router.get('/stats', protect, admin, getOrderStats);
router.get('/dashboard', protect, admin, getDashboardStats);
router.get('/recent', protect, admin, getRecentOrders);
router.get('/date-range', protect, admin, getOrdersByDateRange);
router.get('/', protect, admin, getOrders);
router.get('/:id', protect, admin, getOrderById);
router.put('/:id/status', protect, admin, updateOrderStatus);
router.put('/:id/payment', protect, admin, updatePaymentStatus);
router.delete('/:id', protect, admin, deleteOrder);

export default router;