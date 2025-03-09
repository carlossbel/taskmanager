// frontend/src/services/authService.js
import axios from 'axios';
import API_BASE_URL from '../config/api';

const AuthService = {
  login: async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, { email, password });
      if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  register: async (username, email, password) => {
    try {
      return await axios.post(`${API_BASE_URL}/register`, { username, email, password });
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  },

  // Add token to Authorization header
  authHeader: () => {
    const user = AuthService.getCurrentUser();
    if (user && user.token) {
      return { Authorization: `Bearer ${user.token}` };
    } else {
      return {};
    }
  }
};

export default AuthService;