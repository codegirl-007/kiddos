import { Router } from 'express';
import { getTimeLimit, setTimeLimit, heartbeat, getConnectionStats } from '../controllers/settings.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { optionalAuthMiddleware } from '../middleware/optionalAuth.js';

const router = Router();

// Public route - anyone can read the time limit
router.get('/time-limit', getTimeLimit);

// Protected route - only admins can set time limits
router.put('/time-limit', authMiddleware, setTimeLimit);

// Public route - heartbeat for connection tracking (optional auth to track authenticated users)
router.post('/heartbeat', optionalAuthMiddleware, heartbeat);

// Protected route - admin only - get connection stats
router.get('/connection-stats', authMiddleware, getConnectionStats);

export default router;
