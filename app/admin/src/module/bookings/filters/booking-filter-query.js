import { flattenFilterConditions, isFilterQueryEmpty } from "@/components/reui/filters/filters-query";

function firstValue(values) {
  if (!values?.length) return undefined;
  const value = values[0];
  return Array.isArray(value) ? value[0] : value;
}

export function queryToBookingListParams(query) {
  const params = {};
  if (!query) return params;
  for (const cond of flattenFilterConditions(query)) {
    const value = firstValue(cond.values);
    if (cond.field === "q") {
      if (
        (cond.operator === "contains" ||
          cond.operator === "is" ||
          cond.operator === "starts_with" ||
          cond.operator === "ends_with") &&
        typeof value === "string" &&
        value.trim()
      ) {
        params.q = value.trim();
      }
      continue;
    }
    if (cond.operator !== "is" && cond.operator !== "is_any_of") continue;
    if (value == null || value === "") continue;
    if (cond.field === "status") params.status = value;
    if (cond.field === "cityId") params.cityId = value;
    if (
      cond.field === "paymentMethod" &&
      (value === "COD" || value === "ONLINE" || value === "PREPAID")
    ) {
      params.paymentMethod = value;
    }
    if (cond.field === "fulfillmentType" && (value === "instant" || value === "scheduled")) {
      params.fulfillmentType = value;
    }
    if (
      cond.field === "dispatchStatus" &&
      ["idle", "searching", "offering", "accepted", "exhausted", "cancelled"].includes(value)
    ) {
      params.dispatchStatus = value;
    }
  }
  return params;
}

export function bookingFiltersActive(query) {
  return !isFilterQueryEmpty(query) && Object.keys(queryToBookingListParams(query)).length > 0;
}

export function tabToBookingListParams(tab) {
  switch (tab) {
    case "needs-assign":
      return { needsAssign: "true" };
    case "assigned":
      return { status: "ASSIGNED,EN_ROUTE,ON_SITE" };
    case "completed":
      return { status: "COMPLETED" };
    default:
      return {};
  }
}
