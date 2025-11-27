import { Router } from 'express';
import { getAllChannels, addChannel, deleteChannel, refreshChannel } from '../controllers/channels.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateRequest, addChannelSchema } from '../middleware/validation.js';

const router = Router();

// Public route
router.get('/', getAllChannels);

// Protected routes
router.post('/', authMiddleware, validateRequest(addChannelSchema), addChannel);
router.delete('/:id', authMiddleware, deleteChannel);
router.put('/:id/refresh', authMiddleware, refreshChannel);

export default router;

