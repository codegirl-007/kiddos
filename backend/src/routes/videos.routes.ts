import { Router } from 'express';
import { getAllVideos, refreshVideos } from '../controllers/videos.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateRequest, videoQuerySchema } from '../middleware/validation.js';

const router = Router();

// Public route
router.get('/', validateRequest(videoQuerySchema), getAllVideos);

// Protected route
router.post('/refresh', authMiddleware, refreshVideos);

export default router;


