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

// All routes require authentication
router.use(authMiddleware);

// Word group routes (base routes first)
router.get('/', getAllWordGroups);
router.post('/', createWordGroup);

// Word routes - must come before generic :id routes
// More specific routes first
router.post('/:groupId/words', addWord);
router.delete('/words/:wordId', deleteWord);

// Word group routes with IDs (generic routes last)
router.put('/:id', updateWordGroup);
router.delete('/:id', deleteWordGroup);

export default router;
