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

const router = Router();

// Public route - anyone can read word groups
router.get('/', getAllWordGroups);

// Protected routes - only admins can create/update/delete
router.post('/', authMiddleware, createWordGroup);

// Word routes - must come before generic :id routes
// More specific routes first
router.post('/:groupId/words', authMiddleware, addWord);
router.delete('/words/:wordId', authMiddleware, deleteWord);

// Word group routes with IDs (generic routes last)
router.put('/:id', authMiddleware, updateWordGroup);
router.delete('/:id', authMiddleware, deleteWordGroup);

export default router;
