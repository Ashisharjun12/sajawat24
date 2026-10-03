import { Screen, SmoothScrollView } from '@/components/shell';
import { SELECT_LOCATION_HREF } from '@/lib/select-location-route';
import { HomeBannerCarousel } from '@/module/home/components/HomeBannerCarousel';
import { HomeDiscoveryFeed } from '@/module/home/components/HomeDiscoveryFeed';
import { HomeFeedSkeleton } from '@/module/home/components/HomeFeedSkeleton';
import { HomeSelectCityBanner } from '@/module/home/components/HomeSelectCityBanner';
import { useActiveOrderScrollPaddingBottom } from '@/module/home/hooks/use-tab-active-order-bar';
import { HomeStickyHeader } from '@/module/home/components/HomeStickyHeader';
import { useHomeCategories } from '@/module/home/hooks/use-home-categories';
import { useHomeCms } from '@/module/home/hooks/use-home-cms';
import { useHomeDeliveryBootstrap } from '@/module/home/hooks/use-home-delivery-bootstrap';
import { useHomeDiscovery } from '@/module/home/hooks/use-home-discovery';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useLocationStore } from '@/store/location.store';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl } from 'react-native';

export function HomeScreen() {
  const openSelectLocation = useCallback(() => router.push(SELECT_LOCATION_HREF), []);
  const locationStatus = useLocationStore((s) => s.status);
  const bootstrapDone = useLocationStore((s) => s.bootstrapDone);
  const locationChosen = useLocationStore((s) => s.isLocationChosen());
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  useHomeDeliveryBootstrap();
  const accessToken = useAuthStore((s) => s.accessToken);
  const loadCart = useCartStore((s) => s.loadFromApi);

  const {
    heroSlides,
    layoutBlocks,
    midSlide,
    endSlide,
    useCmsLayout,
    isPending: cmsPending,
    isRefetching: cmsRefetching,
    refetch: refetchCms,
  } = useHomeCms();

  const {
    categories,
    isPending: categoriesPending,
    refetch: refetchCategories,
  } = useHomeCategories();

  const {
    sections,
    isPending: discoveryPending,
    isRefetching: discoveryRefetching,
    refetch: refetchDiscovery,
  } = useHomeDiscovery();

  useFocusEffect(
    useCallback(() => {
      if (accessToken) {
        void loadCart();
      }
    }, [accessToken, loadCart]),
  );

  useEffect(() => {
    if (bootstrapDone && locationStatus === 'ready' && !locationChosen) {
      setCityPickerOpen(true);
    }
  }, [bootstrapDone, locationChosen, locationStatus]);

  useEffect(() => {
    if (locationChosen) {
      setCityPickerOpen(false);
    }
  }, [locationChosen]);

  const discoveryLoading = categoriesPending || discoveryPending;
  const showSkeleton = locationStatus !== 'ready' || cmsPending;

  const scrollBottomPadding = useActiveOrderScrollPaddingBottom(32);

  const refreshing =
    locationStatus === 'ready' &&
    (cmsRefetching || (!useCmsLayout && discoveryRefetching)) &&
    !showSkeleton;

  const onRefresh = useCallback(async () => {
    if (locationStatus !== 'ready') return;
    await refetchCms();
    await Promise.all([refetchDiscovery(), refetchCategories()]);
    if (accessToken) {
      await loadCart();
    }
  }, [
    accessToken,
    loadCart,
    locationChosen,
    locationStatus,
    refetchCategories,
    refetchCms,
    refetchDiscovery,
    useCmsLayout,
  ]);

  return (
    <Screen scroll={false} edges={['top']} contentClassName="flex-1">
      <HomeStickyHeader
        onLocationPress={openSelectLocation}
        cityPickerOpen={cityPickerOpen}
        onCityPickerOpenChange={setCityPickerOpen}
      />
      <SmoothScrollView
        contentContainerClassName="gap-4 pt-2"
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }>
        {showSkeleton ? (
          <HomeFeedSkeleton />
        ) : (
          <>
            {!locationChosen ? (
              <HomeSelectCityBanner onPress={() => setCityPickerOpen(true)} />
            ) : null}
            <HomeBannerCarousel slides={heroSlides} />
            <HomeDiscoveryFeed
              useCmsLayout={useCmsLayout}
              layoutBlocks={layoutBlocks}
              midSlide={midSlide}
              endSlide={endSlide}
              categories={categories}
              sections={sections}
              discoveryLoading={discoveryLoading}
              cmsLoading={cmsPending}
            />
          </>
        )}
      </SmoothScrollView>
    </Screen>
  );
}
