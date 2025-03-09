// src/services/authService.js
import api from './interceptors';

const AuthService = {
  login: async (credentials) => {
    const response = await api.post('/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId);
      localStorage.setItem('email', response.data.email);
      localStorage.setItem('username', response.data.username);
      localStorage.setItem('role', response.data.role || 'user');
      console.log('Login successful, data stored:', {
        token: !!response.data.token,
        userId: response.data.userId
      });
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/register', userData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    console.log('Logout completed, storage cleared');
  },

  getCurrentUser: () => {
    return {
      token: localStorage.getItem('token'),
      userId: localStorage.getItem('userId'),
      email: localStorage.getItem('email'),
      username: localStorage.getItem('username'),
      role: localStorage.getItem('role'),
    };
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    // Verificamos que el token exista y no esté vacío
    return token !== null && token !== undefined && token !== '';
  },

  isAdmin: () => {
    return localStorage.getItem('role') === 'admin';
  }
};

export default AuthService;