import { HOME_CITY_MAP_ICON_URI } from '@/module/home/lib/home-assets';
import { Image } from 'expo-image';
import { View } from 'react-native';

type HomeCityMapIconProps = {
  /** Matches search bar trailing control when `default`. */
  variant?: 'searchBar' | 'listRow';
};

export function HomeCityMapIcon({ variant = 'searchBar' }: HomeCityMapIconProps) {
  const size =
    variant === 'listRow' ? { width: 22, height: 26 } : { width: 22, height: 26 };

  return (
    <View
      className={
        variant === 'listRow'
          ? 'size-9 items-center justify-center rounded-full bg-muted/80'
          : undefined
      }>
      <Image
        source={{ uri: HOME_CITY_MAP_ICON_URI }}
        style={size}
        contentFit="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}
