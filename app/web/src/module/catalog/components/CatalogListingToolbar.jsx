import {
  ArrowDownWideNarrowIcon,
  ArrowUpWideNarrowIcon,
  IndianRupeeIcon,
  SparklesIcon,
  TrendingUpIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CATALOG_SORT_DEFAULT,
  CATALOG_SORT_OPTIONS,
} from "@/module/catalog/lib/catalog-listing-sort";

const SORT_ICONS = {
  popularity: TrendingUpIcon,
  new: SparklesIcon,
  price_asc: ArrowUpWideNarrowIcon,
  price_desc: ArrowDownWideNarrowIcon,
};

export function CatalogListingToolbar({
  total = 0,
  sort = CATALOG_SORT_DEFAULT,
  onSortChange,
  loading = false,
  onPriceClick,
  priceOpen = false,
  priceActive = false,
  showPriceButton = true,
}) {
  return (
    <div
      className="space-y-3 border-b border-border/80 pb-4"
      aria-label="Sort and filter products"
    >
      <p className="text-sm text-muted-foreground">
        <span className="font-bold text-foreground tabular-nums">
          {loading ? "…" : total.toLocaleString()}
        </span>{" "}
        products
      </p>

      <div
        className="flex min-w-0 items-center justify-start gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {CATALOG_SORT_OPTIONS.map((option) => {
          const Icon = SORT_ICONS[option.id];
          const active = sort === option.id;
          return (
            <button
              key={option.id}
              type="button"
              disabled={loading}
              onClick={() => onSortChange?.(option.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:text-[13px]",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-muted/80",
              )}
            >
              {Icon ? <Icon className="size-3.5 shrink-0 opacity-90" /> : null}
              {option.label}
            </button>
          );
        })}
        {showPriceButton ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => onPriceClick?.()}
            aria-expanded={priceOpen}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors sm:text-[13px]",
              priceOpen || priceActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground hover:bg-muted/80",
            )}
          >
            <IndianRupeeIcon className="size-3.5 shrink-0 opacity-90" />
            Custom price
          </button>
        ) : null}
      </div>
    </div>
  );
}
