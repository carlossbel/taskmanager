// frontend/src/config/api.js
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? `${window.location.origin}/api`  // Production: Same origin /api
  : 'http://localhost:5000/api';     // Development: Local server

export default API_BASE_URL;