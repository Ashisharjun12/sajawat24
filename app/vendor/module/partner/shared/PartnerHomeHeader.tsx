import { NotificationBell } from '@/components/shell/NotificationBell';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { useIsFocused } from '@react-navigation/native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect, useRef, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PartnerModeDropdown } from './PartnerModeDropdown';

const SAJAWAT_LOGO = require('../../../assets/images/sajwat.webp');

const RIPPLE_MS = 700;
/** Where the colour bubble starts, measured from the header's right edge and bottom edge. */
const RIPPLE_ORIGIN_FROM_RIGHT = 64;
const RIPPLE_ORIGIN_BELOW_BOTTOM = 40;

type PartnerHomeHeaderProps = {
  firstName: string;
  unreadCount?: number;
  /** Red header while the store is closed, green while open. Changes spread in as a bubble. */
  storeClosed?: boolean;
  /** Override bottom padding, e.g. a smaller value when no card overlaps the curve. */
  className?: string;
};

/**
 * Full-bleed home header: logo + notifications on top, greeting + partner mode switch below.
 * Draws behind the status bar. Green when the store is open, red when closed; when the state
 * changes, the new colour spreads out from the store toggle (bottom right) like a bubble.
 */
export function PartnerHomeHeader({
  firstName,
  unreadCount = 0,
  storeClosed = false,
  className,
}: PartnerHomeHeaderProps) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { colorScheme } = useColorScheme();
  const theme = useThemeColors();

  const colorFor = (closed: boolean) => (closed ? theme.destructive : theme.primary);

  // `baseClosed` is the fully painted colour; `rippleClosed` is the colour currently spreading
  // over it (null when idle).
  const [baseClosed, setBaseClosed] = useState(storeClosed);
  const [rippleClosed, setRippleClosed] = useState<boolean | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const progress = useSharedValue(0);
  const lastTarget = useRef(storeClosed);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (storeClosed === lastTarget.current) return;

    // If a bubble is still spreading, its colour becomes the base before the next one starts.
    setBaseClosed(lastTarget.current);
    lastTarget.current = storeClosed;
    setRippleClosed(storeClosed);

    clearTimeout(settleTimer.current);
    cancelAnimation(progress);
    progress.value = 0;
    progress.value = withTiming(1, { duration: RIPPLE_MS, easing: Easing.out(Easing.cubic) });
    settleTimer.current = setTimeout(() => {
      setBaseClosed(storeClosed);
      setRippleClosed(null);
    }, RIPPLE_MS + 30);
  }, [storeClosed, progress]);

  useEffect(() => () => clearTimeout(settleTimer.current), []);

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: Math.max(progress.value, 0.001) }],
  }));

  // Thin light edge that rides the front of the bubble and fades out as it grows.
  const edgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: Math.max(progress.value, 0.001) }],
    opacity: (1 - progress.value) * 0.7,
  }));

  function handleLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  }

  const originX = size.width - RIPPLE_ORIGIN_FROM_RIGHT;
  const originY = size.height + RIPPLE_ORIGIN_BELOW_BOTTOM;
  // Radius that reaches the farthest top corner, so the bubble always covers the whole header.
  const radius = Math.hypot(Math.max(originX, size.width - originX), originY) + 4;

  return (
    <View
      className={cn('overflow-hidden rounded-b-[32px] px-5 pb-14', className)}
      style={{ paddingTop: insets.top + 8, backgroundColor: colorFor(baseClosed) }}
      onLayout={handleLayout}>
      {rippleClosed !== null && size.width > 0 ? (
        <>
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                left: originX - radius,
                top: originY - radius,
                width: radius * 2,
                height: radius * 2,
                borderRadius: radius,
                backgroundColor: colorFor(rippleClosed),
              },
              bubbleStyle,
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                left: originX - radius,
                top: originY - radius,
                width: radius * 2,
                height: radius * 2,
                borderRadius: radius,
                borderWidth: 4,
                borderColor: 'rgba(255,255,255,0.55)',
              },
              edgeStyle,
            ]}
          />
        </>
      ) : null}

      {isFocused ? <StatusBar style={colorScheme === 'dark' ? 'dark' : 'light'} /> : null}

      <View className="flex-row items-center justify-between gap-3">
        {/* The artwork has transparent margins; pull it left so the wordmark lines up with the gutter. */}
        <Image
          source={SAJAWAT_LOGO}
          style={{ width: 144, height: 48, marginLeft: -9 }}
          contentFit="contain"
          accessibilityLabel="Sajawat24"
        />
        <NotificationBell unreadCount={unreadCount} tone="onPrimary" />
      </View>

      <View className="mt-4 flex-row items-center justify-between gap-3">
        <Text
          className="flex-1 text-2xl font-semibold text-primary-foreground"
          numberOfLines={1}>
          {`Hi, ${firstName}`}
        </Text>
        <PartnerModeDropdown />
      </View>
    </View>
  );
}
