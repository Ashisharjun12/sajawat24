import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function PincodeFilters({ q, cityId, isServiceable, cities, onQ, onCityId, onIsServiceable }) {
  const selectedCityName = cities.find((city) => city.id === cityId)?.name

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        className="w-40"
        value={q}
        onChange={(event) => onQ(event.target.value)}
        inputMode="numeric"
        placeholder="Search PIN"
        aria-label="Search pincodes"
      />
      <Select
        value={cityId || "all"}
        onValueChange={(value) => onCityId(value === "all" ? "" : value)}
      >
        <SelectTrigger className="w-56">
          <SelectValue placeholder="All cities">
            {cityId ? selectedCityName : "All cities"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All cities</SelectItem>
          {cities.map((city) => (
            <SelectItem key={city.id} value={city.id}>
              {city.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={isServiceable || "all"}
        onValueChange={(value) => onIsServiceable(value === "all" ? "" : value)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All">
            {isServiceable === "true" ? "Yes" : isServiceable === "false" ? "No" : "All"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="true">Yes</SelectItem>
          <SelectItem value="false">No</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
