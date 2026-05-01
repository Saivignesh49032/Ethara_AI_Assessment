import prisma from '../lib/prisma.js';
import { success, error } from '../utils/response.js';
import { createTaskSchema, updateTaskSchema, statusSchema, assignSchema } from '../validators/task.validator.js';

export const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const { status, priority, assigneeId, type, parentId } = req.query;
    
    const where = { projectId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;
    if (type) where.type = type;
    if (parentId === 'none') {
      where.parentId = null; // top-level tasks only
    } else if (parentId) {
      where.parentId = parentId;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        subtasks: {
          include: {
            assignee: { select: { id: true, name: true } }
          }
        },
        parent: { select: { id: true, title: true, type: true } },
        _count: { select: { subtasks: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return success(res, { tasks });
  } catch (err) {
    console.error('Get project tasks error:', err);
    return error(res, 'Internal server error', 500);
  }
};

export const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const validatedData = createTaskSchema.parse(req.body);
    const userId = req.user.id;

    if (validatedData.dueDate === '') delete validatedData.dueDate;
    if (validatedData.assigneeId === '') delete validatedData.assigneeId;

    // Validate assignee membership
    if (validatedData.assigneeId) {
      const isMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: validatedData.assigneeId, projectId } }
      });
      if (!isMember) return error(res, 'Assignee must be a project member', 400);
    }

    // Validate parent task exists in same project
    if (validatedData.parentId) {
      const parentTask = await prisma.task.findUnique({
        where: { id: validatedData.parentId }
      });
      if (!parentTask || parentTask.projectId !== projectId) {
        return error(res, 'Parent task not found in this project', 400);
      }
    }

    // Default status to first column if not specified
    if (!validatedData.status) {
      const firstColumn = await prisma.boardColumn.findFirst({
        where: { projectId },
        orderBy: { position: 'asc' }
      });
      validatedData.status = firstColumn ? firstColumn.name : 'TODO';
    }

    const task = await prisma.task.create({
      data: {
        ...validatedData,
        projectId,
        createdById: userId
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        subtasks: true,
        _count: { select: { subtasks: true } }
      }
    });

    return success(res, { task }, 201);
  } catch (err) {
    if (err.name === 'ZodError') return error(res, err.errors[0].message, 400);
    console.error('Create task error:', err);
    return error(res, 'Internal server error', 500);
  }
};

export const getTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        subtasks: {
          include: {
            assignee: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        parent: { select: { id: true, title: true, type: true } },
        _count: { select: { subtasks: true } }
      }
    });

    if (!task) return error(res, 'Task not found', 404);

    return success(res, { task });
  } catch (err) {
    console.error('Get task error:', err);
    return error(res, 'Internal server error', 500);
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateTaskSchema.parse(req.body);

    if (validatedData.dueDate === '') validatedData.dueDate = null;
    if (validatedData.assigneeId === '') validatedData.assigneeId = null;

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) return error(res, 'Task not found', 404);

    if (validatedData.assigneeId) {
      const isMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: validatedData.assigneeId, projectId: existingTask.projectId } }
      });
      if (!isMember) return error(res, 'Assignee must be a project member', 400);
    }

    const task = await prisma.task.update({
      where: { id },
      data: validatedData,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        subtasks: {
          include: { assignee: { select: { id: true, name: true } } }
        },
        _count: { select: { subtasks: true } }
      }
    });

    return success(res, { task });
  } catch (err) {
    if (err.name === 'ZodError') return error(res, err.errors[0].message, 400);
    console.error('Update task error:', err);
    return error(res, 'Internal server error', 500);
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = statusSchema.parse(req.body);

    const task = await prisma.task.update({
      where: { id },
      data: { status: validatedData.status },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        _count: { select: { subtasks: true } }
      }
    });

    return success(res, { task });
  } catch (err) {
    if (err.name === 'ZodError') return error(res, err.errors[0].message, 400);
    if (err.code === 'P2025') return error(res, 'Task not found', 404);
    console.error('Update status error:', err);
    return error(res, 'Internal server error', 500);
  }
};

export const assignTask = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = assignSchema.parse(req.body);

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) return error(res, 'Task not found', 404);

    if (validatedData.assigneeId) {
      const isMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: validatedData.assigneeId, projectId: existingTask.projectId } }
      });
      if (!isMember) return error(res, 'Assignee must be a project member', 400);
    }

    const task = await prisma.task.update({
      where: { id },
      data: { assigneeId: validatedData.assigneeId },
      include: {
        assignee: { select: { id: true, name: true, email: true } }
      }
    });

    return success(res, { task });
  } catch (err) {
    if (err.name === 'ZodError') return error(res, err.errors[0].message, 400);
    console.error('Assign task error:', err);
    return error(res, 'Internal server error', 500);
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.task.delete({ where: { id } });
    return success(res, { message: 'Task deleted successfully' });
  } catch (err) {
    if (err.code === 'P2025') return error(res, 'Task not found', 404);
    console.error('Delete task error:', err);
    return error(res, 'Internal server error', 500);
  }
};
