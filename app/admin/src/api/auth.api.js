import { api, unwrap } from "@/api/api";

export function login({ email, password }) {
  return api
    .post("/auth/admin/login", { email, password })
    .then(unwrap);
}

export function refresh() {
  return api.post("/auth/refresh", { clientType: "web" }).then(unwrap);
}

export function logout() {
  return api.post("/auth/logout").then(unwrap);
}

export function me() {
  return api.get("/auth/me").then(unwrap);
}
