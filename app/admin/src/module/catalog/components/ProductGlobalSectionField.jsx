import { useMemo } from "react"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { buildSectionSelectOptions } from "@/module/catalog/lib/global-section-membership"

export function ProductGlobalSectionField({
  value,
  onChange,
  disabled,
  sections,
  loading,
}) {
  const options = useMemo(
    () => buildSectionSelectOptions(sections, value || null),
    [sections, value],
  )
  const selected = options.find((row) => row.id === value)

  if (loading) {
    return <Skeleton className="h-10 w-full max-w-md" />
  }

  return (
    <Field>
      <FieldLabel>Home section</FieldLabel>
      <FieldDescription>
        Appears in this home rail (global list). One section per product. City-specific lists are
        set under Catalog → Sections.
      </FieldDescription>
      <Select
        value={value || "__none__"}
        onValueChange={(next) => onChange(next === "__none__" ? "" : next)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full max-w-md">
          <SelectValue placeholder="No section">
            {selected?.name ?? "No section"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">No section</SelectItem>
          {options.map((row) => (
            <SelectItem key={row.id} value={row.id}>
              {row.name}
              {row.isActive === false ? " (inactive)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}
