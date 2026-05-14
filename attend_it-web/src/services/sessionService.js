import API from './api';

export const sessionService = {
  getSessions: async () => {
    return await API.get('/sessions');
  },

  createSession: async (data) => {
    return await API.post('/sessions', data);
  },

  toggleSession: async (id) => {
    return await API.patch(`/sessions/${id}/toggle`);
  },
};
