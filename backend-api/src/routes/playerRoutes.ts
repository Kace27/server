import { Router } from 'express';
import { getPlayerProfile, getPlayerMatchHistory, updatePlayerStatus } from '../controllers/playerController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Public routes
router.get('/:username', getPlayerProfile);
router.get('/:username/history', getPlayerMatchHistory);

export default router;
