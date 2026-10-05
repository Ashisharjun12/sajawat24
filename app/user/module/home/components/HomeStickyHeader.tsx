import { formatLocationLabel } from '@/lib/location-label';
import { HomeBottomSheetModal } from '@/module/home/components/HomeBottomSheetModal';
import { HomeCityPickerSheet } from '@/module/home/components/HomeCityPickerSheet';
import { HomeSearchBar } from '@/module/home/components/HomeSearchBar';
import { HomeTopBar } from '@/module/home/components/HomeTopBar';
import { useLocationStore } from '@/store/location.store';
import { useEffect } from 'react';
import { useWindowDimensions, View } from 'react-native';

type HomeStickyHeaderProps = {
  cityPickerOpen: boolean;
  onCityPickerOpenChange: (open: boolean) => void;
};

export function HomeStickyHeader({
  cityPickerOpen,
  onCityPickerOpenChange,
}: HomeStickyHeaderProps) {
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
    if (!cityPickerOpen) return;
    void fetchCities();
  }, [cityPickerOpen, fetchCities]);

  return (
    <View className="gap-2.5 border-b border-border/70 bg-background/95 px-3 pb-3 pt-1">
      <HomeTopBar onCityPress={() => onCityPickerOpenChange(true)} />
      <HomeSearchBar />

      <HomeBottomSheetModal
        visible={cityPickerOpen}
        onClose={() => onCityPickerOpenChange(false)}
        sheetMinHeight={citySheetMinHeight}
        sheetMaxHeight={citySheetMaxHeight}
        closeAccessibilityLabel="Close city picker">
        <HomeCityPickerSheet
          onClose={() => onCityPickerOpenChange(false)}
          currentLabel={cityLabel}
        />
      </HomeBottomSheetModal>
    </View>
  );
}
