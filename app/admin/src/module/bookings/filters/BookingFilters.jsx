import { Filters } from "@/components/reui/filters/filters"

export function BookingFilters({ fields, query, onQueryChange }) {
  return (
    <Filters
      fields={fields}
      query={query}
      onQueryChange={onQueryChange}
      showClear
    />
  )
}
