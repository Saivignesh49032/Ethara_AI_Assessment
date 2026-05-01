import api from './axios';

export const generateTasks = async (projectId, prompt) => {
  const response = await api.post('/ai/generate-tasks', { projectId, prompt });
  return response.data.data;
};

export const chatWithAI = async (projectId, message, history = []) => {
  const response = await api.post('/ai/chat', { projectId, message, history });
  return response.data.data;
};

export const getAISuggestion = async (title) => {
  const response = await api.post('/ai/suggest-priority', { title });
  return response.data.data;
};

export const analyzeProject = async (projectId) => {
  const response = await api.post('/ai/analyze-project', { projectId });
  return response.data.data;
};
