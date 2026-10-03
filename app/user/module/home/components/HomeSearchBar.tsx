import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ScalePressable } from '@/components/shell';
import { formatLocationLabel } from '@/lib/location-label';
import { HomeBottomSheetModal } from '@/module/home/components/HomeBottomSheetModal';
import { HomeCityMapIcon } from '@/module/home/components/HomeCityMapIcon';
import { HomeCityPickerSheet } from '@/module/home/components/HomeCityPickerSheet';
import { useLocationStore } from '@/store/location.store';
import { Href, router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';

type HomeSearchBarProps = {
  cityOpen: boolean;
  onCityOpenChange: (open: boolean) => void;
};

export function HomeSearchBar({ cityOpen, onCityOpenChange }: HomeSearchBarProps) {
  const fetchCities = useLocationStore((s) => s.fetchCities);
  const city = useLocationStore((s) => s.city);
  const pincode = useLocationStore((s) => s.pincode);
  const cityLabel = formatLocationLabel(city, pincode);

  useEffect(() => {
    void fetchCities();
  }, [fetchCities]);

  useEffect(() => {
    if (!cityOpen) return;
    void fetchCities();
  }, [cityOpen, fetchCities]);

  return (
    <>
      <View className="flex-row items-stretch overflow-hidden rounded-xl border border-border bg-muted/40">
        <ScalePressable
          onPress={() => router.push('/(app)/search' as Href)}
          haptic
          className="min-w-0 flex-1 flex-row items-center gap-2 px-3 py-3"
          accessibilityRole="button"
          accessibilityLabel="Search decorations">
          <Icon as={Search} className="text-muted-foreground size-5 shrink-0" />
          <Text className="text-muted-foreground flex-1 text-sm" numberOfLines={1}>
            Search decorations or occasions
          </Text>
        </ScalePressable>
        <View className="my-2.5 w-px bg-border" />
        <ScalePressable
          onPress={() => onCityOpenChange(true)}
          haptic
          hitSlop={4}
          className="max-w-[7.5rem] flex-row items-center justify-center gap-1 px-2.5"
          accessibilityRole="button"
          accessibilityLabel={city ? `City: ${city.name}. Change city` : 'Select city'}>
          <HomeCityMapIcon />
          <Text className="text-foreground min-w-0 flex-1 text-xs font-semibold" numberOfLines={1}>
            {city?.name ?? 'City'}
          </Text>
        </ScalePressable>
      </View>

      <HomeBottomSheetModal
        visible={cityOpen}
        onClose={() => onCityOpenChange(false)}
        closeAccessibilityLabel="Close city picker">
        <HomeCityPickerSheet
          onClose={() => onCityOpenChange(false)}
          currentLabel={cityLabel}
        />
      </HomeBottomSheetModal>
    </>
  );
}
