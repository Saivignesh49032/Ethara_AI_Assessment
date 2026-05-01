import { Router } from 'express';
import { getUsers, getUser } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getUsers);
router.get('/:id', authenticate, getUser);

export default router;
