import { Router } from 'express';
import { getRecentMatches } from '../controllers/matchController';

const router = Router();

// Public route to get matches list
router.get('/', getRecentMatches);

export default router;
