import { TabScreenTitle } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { catalogLocationErrorMessage } from '@/lib/catalog-location';
import { isBackendCityId } from '@/lib/location-label';
import { CatalogListingToolbar } from '@/module/catalog/components/CatalogListingToolbar';
import { CatalogPriceFilterPanel } from '@/module/catalog/components/CatalogPriceFilterPanel';
import { CatalogProductGridSkeleton } from '@/module/catalog/components/CatalogProductGrid';
import {
  CATALOG_LISTING_LIMIT,
  useCatalogListingQuery,
} from '@/module/catalog/hooks/use-catalog-listing-query';
import {
  CATALOG_SORT_DEFAULT,
  type CatalogSortId,
} from '@/module/catalog/lib/catalog-listing-sort';
import { CatalogProductCard } from '@/module/catalog/components/CatalogProductCard';
import { SELECT_LOCATION_HREF } from '@/lib/select-location-route';
import type { HomeCatalogProduct } from '@/module/home/lib/home-catalog';
import { useLocationStore } from '@/store/location.store';
import { type Href, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useActiveOrderScrollPaddingBottom } from '@/module/home/hooks/use-tab-active-order-bar';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
} from 'react-native';

const TAB_SCROLL_BASE_BOTTOM = 112;

export function InstantScreen() {
  const scrollBottomPadding = useActiveOrderScrollPaddingBottom(TAB_SCROLL_BASE_BOTTOM);
  const city = useLocationStore((s) => s.city);
  const locationChosen = useLocationStore((s) => s.isLocationChosen());
  const cityId = city?.id && isBackendCityId(city.id) ? city.id : undefined;
  const hasLocation = locationChosen && Boolean(cityId);

  const [sort, setSort] = useState<CatalogSortId>(CATALOG_SORT_DEFAULT);
  const [minPriceRupees, setMinPriceRupees] = useState<number | null>(null);
  const [maxPriceRupees, setMaxPriceRupees] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [accumulated, setAccumulated] = useState<HomeCatalogProduct[]>([]);
  const [priceOpen, setPriceOpen] = useState(false);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const endReachedLock = useRef(false);

  const { data, dataUpdatedAt, isLoading, isFetching, isError, error, refetch } =
    useCatalogListingQuery({
    instantOnly: true,
    sort,
    minPriceRupees,
    maxPriceRupees,
    page,
  });

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
    endReachedLock.current = false;
  }, [data, page, dataUpdatedAt]);

  const total = data?.total ?? 0;
  const priceFacet = data?.priceFacet ?? { minPaise: 0, maxPaise: 0 };
  const facetMaxRupees = Math.round(priceFacet.maxPaise / 100);
  const priceRangeReady = priceFacet.maxPaise > 0;
  const priceActive = minPriceRupees != null || maxPriceRupees != null;

  const appliedMaxRupees = useMemo(
    () => maxPriceRupees ?? (facetMaxRupees > 0 ? facetMaxRupees : null),
    [maxPriceRupees, facetMaxRupees],
  );

  const showInitialSkeleton = hasLocation && page === 1 && isLoading && accumulated.length === 0;
  const showEmpty =
    hasLocation && !showInitialSkeleton && !isLoading && accumulated.length === 0 && !isError;
  const canLoadMore = accumulated.length < total && !isFetching;

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

  const onRefresh = useCallback(async () => {
    setPullRefreshing(true);
    setPage(1);
    try {
      await refetch();
    } finally {
      setPullRefreshing(false);
    }
  }, [refetch]);

  const onEndReached = useCallback(() => {
    if (!canLoadMore || endReachedLock.current) return;
    endReachedLock.current = true;
    setPage((p) => p + 1);
  }, [canLoadMore]);

  const cityLabel = city?.name?.trim() || 'your city';

  const headerSubtitle = hasLocation ? `Same-day decoration in ${cityLabel}` : 'Same-day decoration near you';

  const onHeaderBack = useCallback(() => {
    router.navigate('/(app)/' as Href);
  }, []);

  const instantTitleBar = (
    <TabScreenTitle
      title="Instant setups"
      subtitle={headerSubtitle}
      showBack
      onBack={onHeaderBack}
      backAccessibilityLabel="Back to home"
    />
  );

  const listHeader = (
    <View className="gap-4 px-5 pb-2 pt-3">
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
        <View className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-6">
          <Text className="text-destructive text-center text-sm font-medium">
            {catalogLocationErrorMessage(error)}
          </Text>
          <Button
            variant="outline"
            className="mt-3 self-center rounded-full px-5"
            onPress={() => router.push(SELECT_LOCATION_HREF)}>
            <Text>Update delivery location</Text>
          </Button>
        </View>
      ) : null}
      {showEmpty ? (
        <View className="rounded-2xl border border-dashed border-border px-6 py-12">
          <Text className="text-foreground text-center text-base font-semibold">
            No instant setups in your city yet
          </Text>
          <Text className="text-muted-foreground mt-2 text-center text-sm">
            Try another sort or check back soon.
          </Text>
        </View>
      ) : null}
    </View>
  );

  if (!hasLocation) {
    return (
      <View className="flex-1">
        {instantTitleBar}
        <View className="mt-8 px-5">
        <View className="rounded-2xl border border-dashed border-border px-6 py-10">
          <Text className="text-foreground text-center text-base font-semibold">
            Location not set yet
          </Text>
          <Text className="text-muted-foreground mt-2 text-center text-sm">
            Set your delivery city to see same-day instant setups near you.
          </Text>
          <Button
            className="mt-4 self-center rounded-full px-6"
            onPress={() => router.push(SELECT_LOCATION_HREF)}>
            <Text>Set delivery location</Text>
          </Button>
        </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {instantTitleBar}
    <FlatList
      className="flex-1"
      data={accumulated}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={{ gap: 10, paddingHorizontal: 20 }}
      contentContainerStyle={{ paddingBottom: scrollBottomPadding, gap: 10 }}
      ListHeaderComponent={listHeader}
      ListFooterComponent={
        isFetching && page > 1 ? (
          <ActivityIndicator className="py-6" />
        ) : accumulated.length >= total && total > CATALOG_LISTING_LIMIT ? (
          <Text className="text-muted-foreground px-5 py-4 text-center text-xs">
            Showing all {total.toLocaleString()} instant setups
          </Text>
        ) : null
      }
      refreshControl={
        <RefreshControl refreshing={pullRefreshing || (isFetching && page === 1)} onRefresh={() => void onRefresh()} />
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      renderItem={({ item }) => (
        <View className="min-w-0 flex-1">
          <CatalogProductCard product={item} layout="grid" />
        </View>
      )}
    />
    </View>
  );
}
