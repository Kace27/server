import { Router } from 'express';
import { login, register, playerLogin } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/player-login', playerLogin);
router.post('/register', register);

export default router;
