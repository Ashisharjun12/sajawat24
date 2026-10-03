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

type CategoryProductListingProps = {
  categoryIds: string[];
  /** Explore “All” — list every product in the city without categoryIds. */
  showAllProducts?: boolean;
  sectionTitle?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Bumped by parent on pull-to-refresh to reload page 1. */
  refreshNonce?: number;
};

export function CategoryProductListing({
  categoryIds,
  showAllProducts = false,
  sectionTitle = 'All packages',
  emptyTitle = 'No packages in this category yet',
  emptyDescription = 'Try another subcategory or browse all categories.',
  refreshNonce = 0,
}: CategoryProductListingProps) {
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

  if (!hasLocation) {
    return (
      <View className="mx-5 rounded-2xl border border-dashed border-border px-6 py-10">
        <Text className="text-foreground text-center text-base font-semibold">Pick your city</Text>
        <Text className="text-muted-foreground mt-2 text-center text-sm">
          We need a serviceable city to show local prices.
        </Text>
        <Button
          className="mt-4 self-center rounded-full px-6"
          onPress={() => router.push(SELECT_LOCATION_HREF)}>
          <Text>Set delivery location</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="gap-4 px-5">
      {sectionTitle ? (
        <Text className="text-foreground text-lg font-semibold">{sectionTitle}</Text>
      ) : null}

      <CatalogListingToolbar
        total={total}
        sort={sort}
        loading={isFetching && page === 1}
        onSortChange={onSortChange}
        onPricePress={() => setPriceOpen(true)}
        priceOpen={priceOpen}
        priceActive={priceActive}
        showPriceButton={priceRangeReady || priceActive || isLoading}
      />

      <CatalogPriceFilterPanel
        visible={priceOpen}
        facetMaxPaise={priceFacet.maxPaise}
        appliedMinRupees={minPriceRupees}
        appliedMaxRupees={appliedMaxRupees}
        disabled={isFetching}
        onClose={() => setPriceOpen(false)}
        onApply={onPriceApply}
      />

      {showInitialSkeleton ? <CatalogProductGridSkeleton /> : null}

      {isError ? (
        <Text className="text-destructive py-6 text-center text-sm">Could not load products.</Text>
      ) : null}

      {showEmpty ? (
        <View className="rounded-2xl border border-dashed border-border px-6 py-12">
          <Text className="text-foreground text-center text-base font-semibold">{emptyTitle}</Text>
          <Text className="text-muted-foreground mt-2 text-center text-sm">{emptyDescription}</Text>
        </View>
      ) : null}

      {accumulated.length > 0 ? (
        <View className="gap-4">
          <CatalogProductGrid products={accumulated} />
          {canLoadMore ? (
            <Button
              variant="outline"
              className="rounded-xl"
              disabled={isFetching}
              onPress={() => setPage((p) => p + 1)}>
              <Text>{isFetching ? 'Loading…' : 'Load more'}</Text>
            </Button>
          ) : null}
          {accumulated.length >= total && total > CATALOG_LISTING_LIMIT ? (
            <Text className="text-muted-foreground text-center text-xs">
              Showing all {total.toLocaleString()} products
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
