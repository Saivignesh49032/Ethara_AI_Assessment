import { Router } from 'express';
import { generateTasks, chat, suggestPriority, analyzeProject } from '../controllers/aiController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/generate-tasks', authenticate, generateTasks);
router.post('/chat', authenticate, chat);
router.post('/suggest-priority', authenticate, suggestPriority);
router.post('/analyze-project', authenticate, analyzeProject);

export default router;
