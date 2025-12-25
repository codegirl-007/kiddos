import { Router } from 'express';
import { login, register, refresh, logout, getCurrentUser } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateRequest, loginSchema, registerSchema } from '../middleware/validation.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', loginLimiter, validateRequest(registerSchema), register);
router.post('/login', loginLimiter, validateRequest(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getCurrentUser);

export default router;



