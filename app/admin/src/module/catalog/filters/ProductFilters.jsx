import { Filters } from "@/components/reui/filters/filters"

export function ProductFilters({ fields, query, onQueryChange }) {
  return (
    <Filters
      fields={fields}
      query={query}
      onQueryChange={onQueryChange}
      showClear
    />
  )
}
