import { motion } from '@/lib/design-tokens';
import { lightImpact } from '@/lib/light-haptic';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ScalePressableProps = Omit<PressableProps, 'style'> & {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** Press scale (default 0.98). Set to 1 to disable scale. */
  pressScale?: number;
  haptic?: boolean;
};

const PRESS_TIMING = { duration: motion.press, easing: Easing.out(Easing.quad) };

export function ScalePressable({
  children,
  className,
  style,
  pressScale = motion.pressScale,
  haptic = false,
  onPress,
  onPressIn,
  onPressOut,
  ...rest
}: ScalePressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      className={cn(className)}
      style={[animatedStyle, style]}
      onPressIn={(event) => {
        if (pressScale !== 1) {
          scale.value = withTiming(pressScale, PRESS_TIMING);
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        if (pressScale !== 1) {
          scale.value = withTiming(1, PRESS_TIMING);
        }
        onPressOut?.(event);
      }}
      onPress={(event) => {
        if (haptic) lightImpact();
        onPress?.(event);
      }}>
      {children}
    </AnimatedPressable>
  );
}
