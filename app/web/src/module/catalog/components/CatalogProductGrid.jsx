import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRightIcon, SlidersHorizontalIcon } from "lucide-react";
import { getApiError } from "@/api/api";
import { listProducts } from "@/api/products.api";
import { Button } from "@/components/ui/button";
import { CatalogListingFilterSheet } from "@/module/catalog/components/CatalogListingFilterSheet";
import { CatalogListingToolbar } from "@/module/catalog/components/CatalogListingToolbar";
import { CatalogPagination } from "@/module/catalog/components/CatalogPagination";
import { CatalogPriceFilter } from "@/module/catalog/components/CatalogPriceFilter";
import {
  countActiveListingFilters,
  parseSubcategoryIdsParam,
  resolveCategoryListingIds,
} from "@/module/catalog/lib/category-listing-filter";
import {
  CATALOG_SORT_DEFAULT,
  parseCatalogSort,
} from "@/module/catalog/lib/catalog-listing-sort";
import {
  HomeProductCardRail,
  HomeProductCardRailSkeleton,
} from "@/module/home/components/HomeProductCard";
import { normalizeProduct } from "@/module/home/lib/home-catalog";
import { isBackendCityId, useLocationStore } from "@/store/location.store";

const DEFAULT_LIMIT = 24;

function parsePriceParam(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

export function CatalogProductGrid({
  categoryIds,
  sectionTitle,
  emptyTitle = "No packages yet",
  emptyDescription = "Check back soon or try another city.",
  pageParam = "page",
  limit = DEFAULT_LIMIT,
  filterUi = "chips",
  subcategoryFilterOptions = [],
  childRouteActive = false,
  parentChildIds = [],
  filterTriggerPlacement = "inline",
  filterSheetOpen: filterSheetOpenProp,
  onFilterSheetOpenChange,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const city = useLocationStore((s) => s.city);
  const pincode = useLocationStore((s) => s.pincode);
  const setPickerOpen = useLocationStore((s) => s.setPickerOpen);

  const page = Math.max(1, Number(searchParams.get(pageParam)) || 1);
  const sort = parseCatalogSort(searchParams.get("sort") ?? CATALOG_SORT_DEFAULT);
  const minPriceRupees = parsePriceParam(searchParams.get("minPrice"));
  const maxPriceRupees = parsePriceParam(searchParams.get("maxPrice"));
  const instantOnly = searchParams.get("instant") === "1";
  const appliedSubcategoryIds = useMemo(
    () => (childRouteActive ? [] : parseSubcategoryIdsParam(searchParams)),
    [searchParams, childRouteActive],
  );

  const listingCategoryIds = useMemo(
    () =>
      resolveCategoryListingIds({
        routeCategoryIds: categoryIds,
        childRouteActive,
        subcategoryIds: appliedSubcategoryIds,
        parentChildIds,
      }),
    [categoryIds, childRouteActive, appliedSubcategoryIds, parentChildIds],
  );

  const hasLocation =
    Boolean(pincode?.code) || (Boolean(city?.id) && isBackendCityId(city.id));

  const filterKey = useMemo(
    () => (listingCategoryIds?.length ? listingCategoryIds.join(",") : ""),
    [listingCategoryIds],
  );

  const listingKey = useMemo(
    () =>
      [filterKey, sort, minPriceRupees ?? "", maxPriceRupees ?? "", page].join("|"),
    [filterKey, sort, minPriceRupees, maxPriceRupees, page],
  );

  const [status, setStatus] = useState(hasLocation ? "loading" : "need-location");
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [priceFacet, setPriceFacet] = useState({ minPaise: 0, maxPaise: 0 });
  const [priceOpen, setPriceOpen] = useState(false);
  const [filterSheetOpenInternal, setFilterSheetOpenInternal] = useState(false);
  const filterSheetOpen = filterSheetOpenProp ?? filterSheetOpenInternal;
  const setFilterSheetOpen = onFilterSheetOpenChange ?? setFilterSheetOpenInternal;
  const useSheetFilters = filterUi === "sheet";
  const externalFilterTrigger = filterTriggerPlacement === "external";

  const updateListingParams = useCallback(
    (patch) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete(pageParam);

          if (patch.sort !== undefined) {
            if (patch.sort === CATALOG_SORT_DEFAULT) next.delete("sort");
            else next.set("sort", patch.sort);
          }

          if (patch.minPriceRupees !== undefined) {
            if (patch.minPriceRupees == null) next.delete("minPrice");
            else next.set("minPrice", String(patch.minPriceRupees));
          }

          if (patch.maxPriceRupees !== undefined) {
            if (patch.maxPriceRupees == null) next.delete("maxPrice");
            else next.set("maxPrice", String(patch.maxPriceRupees));
          }

          if (patch.subcategoryIds !== undefined) {
            if (!patch.subcategoryIds?.length) next.delete("subcategoryIds");
            else next.set("subcategoryIds", patch.subcategoryIds.join(","));
          }

          return next;
        },
        { replace: true },
      );
    },
    [pageParam, setSearchParams],
  );

  const setPage = useCallback(
    (nextPage) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (nextPage <= 1) next.delete(pageParam);
          else next.set(pageParam, String(nextPage));
          return next;
        },
        { replace: true },
      );
    },
    [pageParam, setSearchParams],
  );

  useEffect(() => {
    setPriceFacet({ minPaise: 0, maxPaise: 0 });
    setPriceOpen(false);
  }, [filterKey]);

  useEffect(() => {
    if (!hasLocation) {
      setStatus("need-location");
      setItems([]);
      setTotal(0);
      return undefined;
    }

    let cancelled = false;
    setStatus("loading");
    setError("");

    const minPricePaise =
      minPriceRupees != null && minPriceRupees > 0 ? minPriceRupees * 100 : undefined;
    const maxPricePaise =
      maxPriceRupees != null ? maxPriceRupees * 100 : undefined;

    void listProducts({
      pincode: pincode?.code || undefined,
      cityId: pincode?.code ? undefined : city?.id,
      categoryIds: listingCategoryIds?.length ? listingCategoryIds : undefined,
      sort,
      minPricePaise,
      maxPricePaise,
      page,
      limit,
    })
      .then((data) => {
        if (cancelled) return;
        let rows = (data?.items ?? [])
          .map(normalizeProduct)
          .filter(Boolean);
        if (instantOnly) {
          rows = rows.filter((product) => product.instant?.enabled);
        }
        setItems(rows);
        setTotal(instantOnly ? rows.length : Number(data?.total ?? 0));
        if (data?.facets?.price) {
          setPriceFacet({
            minPaise: Number(data.facets.price.minPaise ?? 0),
            maxPaise: Number(data.facets.price.maxPaise ?? 0),
          });
        }
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(getApiError(err));
        setItems([]);
        setTotal(0);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [hasLocation, pincode?.code, city?.id, listingKey, filterKey, sort, minPriceRupees, maxPriceRupees, page, limit, instantOnly]);

  const showListingControls = hasLocation && status !== "need-location";
  const listingBusy = status === "loading";

  const facetMaxRupees = Math.round(priceFacet.maxPaise / 100);
  const priceRangeReady = priceFacet.maxPaise > 0;
  const priceActive =
    minPriceRupees != null ||
    maxPriceRupees != null;

  const activeFilterCount = countActiveListingFilters({
    sort,
    minPriceRupees,
    maxPriceRupees,
    subcategoryIds: appliedSubcategoryIds,
    defaultSort: CATALOG_SORT_DEFAULT,
  });

  function clearSheetFilters() {
    updateListingParams({
      sort: CATALOG_SORT_DEFAULT,
      minPriceRupees: null,
      maxPriceRupees: null,
      subcategoryIds: [],
    });
  }

  return (
    <section className="space-y-4" aria-label={sectionTitle || "Product listings"}>
      {sectionTitle ? (
        <h2 className="font-heading text-lg font-semibold tracking-tight sm:text-xl">
          {sectionTitle}
        </h2>
      ) : null}

      {status === "need-location" ? (
        <div className="rounded-3xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-heading text-lg font-semibold">Pick your city</p>
          <p className="mt-2 text-sm text-muted-foreground">
            We need a serviceable city to show local prices.
          </p>
          <Button
            className="mt-5 rounded-full"
            onClick={() => setPickerOpen(true)}
          >
            Select city
            <ArrowRightIcon className="size-4" />
          </Button>
        </div>
      ) : null}

      {showListingControls ? (
        <div className="space-y-4">
          {useSheetFilters ? (
            <>
              <div
                className={
                  externalFilterTrigger
                    ? "flex items-center justify-between gap-3 border-b border-border/80 pb-3 md:pb-4"
                    : "flex items-center justify-between gap-3 border-b border-border/80 pb-4"
                }
              >
                <p className="text-sm text-muted-foreground">
                  <span className="font-bold text-foreground tabular-nums">
                    {listingBusy ? "…" : total.toLocaleString()}
                  </span>{" "}
                  products
                </p>
                {!externalFilterTrigger ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 rounded-full"
                    onClick={() => setFilterSheetOpen(true)}
                  >
                    <SlidersHorizontalIcon className="size-4" />
                    Filter
                    {activeFilterCount > 0 ? (
                      <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                        {activeFilterCount}
                      </span>
                    ) : null}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="hidden shrink-0 rounded-full md:inline-flex"
                    onClick={() => setFilterSheetOpen(true)}
                  >
                    <SlidersHorizontalIcon className="size-4" />
                    Filter
                    {activeFilterCount > 0 ? (
                      <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                        {activeFilterCount}
                      </span>
                    ) : null}
                  </Button>
                )}
              </div>
              <CatalogListingFilterSheet
                open={filterSheetOpen}
                onOpenChange={setFilterSheetOpen}
                sort={sort}
                minPriceRupees={minPriceRupees}
                maxPriceRupees={maxPriceRupees}
                facetMaxPaise={priceFacet.maxPaise}
                subcategoryOptions={subcategoryFilterOptions}
                selectedSubcategoryIds={appliedSubcategoryIds}
                onApply={({ sort: nextSort, minPriceRupees: minR, maxPriceRupees: maxR, subcategoryIds }) => {
                  updateListingParams({
                    sort: nextSort,
                    minPriceRupees: minR,
                    maxPriceRupees: maxR,
                    subcategoryIds,
                  });
                }}
                onClear={clearSheetFilters}
              />
            </>
          ) : (
            <>
              <CatalogListingToolbar
                total={total}
                sort={sort}
                loading={listingBusy}
                showPriceButton={priceRangeReady || priceActive || listingBusy}
                priceOpen={priceOpen}
                priceActive={priceActive}
                onPriceClick={() => setPriceOpen((open) => !open)}
                onSortChange={(nextSort) => updateListingParams({ sort: nextSort })}
              />
              {priceOpen && priceRangeReady ? (
                <CatalogPriceFilter
                  facetMaxPaise={priceFacet.maxPaise}
                  appliedMinRupees={minPriceRupees ?? 0}
                  appliedMaxRupees={maxPriceRupees ?? facetMaxRupees}
                  disabled={listingBusy}
                  onApply={({ minRupees, maxRupees }) => {
                    updateListingParams({
                      minPriceRupees: minRupees,
                      maxPriceRupees: maxRupees,
                    });
                  }}
                />
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {status === "loading" ? (
        <div className="space-y-6" aria-busy="true" aria-live="polite">
          <span className="sr-only">Loading products</span>
          <div className="grid grid-cols-2 items-stretch gap-2.5 sm:grid-cols-3 md:gap-3 lg:grid-cols-5">
            {Array.from({ length: 10 }, (_, i) => (
              <HomeProductCardRailSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
          <p className="font-medium text-destructive">
            {error || "Could not load products"}
          </p>
        </div>
      ) : null}

      {status === "ready" && items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-heading text-lg font-semibold">{emptyTitle}</p>
          <p className="mt-2 text-sm text-muted-foreground">{emptyDescription}</p>
        </div>
      ) : null}

      {status === "ready" && items.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 items-stretch gap-2.5 sm:grid-cols-3 md:gap-3 lg:grid-cols-5">
            {items.map((product) => (
              <HomeProductCardRail key={product.id} product={product} />
            ))}
          </div>
          <CatalogPagination
            page={page}
            limit={limit}
            total={total}
            onPageChange={setPage}
          />
        </div>
      ) : null}
    </section>
  );
}
