import { Screen, SmoothScrollView } from '@/components/shell';
import { HomeBannerCarousel } from '@/module/home/components/HomeBannerCarousel';
import { HomeDiscoveryFeed } from '@/module/home/components/HomeDiscoveryFeed';
import { HomeBannerSkeleton, HomeFeedSkeleton } from '@/module/home/components/HomeFeedSkeleton';
import { HomeSelectCityBanner } from '@/module/home/components/HomeSelectCityBanner';
import { useActiveOrderScrollPaddingBottom } from '@/module/home/hooks/use-tab-active-order-bar';
import { HomeLaunchAnnouncementSheet } from '@/module/home/components/HomeLaunchAnnouncementSheet';
import {
  HOME_BANNER_DOTS_BOTTOM,
  HOME_SEARCH_BANNER_OVERLAP,
  HomeCityPicker,
  HomeHeaderSearchRow,
  HomeHeaderStatusSpacer,
  HomeHeaderTopRow,
  HomePinnedSearchBar,
} from '@/module/home/components/HomeStickyHeader';
import { useLaunchAnnouncementSheet } from '@/module/home/hooks/use-launch-announcement-sheet';
import { useHomeCategories } from '@/module/home/hooks/use-home-categories';
import { useHomeCms } from '@/module/home/hooks/use-home-cms';
import { useHomeDeliveryBootstrap } from '@/module/home/hooks/use-home-delivery-bootstrap';
import { useHomeDiscovery } from '@/module/home/hooks/use-home-discovery';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useLocationStore } from '@/store/location.store';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  RefreshControl,
  View,
} from 'react-native';

export function HomeScreen() {
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

  // The pinned search bar (with bell) shows once the in-feed bar's top reaches the screen top.
  // State only changes when crossing that point, not on every scroll event.
  const [pinned, setPinned] = useState(false);
  const pinnedRef = useRef(false);
  // Scroll offset where the in-feed search row touches the top. Read from its real layout.
  const pinAtRef = useRef(Number.POSITIVE_INFINITY);
  const onSearchRowLayout = useCallback((e: LayoutChangeEvent) => {
    pinAtRef.current = e.nativeEvent.layout.y;
  }, []);
  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = e.nativeEvent.contentOffset.y >= pinAtRef.current;
    if (next === pinnedRef.current) return;
    pinnedRef.current = next;
    setPinned(next);
  }, []);

  // The search bar floats over the banner's bottom edge only when there is a banner.
  const bannerVisible = showSkeleton || heroSlides.length > 0;

  const launchSheet = useLaunchAnnouncementSheet({
    enabled: locationChosen && !cityPickerOpen && !showSkeleton,
  });

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
    <Screen scroll={false} edges={['left', 'right']} contentClassName="flex-1">
      <HomeHeaderStatusSpacer />
      {/* Pinned bar is absolutely positioned over the top of this area. */}
      <View className="flex-1">
        <SmoothScrollView
          contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
          scrollEventThrottle={16}
          onScroll={onScroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
          }>
          <HomeHeaderTopRow onCityPress={() => setCityPickerOpen(true)} />
          {showSkeleton ? (
            <HomeBannerSkeleton />
          ) : (
            <HomeBannerCarousel slides={heroSlides} dotsOverlayBottom={HOME_BANNER_DOTS_BOTTOM} />
          )}
          {/* zIndex keeps the bar above the banner it overlaps. */}
          <View
            style={{
              zIndex: 1,
              marginTop: bannerVisible ? -HOME_SEARCH_BANNER_OVERLAP : 0,
            }}
            onLayout={onSearchRowLayout}>
            <HomeHeaderSearchRow solid={!bannerVisible} />
          </View>
          <View className="gap-4 pt-2">
            {showSkeleton ? (
              <HomeFeedSkeleton hideBanner />
            ) : (
              <>
                {!locationChosen ? (
                  <HomeSelectCityBanner onPress={() => setCityPickerOpen(true)} />
                ) : null}
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
          </View>
        </SmoothScrollView>
        <HomePinnedSearchBar visible={pinned} />
      </View>
      <HomeCityPicker open={cityPickerOpen} onOpenChange={setCityPickerOpen} />
      <HomeLaunchAnnouncementSheet
        visible={launchSheet.visible}
        announcement={launchSheet.announcement}
        onDismiss={() => void launchSheet.dismiss()}
        onPrimaryClose={launchSheet.onPrimaryClose}
      />
    </Screen>
  );
}
