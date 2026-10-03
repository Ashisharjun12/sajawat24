import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HomeCategoryTile } from "@/module/home/components/HomeCategoryTile";

export const CATEGORY_TILE_COLS = 5;
/** View-all threshold (mobile shows 3 per row; more categories scroll). */
export const HOME_CATEGORY_PREVIEW_COUNT = 3;
export const HOME_CATEGORY_DESKTOP_VISIBLE = 5;
export const CATEGORY_TILE_INITIAL_COUNT = CATEGORY_TILE_COLS * 2;
export const CATEGORY_TILE_EXPAND_STEP = 20;

/** Home row: 3 tiles on mobile, 5 on md+ (gap-2.5 → n−1 gaps at 0.625rem). */
export const homeCategoryTileWidthClass = cn(
  "min-w-0 shrink-0 snap-start",
  "flex-[0_0_calc((100%-1.25rem)/3)] max-w-[calc((100%-1.25rem)/3)]",
  "md:flex-[0_0_calc((100%-2.5rem)/5)] md:max-w-[calc((100%-2.5rem)/5)]",
);

export const categoryRowClassHome =
  "flex w-full min-w-0 gap-2.5 overflow-x-auto overscroll-x-contain pb-2.5 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] sm:snap-none [&::-webkit-scrollbar]:hidden";

/** Category PLP top rail: 5 tiles per viewport (gap-1.5 → four gaps = 1rem). */
export const categoryPlpTopRailTileClass = cn(
  "min-w-0 shrink-0 snap-start",
  "flex-[0_0_calc((100%-1rem)/5)] max-w-[calc((100%-1rem)/5)]",
);

export const categoryPlpTopRailRowClass =
  "flex w-full min-w-0 gap-1.5 overflow-x-auto overscroll-x-contain pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] md:gap-2.5 sm:snap-none [&::-webkit-scrollbar]:hidden";

export const categoryRowClassCatalog =
  "grid grid-cols-5 gap-2.5 sm:grid-cols-6 sm:gap-3 md:gap-3.5";

export const categoryTileWrapClass = "min-w-0 w-full";

function rowClassForLayout(layout) {
  if (layout === "plp-top") return categoryPlpTopRailRowClass;
  return layout === "home" ? categoryRowClassHome : categoryRowClassCatalog;
}

function wrapClassForLayout(layout) {
  if (layout === "plp-top") return categoryPlpTopRailTileClass;
  if (layout === "home") return homeCategoryTileWidthClass;
  return categoryTileWrapClass;
}

export function CategoryTileGridSkeleton({
  count = CATEGORY_TILE_INITIAL_COUNT,
  layout = "catalog",
}) {
  const skeletonImageClass =
    "aspect-square w-full rounded-2xl bg-muted/30";
  const isHomeLayout = layout === "home" || layout === "plp-top";
  const wrapClass = wrapClassForLayout(layout);

  return (
    <div className={rowClassForLayout(layout)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "flex min-w-0 flex-col items-center gap-2",
            wrapClass,
          )}
        >
          <Skeleton className={skeletonImageClass} />
          <Skeleton className="h-3 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function CategoryTileGrid({
  categories = [],
  parent = null,
  navigation = "drill",
  onDrill,
  loading = false,
  initialVisible = CATEGORY_TILE_INITIAL_COUNT,
  expandStep = CATEGORY_TILE_EXPAND_STEP,
  showExpandButton = true,
  skeletonCount,
  layout = "catalog",
  scrollViewAll = null,
}) {
  const [visibleCount, setVisibleCount] = useState(initialVisible);
  const categoryKey = useMemo(
    () => categories.map((c) => c.id).join(","),
    [categories],
  );

  useEffect(() => {
    setVisibleCount(initialVisible);
  }, [categoryKey, initialVisible]);

  if (loading) {
    return (
      <CategoryTileGridSkeleton
        count={skeletonCount ?? initialVisible}
        layout={layout}
      />
    );
  }

  const isScrollRowLayout = layout === "home" || layout === "plp-top";
  const visible = isScrollRowLayout
    ? categories
    : categories.slice(0, visibleCount);
  const hasMore = showExpandButton && categories.length > visibleCount;
  const rowClass = rowClassForLayout(layout);
  const tileWrapClass = wrapClassForLayout(layout);

  return (
    <div className="flex flex-col gap-4">
      <div className={rowClass}>
        {visible.map((category) => (
          <HomeCategoryTile
            key={category.id}
            category={category}
            parent={parent}
            navigation={navigation}
            onDrill={onDrill}
            className={tileWrapClass}
          />
        ))}
        {isScrollRowLayout && scrollViewAll?.to ? (
          <Link
            to={scrollViewAll.to}
            className={cn(
              "flex min-h-[5.5rem] w-[4.5rem] shrink-0 snap-end flex-col items-center justify-center gap-1 self-center py-2 pl-1 text-center sm:min-h-[6rem] sm:w-[5rem]",
              "text-xs font-semibold text-foreground/80 transition-colors hover:text-foreground sm:text-sm",
            )}
          >
            <span className="leading-tight">{scrollViewAll.label ?? "View all"}</span>
            <span className="text-base leading-none" aria-hidden>→</span>
          </Link>
        ) : null}
      </div>
      {hasMore ? (
        <div className="flex justify-center pt-1">
          <Button
            type="button"
            variant="ghost"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
            onClick={() =>
              setVisibleCount((count) =>
                Math.min(count + expandStep, categories.length),
              )
            }
          >
            View all
          </Button>
        </div>
      ) : null}
    </div>
  );
}
