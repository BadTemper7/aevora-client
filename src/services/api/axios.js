import axios from "axios";

import { useAuthStore } from "../../stores/authStore";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  timeout: 15_000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // an expired or revoked session sends the person back to the login page
    if (error.response?.status === 401) useAuthStore.getState().signOut();
    return Promise.reject(error);
  },
);
