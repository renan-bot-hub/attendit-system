import API from './api';

export const conferenceService = {
  list:   (params = {}) => API.get('/conferences', { params }),
  create: (data)        => API.post('/conferences', data),
  update: (id, data)    => API.patch(`/conferences/${id}`, data),
};
