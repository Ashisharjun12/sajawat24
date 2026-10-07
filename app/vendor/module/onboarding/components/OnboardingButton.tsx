import { Button, type ButtonProps } from '@/components/ui/button';
import { PRIMARY_CTA_BUTTON_CLASS } from '@/lib/primary-cta-button';
import { cn } from '@/lib/utils';

/** Primary CTA for welcome slides, login choice, register, OTP, etc. */
export function OnboardingButton({ className, variant, ...props }: ButtonProps) {
  const isSecondary = variant === 'outline';
  return (
    <Button
      variant={isSecondary ? 'outline' : 'primary'}
      className={cn(PRIMARY_CTA_BUTTON_CLASS, className)}
      {...props}
    />
  );
}
