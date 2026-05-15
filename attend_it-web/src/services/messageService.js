import API from './api';

// Triggered-thread messaging (manuscript Fig. 12). Threads are container objects
// — only teachers/staff open them; messages live inside them.
export const messageService = {
  listThreads:    (params = {}) => API.get('/messages/threads', { params }),
  createThread:   (data)        => API.post('/messages/threads', data),
  closeThread:    (id)          => API.patch(`/messages/threads/${id}/close`),
  reopenThread:   (id)          => API.patch(`/messages/threads/${id}/reopen`),
  getMessages:    (id)          => API.get(`/messages/threads/${id}/messages`),
  sendMessage:    (id, text)    => API.post(`/messages/threads/${id}/messages`, { text }),
};

// Default export keeps older imports working
export default messageService;
