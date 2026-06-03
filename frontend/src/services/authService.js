// Auth helpers - login, OTP verification, cached session utilities, and logout.

import API from './api';

export const authService = {
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

  requestOtp: async (credentials) => {
    const response = await API.post('/auth/request-otp', {
      ...credentials,
      email: normalizeEmail(credentials.email),
    });
    return response.data;
  },

  verifyOtp: async ({ email, otp }) => {
    const response = await API.post('/auth/verify-otp', {
      email: normalizeEmail(email),
      otp,
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
