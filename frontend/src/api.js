import axios from "axios";

// Create an 'instance' of axios
// --- 1. API HELPER ---
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    // console.log("Axios Interceptor - Token:", token ? "Exists" : "Missing"); // Keep for debugging
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
      // console.log("Axios Interceptor - Authorization Header set:", config.headers['Authorization']); // Keep for debugging
    } else if (!token) {
      const college = localStorage.getItem("college");
      if (college) {
        config.headers["x-college"] = college;
        // console.log("Axios Interceptor - X-College Header set:", config.headers['x-college']); // Keep for debugging
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
