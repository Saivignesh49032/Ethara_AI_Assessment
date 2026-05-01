import { z } from 'zod';

export const createColumnSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color hex code').optional()
});

export const updateColumnsSchema = z.object({
  columns: z.array(
    z.object({
      id: z.string().uuid('Invalid column ID'),
      position: z.number().int().min(0)
    })
  )
});
