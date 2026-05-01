import prisma from '../lib/prisma.js';
import { success, error } from '../utils/response.js';

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: { name: 'asc' }
    });

    return success(res, { users });
  } catch (err) {
    console.error('Get users error:', err);
    return error(res, 'Internal server error', 500);
  }
};

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    if (!user) return error(res, 'User not found', 404);

    return success(res, { user });
  } catch (err) {
    console.error('Get user error:', err);
    return error(res, 'Internal server error', 500);
  }
};
