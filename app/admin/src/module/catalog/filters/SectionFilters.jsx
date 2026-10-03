import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function SectionFilters({ q, isActive, onQ, onIsActive }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        className="w-56"
        value={q}
        onChange={(event) => onQ(event.target.value)}
        placeholder="Search by name"
        aria-label="Search sections"
      />
      <Select
        value={isActive || "all"}
        onValueChange={(value) => onIsActive(value === "all" ? "" : value)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All">
            {isActive === "true" ? "Active" : isActive === "false" ? "Inactive" : "All"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="true">Active</SelectItem>
          <SelectItem value="false">Inactive</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
