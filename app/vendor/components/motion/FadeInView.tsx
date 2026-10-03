import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import Animated, { FadeInDown, ReduceMotion, SlideInDown } from 'react-native-reanimated';

type FadeInViewProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
};

export function FadeInView({ children, className, delay = 0, duration = 300 }: FadeInViewProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay)
        .duration(duration)
        .springify()
        .reduceMotion(ReduceMotion.System)}
      className={cn(className)}>
      {children}
    </Animated.View>
  );
}

type SlideInBottomProps = {
  children: ReactNode;
  className?: string;
};

export function SlideInBottom({ children, className }: SlideInBottomProps) {
  return (
    <Animated.View
      entering={SlideInDown.duration(280).springify().reduceMotion(ReduceMotion.System)}
      className={cn(className)}>
      {children}
    </Animated.View>
  );
}
