import { Router } from 'express';
import { login, register, playerLogin, verifyActivation } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/player-login', playerLogin);
router.post('/register', register);
router.post('/verify-activation', verifyActivation);

export default router;
