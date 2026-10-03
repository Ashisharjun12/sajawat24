import { Button, type ButtonProps } from '@/components/ui/button';
import { PRIMARY_CTA_BUTTON_CLASS } from '@/lib/primary-cta-button';
import { cn } from '@/lib/utils';

export function OnboardingButton({ className, ...props }: ButtonProps) {
  return <Button className={cn(PRIMARY_CTA_BUTTON_CLASS, className)} {...props} />;
}
