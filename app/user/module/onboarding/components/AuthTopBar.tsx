import { Icon } from '@/components/ui/icon';
import { Href, router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

type AuthTopBarProps = {
  onBackPress?: () => void;
  backHref?: Href;
  showBack?: boolean;
};

export function AuthTopBar({ onBackPress, backHref, showBack = true }: AuthTopBarProps) {
  function handleBack() {
    if (onBackPress) {
      onBackPress();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    if (backHref) {
      router.replace(backHref);
    }
  }

  return (
    <View className="flex-row items-center justify-between px-8 pb-2 pt-2">
      {showBack ? (
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          className="size-11 items-center justify-center rounded-pill border border-border bg-surface active:bg-primary-tint">
          <Icon as={ArrowLeft} className="text-foreground size-5" />
        </Pressable>
      ) : (
        <View className="size-11" />
      )}
      <View className="h-11 min-w-11" />
    </View>
  );
}
