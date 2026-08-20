import axios from 'axios';

// Centralized API Configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Add Authorization Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('luxedrive_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global Errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle Unauthorized (401) - Clear storage and redirect if needed
    if (error.response?.status === 401) {
      // localStorage.removeItem('luxedrive_token');
      // localStorage.removeItem('luxedrive_user');
      // window.location.href = '/login';
    }
    
    // Flatten error response for easier use in components
    const message = error.response?.data?.error || error.message || 'Network error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api;
