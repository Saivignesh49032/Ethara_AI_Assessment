import { Router } from 'express';
import {
  getColumns,
  createColumn,
  updateColumnPositions,
  deleteColumn,
  updateColumn
} from '../controllers/columnController.js';
import { authenticate } from '../middleware/auth.js';
import { requireProjectRole } from '../middleware/roleCheck.js';

const router = Router();

router.get('/:projectId/columns', authenticate, requireProjectRole('MEMBER'), getColumns);
router.post('/:projectId/columns', authenticate, requireProjectRole('ADMIN'), createColumn);
router.put('/:projectId/columns/positions', authenticate, requireProjectRole('ADMIN'), updateColumnPositions);
router.delete('/:projectId/columns/:colId', authenticate, requireProjectRole('ADMIN'), deleteColumn);
router.put('/:projectId/columns/:colId', authenticate, requireProjectRole('ADMIN'), updateColumn);

export default router;
