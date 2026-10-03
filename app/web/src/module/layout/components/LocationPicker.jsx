import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { MapsPinIcon } from "@/components/maps-pin-icon";
import { getLenis } from "@/lib/lenis-instance";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  formatLocationLabel,
  isBackendCityId,
  LOCATION_PROMPT_DISMISSED_KEY,
  useLocationStore,
} from "@/store/location.store";
import { useCartStore } from "@/store/cart.store";

const MD_DOWN_MEDIA_QUERY = "(max-width: 767px)";
const POPULAR_CITY_COUNT = 8;

function useIsMdDown() {
  return useSyncExternalStore(
    (listener) => {
      const mq = window.matchMedia(MD_DOWN_MEDIA_QUERY);
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    },
    () => window.matchMedia(MD_DOWN_MEDIA_QUERY).matches,
    () => false,
  );
}

function sortCitiesByName(list) {
  return [...list].sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}

function CityChip({
  city,
  pincode,
  source,
  className,
  labelClassName,
  chevronClassName,
  ...props
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-10 max-w-[13rem] cursor-pointer items-center gap-1.5 rounded-[var(--r-btn)] border border-border bg-background px-3.5 text-left text-[13.5px] transition-shadow hover:border-primary hover:shadow-sm sm:max-w-none",
        className,
      )}
      {...props}
    >
      <MapsPinIcon size={14} className="size-3.5 text-primary" strokeWidth={2.25} />
      <span className={cn("min-w-0 truncate font-bold", labelClassName)}>
        {formatLocationLabel(city, pincode, source)}
      </span>
      <ChevronDownIcon
        className={cn("size-3.5 shrink-0 text-muted-foreground", chevronClassName)}
      />
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="mb-2.5 px-0.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
      {children}
    </p>
  );
}

function LocationPickerHeader() {
  return (
    <div className="flex items-start gap-3 px-4 pt-1 pb-2">
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
        aria-hidden
      >
        <MapsPinIcon size={20} className="size-5" strokeWidth={2.25} />
      </span>
      <div className="min-w-0 pt-0.5">
        <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
          Select your city
        </h2>
        <p className="text-sm text-muted-foreground">See pricing for your location</p>
      </div>
    </div>
  );
}

function PopularCityCard({ city, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(city)}
      className={cn(
        "flex flex-col items-center gap-2 rounded-[var(--r-card)] border border-border/80 bg-card px-1.5 py-3 text-center transition-colors hover:border-primary/35 hover:bg-muted/40",
        selected && "border-primary/50 bg-primary/5 ring-1 ring-primary/20",
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MapsPinIcon size={16} className="size-4" strokeWidth={2.25} />
      </span>
      <span className="line-clamp-2 text-xs font-semibold leading-tight text-foreground">
        {city.name}
      </span>
    </button>
  );
}

function AllCityRow({ city, selected, onSelect }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(city)}
        className={cn(
          "flex w-full cursor-pointer items-center gap-2.5 rounded-[var(--r-btn)] px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/80",
          selected && "bg-muted/90",
        )}
      >
        <MapsPinIcon
          size={16}
          className={cn("size-4 shrink-0", selected ? "text-primary" : "text-muted-foreground")}
          strokeWidth={2.25}
        />
        <span className="min-w-0 truncate">{city.name}</span>
      </button>
    </li>
  );
}

