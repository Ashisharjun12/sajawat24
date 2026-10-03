import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";
import { CATALOG_SORT_OPTIONS } from "@/module/catalog/lib/catalog-listing-sort";

function paiseToRupees(paise) {
  return Math.round(Number(paise) / 100);
}

export function CatalogListingFilterSheet({
  open,
  onOpenChange,
  sort,
  minPriceRupees,
  maxPriceRupees,
  facetMaxPaise = 0,
  subcategoryOptions = [],
  selectedSubcategoryIds = [],
  onApply,
  onClear,
}) {
  const [draftSort, setDraftSort] = useState(sort);
  const [draftSubcategoryIds, setDraftSubcategoryIds] = useState(selectedSubcategoryIds);

  const bounds = useMemo(() => {
    const maxR = Math.max(1, paiseToRupees(facetMaxPaise));
    return { min: 0, max: maxR };
  }, [facetMaxPaise]);

  const appliedMin = minPriceRupees ?? bounds.min;
  const appliedMax = maxPriceRupees ?? bounds.max;
  const [draftPrice, setDraftPrice] = useState([appliedMin, appliedMax]);

  useEffect(() => {
    if (!open) return;
    setDraftSort(sort);
    setDraftSubcategoryIds(selectedSubcategoryIds);
    setDraftPrice([appliedMin, appliedMax]);
  }, [open, sort, selectedSubcategoryIds, appliedMin, appliedMax]);

  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [open]);

  const priceRangeReady = facetMaxPaise > 0;

  function toggleSubcategory(id) {
    setDraftSubcategoryIds((prev) =>
      prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id],
    );
  }

  function handleApply() {
    const [low, high] = draftPrice;
    const isFullRange = low <= bounds.min && high >= bounds.max;
    onApply?.({
      sort: draftSort,
      minPriceRupees: isFullRange ? null : low > 0 ? low : null,
      maxPriceRupees: isFullRange ? null : high < bounds.max ? high : null,
      subcategoryIds: draftSubcategoryIds,
    });
    onOpenChange(false);
  }

  function handleClear() {
    onClear?.();
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="flex h-full max-h-dvh w-[min(100vw-2rem,22rem)] flex-col p-0"
      >
        <SheetHeader className="shrink-0 border-b border-border px-4 py-3">
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <div className="flex flex-col gap-6">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Sort by</h3>
            <ul className="space-y-1">
              {CATALOG_SORT_OPTIONS.map((option) => {
                const active = draftSort === option.id;
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      onClick={() => setDraftSort(option.id)}
                      className={cn(
                        "flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                        active ? "bg-primary/15 text-foreground" : "hover:bg-muted",
                      )}
                    >
                      {option.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {subcategoryOptions.length > 0 ? (
            <section className="space-y-3 border-t border-border pt-5">
              <h3 className="text-sm font-semibold">Subcategory</h3>
              <ul className="space-y-2.5">
                {subcategoryOptions.map((row) => {
                  const checked = draftSubcategoryIds.includes(row.id);
                  return (
                    <li key={row.id}>
                      <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleSubcategory(row.id)}
                        />
                        <span className="min-w-0 flex-1">{row.name}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <section className="space-y-4 border-t border-border pt-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Price</h3>
              {priceRangeReady ? (
                <span className="text-xs tabular-nums text-muted-foreground">
                  {formatPaise(draftPrice[0] * 100)} – {formatPaise(draftPrice[1] * 100)}
                </span>
              ) : null}
            </div>
            {priceRangeReady ? (
              <div className="px-1">
                <Slider
                  min={bounds.min}
                  max={bounds.max}
                  step={1}
                  value={draftPrice}
                  onValueChange={(next) => {
                    const values = Array.isArray(next) ? next : [next];
                    const low = Math.min(values[0] ?? bounds.min, values[1] ?? bounds.max);
                    const high = Math.max(values[0] ?? bounds.min, values[1] ?? bounds.max);
                    setDraftPrice([low, high]);
                  }}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Price range unavailable</p>
            )}
          </section>
          </div>
        </div>
        <div className="flex shrink-0 gap-2 border-t border-border p-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-full"
            onClick={handleClear}
          >
            Clear
          </Button>
          <Button type="button" className="flex-1 rounded-full" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
