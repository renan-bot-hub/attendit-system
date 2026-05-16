// Class-session API wrapper.

import API from './api';

export const sessionService = {
  getSessions:   () => API.get('/sessions'),
  createSession: (data) => API.post('/sessions', data),
  toggleSession: (id) => API.patch(`/sessions/${id}/toggle`),
};
