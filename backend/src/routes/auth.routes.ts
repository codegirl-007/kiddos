import { Router } from 'express';
import { login, refresh, logout, getCurrentUser } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateRequest, loginSchema } from '../middleware/validation.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/login', loginLimiter, validateRequest(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getCurrentUser);

export default router;



