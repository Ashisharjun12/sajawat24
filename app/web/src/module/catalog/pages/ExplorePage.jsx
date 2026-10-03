import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SlidersHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CatalogProductGrid } from "@/module/catalog/components/CatalogProductGrid";
import { FilterSidebar } from "@/module/catalog/components/FilterSidebar";
import { MobileExploreCategoryRail } from "@/module/catalog/components/MobileExploreCategoryRail";
import {
  flattenCategoriesForFilter,
  parseCategoryIdsParam,
  resolveExploreProductCategoryIds,
} from "@/module/catalog/lib/explore-category-filter";
import { normalizeCategoryTree } from "@/module/home/lib/home-catalog";
import { useCatalogStore } from "@/store/catalog.store";

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftCategoryIds, setDraftCategoryIds] = useState([]);

  const catalogStatus = useCatalogStore((s) => s.status);
  const rawCategories = useCatalogStore((s) => s.categories);

  const categories = useMemo(
    () => normalizeCategoryTree(rawCategories),
    [rawCategories],
  );

  const appliedCategoryIds = useMemo(
    () => parseCategoryIdsParam(searchParams),
    [searchParams],
  );

  const productCategoryIds = useMemo(
    () => resolveExploreProductCategoryIds(categories, appliedCategoryIds),
    [appliedCategoryIds, categories],
  );

  const filterRows = useMemo(
    () => flattenCategoriesForFilter(categories),
    [categories],
  );

  const loadingCategories = catalogStatus === "loading" || catalogStatus === "idle";

  function openFilter() {
    setDraftCategoryIds(appliedCategoryIds);
    setFilterOpen(true);
  }

  function toggleDraftCategory(id) {
    setDraftCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id],
    );
  }

  function applyFilters() {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("categoryId");
        next.delete("page");
        if (draftCategoryIds.length === 0) {
          next.delete("categoryIds");
        } else {
          next.set("categoryIds", draftCategoryIds.join(","));
        }
        return next;
      },
      { replace: true },
    );
    setFilterOpen(false);
  }

  function clearFilters() {
    setDraftCategoryIds([]);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("categoryId");
        next.delete("categoryIds");
        next.delete("page");
        return next;
      },
      { replace: true },
    );
  }

  const filterCount = appliedCategoryIds.length;

  return (
    <div className="pb-4">
      <div
        className="sticky top-[var(--site-header-height,0px)] z-30 border-b border-border/80 bg-background/95 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-3 px-3 py-2.5 md:px-8">
          <div className="min-w-0">
            <h1 className="font-heading text-lg font-semibold tracking-tight md:text-2xl">
              Explore
            </h1>
            <p className="hidden text-sm text-muted-foreground md:block">
              All setups in your city — filter by occasion or budget.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 rounded-full md:hidden"
            onClick={openFilter}
          >
            <SlidersHorizontalIcon className="size-4" />
            Filter
            {filterCount > 0 ? (
              <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                {filterCount}
              </span>
            ) : null}
          </Button>
        </div>

        <div className="md:hidden">
          <MobileExploreCategoryRail categories={categories} />
        </div>
      </div>

      <div className="mx-auto max-w-[1240px] px-4 pt-4 md:px-8 md:py-8">
        <p className="mb-4 hidden text-sm text-muted-foreground md:block">
          <Link to="/" className="hover:text-foreground">Home</Link>
          {" / "}
          <span className="text-foreground">Explore</span>
        </p>

        <CatalogProductGrid
          categoryIds={productCategoryIds}
          sectionTitle=""
          emptyDescription="Try clearing filters or pick another city."
        />
      </div>

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="left" className="w-[min(100vw-2rem,20rem)] p-0">
          <SheetHeader className="border-b border-border px-4 py-3">
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="flex h-[calc(100dvh-8.5rem)] flex-col overflow-y-auto px-4 py-4">
            <FilterSidebar
              categories={filterRows.map((row) => ({
                id: row.id,
                name: row.depth > 0 ? `${"—".repeat(row.depth)} ${row.name}` : row.name,
              }))}
              selectedCategoryIds={draftCategoryIds}
              onToggleCategory={toggleDraftCategory}
              onClearAll={() => setDraftCategoryIds([])}
              priceBounds={{ minPaise: 0, maxPaise: 0 }}
            />
          </div>
          <div className="flex gap-2 border-t border-border p-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-full"
              onClick={clearFilters}
            >
              Clear
            </Button>
            <Button
              type="button"
              className="flex-1 rounded-full"
              onClick={applyFilters}
              disabled={loadingCategories}
            >
              Apply
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
