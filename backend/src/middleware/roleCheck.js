import prisma from '../lib/prisma.js';

export const requireProjectRole = (minimumRole) => async (req, res, next) => {
  try {
    // Project ID can be in params as :id or :projectId depending on the route
    const projectId = req.params.projectId || req.params.id;
    const userId = req.user.id;

    if (!projectId) {
      return res.status(400).json({ success: false, error: 'Project ID is required' });
    }

    const membership = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } }
    });

    if (!membership) {
      return res.status(403).json({ success: false, error: 'Forbidden: Not a project member' });
    }
    
    if (minimumRole === 'ADMIN' && membership.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
    }
    
    req.membership = membership;
    next();
  } catch (error) {
    console.error('Role check error:', error);
    res.status(500).json({ success: false, error: 'Internal server error during role verification' });
  }
};
