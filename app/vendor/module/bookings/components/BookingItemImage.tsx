import { Image } from 'expo-image';
import { Package } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

type BookingItemImageProps = {
  uri?: string | null;
  size?: number;
  radius?: number;
  width?: number | `${number}%`;
  height?: number;
};

export function BookingItemImage({
  uri,
  size = 56,
  radius = 12,
  width,
  height,
}: BookingItemImageProps) {
  const imageWidth = width ?? size;
  const imageHeight = height ?? size;

  if (!uri) {
    return (
      <View
        style={[
          styles.placeholder,
          { width: imageWidth, height: imageHeight, borderRadius: radius },
        ]}>
        <Package size={Math.max(18, imageHeight * 0.32)} color="#9CA3AF" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={{ width: imageWidth, height: imageHeight, borderRadius: radius }}
      contentFit="cover"
      transition={200}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
});
