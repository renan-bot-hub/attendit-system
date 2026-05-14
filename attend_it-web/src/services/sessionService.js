import API from './api';

export const sessionService = {
  // List class sessions (admins see all; teachers see their own)
  getSessions: async () => API.get('/sessions'),

  // Create a new class session
  createSession: async (data) => API.post('/sessions', data),

  // Activate or deactivate a session
  toggleSession: async (id) => API.patch(`/sessions/${id}/toggle`),
};
