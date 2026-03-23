import axios from "axios";
import { getToken, clearAuth } from "@/lib/auth";

declare global {
  interface Window {
    __ENV__: {
      NEXT_PUBLIC_AUTH_API?: string;
      NEXT_PUBLIC_METAS_API?: string;
      NEXT_PUBLIC_SUPPORT_API?: string;
      NEXT_PUBLIC_SYSTEMS_API?: string;
    };
  }
}

// Instância SEM baseURL fixo — definido dinamicamente a cada request
const api = axios.create();

api.defaults.headers.common["Content-Type"] = "application/json";
api.defaults.headers.post["Content-Type"]   = "application/json";
api.defaults.headers.put["Content-Type"]    = "application/json";
api.defaults.headers.patch["Content-Type"]  = "application/json";

// ── Request: define baseURL + injeta token ────────────────────────────────────
api.interceptors.request.use((config) => {
  // Lê a URL em tempo real a cada requisição (nunca usa valor bakeado no build)
  const base =
    (typeof window !== "undefined" && window.__ENV__?.NEXT_PUBLIC_AUTH_API) ||
    process.env.NEXT_PUBLIC_AUTH_API ||
    "";

  if (!config.baseURL) {
    config.baseURL = base;
  }

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
