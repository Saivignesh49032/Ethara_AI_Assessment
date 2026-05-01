import prisma from '../lib/prisma.js';
import { success, error } from '../utils/response.js';
import { createColumnSchema, updateColumnsSchema } from '../validators/column.validator.js';

export const getColumns = async (req, res) => {
  try {
    const { projectId } = req.params;

    let columns = await prisma.boardColumn.findMany({
      where: { projectId },
      orderBy: { position: 'asc' }
    });

    // If no columns exist, create the default ones
    if (columns.length === 0) {
      await prisma.boardColumn.createMany({
        data: [
          { name: 'TODO', position: 0, color: '#94a3b8', projectId },
          { name: 'IN_PROGRESS', position: 1, color: '#3b82f6', projectId },
          { name: 'IN_REVIEW', position: 2, color: '#a855f7', projectId },
          { name: 'DONE', position: 3, color: '#22c55e', projectId }
        ]
      });
      columns = await prisma.boardColumn.findMany({
        where: { projectId },
        orderBy: { position: 'asc' }
      });
    }

    return success(res, { columns });
  } catch (err) {
    console.error('Get columns error:', err);
    return error(res, 'Internal server error', 500);
  }
};

export const createColumn = async (req, res) => {
  try {
    const { projectId } = req.params;
    const validatedData = createColumnSchema.parse(req.body);

    const count = await prisma.boardColumn.count({ where: { projectId } });

    const column = await prisma.boardColumn.create({
      data: {
        ...validatedData,
        position: count,
        projectId
      }
    });

    return success(res, { column }, 201);
  } catch (err) {
    if (err.name === 'ZodError') return error(res, err.errors[0].message, 400);
    if (err.code === 'P2002') return error(res, 'Column with this name already exists', 400);
    console.error('Create column error:', err);
    return error(res, 'Internal server error', 500);
  }
};

export const updateColumnPositions = async (req, res) => {
  try {
    const { projectId } = req.params;
    const validatedData = updateColumnsSchema.parse(req.body);

    await prisma.$transaction(
      validatedData.columns.map((col) => 
        prisma.boardColumn.update({
          where: { id: col.id, projectId },
          data: { position: col.position }
        })
      )
    );

    return success(res, { message: 'Column positions updated' });
  } catch (err) {
    if (err.name === 'ZodError') return error(res, err.errors[0].message, 400);
    console.error('Update column positions error:', err);
    return error(res, 'Internal server error', 500);
  }
};

export const deleteColumn = async (req, res) => {
  try {
    const { projectId, colId } = req.params;

    // Optional: check if there are tasks in this column
    const col = await prisma.boardColumn.findUnique({ where: { id: colId } });
    if (!col) return error(res, 'Column not found', 404);

    const taskCount = await prisma.task.count({
      where: { projectId, status: col.name }
    });

    if (taskCount > 0) {
      return error(res, 'Cannot delete column with existing tasks. Move tasks first.', 400);
    }

    await prisma.boardColumn.delete({ where: { id: colId } });

    // Reorder remaining columns
    const remaining = await prisma.boardColumn.findMany({
      where: { projectId },
      orderBy: { position: 'asc' }
    });

    await prisma.$transaction(
      remaining.map((c, index) => 
        prisma.boardColumn.update({
          where: { id: c.id },
          data: { position: index }
        })
      )
    );

    return success(res, { message: 'Column deleted successfully' });
  } catch (err) {
    console.error('Delete column error:', err);
    return error(res, 'Internal server error', 500);
  }
};

export const updateColumn = async (req, res) => {
  try {
    const { projectId, colId } = req.params;
    const validatedData = createColumnSchema.parse(req.body);

    const oldCol = await prisma.boardColumn.findUnique({ where: { id: colId } });
    if (!oldCol) return error(res, 'Column not found', 404);

    // If name changed, we need to update all tasks that use this status name
    const updatedCol = await prisma.$transaction(async (tx) => {
      const col = await tx.boardColumn.update({
        where: { id: colId },
        data: validatedData
      });

      if (validatedData.name && validatedData.name !== oldCol.name) {
        await tx.task.updateMany({
          where: { projectId, status: oldCol.name },
          data: { status: validatedData.name }
        });
      }

      return col;
    });

    return success(res, { column: updatedCol });
  } catch (err) {
    if (err.name === 'ZodError') return error(res, err.errors[0].message, 400);
    if (err.code === 'P2002') return error(res, 'Column with this name already exists', 400);
    console.error('Update column error:', err);
    return error(res, 'Internal server error', 500);
  }
};
