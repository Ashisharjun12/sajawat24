import axios from "axios";
import { API_URL } from "@/lib/env";
import { useAuthStore } from "@/store/auth.store";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export function getApiError(err) {
  return err?.response?.data?.message || "Something went wrong";
}

export function unwrap(response) {
  return response.data?.data;
}

function skipRefresh(url = "") {
  return (
    url.includes("/auth/admin/login") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout") ||
    url.includes("/auth/verify-email-change")
  );
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    if (skipRefresh(original.url || "")) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = api
          .post("/auth/refresh", { clientType: "web" })
          .then((res) => {
            const payload = unwrap(res);
            if (!payload?.user || payload.user.role !== "admin") {
              throw error;
            }
            useAuthStore.getState().setSession(payload);
            return payload.accessToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const token = await refreshPromise;
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    } catch (refreshError) {
      useAuthStore.getState().clear();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
      return Promise.reject(refreshError);
    }
  },
);
