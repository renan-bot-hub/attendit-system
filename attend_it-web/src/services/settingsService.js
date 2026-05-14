import API from './api';

export const settingsService = {
  get: async () => API.get('/settings'),
  update: async (data) => API.put('/settings', data),
};
