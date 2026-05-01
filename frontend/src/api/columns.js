import api from './axios';

export const getColumns = async (projectId) => {
  const response = await api.get(`/projects/${projectId}/columns`);
  return response.data.data;
};

export const createColumn = async (projectId, data) => {
  const response = await api.post(`/projects/${projectId}/columns`, data);
  return response.data.data;
};

export const updateColumnPositions = async (projectId, columns) => {
  const response = await api.put(`/projects/${projectId}/columns/positions`, { columns });
  return response.data.data;
};

export const updateColumn = async (projectId, colId, data) => {
  const response = await api.put(`/projects/${projectId}/columns/${colId}`, data);
  return response.data.data;
};

export const deleteColumn = async (projectId, colId) => {
  const response = await api.delete(`/projects/${projectId}/columns/${colId}`);
  return response.data.data;
};
