import { flattenFilterConditions, isFilterQueryEmpty } from "@/components/reui/filters/filters-query"

function firstValue(values) {
  if (!values?.length) return undefined
  const value = values[0]
  return Array.isArray(value) ? value[0] : value
}

export function queryToCustomerListParams(query) {
  const params = {}
  if (!query) return params

  for (const cond of flattenFilterConditions(query)) {
    const value = firstValue(cond.values)
    if (cond.operator !== "is" && cond.operator !== "contains") continue
    if (value == null || value === "") continue

    if (cond.field === "cityId") params.cityId = value
    if (cond.field === "hasBookings" && (value === "true" || value === "false")) {
      params.hasBookings = value === "true"
    }
    if (cond.field === "joinedFrom" && typeof value === "string" && value.trim()) {
      params.joinedFrom = value.trim()
    }
    if (cond.field === "joinedTo" && typeof value === "string" && value.trim()) {
      params.joinedTo = value.trim()
    }
  }

  return params
}

export function customerFiltersActive(query) {
  return !isFilterQueryEmpty(query) && Object.keys(queryToCustomerListParams(query)).length > 0
}

export function customerTabToStatus(tab) {
  switch (tab) {
    case "active":
      return "active"
    case "blocked":
      return "blocked"
    default:
      return null
  }
}
