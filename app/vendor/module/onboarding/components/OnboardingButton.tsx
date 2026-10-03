import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { StyleProp, ViewStyle } from 'react-native';

/** Matches Tailwind `rounded-2xl` (1rem). Applied via style so corners work on native Pressable. */
export const ONBOARDING_BUTTON_RADIUS = 16;

const radiusStyle: ViewStyle = { borderRadius: ONBOARDING_BUTTON_RADIUS };

/** Primary CTA for welcome slides, login choice, register, OTP, etc. */
export function OnboardingButton({
  className,
  style,
  radius = 'soft',
  ...props
}: ButtonProps) {
  return (
    <Button
      radius={radius}
      className={cn('h-12 rounded-2xl', className)}
      style={[radiusStyle, style as StyleProp<ViewStyle>]}
      {...props}
    />
  );
}
