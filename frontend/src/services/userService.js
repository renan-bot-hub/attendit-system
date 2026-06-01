// User CRUD + self-service + admin-only QR backup regenerate.

import API from './api';

export const userService = {
  getAllUsers: async () => API.get('/users'),
  getMe: async () => API.get('/users/me'),
  updateMe: async (data) => API.patch('/users/me', data),
  changePassword: async (currentPassword, newPassword) =>
    API.post('/users/me/password', { currentPassword, newPassword }),
  createUser: async (userData) => API.post('/users', userData),
  bulkCreate: async (users) => API.post('/users/bulk', { users }),
  updateUser: async (id, userData) => API.put(`/users/${id}`, userData),
  toggleUserStatus: async (id) => API.patch(`/users/${id}/toggle-status`),
  deleteUser: async (id) => API.delete(`/users/${id}`),
  regenerateQr: async (id) => API.post(`/users/${id}/regenerate-qr`),
};
