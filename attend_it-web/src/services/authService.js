import API from './api';

export const authService = {
  // Register a new account
  signup: async (userData) => {
    const response = await API.post('/auth/signup', userData);
    return response.data;
  },

  // Authenticate and persist the JWT + user object in localStorage
  login: async (credentials) => {
    const response = await API.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  // Clear the session and return to the login page
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  // Read the cached user object (or null if not logged in)
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // True if a JWT is present in localStorage
  isAuthenticated: () => !!localStorage.getItem('token'),
};
