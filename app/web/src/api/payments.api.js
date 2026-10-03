import { api, unwrap } from "@/api/api";

export function getPaymentMethods() {
  return api.get("/payments/methods").then(unwrap);
}

export function verifyPayment(body) {
  return api.post("/payments/verify", body).then(unwrap);
}
