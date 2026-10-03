import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Skeleton } from "@/components/ui/skeleton"

export function PackageLocationPanel({
  states,
  statesLoading,
  selectedState,
  onSelectState,
  stateCities,
  citiesLoading,
  selectedCity,
  onSelectCity,
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">State</p>
        {statesLoading ? (
          <Skeleton className="h-9 w-full" />
        ) : !states.length ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No active cities found.</p>
        ) : (
          <Combobox
            items={states}
            itemToStringLabel={(state) => state ?? ""}
            itemToStringValue={(state) => state ?? ""}
            isItemEqualToValue={(a, b) => a === b}
            value={selectedState || null}
            onValueChange={(state) => {
              if (state) onSelectState(state)
            }}
          >
            <ComboboxInput placeholder="Search and select state" className="w-full" showClear />
            <ComboboxContent className="w-(--anchor-width)">
              <ComboboxEmpty>No matching state</ComboboxEmpty>
              <ComboboxList>
                {(state) => (
                  <ComboboxItem key={state} value={state}>
                    {state}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        )}
      </div>

      {selectedState ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">City</p>
          {citiesLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : !stateCities.length ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No cities in this state.
            </p>
          ) : (
            <Combobox
              items={stateCities}
              itemToStringLabel={(city) => city?.name ?? ""}
              itemToStringValue={(city) => city?.id ?? ""}
              isItemEqualToValue={(a, b) => a?.id === b?.id}
              value={selectedCity}
              onValueChange={(city) => {
                if (city) onSelectCity(city)
              }}
            >
              <ComboboxInput placeholder="Search and select city" className="w-full" showClear />
              <ComboboxContent className="w-(--anchor-width)">
                <ComboboxEmpty>No matching city</ComboboxEmpty>
                <ComboboxList>
                  {(city) => (
                    <ComboboxItem key={city.id} value={city}>
                      {city.name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          )}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Select a state to see cities.
        </p>
      )}
    </div>
  )
}
