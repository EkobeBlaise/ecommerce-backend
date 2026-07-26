import express from 'express';
import { getConfig, updateConfig } from '../controllers/seoController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, admin, getConfig);
router.put('/', protect, admin, updateConfig);

export default router;