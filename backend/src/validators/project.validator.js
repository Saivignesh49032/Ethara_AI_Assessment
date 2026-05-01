import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().optional()
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100).optional(),
  description: z.string().optional()
});

export const addMemberSchema = z.object({
  email: z.string().email('Invalid email address')
});
