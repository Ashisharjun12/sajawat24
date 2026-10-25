import { api, refreshSession, unwrap } from "@/api/api";
import { useAuthStore } from "@/store/auth.store";

export function login({ email, password }) {
  return api
    .post("/auth/admin/login", { email, password })
    .then(unwrap);
}

export function refresh() {
  return refreshSession();
}

export function logout() {
  const refreshToken = useAuthStore.getState().refreshToken;
  return api
    .post("/auth/logout", {
      ...(refreshToken ? { refreshToken } : {}),
    })
    .then(unwrap);
}

export function me() {
  return api.get("/auth/me").then(unwrap);
}

