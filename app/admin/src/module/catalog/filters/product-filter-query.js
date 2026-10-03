import { flattenFilterConditions, isFilterQueryEmpty } from "@/components/reui/filters/filters-query"

function firstValue(values) {
  if (!values?.length) return undefined
  const value = values[0]
  return Array.isArray(value) ? value[0] : value
}

export function queryToProductListParams(query) {
  const params = {}
  if (!query) return params
  for (const cond of flattenFilterConditions(query)) {
    const value = firstValue(cond.values)
    if (cond.field === "q") {
      if (
        (cond.operator === "contains" ||
          cond.operator === "is" ||
          cond.operator === "starts_with" ||
          cond.operator === "ends_with") &&
        typeof value === "string" &&
        value.trim()
      ) {
        params.q = value.trim()
      }
      continue
    }
    if (cond.operator !== "is" && cond.operator !== "is_any_of") continue
    if (value == null || value === "") continue
    if (cond.field === "isActive" && (value === "true" || value === "false")) {
      params.isActive = value
    }
    if (cond.field === "categoryId") params.categoryId = value
    if (cond.field === "cityId") params.cityId = value
    if (cond.field === "price" && (value === "none" || value === "set" || value === "sale")) {
      params.price = value
    }
  }
  return params
}

export function productFiltersActive(query) {
  return !isFilterQueryEmpty(query) && Object.keys(queryToProductListParams(query)).length > 0
}
