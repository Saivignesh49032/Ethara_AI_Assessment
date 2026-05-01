import prisma from '../lib/prisma.js';
import { success, error } from '../utils/response.js';
import { sendInvitationEmail } from '../lib/email.js';

/**
 * POST /api/projects/:id/invitations
 * Invite a user to a project via email.
 * If user already exists → add directly.
 * If user doesn't exist → create invitation + send email.
 */
export const createInvitation = async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { email } = req.body;
    const inviterId = req.user.id;

    if (!email || typeof email !== 'string') {
      return error(res, 'A valid email is required', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Get inviter info and project info
    const [inviter, project] = await Promise.all([
      prisma.user.findUnique({ where: { id: inviterId } }),
      prisma.project.findUnique({ where: { id: projectId } })
    ]);

    if (!project) return error(res, 'Project not found', 404);

    // Check if user already exists in the system
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      // Check if already a member
      const existingMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: existingUser.id, projectId } }
      });

      if (existingMember) {
        return error(res, 'User is already a member of this project', 400);
      }

      // Add them directly
      await prisma.projectMember.create({
        data: {
          userId: existingUser.id,
          projectId,
          role: 'MEMBER'
        }
      });

      return success(res, { 
        added: true, 
        message: `${existingUser.name} has been added to the project directly.` 
      }, 201);
    }

    // User doesn't exist — check for existing pending invitation
    const existingInvite = await prisma.invitation.findUnique({
      where: { email_projectId: { email: normalizedEmail, projectId } }
    });

    if (existingInvite && existingInvite.status === 'PENDING' && existingInvite.expiresAt > new Date()) {
      return error(res, 'An invitation has already been sent to this email', 400);
    }

    // Delete old expired/accepted invitation if it exists
    if (existingInvite) {
      await prisma.invitation.delete({ where: { id: existingInvite.id } });
    }

    // Create new invitation (expires in 7 days)
    const invitation = await prisma.invitation.create({
      data: {
        email: normalizedEmail,
        projectId,
        invitedById: inviterId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    // Build invite link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink = `${frontendUrl}/invite/${invitation.token}`;

    // Send email via Resend
    const emailResult = await sendInvitationEmail({
      to: normalizedEmail,
      inviterName: inviter.name,
      projectName: project.name,
      inviteLink
    });

    return success(res, { 
      invited: true, 
      inviteLink,
      emailSent: emailResult.success,
      message: emailResult.success 
        ? `Invitation email sent to ${normalizedEmail}` 
        : `Invitation created but email failed to send. Share this link manually: ${inviteLink}`
    }, 201);
  } catch (err) {
    console.error('Create invitation error:', err);
    return error(res, 'Internal server error', 500);
  }
};

/**
 * GET /api/projects/:id/invitations
 * List all invitations for a project (admin only)
 */
export const getInvitations = async (req, res) => {
  try {
    const { id: projectId } = req.params;

    const invitations = await prisma.invitation.findMany({
      where: { projectId },
      include: {
        invitedBy: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return success(res, { invitations });
  } catch (err) {
    console.error('Get invitations error:', err);
    return error(res, 'Internal server error', 500);
  }
};

/**
 * DELETE /api/projects/:id/invitations/:invitationId
 * Revoke/cancel a pending invitation
 */
export const revokeInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;

    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId }
    });

    if (!invitation) return error(res, 'Invitation not found', 404);
    if (invitation.status !== 'PENDING') {
      return error(res, 'Only pending invitations can be revoked', 400);
    }

    await prisma.invitation.delete({ where: { id: invitationId } });

    return success(res, { message: 'Invitation revoked successfully' });
  } catch (err) {
    console.error('Revoke invitation error:', err);
    return error(res, 'Internal server error', 500);
  }
};
