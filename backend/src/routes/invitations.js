import { Router } from 'express';
import {
  createInvitation,
  getInvitations,
  revokeInvitation
} from '../controllers/invitationController.js';
import { authenticate } from '../middleware/auth.js';
import { requireProjectRole } from '../middleware/roleCheck.js';

const router = Router();

// All invitation routes require ADMIN role
router.post('/:id/invitations', authenticate, requireProjectRole('ADMIN'), createInvitation);
router.get('/:id/invitations', authenticate, requireProjectRole('ADMIN'), getInvitations);
router.delete('/:id/invitations/:invitationId', authenticate, requireProjectRole('ADMIN'), revokeInvitation);

export default router;
