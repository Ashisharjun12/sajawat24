import { HomeSearchBar } from '@/module/home/components/HomeSearchBar';
import { HomeTopBar } from '@/module/home/components/HomeTopBar';
import { View } from 'react-native';

type HomeStickyHeaderProps = {
  onLocationPress?: () => void;
  cityPickerOpen: boolean;
  onCityPickerOpenChange: (open: boolean) => void;
};

export function HomeStickyHeader({
  onLocationPress,
  cityPickerOpen,
  onCityPickerOpenChange,
}: HomeStickyHeaderProps) {
  return (
    <View className="border-b border-border/70 bg-background/95 px-3 pb-3 pt-1 gap-2.5">
      <HomeTopBar onLocationPress={onLocationPress} />
      <HomeSearchBar cityOpen={cityPickerOpen} onCityOpenChange={onCityPickerOpenChange} />
    </View>
  );
}
