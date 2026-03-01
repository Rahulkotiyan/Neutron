import axios from "axios";

const API_URL = "http://localhost:5000/api";

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
    console.log("API Request - Token being sent:", token ? `${token.substring(0, 20)}...` : "No token");
    
    // Check if token is expired before sending
    if (token) {
      try {
        // Decode JWT to check expiration
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp && payload.exp < currentTime) {
          console.log("Token has expired, clearing storage");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          // Don't send the expired token
          return config;
        }
        
        config.headers.Authorization = `Bearer ${token}`;
      } catch (e) {
        console.log("Invalid token format, clearing storage");
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
        console.log("Session expired - showing user-friendly message");
        // We use a custom event to notify the App to show the modal since api.js is not a component
        const event = new CustomEvent('session_expired');
        window.dispatchEvent(event);
      } else {
        console.log("401 Unauthorized - Token is invalid, clearing storage");
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

export default api;
