import { ChevronRightIcon } from "lucide-react";
import { formatPaise } from "@/lib/money";
import { discountPercent } from "@/lib/product-price";
import { cn } from "@/lib/utils";
import { DecoryImageFallback } from "@/components/decory-image-fallback";
import { CommandItem } from "@/components/ui/command";

export function SearchProductRow({ product, onSelect }) {
  const percentOff = discountPercent(product.pricePaise, product.compareAtPaise);

  return (
    <CommandItem
      value={`${product.id} ${product.name}`}
      onSelect={onSelect}
      className="[&_svg:last-child]:hidden flex items-center gap-3 rounded-xl px-2 py-2.5 aria-selected:bg-muted/80"
    >
      <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <DecoryImageFallback className="size-full" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-left text-sm font-medium leading-snug text-foreground">
          {product.name}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
            {formatPaise(product.pricePaise)}
          </span>
          {product.compareAtPaise != null &&
          product.compareAtPaise > (product.pricePaise ?? 0) ? (
            <span className="text-xs tabular-nums text-muted-foreground line-through">
              {formatPaise(product.compareAtPaise)}
            </span>
          ) : null}
          {percentOff > 0 ? (
            <span
              className={cn(
                "rounded-md bg-emerald-100 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-800",
                "dark:bg-emerald-950/80 dark:text-emerald-300",
              )}
            >
              {percentOff}% off
            </span>
          ) : null}
        </div>
      </div>
      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground/60" aria-hidden />
    </CommandItem>
  );
}
