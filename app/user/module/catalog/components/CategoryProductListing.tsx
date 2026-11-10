import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { isBackendCityId } from '@/lib/location-label';
import { CatalogListingToolbar } from '@/module/catalog/components/CatalogListingToolbar';
import { CatalogPriceFilterPanel } from '@/module/catalog/components/CatalogPriceFilterPanel';
import {
  CatalogProductGrid,
  CatalogProductGridSkeleton,
} from '@/module/catalog/components/CatalogProductGrid';
import {
  CATALOG_LISTING_LIMIT,
  type CatalogPriceFacet,
  useCatalogListingQuery,
} from '@/module/catalog/hooks/use-catalog-listing-query';
import {
  CATALOG_SORT_DEFAULT,
  type CatalogSortId,
} from '@/module/catalog/lib/catalog-listing-sort';
import { SELECT_LOCATION_HREF } from '@/lib/select-location-route';
import { router } from 'expo-router';
import type { HomeCatalogProduct } from '@/module/home/lib/home-catalog';
import { useLocationStore } from '@/store/location.store';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';

/** Last known totals, kept while the next page loads (its `data` is empty until it arrives). */
type ListingMeta = { total: number; priceFacet: CatalogPriceFacet };
const EMPTY_META: ListingMeta = { total: 0, priceFacet: { minPaise: 0, maxPaise: 0 } };

type CategoryProductListingOptions = {
  categoryIds: string[];
  /** Explore “All” — list every product in the city without categoryIds. */
  showAllProducts?: boolean;
  /** Bumped by parent on pull-to-refresh to reload page 1. */
  refreshNonce?: number;
};

type CategoryProductListingProps = CategoryProductListingOptions & {
  sectionTitle?: string;
  emptyTitle?: string;
  emptyDescription?: string;
};

