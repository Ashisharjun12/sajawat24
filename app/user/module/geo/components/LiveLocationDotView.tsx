import {
  MAP_DRIVER_MARKER_FRAME_PX,
  MAP_DRIVER_MARKER_ICON_PX,
  MAP_DRIVER_MARKER_URL,
} from '@/lib/map-assets';
import { Image } from 'expo-image';
import { View } from 'react-native';

type Props = {
  /** Degrees clockwise from north; rotates the rider icon when en route. */
  heading?: number;
  accessibilityLabel?: string;
};

/** Live decorator position on order tracking maps (replaces generic blue GPS dot). */
export function LiveLocationDotView({
  heading,
  accessibilityLabel = 'Decorator location',
}: Props) {
  const rotation =
    heading != null && Number.isFinite(heading) && heading >= 0 ? heading - 90 : 0;

  return (
    <View
      style={{
        width: MAP_DRIVER_MARKER_FRAME_PX,
        height: MAP_DRIVER_MARKER_FRAME_PX,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Image
        source={MAP_DRIVER_MARKER_URL}
        style={{
          width: MAP_DRIVER_MARKER_ICON_PX,
          height: MAP_DRIVER_MARKER_ICON_PX,
          transform: [{ rotate: `${rotation}deg` }],
        }}
        contentFit="contain"
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
}
