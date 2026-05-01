import prisma from '../lib/prisma.js';
import { success, error } from '../utils/response.js';
import { createProjectSchema, updateProjectSchema, addMemberSchema } from '../validators/project.validator.js';

export const createProject = async (req, res) => {
  try {
    const validatedData = createProjectSchema.parse(req.body);
    const userId = req.user.id;

    // Use transaction to create project and add creator as ADMIN
    const project = await prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          name: validatedData.name,
          description: validatedData.description
        }
      });

      // Add creator as Admin
      await tx.projectMember.create({
        data: {
          userId,
          projectId: newProject.id,
          role: 'ADMIN'
        }
      });

      // Add default columns
      await tx.boardColumn.createMany({
        data: [
          { name: 'TODO', position: 0, color: '#94a3b8', projectId: newProject.id },
          { name: 'IN_PROGRESS', position: 1, color: '#3b82f6', projectId: newProject.id },
          { name: 'IN_REVIEW', position: 2, color: '#a855f7', projectId: newProject.id },
          { name: 'DONE', position: 3, color: '#22c55e', projectId: newProject.id }
        ]
      });

      return {
        ...newProject,
        members: [{ role: 'ADMIN' }],
        _count: { members: 1, tasks: 0 }
      };
    });

    return success(res, { project }, 201);
  } catch (err) {
    if (err.name === 'ZodError') return error(res, err.errors[0].message, 400);
    console.error('Create project error:', err);
    return error(res, 'Internal server error', 500);
  }
};

export const getProjects = async (req, res) => {
  try {
    const userId = req.user.id;

    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: { userId }
        }
      },
      include: {
        _count: {
          select: { members: true, tasks: true }
        },
        members: {
          where: { userId },
          select: { role: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return success(res, { projects });
  } catch (err) {
    console.error('Get projects error:', err);
    return error(res, 'Internal server error', 500);
  }
};

export const getProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true } },
            _count: { select: { subtasks: true } }
          }
        },
        columns: {
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!project) return error(res, 'Project not found', 404);

    return success(res, { project });
  } catch (err) {
    console.error('Get project error:', err);
    return error(res, 'Internal server error', 500);
  }
};

export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = updateProjectSchema.parse(req.body);

    const project = await prisma.project.update({
      where: { id },
      data: validatedData
    });

    return success(res, { project });
  } catch (err) {
    if (err.name === 'ZodError') return error(res, err.errors[0].message, 400);
    console.error('Update project error:', err);
    return error(res, 'Internal server error', 500);
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.project.delete({ where: { id } });

    return success(res, { message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Delete project error:', err);
    return error(res, 'Internal server error', 500);
  }
};

export const addMember = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const validatedData = addMemberSchema.parse(req.body);

    const userToAdd = await prisma.user.findUnique({ where: { email: validatedData.email } });
    if (!userToAdd) return error(res, 'User not found', 404);

    const existingMember = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: userToAdd.id, projectId } }
    });

    if (existingMember) return error(res, 'User is already a member', 400);

    const newMember = await prisma.projectMember.create({
      data: {
        userId: userToAdd.id,
        projectId,
        role: 'MEMBER'
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    return success(res, { member: newMember }, 201);
  } catch (err) {
    if (err.name === 'ZodError') return error(res, err.errors[0].message, 400);
    console.error('Add member error:', err);
    return error(res, 'Internal server error', 500);
  }
};

export const removeMember = async (req, res) => {
  try {
    const { id: projectId, userId } = req.params;

    // Check if removing the last admin
    if (userId === req.user.id) {
      const adminCount = await prisma.projectMember.count({
        where: { projectId, role: 'ADMIN' }
      });

      if (adminCount <= 1) {
        return error(res, 'Cannot remove the last admin of the project', 400);
      }
    }

    await prisma.projectMember.delete({
      where: { userId_projectId: { userId, projectId } }
    });

    return success(res, { message: 'Member removed successfully' });
  } catch (err) {
    if (err.code === 'P2025') return error(res, 'Member not found', 404);
    console.error('Remove member error:', err);
    return error(res, 'Internal server error', 500);
  }
};

export const changeRole = async (req, res) => {
  try {
    const { id: projectId, userId } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'MEMBER'].includes(role)) {
      return error(res, 'Invalid role', 400);
    }

    // Prevent changing own role if last admin
    if (userId === req.user.id && role === 'MEMBER') {
      const adminCount = await prisma.projectMember.count({
        where: { projectId, role: 'ADMIN' }
      });

      if (adminCount <= 1) {
        return error(res, 'Cannot demote the last admin of the project', 400);
      }
    }

    const updatedMember = await prisma.projectMember.update({
      where: { userId_projectId: { userId, projectId } },
      data: { role },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    return success(res, { member: updatedMember });
  } catch (err) {
    if (err.code === 'P2025') return error(res, 'Member not found', 404);
    console.error('Change role error:', err);
    return error(res, 'Internal server error', 500);
  }
};
