// School-wide announcements API wrapper (Fig. 15).

import API from './api';

export const announcementService = {
  list:   (params = {}) => API.get('/announcements', { params }),
  create: (data)        => API.post('/announcements', data),
  update: (id, data)    => API.patch(`/announcements/${id}`, data),
  remove: (id)          => API.delete(`/announcements/${id}`),
};
