import { BOOKING_CONFIRMED_ICON_URI } from '@/module/booking/lib/booking-assets';
import { bookingConfirmedMotionHtml } from '@/module/booking/lib/booking-confirmed-motion-html';
import { Image } from 'expo-image';
import { Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';

export const BOOKING_CONFIRMED_HERO_SIZE = 220;

type BookingConfirmedSuccessMotionProps = {
  size?: number;
};

/**
 * Animated success hero (SMIL SVG). Static `Image` cannot play motion; WebView can.
 * Falls back to still frame on web where WebView SVG support is inconsistent.
 */
export function BookingConfirmedSuccessMotion({
  size = BOOKING_CONFIRMED_HERO_SIZE,
}: BookingConfirmedSuccessMotionProps) {
  if (Platform.OS === 'web') {
    return (
      <Image
        source={{ uri: BOOKING_CONFIRMED_ICON_URI }}
        style={{ width: size, height: size }}
        contentFit="contain"
        accessibilityLabel="Booking confirmed"
      />
    );
  }

  return (
    <View
      style={{ width: size, height: size, backgroundColor: 'transparent' }}
      accessibilityLabel="Booking confirmed"
      accessibilityRole="image">
      <WebView
        style={{ width: size, height: size, backgroundColor: 'transparent' }}
        containerStyle={{ backgroundColor: 'transparent' }}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        originWhitelist={['*']}
        bounces={false}
        overScrollMode="never"
        pointerEvents="none"
        androidLayerType="hardware"
        opaque={false}
        source={{ html: bookingConfirmedMotionHtml(BOOKING_CONFIRMED_ICON_URI) }}
      />
    </View>
  );
}
