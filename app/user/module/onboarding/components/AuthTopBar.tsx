import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Href, router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

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
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Icon as={ArrowLeft} className="text-foreground size-5" />
        </Pressable>
      ) : (
        <View style={styles.iconButton} />
      )}
      <View style={styles.trailingPlaceholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trailingPlaceholder: {
    height: 40,
    minWidth: 40,
  },
  pressed: {
    opacity: 0.75,
  },
});
