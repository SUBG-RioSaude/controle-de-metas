import axios from "axios";
import { getToken, clearAuth } from "@/lib/auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_AUTH_API,
});

// Explicitly set Content-Type for every method that sends a body
// (Axios doesn't always propagate the `headers` option in create() to PATCH/PUT)
api.defaults.headers.common["Content-Type"] = "application/json";
api.defaults.headers.post["Content-Type"]   = "application/json";
api.defaults.headers.put["Content-Type"]    = "application/json";
api.defaults.headers.patch["Content-Type"]  = "application/json";


// ── Request: inject Bearer token ──────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: handle 401 → logout ────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
