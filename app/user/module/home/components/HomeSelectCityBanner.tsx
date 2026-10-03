import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ScalePressable } from '@/components/shell';
import { HomeCityMapIcon } from '@/module/home/components/HomeCityMapIcon';
import { ChevronRight } from 'lucide-react-native';
import { View } from 'react-native';

type HomeSelectCityBannerProps = {
  onPress: () => void;
};

export function HomeSelectCityBanner({ onPress }: HomeSelectCityBannerProps) {
  return (
    <ScalePressable
      onPress={onPress}
      haptic
      className="mx-3 flex-row items-center gap-2.5 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2.5"
      accessibilityRole="button"
      accessibilityLabel="Please select city">
      <HomeCityMapIcon />
      <Text className="text-foreground min-w-0 flex-1 text-sm font-medium">
        Please select city
      </Text>
      <View className="flex-row items-center gap-0.5">
        <Text className="text-foreground text-xs font-semibold">Choose</Text>
        <Icon as={ChevronRight} className="text-foreground size-4" />
      </View>
    </ScalePressable>
  );
}
