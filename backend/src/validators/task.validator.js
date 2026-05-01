import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  type: z.enum(['EPIC', 'STORY', 'BUG', 'TASK']).optional(),
  dueDate: z.string().datetime().optional().or(z.literal('')),
  assigneeId: z.string().uuid('Invalid user ID').optional().or(z.literal('')),
  parentId: z.string().uuid('Invalid task ID').optional().or(z.literal('').transform(() => undefined)).or(z.null())
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  type: z.enum(['EPIC', 'STORY', 'BUG', 'TASK']).optional(),
  dueDate: z.string().datetime().optional().nullable().or(z.literal('')),
  assigneeId: z.string().uuid('Invalid user ID').optional().nullable().or(z.literal('')),
  parentId: z.string().uuid('Invalid task ID').optional().nullable().or(z.literal('').transform(() => null))
});

export const statusSchema = z.object({
  status: z.string().min(1, 'Status is required')
});

export const assignSchema = z.object({
  assigneeId: z.string().uuid('Invalid user ID').nullable()
});
