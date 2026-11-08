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
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

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
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState<HomeCatalogProduct[]>([]);
  const [priceOpen, setPriceOpen] = useState(false);

  useEffect(() => {
    setSort(CATALOG_SORT_DEFAULT);
    setMinPriceRupees(null);
    setMaxPriceRupees(null);
    setPage(1);
    setAccumulated([]);
    setPriceOpen(false);
  }, [listingFilterKey]);

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
    if (page === 1) {
      setAccumulated(data.items);
    } else {
      setAccumulated((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const next = data.items.filter((p) => !seen.has(p.id));
        return next.length ? [...prev, ...next] : prev;
      });
    }
  }, [data, page, dataUpdatedAt]);

  const total = data?.total ?? 0;

  const priceFacet = data?.priceFacet ?? { minPaise: 0, maxPaise: 0 };

  const facetMaxRupees = Math.round(priceFacet.maxPaise / 100);
  const priceRangeReady = priceFacet.maxPaise > 0;
  const priceActive = minPriceRupees != null || maxPriceRupees != null;

  const showInitialSkeleton = hasLocation && page === 1 && isLoading && accumulated.length === 0;
  const showEmpty =
    hasLocation && !showInitialSkeleton && !isLoading && accumulated.length === 0 && !isError;
  const canLoadMore = accumulated.length < total && !isFetching;

  const appliedMaxRupees = useMemo(
    () => maxPriceRupees ?? (facetMaxRupees > 0 ? facetMaxRupees : null),
    [maxPriceRupees, facetMaxRupees],
  );

  function onSortChange(next: CatalogSortId) {
    setSort(next);
    setPage(1);
    setAccumulated([]);
  }

  function onPriceApply(patch: { minRupees: number | null; maxRupees: number | null }) {
    setMinPriceRupees(patch.minRupees);
    setMaxPriceRupees(patch.maxRupees);
    setPage(1);
    setAccumulated([]);
  }

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
    loadMore: () => setPage((p) => p + 1),
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

  const { accumulated, total } = listing;

  return (
    <>
      {listing.showInitialSkeleton ? <CatalogProductGridSkeleton /> : null}

      {listing.isError ? (
        <Text className="text-destructive py-6 text-center text-sm">Could not load products.</Text>
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
          {listing.canLoadMore ? (
            <Button variant="secondary" loading={listing.isFetching} onPress={listing.loadMore}>
              <Text>Load more</Text>
            </Button>
          ) : null}
          {accumulated.length >= total && total > CATALOG_LISTING_LIMIT ? (
            <Text className="text-muted-foreground text-center text-xs">
              Showing all {total.toLocaleString()} products
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