function LocationCityPickerPanel({
  query,
  onQueryChange,
  cities,
  selectedCityId,
  onSelectCity,
}) {
  const isSearching = query.trim().length > 0;

  const popularCities = useMemo(() => {
    if (isSearching || cities.length === 0) return [];
    return cities.slice(0, POPULAR_CITY_COUNT);
  }, [cities, isSearching]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortCitiesByName(cities);
    return sortCitiesByName(
      cities.filter(
        (item) =>
          item.name.toLowerCase().includes(q) || item.state?.toLowerCase().includes(q),
      ),
    );
  }, [cities, query]);

  return (
    <>
      <LocationPickerHeader />

      <div className="shrink-0 px-4 pb-3">
        <div className="relative">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search city…"
            className="h-11 rounded-[var(--r-input)] border-border/70 bg-muted/30 pl-10 shadow-none"
            autoComplete="off"
          />
        </div>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        data-lenis-prevent
      >
        {cities.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No cities available yet.</p>
        ) : null}

        {cities.length > 0 && filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No city matches that search.
          </p>
        ) : null}

        {popularCities.length > 0 ? (
          <section className="mb-5" aria-label="Popular cities">
            <SectionLabel>Popular cities</SectionLabel>
            <div className="grid grid-cols-4 gap-2">
              {popularCities.map((item) => (
                <PopularCityCard
                  key={item.id}
                  city={item}
                  selected={selectedCityId === item.id}
                  onSelect={onSelectCity}
                />
              ))}
            </div>
          </section>
        ) : null}

        {filtered.length > 0 ? (
          <section aria-label={isSearching ? "Search results" : "All cities"}>
            <SectionLabel>{isSearching ? "Results" : "All cities"}</SectionLabel>
            <ul className="flex flex-col gap-0.5">
              {filtered.map((item) => (
                <AllCityRow
                  key={item.id}
                  city={item}
                  selected={selectedCityId === item.id}
                  onSelect={onSelectCity}
                />
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}

export function LocationPicker({ variant = "default", className }) {
  const city = useLocationStore((s) => s.city);
  const pincode = useLocationStore((s) => s.pincode);
  const source = useLocationStore((s) => s.source);
  const cities = useLocationStore((s) => s.cities);
  const pickerOpen = useLocationStore((s) => s.pickerOpen);
  const setPickerOpen = useLocationStore((s) => s.setPickerOpen);
  const setLocation = useLocationStore((s) => s.setLocation);
  const setCartLocation = useCartStore((s) => s.setLocation);
  const [query, setQuery] = useState("");
  const isMdDown = useIsMdDown();

  function syncCartLocation(nextCity, nextPincode) {
    if (!nextCity?.id || !isBackendCityId(nextCity.id)) return;
    const body = nextPincode?.code
      ? { cityId: nextCity.id, pincode: String(nextPincode.code).replace(/\D/g, "").slice(0, 6) }
      : { cityId: nextCity.id };
    void setCartLocation(body).catch(() => {});
  }

  useEffect(() => {
    if (!pickerOpen) return undefined;

    const lenis = getLenis();
    lenis?.stop();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      lenis?.start();
    };
  }, [pickerOpen]);

  function selectCity(next) {
    setLocation({ city: next, pincode: null, source: "manual" });
    syncCartLocation(next, null);
    setQuery("");
    setPickerOpen(false);
    sessionStorage.setItem(LOCATION_PROMPT_DISMISSED_KEY, "1");
    useLocationStore.getState().setNeedsPrompt(false);
  }

  function closePicker(open) {
    setPickerOpen(open);
    if (!open) setQuery("");
  }

  const panel = (
    <LocationCityPickerPanel
      query={query}
      onQueryChange={setQuery}
      cities={cities}
      selectedCityId={city?.id}
      onSelectCity={selectCity}
    />
  );

  const shellClass =
    "flex max-h-[min(88dvh,40rem)] flex-col gap-0 overflow-hidden rounded-[var(--r-sheet)] p-0";

  return (
    <>
      <CityChip
        city={city}
        pincode={pincode}
        source={source}
        onClick={() => setPickerOpen(true)}
        className={cn(
          variant === "onBrand" || variant === "onHero"
            ? "h-auto max-w-[10.5rem] border-0 bg-transparent px-0 py-0 shadow-none hover:border-0 hover:bg-transparent hover:shadow-none"
            : undefined,
          variant === "mobileToolbar"
            ? "h-9 w-full max-w-full border-border/80 bg-muted/40 px-2.5 text-xs hover:bg-muted/60"
            : undefined,
          className,
        )}
        labelClassName={
          variant === "onBrand"
            ? "text-sm font-semibold text-primary-foreground"
            : variant === "onHero"
              ? "text-sm font-semibold text-background"
              : variant === "mobileToolbar"
                ? "text-xs font-bold"
                : undefined
        }
        chevronClassName={
          variant === "onBrand"
            ? "text-primary-foreground/70"
            : variant === "onHero"
              ? "text-background/70"
              : undefined
        }
      />

      {isMdDown ? (
        <Sheet open={pickerOpen} onOpenChange={closePicker}>
          <SheetContent side="bottom" showCloseButton className={cn(shellClass, "border-t")}>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-3">{panel}</div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={pickerOpen} onOpenChange={closePicker}>
          <DialogContent
            showCloseButton
            className={cn(
              shellClass,
              "top-[8vh] max-h-[min(40rem,90vh)] w-[min(calc(100%-2rem),28rem)] translate-y-0 sm:max-w-[28rem]",
            )}
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-2">{panel}</div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export function LocationTriggerButton({ className }) {
  const city = useLocationStore((s) => s.city);
  const setPickerOpen = useLocationStore((s) => s.setPickerOpen);
  return (
    <Button className={className} onClick={() => setPickerOpen(true)}>
      {city ? "Change city" : "Select city"}
    </Button>
  );
}
