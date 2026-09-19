import axios from "axios";

// Create Axios client for the Express API
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: automatically add Bearer token to all requests if logged in
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("terminal_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: handle 401s (token expired)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token is invalid or expired, clear local storage
      if (localStorage.getItem("terminal_token")) {
        localStorage.removeItem("terminal_token");
        localStorage.removeItem("terminal_user");
        window.dispatchEvent(new Event("auth-changed"));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
