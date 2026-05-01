import api from './axios';

export const getProjectTasks = async (projectId, params) => {
  const response = await api.get(`/tasks/project/${projectId}`, { params });
  return response.data.data;
};

export const createTask = async (projectId, data) => {
  const response = await api.post(`/tasks/project/${projectId}`, data);
  return response.data.data;
};

export const getTask = async (id) => {
  const response = await api.get(`/tasks/${id}`);
  return response.data.data;
};

export const updateTask = async (id, data) => {
  const response = await api.put(`/tasks/${id}`, data);
  return response.data.data;
};

export const updateStatus = async (id, status) => {
  const response = await api.patch(`/tasks/${id}/status`, { status });
  return response.data.data;
};

export const assignTask = async (id, assigneeId) => {
  const response = await api.patch(`/tasks/${id}/assign`, { assigneeId });
  return response.data.data;
};

export const deleteTask = async (id) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data.data;
};

export const searchTasks = async (query) => {
  const response = await api.get(`/tasks/search?q=${query}`);
  return response.data.data;
};
