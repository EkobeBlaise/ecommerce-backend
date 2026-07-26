import express from 'express';
import { generateDescription, parseSearchQuery } from '../controllers/aiController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// Admin-only: generate product description
router.post('/generate-description', protect, admin, generateDescription);

// Public: parse search query (no auth required)
router.post('/parse-search', parseSearchQuery);

export default router;