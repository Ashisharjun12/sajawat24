import { XIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";

export function FilterSidebar({
  className,
  categories = [],
  selectedCategoryIds = [],
  onToggleCategory,
  priceBounds = { minPaise: 0, maxPaise: 0 },
  priceRange,
  onPriceRangeChange,
  chips = [],
  onRemoveChip,
  onClearAll,
}) {
  const hasBounds = priceBounds.maxPaise > priceBounds.minPaise;
  const rangeValue = priceRange ?? [priceBounds.minPaise, priceBounds.maxPaise];
  const hasFilters =
    selectedCategoryIds.length > 0 ||
    (hasBounds &&
      (rangeValue[0] > priceBounds.minPaise ||
        rangeValue[1] < priceBounds.maxPaise));

  return (
    <aside className={cn("flex flex-col gap-6", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Filters
        </h2>
        {hasFilters ? (
          <button
            type="button"
            onClick={onClearAll}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear all
          </button>
        ) : null}
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => onRemoveChip(chip)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
            >
              {chip.label}
              <XIcon className="size-3.5 opacity-70" />
            </button>
          ))}
        </div>
      ) : null}

      <section className="space-y-3 border-t border-border pt-5">
        <h3 className="text-sm font-semibold">Category</h3>
        <ul className="space-y-2.5">
          {categories.length === 0 ? (
            <li className="text-sm text-muted-foreground">No categories yet</li>
          ) : (
            categories.map((category) => {
              const checked = selectedCategoryIds.includes(category.id);
              return (
                <li key={category.id}>
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => onToggleCategory(category.id)}
                    />
                    <span className="min-w-0 flex-1 truncate">{category.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {category.count ?? 0}
                    </span>
                  </label>
                </li>
              );
            })
          )}
        </ul>
      </section>

      <section className="space-y-4 border-t border-border pt-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Price</h3>
          {hasBounds ? (
            <span className="text-xs tabular-nums text-muted-foreground">
              {formatPaise(rangeValue[0])} – {formatPaise(rangeValue[1])}
            </span>
          ) : null}
        </div>
        {hasBounds ? (
          <div className="px-1">
            <Slider
              min={priceBounds.minPaise}
              max={priceBounds.maxPaise}
              step={10000}
              value={rangeValue}
              onValueChange={onPriceRangeChange}
            />
            <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
              <span>{formatPaise(priceBounds.minPaise)}</span>
              <span>{formatPaise(priceBounds.maxPaise)}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Price range unavailable</p>
        )}
      </section>
    </aside>
  );
}