/** Listing state (sort, price, pagination, query) — shared by the inline and split layouts. */
export function useCategoryProductListing({
  categoryIds,
  showAllProducts = false,
  refreshNonce = 0,
}: CategoryProductListingOptions) {
  const city = useLocationStore((s) => s.city);
  const pincode = useLocationStore((s) => s.pincode);
  const cityId = city?.id && isBackendCityId(city.id) ? city.id : undefined;
  const pincodeCode = pincode?.code?.replace(/\D/g, '').slice(0, 6) || undefined;
  const hasLocation = Boolean(pincodeCode || cityId);

  const categoryIdsKey = categoryIds.join(',');
  const listingFilterKey = showAllProducts ? 'all' : categoryIdsKey;

  const [sort, setSort] = useState<CatalogSortId>(CATALOG_SORT_DEFAULT);
  const [minPriceRupees, setMinPriceRupees] = useState<number | null>(null);
  const [maxPriceRupees, setMaxPriceRupees] = useState<number | null>(null);
  /** Page being requested. */
  const [page, setPage] = useState(1);
  /** Highest page already merged into `accumulated` (0 = nothing yet). */
  const [loadedPage, setLoadedPage] = useState(0);
  /** A page came back with nothing new, so there is nothing more to load. */
  const [exhausted, setExhausted] = useState(false);
  const [meta, setMeta] = useState<ListingMeta>(EMPTY_META);
  const [accumulated, setAccumulated] = useState<HomeCatalogProduct[]>([]);
  const [priceOpen, setPriceOpen] = useState(false);

  // Refs mirror the state above so the merge effect reads the latest values without
  // re-running, and so a repeat fetch of an already-merged page is never mistaken for a new one.
  const listRef = useRef<HomeCatalogProduct[]>([]);
  const loadedPageRef = useRef(0);

  const commitList = useCallback((next: HomeCatalogProduct[]) => {
    listRef.current = next;
    setAccumulated(next);
  }, []);

  const markLoaded = useCallback((n: number) => {
    loadedPageRef.current = n;
    setLoadedPage(n);
  }, []);

  /** Back to page 1 with an empty list (filters changed). */
  const resetList = useCallback(() => {
    setPage(1);
    commitList([]);
    markLoaded(0);
    setExhausted(false);
  }, [commitList, markLoaded]);

  useEffect(() => {
    setSort(CATALOG_SORT_DEFAULT);
    setMinPriceRupees(null);
    setMaxPriceRupees(null);
    resetList();
    setMeta(EMPTY_META);
    setPriceOpen(false);
  }, [listingFilterKey, resetList]);

  const { data, dataUpdatedAt, isLoading, isFetching, isError, refetch } =
    useCatalogListingQuery({
      categoryIds: showAllProducts ? undefined : categoryIds,
      unfiltered: showAllProducts,
      sort,
      minPriceRupees,
      maxPriceRupees,
      page,
    });

  useEffect(() => {
    if (refreshNonce <= 0) return;
    setPage(1);
    void refetch();
  }, [refreshNonce, refetch]);

  useEffect(() => {
    if (!data) return;
    setMeta({ total: data.total, priceFacet: data.priceFacet });

    if (page === 1) {
      commitList(data.items);
      markLoaded(1);
      setExhausted(data.items.length === 0);
      return;
    }

    const prev = listRef.current;
    const seen = new Set(prev.map((p) => p.id));
    const fresh = data.items.filter((p) => !seen.has(p.id));
    if (fresh.length) commitList([...prev, ...fresh]);

    // Only a page we have not merged before can prove the list has ended. A background
    // refetch of an already-merged page returns only duplicates and must not flip this.
    if (page > loadedPageRef.current) {
      markLoaded(page);
      setExhausted(fresh.length === 0);
    }
  }, [data, page, dataUpdatedAt, commitList, markLoaded]);

  // Fall back to the last known values while the next page's `data` is still empty.
  const total = data?.total ?? meta.total;

  const priceFacet = data?.priceFacet ?? meta.priceFacet;

  const facetMaxRupees = Math.round(priceFacet.maxPaise / 100);
  const priceRangeReady = priceFacet.maxPaise > 0;
  const priceActive = minPriceRupees != null || maxPriceRupees != null;

  const hasItems = accumulated.length > 0;
  /** Next page requested but not merged yet (request in flight, or arrived this frame). */
  const nextPagePending = hasItems && page > loadedPage;

  // `data !== undefined` covers the frame where cached data has arrived but is not merged
  // yet, so the list never flashes its empty state between skeleton and products.
  const showInitialSkeleton =
    hasLocation && !hasItems && loadedPage < 1 && !isError && (isLoading || data !== undefined);
  const showEmpty = hasLocation && !hasItems && !isError && !showInitialSkeleton;

  /** Skeleton rows under the grid while the next page loads. */
  const loadingMore = nextPagePending && !isError;
  /** The next page failed: keep the products, offer a retry for that same page. */
  const loadMoreFailed = nextPagePending && isError;
  // `page === loadedPage` also rules out the short window after a pull-to-refresh where the page
  // is already back at 1 but the list still holds later pages until page 1 is merged again.
  const inSync = page === loadedPage;
  const canLoadMore = hasItems && inSync && !exhausted && accumulated.length < total;
  const reachedEnd =
    hasItems && inSync && !canLoadMore && accumulated.length > CATALOG_LISTING_LIMIT;

  const appliedMaxRupees = useMemo(
    () => maxPriceRupees ?? (facetMaxRupees > 0 ? facetMaxRupees : null),
    [maxPriceRupees, facetMaxRupees],
  );

  // Both handlers return early when nothing changed: the query key would stay the same, so
  // no new data would arrive to refill the list we are about to clear.
  function onSortChange(next: CatalogSortId) {
    if (next === sort) return;
    setSort(next);
    resetList();
  }

  function onPriceApply(patch: { minRupees: number | null; maxRupees: number | null }) {
    if (patch.minRupees === minPriceRupees && patch.maxRupees === maxPriceRupees) return;
    setMinPriceRupees(patch.minRupees);
    setMaxPriceRupees(patch.maxRupees);
    resetList();
  }

  /**
   * Load the page after the last merged one. Idempotent: a double tap asks for the same page
   * twice instead of skipping one. If that page already failed, retry it rather than moving on.
   */
  const loadMore = useCallback(() => {
    if (page > loadedPage) {
      if (!isFetching) void refetch();
      return;
    }
    if (page < loadedPage) return; // refresh in progress, list not back in sync yet
    setPage(loadedPage + 1);
  }, [page, loadedPage, isFetching, refetch]);

  const retry = useCallback(() => {
    void refetch();
  }, [refetch]);

  return {
    hasLocation,
    sort,
    page,
    total,
    accumulated,
    priceOpen,
    setPriceOpen,
    priceFacet,
    priceRangeReady,
    priceActive,
    minPriceRupees,
    appliedMaxRupees,
    isLoading,
    isFetching,
    isError,
    showInitialSkeleton,
    showEmpty,
    canLoadMore,
    loadingMore,
    loadMoreFailed,
    reachedEnd,
    loadMore,
    retry,
    onSortChange,
    onPriceApply,
  };
}

export type CategoryProductListingState = ReturnType<typeof useCategoryProductListing>;

