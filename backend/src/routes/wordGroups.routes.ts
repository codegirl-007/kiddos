import { Router } from 'express';
import {
  getAllWordGroups,
  createWordGroup,
  updateWordGroup,
  deleteWordGroup,
  addWord,
  deleteWord
} from '../controllers/wordGroups.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';

const router = Router();

// Public route - anyone can read word groups
router.get('/', getAllWordGroups);

// Admin-only routes - only admins can create/update/delete
router.post('/', authMiddleware, adminMiddleware, createWordGroup);

// Word routes - must come before generic :id routes
// More specific routes first
router.post('/:groupId/words', authMiddleware, adminMiddleware, addWord);
router.delete('/words/:wordId', authMiddleware, adminMiddleware, deleteWord);

// Word group routes with IDs (generic routes last)
router.put('/:id', authMiddleware, adminMiddleware, updateWordGroup);
router.delete('/:id', authMiddleware, adminMiddleware, deleteWordGroup);

export default router;
