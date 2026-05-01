import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, Trash2, Copy, Check, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { getInvitations, createInvitation, revokeInvitation } from '../../api/invitations';
import { removeMember, changeRole } from '../../api/projects';
import useAuthStore from '../../store/authStore';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Select from '../ui/Select';
import Modal from '../ui/Modal';

const MembersTab = ({ project, onUpdate }) => {
  const [invitations, setInvitations] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const currentUser = useAuthStore(state => state.user);

  useEffect(() => {
    fetchInvitations();
  }, [project.id]);

  const fetchInvitations = async () => {
    try {
      const data = await getInvitations(project.id);
      setInvitations(data.invitations || []);
    } catch (err) {
      // Silently fail — not critical
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setIsInviting(true);
      const data = await createInvitation(project.id, inviteEmail.trim());
      
      if (data.added) {
        // User already existed, added directly
        toast.success(data.message);
        setIsModalOpen(false);
        setInviteEmail('');
        setInviteResult(null);
        onUpdate(); // refresh project members
      } else if (data.invited) {
        // New user, invitation created
        setInviteResult(data);
        toast.success(data.emailSent ? 'Invitation email sent!' : 'Invitation created!');
        fetchInvitations();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleRevoke = async (invitationId) => {
    if (!window.confirm('Revoke this invitation?')) return;
    try {
      await revokeInvitation(project.id, invitationId);
      toast.success('Invitation revoked');
      fetchInvitations();
    } catch (err) {
      toast.error('Failed to revoke invitation');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      await removeMember(project.id, userId);
      toast.success('Member removed');
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await changeRole(project.id, userId, newRole);
      toast.success('Role updated');
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setInviteEmail('');
    setInviteResult(null);
  };

  const pendingInvitations = invitations.filter(i => i.status === 'PENDING');

  const statusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Clock size={14} className="text-yellow-400" />;
      case 'ACCEPTED': return <CheckCircle2 size={14} className="text-green-400" />;
      case 'EXPIRED': return <XCircle size={14} className="text-red-400" />;
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8 overflow-y-auto">

      {/* Current Members */}
      <section className="bg-bg-secondary p-6 rounded-xl border border-border">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Team Members</h3>
            <p className="text-sm text-text-secondary">{project.members?.length || 0} members in this project</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} size="sm">
            <UserPlus className="h-4 w-4 mr-2" /> Invite Member
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-secondary uppercase bg-bg-tertiary border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {project.members?.map((member) => (
                <tr key={member.id} className="border-b border-border last:border-0 hover:bg-bg-tertiary/50 transition-colors">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <Avatar name={member.user.name} size="sm" />
                    <div>
                      <div className="font-medium text-text-primary">
                        {member.user.name}
                        {member.user.id === currentUser?.id && <span className="ml-2 text-xs text-accent">(You)</span>}
                      </div>
                      <div className="text-xs text-text-secondary">{member.user.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={member.role}
                      onChange={(e) => handleChangeRole(member.user.id, e.target.value)}
                      options={[
                        { value: 'MEMBER', label: 'Member' },
                        { value: 'ADMIN', label: 'Admin' }
                      ]}
                      className="h-8 py-1 text-xs w-28 bg-transparent"
                      disabled={member.user.id === currentUser?.id}
                    />
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-xs whitespace-nowrap">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {member.user.id !== currentUser?.id && (
                      <button
                        onClick={() => handleRemoveMember(member.user.id)}
                        className="text-text-secondary hover:text-red-500 p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <section className="bg-bg-secondary p-6 rounded-xl border border-border">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-text-primary flex items-center">
              <Mail className="mr-2 h-5 w-5 text-yellow-400" /> Pending Invitations
            </h3>
            <p className="text-sm text-text-secondary mt-1">{pendingInvitations.length} invitation(s) awaiting response</p>
          </div>

          <div className="space-y-3">
            {pendingInvitations.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-bg-primary">
                <div className="flex items-center gap-3">
                  {statusIcon(invite.status)}
                  <div>
                    <p className="text-sm font-medium text-text-primary">{invite.email}</p>
                    <p className="text-xs text-text-secondary">
                      Invited by {invite.invitedBy?.name} · Expires {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(invite.id)}
                  className="text-text-secondary hover:text-red-500 p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
                  title="Revoke invitation"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Invite Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title="Invite Team Member">
        {!inviteResult ? (
          <form onSubmit={handleInvite} className="space-y-4 pt-2">
            <p className="text-sm text-text-secondary">
              Enter the email address of the person you want to invite. If they already have a TaskFlow account, 
              they'll be added instantly. Otherwise, they'll receive an email with a signup link.
            </p>
            <Input
              label="Email Address"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              autoFocus
              required
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isInviting}>
                <Mail className="h-4 w-4 mr-2" /> Send Invitation
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-green-400 font-medium flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {inviteResult.emailSent ? 'Invitation email sent successfully!' : 'Invitation created!'}
              </p>
              {!inviteResult.emailSent && (
                <p className="text-xs text-text-secondary mt-1">
                  Email delivery failed. Please share the link below manually.
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Invite Link</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteResult.inviteLink}
                  className="flex-1 rounded-md border border-border bg-bg-tertiary px-3 py-2 text-xs text-text-primary font-mono"
                />
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="sm"
                  onClick={() => handleCopyLink(inviteResult.inviteLink)}
                >
                  {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={closeModal}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MembersTab;
