import api from './axios';

export const getProjects = async () => {
  const response = await api.get('/projects');
  return response.data.data;
};

export const getProject = async (id) => {
  const response = await api.get(`/projects/${id}`);
  return response.data.data;
};

export const createProject = async (data) => {
  const response = await api.post('/projects', data);
  return response.data.data;
};

export const updateProject = async (id, data) => {
  const response = await api.put(`/projects/${id}`, data);
  return response.data.data;
};

export const deleteProject = async (id) => {
  const response = await api.delete(`/projects/${id}`);
  return response.data.data;
};

export const addMember = async (projectId, data) => {
  const response = await api.post(`/projects/${projectId}/members`, data);
  return response.data.data;
};

export const removeMember = async (projectId, userId) => {
  const response = await api.delete(`/projects/${projectId}/members/${userId}`);
  return response.data.data;
};

export const changeRole = async (projectId, userId, role) => {
  const response = await api.patch(`/projects/${projectId}/members/${userId}/role`, { role });
  return response.data.data;
};
