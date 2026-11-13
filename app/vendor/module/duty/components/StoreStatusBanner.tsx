import { useVendorDuty } from '@/module/duty/hooks/use-vendor-duty';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

export type StoreStatusBannerVariant = 'vendor' | 'worker';

// Both artworks are 1600x800 with a blank lit sign inside a bulb frame. `sign` places the label
// on that white panel as percentages of the banner, so it scales with screen width. Each image
// has its own `sign`; if an image is replaced with different art, adjust its `sign`.
type Percent = `${number}%`;

const BANNERS: Record<
  StoreStatusBannerVariant,
  { image: number; sign: { left: Percent; top: Percent; width: Percent; height: Percent } }
> = {
  // Store artwork: white sign interior is roughly x 105-670, y 430-535 of 1600x800.
  vendor: {
    image: require('../../../assets/images/img-vendor.jpeg'),
    sign: { left: '6.6%', top: '54%', width: '35%', height: '12.8%' },
  },
  // Event Setup Crew artwork: white sign interior is roughly x 85-645, y 465-585.
  worker: {
    image: require('../../../assets/images/img-user.jpeg'),
    sign: { left: '5.3%', top: '58.1%', width: '35%', height: '15%' },
  },
};

const NEON = {
  open: { label: 'STORE OPEN', color: '#00C853', glow: '#00E676' },
  closed: { label: 'STORE CLOSED', color: '#FF1744', glow: '#FF1744' },
} as const;

type StoreStatusBannerProps = {
  /** `vendor` shows img-vendor.jpeg (owner mode), `worker` shows img-user.jpeg (worker mode). */
  variant: StoreStatusBannerVariant;
  isOpen: boolean;
  className?: string;
};

/**
 * Banner with a neon STORE OPEN / STORE CLOSED label on the blank sign in the artwork.
 * The label pulses and floats continuously. STORE OPEN breathes; STORE CLOSED flickers.
 */
export function StoreStatusBanner({ variant, isOpen, className }: StoreStatusBannerProps) {
  const { image, sign } = BANNERS[variant];
  const [signSize, setSignSize] = useState({ width: 0, height: 0 });
  const glow = useSharedValue(1);
  const bounce = useSharedValue(0);

  // The label always moves, even when the system "reduce motion" setting is on, because this
  // banner is the store status indicator and is meant to stay animated.
  useEffect(() => {
    cancelAnimation(bounce);
    bounce.value = 0;
    bounce.value = withRepeat(
      withTiming(1, { duration: isOpen ? 900 : 650, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => cancelAnimation(bounce);
  }, [isOpen, bounce]);

  useEffect(() => {
    cancelAnimation(glow);
    glow.value = 1;

    if (isOpen) {
      glow.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
      );
    } else {
      // Faulty-tube flicker: steady, then a few quick dips.
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.2, { duration: 60 }),
          withTiming(1, { duration: 60 }),
          withTiming(0.35, { duration: 50 }),
          withTiming(1, { duration: 90 }),
          withTiming(1, { duration: 400 }),
        ),
        -1,
      );
    }

    return () => cancelAnimation(glow);
  }, [isOpen, glow]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + glow.value * 0.65,
    shadowOpacity: glow.value * 0.9,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + glow.value * 0.45,
    textShadowRadius: 4 + glow.value * 14,
  }));

  // Moves the whole label: gentle grow/shrink plus a small float up and down.
  const moveStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + bounce.value * 0.08 }, { translateY: -bounce.value * 2 }],
  }));

  const neon = isOpen ? NEON.open : NEON.closed;

  // Fit the label inside the sign: limited by sign height, and by width (about 0.72em per
  // capital letter including tracking), leaving room for the grow animation.
  const fontSize =
    signSize.width > 0
      ? Math.floor(Math.min(signSize.height * 0.6, (signSize.width * 0.84) / (neon.label.length * 0.72)))
      : 14;

  function handleSignLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setSignSize({ width, height });
  }

  return (
    <View
      className={className}
      style={styles.banner}
      accessible
      accessibilityRole="image"
      accessibilityLabel={isOpen ? 'Store is open' : 'Store is closed'}>
      <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" />

      <View style={[styles.sign, sign]} onLayout={handleSignLayout} pointerEvents="none">
        <Animated.View
          style={[
            styles.ring,
            {
              borderColor: neon.color,
              backgroundColor: `${neon.color}1A`,
              shadowColor: neon.glow,
            },
            ringStyle,
          ]}
        />
        <Animated.View style={moveStyle}>
          <Animated.Text
            key={neon.label}
            entering={ZoomIn.duration(260)}
            numberOfLines={1}
            allowFontScaling={false}
            style={[
              styles.label,
              {
                fontSize,
                letterSpacing: fontSize * 0.06,
                color: neon.color,
                textShadowColor: neon.glow,
              },
              textStyle,
            ]}>
            {neon.label}
          </Animated.Text>
        </Animated.View>
      </View>
    </View>
  );
}

type VendorStoreStatusBannerProps = {
  className?: string;
};

/** Owner-mode banner: follows the shop duty toggle and hides while the toggle is locked. */
export function VendorStoreStatusBanner({ className }: VendorStoreStatusBannerProps) {
  const { canToggle, isOnDuty } = useVendorDuty();
  if (!canToggle) return null;
  return <StoreStatusBanner variant="vendor" isOpen={isOnDuty} className={className} />;
}

const styles = StyleSheet.create({
  banner: {
    aspectRatio: 2,
    width: '100%',
    overflow: 'hidden',
    borderRadius: 24,
  },
  sign: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
  },
  label: {
    fontFamily: 'Poppins_600SemiBold',
    textShadowOffset: { width: 0, height: 0 },
  },
});
