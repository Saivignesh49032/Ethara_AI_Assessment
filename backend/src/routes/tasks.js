import { Router } from 'express';
import {
  getProjectTasks,
  createTask,
  getTask,
  updateTask,
  updateStatus,
  assignTask,
  deleteTask,
  searchTasks
} from '../controllers/taskController.js';
import { authenticate } from '../middleware/auth.js';
import { requireProjectRole } from '../middleware/roleCheck.js';
import prisma from '../lib/prisma.js';
import { error } from '../utils/response.js';

const router = Router();

// Global search
router.get('/search', authenticate, searchTasks);

// Middleware to resolve projectId from task for role checking
const resolveTaskProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({
      where: { id },
      select: { projectId: true }
    });
    
    if (!task) return error(res, 'Task not found', 404);
    
    req.params.projectId = task.projectId;
    next();
  } catch (err) {
    console.error('Resolve task project error:', err);
    return error(res, 'Internal server error', 500);
  }
};

// Project-level task routes
router.get('/project/:projectId', authenticate, requireProjectRole('MEMBER'), getProjectTasks);
router.post('/project/:projectId', authenticate, requireProjectRole('ADMIN'), createTask);

// Individual task routes (needs resolveTaskProject to get projectId for roleCheck)
router.get('/:id', authenticate, resolveTaskProject, requireProjectRole('MEMBER'), getTask);
router.put('/:id', authenticate, resolveTaskProject, requireProjectRole('ADMIN'), updateTask);
router.patch('/:id/status', authenticate, resolveTaskProject, requireProjectRole('MEMBER'), updateStatus);
router.patch('/:id/assign', authenticate, resolveTaskProject, requireProjectRole('ADMIN'), assignTask);
router.delete('/:id', authenticate, resolveTaskProject, requireProjectRole('ADMIN'), deleteTask);

export default router;
