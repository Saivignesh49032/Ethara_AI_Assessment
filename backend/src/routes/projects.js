import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  changeRole,
  getProjectActivities
} from '../controllers/projectController.js';
import { authenticate } from '../middleware/auth.js';
import { requireProjectRole } from '../middleware/roleCheck.js';

const router = Router();

// Base project routes
router.post('/', authenticate, createProject);
router.get('/', authenticate, getProjects);

// Project detail routes
router.get('/:id', authenticate, requireProjectRole('MEMBER'), getProject);
router.get('/:id/activities', authenticate, requireProjectRole('MEMBER'), getProjectActivities);
router.put('/:id', authenticate, requireProjectRole('ADMIN'), updateProject);
router.delete('/:id', authenticate, requireProjectRole('ADMIN'), deleteProject);

// Member management routes
router.post('/:id/members', authenticate, requireProjectRole('ADMIN'), addMember);
router.delete('/:id/members/:userId', authenticate, requireProjectRole('ADMIN'), removeMember);
router.patch('/:id/members/:userId/role', authenticate, requireProjectRole('ADMIN'), changeRole);

export default router;
