import { Router } from 'express';
import { heartbeat, getConnectionStats } from '../controllers/settings.controller.js';
import { optionalAuthMiddleware } from '../middleware/optionalAuth.js';

const router = Router();

// Public route - heartbeat for connection tracking (optional auth to track authenticated users)
router.post('/heartbeat', optionalAuthMiddleware, heartbeat);

// Admin-only route - get connection stats
router.get('/connection-stats', authMiddleware, adminMiddleware, getConnectionStats);

export default router;
