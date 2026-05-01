import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send a project invitation email via Resend
 */
export const sendInvitationEmail = async ({ to, inviterName, projectName, inviteLink }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'TaskFlow <onboarding@resend.dev>',
      to: [to],
      subject: `You've been invited to join "${projectName}" on TaskFlow`,
      html: `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <div style="background: linear-gradient(135deg, #1a1b2e 0%, #0f1117 100%); border-radius: 12px; padding: 40px; border: 1px solid #2a2d3e;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #818cf8; font-size: 24px; margin: 0;">TaskFlow</h1>
            </div>
            
            <h2 style="color: #e2e8f0; font-size: 20px; margin-bottom: 16px;">You're invited! 🎉</h2>
            
            <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 8px;">
              <strong style="color: #e2e8f0;">${inviterName}</strong> has invited you to collaborate on the project 
              <strong style="color: #818cf8;">"${projectName}"</strong> on TaskFlow.
            </p>
            
            <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 32px;">
              Click the button below to accept the invitation and get started.
            </p>
            
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${inviteLink}" 
                 style="display: inline-block; background: #818cf8; color: #fff; padding: 14px 32px; 
                        border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;
                        box-shadow: 0 4px 14px rgba(129, 140, 248, 0.4);">
                Accept Invitation
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 13px; line-height: 1.6;">
              Or copy and paste this link into your browser:<br/>
              <a href="${inviteLink}" style="color: #818cf8; word-break: break-all;">${inviteLink}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #2a2d3e; margin: 24px 0;" />
            
            <p style="color: #475569; font-size: 12px; text-align: center;">
              This invitation will expire in 7 days. If you didn't expect this email, you can safely ignore it.
            </p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('Resend email error:', error);
      return { success: false, error };
    }

    console.log('Invitation email sent:', data?.id);
    return { success: true, data };
  } catch (err) {
    console.error('Failed to send invitation email:', err);
    return { success: false, error: err.message };
  }
};
