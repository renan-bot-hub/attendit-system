import API from './api';

export const settingsService = {
  // Get the school's global settings (public — used for branding)
  get: async () => API.get('/settings'),

  // Admin: persist updated school settings
  update: async (data) => API.put('/settings', data),
};
