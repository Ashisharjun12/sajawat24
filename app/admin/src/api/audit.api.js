import { api, unwrap } from "@/api/api"

export function listAuditLogs(params = {}) {
  const search = new URLSearchParams()
  if (params.page) search.set("page", String(params.page))
  if (params.limit) search.set("limit", String(params.limit))
  if (params.action) search.set("action", params.action)
  if (params.entityType) search.set("entityType", params.entityType)
  if (params.entityId) search.set("entityId", params.entityId)
  if (params.from) search.set("from", params.from)
  if (params.to) search.set("to", params.to)
  const query = search.toString()
  return api.get(`/admin/audit-logs${query ? `?${query}` : ""}`).then(unwrap)
}
