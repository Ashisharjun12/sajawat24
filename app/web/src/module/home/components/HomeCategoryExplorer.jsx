import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveViewAllCategoryHref } from "@/module/catalog/lib/category-nav";
import {
  CategoryTileGrid,
  HOME_CATEGORY_DESKTOP_VISIBLE,
  HOME_CATEGORY_PREVIEW_COUNT,
} from "@/module/catalog/components/CategoryTileGrid";
import { VIEW_ALL_LINK_CLASS } from "@/module/catalog/components/PdpProductRailHeader";
import { HomeSectionHeading } from "@/module/home/components/HomeSectionHeading";
import { normalizeCategoryTree } from "@/module/home/lib/home-catalog";
import { useCatalogStore } from "@/store/catalog.store";

export function HomeCategoryExplorer({
  categories = [],
  loading = false,
  headingTitle,
  headingSubtitle,
  showTitle = true,
  showSubtitle = true,
  maxVisible = HOME_CATEGORY_PREVIEW_COUNT,
  showViewAll = true,
  enableDrillDown = true,
}) {
  const [stack, setStack] = useState([]);
  const catalogRaw = useCatalogStore((s) => s.categories);
  const catalogTree = useMemo(
    () => normalizeCategoryTree(catalogRaw),
    [catalogRaw],
  );

  useEffect(() => {
    setStack([]);
  }, [categories]);

  const currentParent = stack[stack.length - 1] ?? null;
  const visibleCategories = useMemo(() => {
    if (currentParent) return currentParent.children ?? [];
    return categories;
  }, [categories, currentParent]);

  const title = currentParent?.name ?? headingTitle ?? "Top balloon decoration categories";
  const subtitle = currentParent
    ? `Pick a ${currentParent.name.toLowerCase()} setup`
    : headingSubtitle ?? "Trusted decorators for all events";

  const viewAllHref = useMemo(() => {
    if (showViewAll === false || loading) return null;
    return resolveViewAllCategoryHref({
      rowCategories: visibleCategories,
      catalogCategories: catalogTree,
      currentParent,
    });
  }, [
    showViewAll,
    loading,
    visibleCategories,
    catalogTree,
    currentParent,
  ]);

  const showViewAllLink = Boolean(viewAllHref);

  return (
    <section aria-label="Decoration categories">
      <div className="mb-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-1.5">
          <div className="flex min-w-0 items-start gap-2">
            {currentParent ? (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="mt-0.5 shrink-0 rounded-full"
                onClick={() => setStack((prev) => prev.slice(0, -1))}
                aria-label="Back to categories"
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
            ) : null}
            {showTitle ? (
              <HomeSectionHeading
                className="min-w-0 flex-1"
                title={title}
                subtitle={showSubtitle ? subtitle : null}
                compact
                hideSubtitle
              />
            ) : null}
          </div>
          {showViewAllLink ? (
            <Link to={viewAllHref} className={VIEW_ALL_LINK_CLASS}>
              View all →
            </Link>
          ) : null}
          {showSubtitle && subtitle ? (
            <p className="col-span-2 max-w-[460px] text-xs text-muted-foreground sm:text-[13px]">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>

      <CategoryTileGrid
        categories={visibleCategories}
        parent={currentParent}
        navigation={enableDrillDown ? "drill" : "link"}
        onDrill={enableDrillDown ? (next) => setStack((prev) => [...prev, next]) : undefined}
        loading={loading}
        initialVisible={maxVisible}
        showExpandButton={false}
        skeletonCount={HOME_CATEGORY_DESKTOP_VISIBLE}
        layout="home"
      />
    </section>
  );
}
