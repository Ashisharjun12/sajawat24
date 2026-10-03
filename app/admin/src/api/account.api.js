import { api, unwrap } from "@/api/api"

export function getAdminAccount() {
  return api.get("/admin/account").then(unwrap)
}

export function patchAdminAccountProfile(body) {
  return api.patch("/admin/account/profile", body).then(unwrap)
}

export function changeAdminPassword(body) {
  return api.post("/admin/account/change-password", body).then(unwrap)
}

export function changeAdminEmail(body) {
  return api.post("/admin/account/change-email", body).then(unwrap)
}

export function skipAdminPasswordSetup() {
  return api.post("/admin/account/skip-password-setup").then(unwrap)
}

export function verifyAdminEmailChange(token) {
  return api
    .get("/auth/verify-email-change", { params: { token } })
    .then(unwrap)
}
