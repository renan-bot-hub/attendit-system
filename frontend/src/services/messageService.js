// Triggered Threads API wrapper (Fig. 12). Teachers open threads;
// either side can post while the thread is Open.

import API from './api';

export const messageService = {
  listThreads:    (params = {}) => API.get('/messages/threads', { params }),
  createThread:   (data)        => API.post('/messages/threads', data),
  closeThread:    (id)          => API.patch(`/messages/threads/${id}/close`),
  reopenThread:   (id)          => API.patch(`/messages/threads/${id}/reopen`),
  getMessages:    (id)          => API.get(`/messages/threads/${id}/messages`),
  sendMessage:    (id, text)    => API.post(`/messages/threads/${id}/messages`, { text }),
};

export default messageService;
