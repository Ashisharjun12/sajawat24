import { SCOOTER_ASPECT, ScooterIcon } from '@/components/ui/scooter-icon';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type AnimatedScooterProps = {
  width?: number;
  color?: string;
};

/** Pause while parked, then the ride out / ride back in. */
const PARKED_MS = 1400;
const RIDE_MS = 520;

/**
 * Delivery scooter that rides out of its box to the right, re-enters from the left
 * and parks — looping. Wheels bob slightly while riding. Static when Reduce Motion is on.
 */
export function AnimatedScooter({ width = 22, color = '#15803D' }: AnimatedScooterProps) {
  const height = width * SCOOTER_ASPECT;
  const reduceMotion = useReducedMotion();
  const x = useSharedValue(0);
  const bob = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    // Travel a bit more than the icon width so it fully leaves the clipped box.
    const out = width + 4;
    x.value = withRepeat(
      withSequence(
        withDelay(PARKED_MS, withTiming(out, { duration: RIDE_MS, easing: Easing.in(Easing.quad) })),
        withTiming(-out, { duration: 0 }),
        withTiming(0, { duration: RIDE_MS, easing: Easing.out(Easing.quad) }),
      ),
      -1,
    );
    bob.value = withRepeat(
      withSequence(
        withTiming(-0.8, { duration: 140, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 140, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
    return () => {
      cancelAnimation(x);
      cancelAnimation(bob);
    };
  }, [reduceMotion, width, x, bob]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: bob.value }],
  }));

  return (
    <View style={{ width, height, overflow: 'hidden' }} accessibilityElementsHidden>
      <Animated.View style={style}>
        <ScooterIcon width={width} color={color} />
      </Animated.View>
    </View>
  );
}
