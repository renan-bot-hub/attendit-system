import API from './api';

export const messageService = {
  // List people you've messaged with, plus last-message preview + unread count
  getContacts: async () => API.get('/messages/contacts'),

  // Full message thread between you and a partner
  getThread: async (partnerId) => API.get(`/messages/thread/${partnerId}`),

  // Send a new message to a recipient
  sendMessage: async (recipientId, text) => API.post('/messages', { recipientId, text }),
};
