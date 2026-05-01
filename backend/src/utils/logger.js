import prisma from '../lib/prisma.js';

export const logActivity = async ({ userId, projectId, action, details, taskId }) => {
  try {
    await prisma.activity.create({
      data: {
        userId,
        projectId,
        action,
        details: details ? JSON.stringify(details) : null,
        taskId
      }
    });
  } catch (err) {
    console.error('Logging error:', err);
  }
};
