import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const SPRING_CONFIG = { damping: 15, stiffness: 400 };

type PressableScaleProps = Omit<PressableProps, 'children'> & {
  children: ReactNode;
  /** Styles the animated surface (background, padding, radius) — these scale on press. */
  className?: string;
  /**
   * Styles the outer touchable. Layout classes such as `flex-1` belong here,
   * since the outer element is what the parent flex container measures.
   */
  containerClassName?: string;
  scaleTo?: number;
};

export function PressableScale({
  children,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  className,
  containerClassName,
  scaleTo = 0.97,
  ...props
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      className={cn(containerClassName)}
      disabled={disabled}
      onPress={onPress}
      onPressIn={(event) => {
        if (!disabled) {
          scale.value = withSpring(scaleTo, SPRING_CONFIG);
        }
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, SPRING_CONFIG);
        onPressOut?.(event);
      }}
      {...props}>
      <Animated.View className={cn(className)} style={animatedStyle}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
