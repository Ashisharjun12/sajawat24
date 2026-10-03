import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react";
import { MapsPinIcon } from "@/components/maps-pin-icon";
import { getLenis } from "@/lib/lenis-instance";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  formatLocationLabel,
  isBackendCityId,
  LOCATION_PROMPT_DISMISSED_KEY,
  useLocationStore,
} from "@/store/location.store";
import { useCartStore } from "@/store/cart.store";

const MD_DOWN_MEDIA_QUERY = "(max-width: 767px)";

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
        "inline-flex h-10 max-w-[13rem] cursor-pointer items-center gap-1.5 rounded-full border border-border bg-background px-3.5 text-left text-[13.5px] transition-shadow hover:border-primary hover:shadow-sm sm:max-w-none",
        className,
      )}
      {...props}
    >
      <MapsPinIcon size={14} className="size-3.5" />
      <span className={cn("min-w-0 truncate font-bold", labelClassName)}>
        {formatLocationLabel(city, pincode, source)}
      </span>
      <ChevronDownIcon
        className={cn("size-3.5 shrink-0 text-muted-foreground", chevronClassName)}
      />
    </button>
  );
}

function LocationCityPickerPanel({
  query,
  onQueryChange,
  filtered,
  cities,
  selectedCityId,
  onSelectCity,
  headerClassName,
}) {
  return (
    <>
      <div className={cn("shrink-0 px-4 pt-2 pb-3", headerClassName)}>
        <div className="relative mt-3">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search city or state"
            className="h-11 rounded-2xl border-border/60 bg-muted/40 pl-10 shadow-none"
            autoComplete="off"
          />
        </div>
        <p className="mt-3 px-0.5 text-xs font-medium text-muted-foreground">
          Cities we serve
        </p>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-[max(1rem,env(safe-area-inset-bottom))]"
        data-lenis-prevent
      >
        {cities.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted-foreground">
            No cities available yet.
          </p>
        ) : null}
        {cities.length > 0 && filtered.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted-foreground">
            No city matches that search.
          </p>
        ) : null}
        <ul className="flex flex-col gap-0.5">
          {filtered.map((item) => {
            const selected = selectedCityId === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelectCity(item)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2.5 text-left text-sm transition-colors hover:bg-muted/80",
                    selected && "bg-muted ring-1 ring-border/60",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-md bg-muted",
                      selected && "bg-primary/15",
                    )}
                  >
                    <MapsPinIcon size={16} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-foreground">{item.name}</span>
                    <span className="block text-xs text-muted-foreground">{item.state}</span>
                  </span>
                  {selected ? (
                    <CheckIcon className="size-4 shrink-0 text-primary" aria-hidden />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.state.toLowerCase().includes(q),
    );
  }, [cities, query]);

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

  const panel = (
    <LocationCityPickerPanel
      query={query}
      onQueryChange={setQuery}
      filtered={filtered}
      cities={cities}
      selectedCityId={city?.id}
      onSelectCity={selectCity}
      headerClassName={isMdDown ? "pt-1" : "pt-5 pr-12"}
    />
  );

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
        <Sheet
          open={pickerOpen}
          onOpenChange={(open) => {
            setPickerOpen(open);
            if (!open) setQuery("");
          }}
        >
          <SheetContent
            side="bottom"
            className="flex max-h-[min(88dvh,36rem)] flex-col gap-0 overflow-hidden rounded-t-3xl border-t p-0 pb-0"
          >
            <SheetHeader className="gap-1 border-b border-border/60 px-4 py-4 text-left">
              <SheetTitle className="font-heading text-lg">Choose city</SheetTitle>
              <SheetDescription>
                Pick a city for local pricing and availability.
              </SheetDescription>
            </SheetHeader>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{panel}</div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog
          open={pickerOpen}
          onOpenChange={(open) => {
            setPickerOpen(open);
            if (!open) setQuery("");
          }}
        >
          <DialogContent
            className="top-[12vh] flex max-h-[min(32rem,85vh)] translate-y-0 flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-[min(100%-1.25rem,26rem)]"
          >
            <div className="shrink-0 px-4 pb-3">
              <DialogHeader className="gap-1 text-left">
                <DialogTitle className="font-heading text-lg">Choose city</DialogTitle>
                <DialogDescription>
                  Pick a city for local pricing and availability.
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{panel}</div>
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
