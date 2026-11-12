import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatPaise } from "@/lib/money";

function paiseToRupees(paise) {
  return Math.round(Number(paise) / 100);
}

function parseRupees(value) {
  const n = Number(String(value).replace(/\D/g, ""));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

/**
 * Custom price bottom sheet. Mirrors the user app (CatalogPriceFilterPanel):
 * handle, title, "Range up to", Min/Max inputs, Clear + Apply.
 */
export function CatalogPriceFilter({
  open,
  onOpenChange,
  facetMaxPaise = 0,
  appliedMinRupees,
  appliedMaxRupees,
  onApply,
  disabled = false,
}) {
  const bounds = useMemo(() => {
    const maxR = Math.max(1, paiseToRupees(facetMaxPaise));
    return { min: 0, max: maxR };
  }, [facetMaxPaise]);

  const appliedMin = appliedMinRupees ?? bounds.min;
  const appliedMax = appliedMaxRupees ?? bounds.max;

  const [minDraft, setMinDraft] = useState(String(appliedMin));
  const [maxDraft, setMaxDraft] = useState(String(appliedMax));

  useEffect(() => {
    if (open) {
      setMinDraft(String(appliedMin));
      setMaxDraft(String(appliedMax));
    }
  }, [open, appliedMin, appliedMax]);

  if (facetMaxPaise <= 0) {
    return null;
  }

  function handleApply() {
    const a = parseRupees(minDraft);
    const b = maxDraft.trim() === "" ? bounds.max : parseRupees(maxDraft);
    const low = Math.min(a, b);
    const high = Math.max(a, b);
    const isFullRange = low <= bounds.min && high >= bounds.max;
    onApply?.(
      isFullRange
        ? { minRupees: null, maxRupees: null }
        : {
            minRupees: low > 0 ? low : null,
            maxRupees: high < bounds.max ? high : null,
          },
    );
    onOpenChange?.(false);
  }

  function handleClear() {
    onApply?.({ minRupees: null, maxRupees: null });
    onOpenChange?.(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto w-full gap-0 overflow-hidden rounded-t-[var(--r-sheet)] border-t p-0 pb-[max(1rem,env(safe-area-inset-bottom))] sm:max-w-md"
      >
        <div className="flex items-center justify-center pb-2 pt-3" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>
        <form
          className="px-5 pt-1"
          onSubmit={(event) => {
            event.preventDefault();
            handleApply();
          }}
        >
          <SheetTitle className="text-lg font-semibold">Custom price</SheetTitle>
          <SheetDescription className="mt-1">
            Range up to {formatPaise(bounds.max * 100)}
          </SheetDescription>

          <div className="mt-5 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="catalog-price-min"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Min (₹)
              </label>
              <Input
                id="catalog-price-min"
                value={minDraft}
                onChange={(event) => setMinDraft(event.target.value)}
                inputMode="numeric"
                disabled={disabled}
                className="h-12 rounded-[var(--r-input)]"
                placeholder="0"
              />
            </div>
            <span className="pt-5 text-muted-foreground" aria-hidden="true">
              —
            </span>
            <div className="min-w-0 flex-1">
              <label
                htmlFor="catalog-price-max"
                className="mb-1.5 block text-xs font-medium text-muted-foreground"
              >
                Max (₹)
              </label>
              <Input
                id="catalog-price-max"
                value={maxDraft}
                onChange={(event) => setMaxDraft(event.target.value)}
                inputMode="numeric"
                disabled={disabled}
                className="h-12 rounded-[var(--r-input)]"
                placeholder={String(bounds.max)}
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1 rounded-[var(--r-btn)] text-base"
              onClick={handleClear}
              disabled={disabled}
            >
              Clear
            </Button>
            <Button
              type="submit"
              variant="cta"
              className="h-12 flex-1 rounded-[var(--r-btn)] text-base"
              disabled={disabled}
            >
              Apply
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
