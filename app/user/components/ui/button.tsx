import { AppSpinner } from '@/components/ui/app-spinner';
import { Icon } from '@/components/ui/icon';
import { TextClassContext } from '@/components/ui/text';
import { button as buttonToken, motion } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Zap } from 'lucide-react-native';
import * as React from 'react';
import { Platform, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const PRESS_TIMING = { duration: motion.press, easing: Easing.out(Easing.quad) };

const buttonVariants = cva(
  cn(
    'group shrink-0 flex-row items-center justify-center gap-2 rounded-btn shadow-none',
    Platform.select({
      web: "focus-visible:border-ring focus-visible:ring-ring/50 whitespace-nowrap outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-[18px] [&_svg]:pointer-events-none [&_svg]:shrink-0",
    })
  ),
  {
    variants: {
      variant: {
        /** Book Now / Pay — one per screen. */
        cta: cn('bg-cta active:bg-cta/90', Platform.select({ web: 'hover:bg-cta/90' })),
        /** `default` is the screen's main action, so it is the orange CTA. */
        default: cn('bg-cta active:bg-cta/90', Platform.select({ web: 'hover:bg-cta/90' })),
        /** Teal fill — nav-level and supporting actions. */
        primary: cn(
          'bg-primary active:bg-primary-dark',
          Platform.select({ web: 'hover:bg-primary-dark' })
        ),
        /** Surface + 1.5px primary border. */
        secondary: cn(
          'bg-surface border-primary border-[1.5px] active:bg-primary-tint',
          Platform.select({ web: 'hover:bg-primary-tint' })
        ),
        outline: cn(
          'bg-surface border-primary border-[1.5px] active:bg-primary-tint',
          Platform.select({ web: 'hover:bg-primary-tint' })
        ),
        /** Instant Service only. */
        instant: cn('bg-instant active:bg-instant/90', Platform.select({ web: 'hover:bg-instant/90' })),
        destructive: cn(
          'bg-destructive active:bg-destructive/90',
          Platform.select({ web: 'hover:bg-destructive/90' })
        ),
        /** See all / Skip — no fill. */
        text: 'bg-transparent',
        ghost: 'bg-transparent',
        link: 'bg-transparent',
      },
      size: {
        /** Large is the default. */
        default: 'h-12 px-5',
        lg: 'h-12 px-5',
        md: 'h-10 px-5',
        sm: 'h-8 px-4',
        icon: 'h-11 w-11 px-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva('text-center text-button font-semibold', {
  variants: {
    variant: {
      cta: 'text-cta-foreground',
      default: 'text-cta-foreground',
      primary: 'text-primary-foreground',
      secondary: 'text-primary',
      outline: 'text-primary',
      instant: 'text-instant-foreground',
      destructive: 'text-destructive-foreground',
      text: 'text-primary',
      ghost: 'text-primary',
      link: cn(
        'text-primary group-active:underline',
        Platform.select({ web: 'underline-offset-4 hover:underline group-hover:underline' })
      ),
    },
    size: {
      default: '',
      lg: '',
      md: '',
      sm: 'text-body',
      icon: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

const FILLED_VARIANTS = ['cta', 'default', 'primary', 'instant', 'destructive'] as const;

/** Spinner colour per variant, so it matches the label it replaces. */
const SPINNER_TONE: Record<string, string> = {
  cta: 'text-cta-foreground',
  default: 'text-cta-foreground',
  primary: 'text-primary-foreground',
  instant: 'text-instant-foreground',
  destructive: 'text-destructive-foreground',
};

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

type ButtonProps = React.ComponentProps<typeof Pressable> &
  React.RefAttributes<typeof Pressable> &
  ButtonVariantProps & {
    /** Swaps the label for a spinner while keeping the button's width. */
    loading?: boolean;
  };

function Button({
  className,
  variant = 'default',
  size = 'default',
  loading = false,
  disabled,
  children,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isFilled = FILLED_VARIANTS.includes(variant as (typeof FILLED_VARIANTS)[number]);
  const isDisabled = !!disabled || loading;
  // Flat disabled fill, never opacity.
  const disabledClass = isDisabled
    ? isFilled
      ? 'bg-disabled border-disabled'
      : 'border-disabled'
    : undefined;
  const disabledTextClass = isDisabled ? 'text-disabled-foreground' : undefined;

  return (
    <TextClassContext.Provider
      value={cn(buttonTextVariants({ variant, size }), disabledTextClass)}>
      <AnimatedPressable
        className={cn(buttonVariants({ variant, size }), disabledClass, className)}
        style={animatedStyle}
        role="button"
        disabled={isDisabled}
        // Touch target never drops below 44.
        hitSlop={size === 'sm' || size === 'md' ? 8 : undefined}
        android_ripple={
          isDisabled || !isFilled ? undefined : { color: 'rgba(0,0,0,0.12)', borderless: false }
        }
        onPressIn={(event) => {
          scale.value = withTiming(motion.pressScale, PRESS_TIMING);
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          scale.value = withTiming(1, PRESS_TIMING);
          onPressOut?.(event);
        }}
        {...props}>
        {variant === 'instant' && !loading ? (
          <Icon as={Zap} size={buttonToken.iconSize} className="text-instant-foreground" />
        ) : null}
        {loading ? (
          <>
            {/* Kept mounted so the button does not resize while loading. */}
            <View className="opacity-0">{children as React.ReactNode}</View>
            <View className="absolute inset-0 items-center justify-center">
              <AppSpinner size="sm" iconClassName={SPINNER_TONE[variant ?? 'default'] ?? 'text-primary'} />
            </View>
          </>
        ) : (
          (children as React.ReactNode)
        )}
      </AnimatedPressable>
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
