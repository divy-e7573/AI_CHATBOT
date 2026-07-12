import axios from "axios";

import { useAuthStore } from "../store/authStore";

// baseURL "/api" is proxied to the Express server in vite.config.js during dev.
const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // send the httpOnly auth cookie
});

// Attach the JWT (for non-cookie clients / header-based auth) on every request.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear auth state and bounce the user to the login page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
