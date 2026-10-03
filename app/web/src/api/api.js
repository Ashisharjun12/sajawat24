import axios from "axios";
import { API_URL } from "@/lib/env";
import { useAuthStore } from "@/store/auth.store";
import { isConsumerAppEligible } from "@/module/auth/lib/consumer-eligibility";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

function formatValidationErrors(errors) {
  if (!Array.isArray(errors) || errors.length === 0) return "";
  return errors
    .map((issue) => {
      const path = Array.isArray(issue?.path) ? issue.path.join(".") : "";
      const msg = issue?.message ?? "";
      return path ? `${path}: ${msg}` : msg;
    })
    .filter(Boolean)
    .join(" · ");
}

export function getApiError(err) {
  const data = err?.response?.data;
  if (data?.message === "validation failed") {
    const detail = formatValidationErrors(data.errors);
    if (detail) return detail;
  }
  return data?.message || err?.message || "Something went wrong";
}

export function unwrap(response) {
  return response.data?.data;
}

function skipRefresh(url = "") {
  return (
    url.includes("/auth/google") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout")
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
            if (!isConsumerAppEligible(payload?.user)) {
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
      const { user, accessToken } = useAuthStore.getState();
      if (!user && !accessToken) {
        useAuthStore.getState().clear();
      }
      return Promise.reject(refreshError);
    }
  },
);
