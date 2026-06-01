// AI risk alerts API wrapper (TF-backed pipeline).

import API from './api';

export const aiAlertService = {
  list:     (params = {}) => API.get('/ai-alerts', { params }),
  run:      ()       => API.post('/ai-alerts/run'),
  update:   (id, patch) => API.patch(`/ai-alerts/${id}`, patch),
  escalate: (id)     => API.post(`/ai-alerts/${id}/escalate`),
};
