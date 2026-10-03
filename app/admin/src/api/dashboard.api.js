import { api, unwrap } from "@/api/api";

export function getDashboardOverview() {
  return api.get("/admin/dashboard/overview").then(unwrap);
}
