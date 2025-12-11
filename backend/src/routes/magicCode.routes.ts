import { Router } from 'express';
import { getSettingsByCode } from '../controllers/magicCode.controller.js';

const router = Router();

// Public route - no authentication required
router.get('/:code', getSettingsByCode);

export default router;
