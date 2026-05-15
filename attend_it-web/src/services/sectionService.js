import API from './api';

export const sectionService = {
  list:   () => API.get('/sections'),
  create: (data)     => API.post('/sections', data),
  update: (id, data) => API.put(`/sections/${id}`, data),
  remove: (id)       => API.delete(`/sections/${id}`),
};
