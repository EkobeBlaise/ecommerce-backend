import express from 'express';
import {
  getConfig,
  updateConfig,
  resetConfig,
} from '../controllers/merchandisingController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, admin, getConfig);
router.put('/', protect, admin, updateConfig);
router.post('/reset', protect, admin, resetConfig);

export default router;