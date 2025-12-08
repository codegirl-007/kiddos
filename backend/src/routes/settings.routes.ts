import { Router } from 'express';
import { getTimeLimit, setTimeLimit } from '../controllers/settings.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Public route - anyone can read the time limit
router.get('/time-limit', getTimeLimit);

// Protected route - only admins can set time limits
router.put('/time-limit', authMiddleware, setTimeLimit);

export default router;
