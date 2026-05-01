import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Trash2, UserPlus } from 'lucide-react';
import { updateProject, deleteProject, addMember, removeMember, changeRole } from '../../api/projects';
import useAuthStore from '../../store/authStore';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Select from '../ui/Select';

const ProjectSettings = ({ project, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: project.name || '',
    description: project.description || ''
  });
  const [inviteEmail, setInviteEmail] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  
  const currentUser = useAuthStore(state => state.user);
  const navigate = useNavigate();

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      await updateProject(project.id, formData);
      toast.success('Project details updated');
      onUpdate();
    } catch (error) {
      toast.error('Failed to update project');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    
    try {
      setIsInviting(true);
      await addMember(project.id, { email: inviteEmail });
      toast.success('Member added successfully');
      setInviteEmail('');
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add member');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    
    try {
      await removeMember(project.id, userId);
      toast.success('Member removed');
      if (userId === currentUser.id) {
        navigate('/projects');
      } else {
        onUpdate();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await changeRole(project.id, userId, newRole);
      toast.success('Role updated');
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update role');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone and will delete all associated tasks.`)) return;
    
    try {
      await deleteProject(project.id);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-10">
      
      {/* General Settings */}
      <section className="bg-bg-secondary p-6 rounded-xl border border-border">
        <h3 className="text-lg font-semibold mb-4 text-text-primary">Project Details</h3>
        <form onSubmit={handleUpdate} className="space-y-4 max-w-xl">
          <Input
            label="Project Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Description
            </label>
            <textarea
              className="flex w-full rounded-md border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-none min-h-[100px]"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <Button type="submit" isLoading={isUpdating}>
            Save Changes
          </Button>
        </form>
      </section>

      {/* Members */}
      <section className="bg-bg-secondary p-6 rounded-xl border border-border">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-6 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Members</h3>
            <p className="text-sm text-text-secondary">Manage who has access to this project.</p>
          </div>
          
          <form onSubmit={handleInvite} className="flex gap-2">
            <Input
              type="email"
              placeholder="user@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full sm:w-64"
              required
            />
            <Button type="submit" isLoading={isInviting}>
              <UserPlus className="h-4 w-4 mr-2" /> Invite
            </Button>
          </form>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-secondary uppercase bg-bg-tertiary border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {project.members?.map((member) => (
                <tr key={member.id} className="border-b border-border last:border-0 hover:bg-bg-tertiary/50">
                  <td className="px-4 py-3 flex items-center gap-3">
                    <Avatar name={member.user.name} size="sm" />
                    <div>
                      <div className="font-medium text-text-primary">
                        {member.user.name}
                        {member.user.id === currentUser.id && <span className="ml-2 text-xs text-text-secondary">(You)</span>}
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
                      disabled={member.user.id === currentUser.id}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRemoveMember(member.user.id)}
                      className="text-text-secondary hover:text-red-500 p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-red-500/5 p-6 rounded-xl border border-red-500/20">
        <h3 className="text-lg font-semibold text-red-500 mb-2">Danger Zone</h3>
        <p className="text-sm text-text-secondary mb-4">
          Once you delete a project, there is no going back. Please be certain.
        </p>
        <Button variant="danger" onClick={handleDeleteProject}>
          Delete Project
        </Button>
      </section>

    </div>
  );
};

export default ProjectSettings;
