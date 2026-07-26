import express from 'express';
import {
  getFlashSales,
  getFlashSaleById,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale,
} from '../controllers/flashSaleController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, admin, getFlashSales);
router.get('/:id', protect, admin, getFlashSaleById);
router.post('/', protect, admin, createFlashSale);
router.put('/:id', protect, admin, updateFlashSale);
router.delete('/:id', protect, admin, deleteFlashSale);

export default router;