import express from 'express';
import {
  getProducts,
  getAdminProducts, // 🆕 Added this import
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteManyProducts
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// 🟢 Admin Routes (Protected)
router.get('/admin', protect, admin, getAdminProducts);
router.post('/', protect, admin, createProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);
router.post('/delete-many', protect, admin, deleteManyProducts);

// 🔵 Public Routes (No login required)
router.get('/', getProducts);
router.get('/:id', getProductById);

export default router;