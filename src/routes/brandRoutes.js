import express from 'express';
import {
  getBrands,
  getBrandById,
  getBrandsWithCount,
  createBrand,
  updateBrand,
  deleteBrand,
} from '../controllers/brandController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getBrands);
router.get('/with-count', getBrandsWithCount);
router.get('/:id', getBrandById);
router.post('/', protect, admin, createBrand);
router.put('/:id', protect, admin, updateBrand);
router.delete('/:id', protect, admin, deleteBrand);

export default router;