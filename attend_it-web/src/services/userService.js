import API from './api';

export const userService = {
  // List users (admins see all; others see active only)
  getAllUsers: async () => API.get('/users'),

  // Get the current user's full profile
  getMe: async () => API.get('/users/me'),

  // Update the current user's own profile fields
  updateMe: async (data) => API.patch('/users/me', data),

  // Change the current user's password
  changePassword: async (currentPassword, newPassword) =>
    API.post('/users/me/password', { currentPassword, newPassword }),

  // Admin: create a single user
  createUser: async (userData) => API.post('/users', userData),

  // Admin: bulk-create users from a CSV upload
  bulkCreate: async (users) => API.post('/users/bulk', { users }),

  // Admin: edit any user's profile by id
  updateUser: async (id, userData) => API.put(`/users/${id}`, userData),

  // Admin: flip a user's active/inactive flag
  toggleUserStatus: async (id) => API.patch(`/users/${id}/toggle-status`),

  // Admin: permanently delete a user
  deleteUser: async (id) => API.delete(`/users/${id}`),
};
