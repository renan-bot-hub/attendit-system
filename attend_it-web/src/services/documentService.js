import API from './api';

export const documentService = {
  list:    (params = {}) => API.get('/documents', { params }),
  summary: ()            => API.get('/documents/summary'),
  create:  (data)        => API.post('/documents', data),
  review:  (id, status, reviewNote = '') => API.patch(`/documents/${id}`, { status, reviewNote }),
};
