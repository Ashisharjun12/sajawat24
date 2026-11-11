import { SmoothScrollView, TabScreenTitle } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import {
  CategoryProductListingResults,
  CategoryProductListingToolbar,
  useCategoryProductListing,
} from '@/module/catalog/components/CategoryProductListing';
import { SELECT_LOCATION_HREF } from '@/lib/select-location-route';
import { type Href, router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useActiveOrderScrollPaddingBottom } from '@/module/home/hooks/use-tab-active-order-bar';
import { RefreshControl, View } from 'react-native';

const TAB_SCROLL_BASE_BOTTOM = 112;
/** Pull-to-refresh spinner never outlives this, even if no request ends up running. */
const REFRESH_MAX_MS = 5000;

/**
 * Instant tab — same listing as Explore (shared hook, grid, sort/price toolbar, Load more),
 * limited to same-day setups.
 */
export function InstantScreen() {
  const scrollBottomPadding = useActiveOrderScrollPaddingBottom(TAB_SCROLL_BASE_BOTTOM);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const refreshStarted = useRef(false);

  const listing = useCategoryProductListing({
    categoryIds: [],
    instantOnly: true,
    refreshNonce,
  });

  const onRefresh = useCallback(() => {
    if (pullRefreshing) return;
    refreshStarted.current = false;
    setPullRefreshing(true);
    setRefreshNonce((n) => n + 1);
  }, [pullRefreshing]);

  // Stop the spinner once the refetch that the nonce triggers has run and finished.
  useEffect(() => {
    if (!pullRefreshing) return undefined;
    if (listing.isFetching) {
      refreshStarted.current = true;
    } else if (refreshStarted.current) {
      refreshStarted.current = false;
      setPullRefreshing(false);
      return undefined;
    }
    const timer = setTimeout(() => setPullRefreshing(false), REFRESH_MAX_MS);
    return () => clearTimeout(timer);
  }, [pullRefreshing, listing.isFetching]);

  const onHeaderBack = useCallback(() => {
    router.navigate('/(app)/' as Href);
  }, []);

  const titleBar = (
    <TabScreenTitle
      title="Instant setups"
      showBack
      onBack={onHeaderBack}
      backAccessibilityLabel="Back to home"
    />
  );

  if (!listing.hasLocation) {
    return (
      <View className="flex-1">
        {titleBar}
        <View className="mt-8 px-5">
          <View className="rounded-2xl border border-dashed border-border px-6 py-10">
            <Text className="text-foreground text-center text-base font-semibold">
              Location not set yet
            </Text>
            <Text className="text-muted-foreground mt-2 text-center text-sm">
              Set your delivery city to see same-day instant setups near you.
            </Text>
            <Button
              variant="primary"
              className="mt-4 self-center"
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
      {titleBar}
      <SmoothScrollView
        className="flex-1"
        contentContainerClassName="gap-3"
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
        stickyHeaderIndices={[0]}
        refreshControl={<RefreshControl refreshing={pullRefreshing} onRefresh={onRefresh} />}>
        {/* Sticky: sort / price filters stay pinned under the title. */}
        <View className="bg-background px-5 pt-3">
          <CategoryProductListingToolbar listing={listing} showTotal={false} />
        </View>
        <View className="gap-4 px-5 pt-1">
          <CategoryProductListingResults
            listing={listing}
            emptyTitle={
              listing.priceActive
                ? 'No instant setups in this price range'
                : 'No instant setups in your city yet'
            }
            emptyDescription={
              listing.priceActive
                ? 'Try a different price range.'
                : 'Check back soon, or browse Explore for scheduled setups.'
            }
          />
        </View>
      </SmoothScrollView>
    </View>
  );
}