/** Sort chips + Custom price (and its sheet). */
export function CategoryProductListingToolbar({
  listing,
  showTotal = true,
}: {
  listing: CategoryProductListingState;
  showTotal?: boolean;
}) {
  if (!listing.hasLocation) return null;
  return (
    <>
      <CatalogListingToolbar
        total={listing.total}
        sort={listing.sort}
        loading={listing.isFetching && listing.page === 1}
        onSortChange={listing.onSortChange}
        onPricePress={() => listing.setPriceOpen(true)}
        priceOpen={listing.priceOpen}
        priceActive={listing.priceActive}
        showPriceButton={listing.priceRangeReady || listing.priceActive || listing.isLoading}
        showTotal={showTotal}
      />
      <CatalogPriceFilterPanel
        visible={listing.priceOpen}
        facetMaxPaise={listing.priceFacet.maxPaise}
        appliedMinRupees={listing.minPriceRupees}
        appliedMaxRupees={listing.appliedMaxRupees}
        disabled={listing.isFetching}
        onClose={() => listing.setPriceOpen(false)}
        onApply={listing.onPriceApply}
      />
    </>
  );
}

/** Location prompt, skeleton, error, empty state, grid and load more. */
export function CategoryProductListingResults({
  listing,
  emptyTitle = 'No packages in this category yet',
  emptyDescription = 'Try another subcategory or browse all categories.',
}: {
  listing: CategoryProductListingState;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (!listing.hasLocation) {
    return (
      <View className="mx-5 rounded-2xl border border-dashed border-border px-6 py-10">
        <Text className="text-foreground text-center text-base font-semibold">Pick your city</Text>
        <Text className="text-muted-foreground mt-2 text-center text-sm">
          We need a serviceable city to show local prices.
        </Text>
        <Button
          variant="primary"
          className="mt-4 self-center"
          onPress={() => router.push(SELECT_LOCATION_HREF)}>
          <Text>Set delivery location</Text>
        </Button>
      </View>
    );
  }

  const { accumulated } = listing;

  return (
    <>
      {listing.showInitialSkeleton ? <CatalogProductGridSkeleton /> : null}

      {/* First page failed (or a refresh failed). A failed next page is handled under the grid. */}
      {listing.isError && !listing.loadMoreFailed ? (
        <View className="items-center gap-3 py-6">
          <Text className="text-destructive text-center text-sm">Could not load products.</Text>
          <Button variant="primary" size="md" onPress={listing.retry}>
            <Text>Try again</Text>
          </Button>
        </View>
      ) : null}

      {listing.showEmpty ? (
        <View className="rounded-2xl border border-dashed border-border px-6 py-12">
          <Text className="text-foreground text-center text-base font-semibold">{emptyTitle}</Text>
          <Text className="text-muted-foreground mt-2 text-center text-sm">{emptyDescription}</Text>
        </View>
      ) : null}

      {accumulated.length > 0 ? (
        <View className="gap-4">
          <CatalogProductGrid products={accumulated} />

          {/* Next page loading: placeholder cards under the products instead of a blank gap.
              mt-2 + the 16px gap = the 24px row spacing used inside the grid. */}
          {listing.loadingMore ? (
            <View
              className="mt-2"
              accessibilityLabel="Loading more products"
              accessibilityLiveRegion="polite">
              <CatalogProductGridSkeleton rows={2} />
            </View>
          ) : null}

          {/* Next page failed: products stay, retry fetches that same page. */}
          {listing.loadMoreFailed ? (
            <View className="items-center gap-3">
              <Text className="text-destructive text-center text-sm">
                Could not load more products.
              </Text>
              <Button variant="primary" className="self-stretch" onPress={listing.loadMore}>
                <Text>Try again</Text>
              </Button>
            </View>
          ) : null}

          {listing.canLoadMore ? (
            <Button variant="primary" onPress={listing.loadMore}>
              <Text>Load more</Text>
            </Button>
          ) : null}

          {listing.reachedEnd ? (
            <Text className="text-muted-foreground text-center text-xs">
              Showing all {accumulated.length.toLocaleString()} products
            </Text>
          ) : null}
        </View>
      ) : null}
    </>
  );
}

export function CategoryProductListing({
  sectionTitle = 'All packages',
  emptyTitle,
  emptyDescription,
  ...options
}: CategoryProductListingProps) {
  const listing = useCategoryProductListing(options);

  if (!listing.hasLocation) {
    return <CategoryProductListingResults listing={listing} />;
  }

  return (
    <View className="gap-4 px-5">
      {sectionTitle ? (
        <Text className="text-foreground text-lg font-semibold">{sectionTitle}</Text>
      ) : null}
      <CategoryProductListingToolbar listing={listing} />
      <CategoryProductListingResults
        listing={listing}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
    </View>
  );
}
