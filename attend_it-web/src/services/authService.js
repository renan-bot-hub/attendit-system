// Auth helpers — signup, login (caches token + user in localStorage),
// logout, and the synchronous getCurrentUser / isAuthenticated checks.

import API from './api';

export const authService = {
  signup: async (userData) => {
    const response = await API.post('/auth/signup', normalizeUserData(userData));
    return response.data;
  },

  login: async (credentials) => {
    const response = await API.post('/auth/login', {
      ...credentials,
      email: normalizeEmail(credentials.email),
    });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    if (!user) return null;
    try {
      return JSON.parse(user);
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  },

  isAuthenticated: () => !!localStorage.getItem('token'),
};

function normalizeEmail(email = '') {
  return email.trim().toLowerCase();
}

function normalizeUserData(userData) {
  return {
    ...userData,
    name: userData.name?.trim() || '',
    email: normalizeEmail(userData.email),
    department: userData.department?.trim() || '',
  };
}
