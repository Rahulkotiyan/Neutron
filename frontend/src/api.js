import axios from "axios";

// Create an 'instance' of axios
// --- 1. API HELPER ---
const api = axios.create({
  baseURL: 'http://localhost:5000/api', 
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    // Only add auth header if token exists and isn't the string "null"
    if (token && token !== "null") {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // ALWAYS send the college header as a fallback
    // This fixes the 400 error when the token is invalid/expired
    const college = localStorage.getItem('college');
    if (college) {
      config.headers['x-college'] = college;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
