import API from './api';

export const messageService = {
  // List conversation partners with last-message preview
  getContacts: async () => {
    return await API.get('/messages/contacts');
  },

  // Full conversation thread with a specific partner
  getThread: async (partnerId) => {
    return await API.get(`/messages/thread/${partnerId}`);
  },

  // Send a new message
  sendMessage: async (recipientId, text) => {
    return await API.post('/messages', { recipientId, text });
  },
};
