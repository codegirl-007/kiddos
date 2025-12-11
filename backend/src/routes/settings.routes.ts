import { Router } from 'express';
import { getTimeLimit, setTimeLimit, heartbeat, getConnectionStats } from '../controllers/settings.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { optionalAuthMiddleware } from '../middleware/optionalAuth.js';

const router = Router();

// Public route - anyone can read the time limit
router.get('/time-limit', getTimeLimit);

// Admin-only route - only admins can set time limits
router.put('/time-limit', authMiddleware, adminMiddleware, setTimeLimit);

// Public route - heartbeat for connection tracking (optional auth to track authenticated users)
router.post('/heartbeat', optionalAuthMiddleware, heartbeat);

// Admin-only route - get connection stats
router.get('/connection-stats', authMiddleware, adminMiddleware, getConnectionStats);

export default router;
