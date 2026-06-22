import { Router } from 'express';
import { getRanking, triggerRefreshRanking } from '../controllers/rankingController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Public routes
router.get('/', getRanking);

export default router;
