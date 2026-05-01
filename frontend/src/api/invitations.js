import api from './axios';

export const getInvitations = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/invitations`);
  return response.data.data;
};

export const createInvitation = async (projectId, email) => {
  const response = await api.post(`/projects/${projectId}/invitations`, { email });
  return response.data.data;
};

export const revokeInvitation = async (projectId, invitationId) => {
  const response = await api.delete(`/projects/${projectId}/invitations/${invitationId}`);
  return response.data.data;
};

// Public endpoints (no auth needed)
export const getInviteDetails = async (token) => {
  const response = await api.get(`/auth/invite/${token}`);
  return response.data.data;
};

export const registerViaInvite = async (data) => {
  const response = await api.post('/auth/register-invite', data);
  return response.data.data;
};
