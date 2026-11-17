import { ScalePressable } from '@/components/shell';
import { WhatsAppIcon } from '@/components/shell/WhatsAppIcon';
import { AppSpinner } from '@/components/ui/app-spinner';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatPaise } from '@/lib/format-money';
import { lightImpact } from '@/lib/light-haptic';
import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

/** WhatsApp's own brand green — a third-party mark, not a brand token. */
const WHATSAPP_GREEN = '#25D366';

/** Same yellow 3D key-cap as the "Book a slot" card (`FulfillmentCard`). */
const BOOK_FACE = '#FACC15';
const BOOK_EDGE = '#CA8A04';
const BOOK_TEXT = '#422006';
/** Height of the visible 3D edge; the face sinks PRESS_DEPTH px when pressed. */
const RAISE = 4;
const PRESS_DEPTH = 3;
const RADIUS = 12;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ProductPdpMobileBookingBarProps = {
  pricePaise: number | null | undefined;
  booking: boolean;
  isInstantBooking: boolean;
  onWhatsApp: () => void;
  onBookNow: () => void;
};

/** "Book your setup": yellow face on a darker edge; pressing sinks it like a physical key. */
function BookSlotButton({
  label,
  loading,
  onPress,
}: {
  label: string;
  loading: boolean;
  onPress: () => void;
}) {
  const sink = useSharedValue(0);
  const faceMotion = useAnimatedStyle(() => ({
    transform: [{ translateY: sink.value }],
  }));

  return (
    <View className="flex-1" style={{ marginBottom: RAISE }}>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: RAISE,
          bottom: -RAISE,
          left: 0,
          right: 0,
          borderRadius: RADIUS,
          backgroundColor: BOOK_EDGE,
        }}
      />
      <AnimatedPressable
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ busy: loading, disabled: loading }}
        onPressIn={() => {
          sink.value = withTiming(PRESS_DEPTH, { duration: 70 });
        }}
        onPressOut={() => {
          sink.value = withTiming(0, { duration: 140 });
        }}
        onPress={() => {
          lightImpact();
          onPress();
        }}
        style={[
          {
            height: 48,
            paddingHorizontal: 20,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: RADIUS,
            backgroundColor: BOOK_FACE,
            borderTopWidth: 1,
            // Light catching the top edge.
            borderTopColor: 'rgba(255,255,255,0.45)',
          },
          faceMotion,
        ]}>
        {loading ? (
          <AppSpinner size="sm" iconClassName="text-[#422006]" />
        ) : (
          <Text className="text-button font-semibold" style={{ color: BOOK_TEXT }} numberOfLines={1}>
            {label}
          </Text>
        )}
      </AnimatedPressable>
    </View>
  );
}

export function ProductPdpMobileBookingBar({
  pricePaise,
  booking,
  isInstantBooking,
  onWhatsApp,
  onBookNow,
}: ProductPdpMobileBookingBarProps) {
  const bookLabel = isInstantBooking ? 'Book instant' : 'Book your setup';

  return (
    <View className="flex-row items-center gap-3">
      <View className="shrink-0">
        <Text className="text-muted-foreground text-caption">Total</Text>
        <Text className="text-h3 font-semibold">
          {pricePaise != null ? formatPaise(pricePaise) : '—'}
        </Text>
        <View className="flex-row items-center gap-1">
          <Icon as={Check} size={12} className="text-success" strokeWidth={2.5} />
          <Text className="text-micro font-medium text-success">All inclusive</Text>
        </View>
      </View>

      <ScalePressable
        haptic
        onPress={onWhatsApp}
        accessibilityRole="button"
        accessibilityLabel="Chat on WhatsApp"
        className="size-12 items-center justify-center rounded-btn border border-border bg-surface">
        <WhatsAppIcon size={22} color={WHATSAPP_GREEN} />
      </ScalePressable>

      {isInstantBooking ? (
        <Button
          className="flex-1"
          variant="instant"
          loading={booking}
          accessibilityLabel={bookLabel}
          onPress={() => {
            lightImpact();
            onBookNow();
          }}>
          <Text numberOfLines={1}>{bookLabel}</Text>
        </Button>
      ) : (
        <BookSlotButton label={bookLabel} loading={booking} onPress={onBookNow} />
      )}
    </View>
  );
}
