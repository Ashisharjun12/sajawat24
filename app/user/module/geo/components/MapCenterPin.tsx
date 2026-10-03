import { MAP_PIN_IMAGE_URL } from '@/lib/map-assets';
import { Image } from 'expo-image';
import { View } from 'react-native';

const PIN_WIDTH = 40;
const PIN_HEIGHT = 52;

/** Fixed center overlay — map moves under the pin tip. */
export function MapCenterPin() {
  return (
    <View
      pointerEvents="none"
      className="absolute left-1/2 top-1/2 z-10"
      style={{ marginLeft: -PIN_WIDTH / 2, marginTop: -PIN_HEIGHT }}>
      <Image
        source={{ uri: MAP_PIN_IMAGE_URL }}
        style={{ width: PIN_WIDTH, height: PIN_HEIGHT }}
        contentFit="contain"
        accessibilityLabel="Map pin"
      />
    </View>
  );
}
