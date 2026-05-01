import { Router } from 'express';
import { register, login, getMe, getInviteDetails, registerViaInvite } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);

// Invitation-based auth (public endpoints)
router.get('/invite/:token', getInviteDetails);
router.post('/register-invite', registerViaInvite);

export default router;
