import { Router } from 'express';
import { getTimeLimit, setTimeLimit } from '../controllers/settings.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Protected routes - only admins can get/set time limits
router.get('/time-limit', authMiddleware, getTimeLimit);
router.put('/time-limit', authMiddleware, setTimeLimit);

export default router;
