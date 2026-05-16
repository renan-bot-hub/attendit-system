// Intervention cases API wrapper.

import API from './api';

export const caseService = {
  getCases:     (params = {}) => API.get('/cases', { params }),
  getSummary:   ()            => API.get('/cases/summary'),
  createCase:   (data)        => API.post('/cases', data),
  updateStatus: (id, status, reviewNote = '') =>
    API.patch(`/cases/${id}/status`, { status, reviewNote }),
  escalate:     (id, riskLevel) => API.post(`/cases/${id}/escalate`, riskLevel ? { riskLevel } : {}),
  remove:       (id)            => API.delete(`/cases/${id}`),
};
