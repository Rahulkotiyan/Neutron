import axios from "axios";

// Create an 'instance' of axios
const api = axios.create({
  baseURL: "http://localhost:5000/api", // Your backend API URL
});

/* This is an interceptor. It runs BEFORE every request.
      It checks if we have a token in localStorage, and if so,
      it adds it to the 'Authorization' header.
    */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
