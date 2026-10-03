import { lightImpact } from '@/lib/light-haptic';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ScalePressableProps = Omit<PressableProps, 'style'> & {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** Press scale (default 0.97). Set to 1 to disable scale. */
  pressScale?: number;
  haptic?: boolean;
};

const SPRING = { damping: 16, stiffness: 380 };

export function ScalePressable({
  children,
  className,
  style,
  pressScale = 0.97,
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
          scale.value = withSpring(pressScale, SPRING);
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        if (pressScale !== 1) {
          scale.value = withSpring(1, SPRING);
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
