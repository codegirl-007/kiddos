import { Router } from 'express';
import { pronounceWord, clearPronunciationsCache } from '../controllers/speechSounds.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';

const router = Router();

// Public route - no authentication required for pronunciation
router.get('/pronounce/:wordId', pronounceWord);

// Admin route - clear pronunciation cache
router.delete('/cache', authMiddleware, adminMiddleware, clearPronunciationsCache);

export default router;
