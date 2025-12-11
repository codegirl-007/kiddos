import { Router } from 'express';
import {
  getAllProfiles,
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  updateProfileSettings,
  regenerateMagicCode
} from '../controllers/settingsProfiles.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';

const router = Router();

// All routes require admin authentication
router.get('/', authMiddleware, adminMiddleware, getAllProfiles);
router.post('/', authMiddleware, adminMiddleware, createProfile);
router.get('/:id', authMiddleware, adminMiddleware, getProfile);
router.put('/:id', authMiddleware, adminMiddleware, updateProfile);
router.delete('/:id', authMiddleware, adminMiddleware, deleteProfile);
router.put('/:id/settings', authMiddleware, adminMiddleware, updateProfileSettings);
router.post('/:id/regenerate-code', authMiddleware, adminMiddleware, regenerateMagicCode);

export default router;
