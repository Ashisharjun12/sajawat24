import { Icon } from '@/components/ui/icon';
import { lightImpact } from '@/lib/light-haptic';
import { goBackOneScreen, type GoBackOptions } from '@/lib/navigate-back';
import { cn } from '@/lib/utils';
import type { Href } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable } from 'react-native';

type ScreenBackButtonProps = {
  onPress?: () => void;
  fallbackHref?: Href;
  orHome?: boolean;
  accessibilityLabel?: string;
  className?: string;
  iconClassName?: string;
};

export function ScreenBackButton({
  onPress,
  fallbackHref,
  orHome = false,
  accessibilityLabel = 'Go back',
  className,
  iconClassName = 'text-foreground size-5',
}: ScreenBackButtonProps) {
  function handlePress() {
    lightImpact();
    if (onPress) {
      onPress();
      return;
    }
    const options: GoBackOptions = { fallbackHref, orHome };
    goBackOneScreen(options);
  }

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className={cn(
        'size-10 items-center justify-center rounded-full bg-muted/80 active:bg-muted',
        className,
      )}>
      <Icon as={ArrowLeft} className={iconClassName} />
    </Pressable>
  );
}
