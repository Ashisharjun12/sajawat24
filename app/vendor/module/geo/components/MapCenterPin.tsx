import { Image } from 'expo-image';
import { View } from 'react-native';

export const MAP_PIN_IMAGE_URL = 'https://ik.imagekit.io/aevhlnk0h/pin.png';

const PIN_WIDTH = 36;
const PIN_HEIGHT = 48;

/** Fixed center overlay for drag-the-map pin placement (tip at map center). */
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
