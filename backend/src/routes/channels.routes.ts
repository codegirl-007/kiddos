import { Router } from 'express';
import { getAllChannels, addChannel, deleteChannel, refreshChannel } from '../controllers/channels.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import { validateRequest, addChannelSchema } from '../middleware/validation.js';

const router = Router();

// Public route
router.get('/', getAllChannels);

// Admin-only routes
router.post('/', authMiddleware, adminMiddleware, validateRequest(addChannelSchema), addChannel);
router.delete('/:id', authMiddleware, adminMiddleware, deleteChannel);
router.put('/:id/refresh', authMiddleware, adminMiddleware, refreshChannel);

export default router;



