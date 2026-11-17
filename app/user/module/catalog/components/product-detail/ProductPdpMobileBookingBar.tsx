import { ScalePressable } from '@/components/shell';
import { WhatsAppIcon } from '@/components/shell/WhatsAppIcon';
import { AppSpinner } from '@/components/ui/app-spinner';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatPaise } from '@/lib/format-money';
import { lightImpact } from '@/lib/light-haptic';
import { INSTANT_TAB_HEX } from '@/lib/theme';
import { Check, Zap } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

/** WhatsApp's own brand green — a third-party mark, not a brand token. */
const WHATSAPP_GREEN = '#25D366';

/**
 * Same 3D key-caps as the "Book a slot" / "Instant" cards (`FulfillmentCard`):
 * slot = yellow face + gold edge + dark brown text; instant = crimson face + deep crimson edge + white text.
 */
const TONES = {
  slot: { face: '#FACC15', edge: '#CA8A04', text: '#422006', spinner: 'text-[#422006]' },
  instant: { face: INSTANT_TAB_HEX, edge: '#9F1239', text: '#FFFFFF', spinner: 'text-white' },
} as const;
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

/** "Book your setup" / "Book instant": coloured face on a darker edge; pressing sinks it like a key. */
function BookButton3D({
  label,
  tone,
  loading,
  onPress,
}: {
  label: string;
  tone: keyof typeof TONES;
  loading: boolean;
  onPress: () => void;
}) {
  const colors = TONES[tone];
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
          backgroundColor: colors.edge,
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
            flexDirection: 'row',
            gap: 8,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: RADIUS,
            backgroundColor: colors.face,
            borderTopWidth: 1,
            // Light catching the top edge.
            borderTopColor: 'rgba(255,255,255,0.45)',
          },
          faceMotion,
        ]}>
        {loading ? (
          <AppSpinner size="sm" iconClassName={colors.spinner} />
        ) : (
          <>
            {tone === 'instant' ? (
              <Zap size={18} color={colors.text} fill={colors.text} />
            ) : null}
            <Text
              className="shrink text-button font-semibold"
              style={{ color: colors.text }}
              numberOfLines={1}>
              {label}
            </Text>
          </>
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

      <BookButton3D
        label={bookLabel}
        tone={isInstantBooking ? 'instant' : 'slot'}
        loading={booking}
        onPress={onBookNow}
      />
    </View>
  );
}
