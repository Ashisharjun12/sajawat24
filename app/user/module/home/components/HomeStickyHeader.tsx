import { formatLocationLabel } from '@/lib/location-label';
import { HomeBottomSheetModal } from '@/module/home/components/HomeBottomSheetModal';
import { HomeCityPickerSheet } from '@/module/home/components/HomeCityPickerSheet';
import { HomeSearchBar } from '@/module/home/components/HomeSearchBar';
import { HomeNotificationButton, HomeTopBar } from '@/module/home/components/HomeTopBar';
import { useUserNotifications } from '@/module/notifications/hooks/use-user-notifications';
import { useLocationStore } from '@/store/location.store';
import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Fixed colored strip behind the status bar. Stays put while the feed scrolls. */
export function HomeHeaderStatusSpacer() {
  const insets = useSafeAreaInsets();
  return <View className="bg-primary" style={{ height: insets.top }} />;
}

/** Location + wishlist / cart / bell. Lives inside the scroll content, so it scrolls away. */
export function HomeHeaderTopRow({ onCityPress }: { onCityPress: () => void }) {
  return (
    <View className="bg-primary px-3 pb-3.5 pt-2">
      <HomeTopBar onCityPress={onCityPress} />
    </View>
  );
}

/**
 * How far the search row is pulled up over the bottom of the banner.
 * Row = pt-2 (8) + bar (~48) + pb; 32 puts the bar's middle on the banner's bottom edge.
 */
export const HOME_SEARCH_BANNER_OVERLAP = 32;

/** Banner dots sit just above the part of the search bar that covers the banner. */
export const HOME_BANNER_DOTS_BOTTOM = HOME_SEARCH_BANNER_OVERLAP - 8 + 10;

/** Same paddings for both rows, so the pinned bar lands exactly where the in-feed bar was. */
const SEARCH_ROW_CLASS = 'flex-row items-center gap-2 px-4 pb-2.5 pt-2';

type HomeHeaderSearchRowProps = {
  /** Solid green behind the bar. False while it floats over the banner (banner shows through). */
  solid: boolean;
};

/** In-feed search bar. Scrolls with the page, sitting over the banner's bottom edge. */
export function HomeHeaderSearchRow({ solid }: HomeHeaderSearchRowProps) {
  return (
    <View className={`${SEARCH_ROW_CLASS} ${solid ? 'bg-primary' : ''}`}>
      <View className="min-w-0 flex-1">
        <HomeSearchBar />
      </View>
    </View>
  );
}

/**
 * Pinned copy of the search bar with the bell beside it. Rendered on top of the feed
 * (outside the ScrollView) and shown only once the in-feed bar reaches the top.
 * Shown/hidden instantly, so there are never two bells on screen.
 */
export function HomePinnedSearchBar({ visible }: { visible: boolean }) {
  const { unreadCount } = useUserNotifications();

  return (
    <View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[styles.pinned, { opacity: visible ? 1 : 0 }]}
      className={`${SEARCH_ROW_CLASS} bg-primary shadow-md`}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}>
      <View className="min-w-0 flex-1">
        <HomeSearchBar />
      </View>
      <HomeNotificationButton unreadCount={unreadCount} />
    </View>
  );
}

const styles = StyleSheet.create({
  pinned: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, elevation: 6 },
});

type HomeCityPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function HomeCityPicker({ open, onOpenChange }: HomeCityPickerProps) {
  const { height: windowHeight } = useWindowDimensions();
  const citySheetMinHeight = Math.round(windowHeight * 0.62);
  const citySheetMaxHeight = Math.round(windowHeight * 0.85);
  const fetchCities = useLocationStore((s) => s.fetchCities);
  const city = useLocationStore((s) => s.city);
  const pincode = useLocationStore((s) => s.pincode);
  const cityLabel = formatLocationLabel(city, pincode);

  useEffect(() => {
    void fetchCities();
  }, [fetchCities]);

  useEffect(() => {
    if (!open) return;
    void fetchCities();
  }, [open, fetchCities]);

  return (
    <HomeBottomSheetModal
      visible={open}
      onClose={() => onOpenChange(false)}
      sheetMinHeight={citySheetMinHeight}
      sheetMaxHeight={citySheetMaxHeight}
      closeAccessibilityLabel="Close city picker">
      <HomeCityPickerSheet onClose={() => onOpenChange(false)} currentLabel={cityLabel} />
    </HomeBottomSheetModal>
  );
}
