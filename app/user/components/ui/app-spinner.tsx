import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const SPIN_MS = 850;

const sizeMap = {
  sm: { box: 20, icon: 'size-4' },
  md: { box: 28, icon: 'size-5' },
  lg: { box: 36, icon: 'size-7' },
} as const;

type AppSpinnerProps = {
  size?: keyof typeof sizeMap;
  variant?: 'default' | 'inverse';
  className?: string;
  /** Overrides the spinner colour, e.g. `text-cta-foreground` on an orange CTA. */
  iconClassName?: string;
};

export function AppSpinner({
  size = 'md',
  variant = 'default',
  className,
  iconClassName,
}: AppSpinnerProps) {
  const rotation = useSharedValue(0);
  const dims = sizeMap[size];

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: SPIN_MS, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View
      className={cn('items-center justify-center', className)}
      style={{ width: dims.box, height: dims.box }}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading">
      <Animated.View style={spinStyle}>
        <Icon
          as={Loader2}
          className={cn(
            dims.icon,
            variant === 'inverse' ? 'text-primary-foreground' : 'text-primary',
            iconClassName,
          )}
        />
      </Animated.View>
    </View>
  );
}
