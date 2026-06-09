import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    
    // Check if token is expired before sending
    if (token) {
      try {
        // Decode JWT to check expiration
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp && payload.exp < currentTime) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          // Don't send the expired token
          return config;
        }
        
        config.headers.Authorization = `Bearer ${token}`;
      } catch (e) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const errorData = error.response.data;
      
      if (errorData?.code === 'TOKEN_EXPIRED') {
        // We use a custom event to notify the App to show the modal since api.js is not a component
        const event = new CustomEvent('session_expired');
        window.dispatchEvent(event);
      }
      
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Only redirect if not already on login/home page
      if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export { API_URL, SOCKET_URL };
export default api;
