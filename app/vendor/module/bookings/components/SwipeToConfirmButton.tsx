import { triggerHaptic } from '@/components/motion/haptics';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import * as Haptics from 'expo-haptics';
import { ChevronRight } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { AppSpinner } from '@/components/ui/app-spinner';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const THUMB_SIZE = 52;
const TRACK_HEIGHT = 56;
const THUMB_INSET = 2;
const COMPLETE_THRESHOLD = 0.85;
const SPRING_CONFIG = { damping: 20, stiffness: 320 };

type SwipeVariant = 'accept' | 'decline';

const variantStyles: Record<
  SwipeVariant,
  {
    track: string;
    fill: string;
    icon: string;
    spinner: string;
  }
> = {
  accept: {
    track: 'bg-emerald-600/35',
    fill: 'bg-emerald-600',
    icon: 'text-emerald-600',
    spinner: '#059669',
  },
  decline: {
    track: 'bg-destructive/25',
    fill: 'bg-destructive',
    icon: 'text-destructive',
    spinner: '#DC2626',
  },
};

type SwipeToConfirmButtonProps = {
  variant?: SwipeVariant;
  label?: string;
  loadingLabel?: string;
  onConfirm: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
};

export function SwipeToConfirmButton({
  variant = 'accept',
  label,
  loadingLabel,
  onConfirm,
  disabled = false,
  loading = false,
  className,
}: SwipeToConfirmButtonProps) {
  const styles = variantStyles[variant];
  const defaultLabel =
    variant === 'accept' ? 'Swipe to accept booking' : 'Swipe to decline booking';
  const defaultLoadingLabel = variant === 'accept' ? 'Accepting…' : 'Declining…';

  const [trackWidth, setTrackWidth] = useState(0);
  const translateX = useSharedValue(0);
  const maxTranslate = useSharedValue(0);
  const isLocked = useSharedValue(false);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      setTrackWidth(width);
      maxTranslate.value = Math.max(0, width - THUMB_SIZE - THUMB_INSET * 2);
    },
    [maxTranslate],
  );

  const completeConfirm = useCallback(() => {
    triggerHaptic(
      variant === 'accept'
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Heavy,
    );
    onConfirm();
  }, [onConfirm, variant]);

  useEffect(() => {
    if (!loading) {
      isLocked.value = false;
      translateX.value = withSpring(0, SPRING_CONFIG);
    }
  }, [loading, isLocked, translateX]);

  const pan = Gesture.Pan()
    .enabled(!disabled && !loading && trackWidth > 0)
    .activeOffsetX(8)
    .failOffsetY([-12, 12])
    .onUpdate((event) => {
      if (isLocked.value) return;
      const limit = maxTranslate.value;
      translateX.value = Math.min(Math.max(0, event.translationX), limit);
    })
    .onEnd(() => {
      if (isLocked.value) return;
      const limit = maxTranslate.value;
      if (limit <= 0) {
        translateX.value = withSpring(0, SPRING_CONFIG);
        return;
      }
      if (translateX.value >= limit * COMPLETE_THRESHOLD) {
        isLocked.value = true;
        translateX.value = withTiming(limit, { duration: 140 });
        runOnJS(completeConfirm)();
        return;
      }
      translateX.value = withSpring(0, SPRING_CONFIG);
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: translateX.value + THUMB_SIZE + THUMB_INSET,
  }));

  const isInteractive = !disabled && !loading;

  return (
    <View className={cn('w-full', className)} onLayout={onLayout}>
      <GestureDetector gesture={pan}>
        <Animated.View
          className={cn(
            'relative overflow-hidden rounded-full',
            styles.track,
            !isInteractive && 'opacity-60',
          )}
          style={{ height: TRACK_HEIGHT }}>
          <Animated.View
            className={cn('absolute bottom-0 left-0 top-0 rounded-full', styles.fill)}
            style={fillStyle}
          />

          <View className="absolute inset-0 items-center justify-center px-14" pointerEvents="none">
            <Text className="text-center text-sm font-semibold text-white" numberOfLines={1}>
              {loading ? (loadingLabel ?? defaultLoadingLabel) : (label ?? defaultLabel)}
            </Text>
          </View>

          <Animated.View
            className="absolute items-center justify-center rounded-full bg-white shadow-md shadow-black/15"
            style={[
              {
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                top: THUMB_INSET,
                left: THUMB_INSET,
              },
              thumbStyle,
            ]}>
            {loading ? (
              <AppSpinner size="sm" variant="inverse" />
            ) : (
              <Icon as={ChevronRight} className={cn('size-6', styles.icon)} />
            )}
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

type SwipeToAcceptButtonProps = Omit<SwipeToConfirmButtonProps, 'variant' | 'onConfirm'> & {
  onAccept: () => void;
};

export function SwipeToAcceptButton({ onAccept, ...props }: SwipeToAcceptButtonProps) {
  return <SwipeToConfirmButton variant="accept" onConfirm={onAccept} {...props} />;
}
