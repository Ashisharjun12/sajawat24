import { useEffect, useRef, useState } from "react";
import { autocompletePlaces, getPlaceDetails } from "@/api/maps.api";
import { cn } from "@/lib/utils";

function inputClassName(className, ariaInvalid) {
  return cn(
    "h-9 w-full min-w-0 rounded-3xl border border-transparent bg-input/50 px-3 py-1 text-base transition-[color,box-shadow,background-color] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
    className,
  );
}

export function PlacesAddressAutocomplete({
  id,
  value,
  onChange,
  onPlaceResolved,
  placeholder,
  disabled,
  "aria-invalid": ariaInvalid,
  className,
  locationBias = null,
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const debounceRef = useRef(null);
  const sessionRef = useRef(`${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const skipSearchRef = useRef(false);

  useEffect(() => {
    const trimmed = (value ?? "").trim();
    if (skipSearchRef.current) {
      setSuggestions([]);
      setOpen(false);
      return undefined;
    }
    if (trimmed.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return undefined;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setLoading(true);
      void autocompletePlaces(trimmed, {
        sessionToken: sessionRef.current,
        location: locationBias,
      })
        .then((items) => {
          setSuggestions(items);
          setOpen(items.length > 0);
        })
        .catch(() => {
          setSuggestions([]);
          setOpen(false);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [value, locationBias]);

  async function handleSelect(item) {
    skipSearchRef.current = true;
    setOpen(false);
    setSuggestions([]);
    onChange?.(item.description);
    try {
      const details = await getPlaceDetails(item.placeId, sessionRef.current);
      sessionRef.current = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      onPlaceResolved?.({
        address: details.formattedAddress || item.description,
        pincode: details.pincode ?? null,
        latitude: details.latitude,
        longitude: details.longitude,
      });
    } catch {
      // keep typed line
    }
  }

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        autoComplete="off"
        disabled={disabled}
        aria-invalid={ariaInvalid}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          skipSearchRef.current = false;
          onChange?.(e.target.value);
        }}
        onFocus={() => {
          if (!skipSearchRef.current && suggestions.length > 0) setOpen(true);
        }}
        className={inputClassName(className, ariaInvalid)}
      />
      {loading ? (
        <p className="mt-1 text-xs text-muted-foreground">Searching…</p>
      ) : null}
      {open && suggestions.length > 0 ? (
        <ul
          className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-border bg-background py-1 shadow-lg"
          role="listbox"
        >
          {suggestions.map((item) => (
            <li key={item.placeId}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void handleSelect(item)}
              >
                {item.description}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
