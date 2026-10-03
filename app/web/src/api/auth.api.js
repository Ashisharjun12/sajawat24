import { api, unwrap } from "@/api/api";

export function requestOtp({ phone }) {
  return api.post("/auth/otp/request", { phone }).then(unwrap);
}

export function verifyOtp({ phone, otp, clientType = "web" }) {
  return api.post("/auth/otp/verify", { phone, otp, clientType }).then(unwrap);
}

export function googleLogin({ idToken, clientType = "web" }) {
  return api.post("/auth/google", { idToken, clientType }).then(unwrap);
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

export function linkPhone({ phone, otp }) {
  return api.post("/user/link-phone", { phone, otp }).then(unwrap);
}

export function linkGoogle({ idToken }) {
  return api.post("/user/link-google", { idToken }).then(unwrap);
}
