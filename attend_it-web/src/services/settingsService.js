// School settings API wrapper. GET is open; PUT is admin-only.

import API from './api';

export const settingsService = {
  get:    () => API.get('/settings'),
  update: (data) => API.put('/settings', data),
};
