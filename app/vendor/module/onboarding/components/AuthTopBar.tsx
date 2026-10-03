import { Text } from '@/components/ui/text';
import { showAuthHelp } from '@/module/onboarding/lib/auth-nav';
import { Href, router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '@/components/ui/icon';

type AuthTopBarProps = {
  onBackPress?: () => void;
  backHref?: Href;
  onHelpPress?: () => void;
  trailingLabel?: string;
  onTrailingPress?: () => void;
  showBack?: boolean;
  showHelp?: boolean;
};

export function AuthTopBar({
  onBackPress,
  backHref,
  onHelpPress = showAuthHelp,
  trailingLabel,
  onTrailingPress,
  showBack = true,
  showHelp = true,
}: AuthTopBarProps) {
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
      {trailingLabel && onTrailingPress ? (
        <Pressable
          onPress={onTrailingPress}
          accessibilityRole="button"
          accessibilityLabel={trailingLabel}
          hitSlop={8}
          style={({ pressed }) => [styles.helpButton, pressed && styles.pressed]}>
          <Text style={styles.helpText}>{trailingLabel}</Text>
        </Pressable>
      ) : showHelp ? (
        <Pressable
          onPress={onHelpPress}
          accessibilityRole="button"
          accessibilityLabel="Help"
          hitSlop={8}
          style={({ pressed }) => [styles.helpButton, pressed && styles.pressed]}>
          <Text style={styles.helpText}>Help</Text>
        </Pressable>
      ) : (
        <View style={styles.trailingPlaceholder} />
      )}
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
    minWidth: 72,
  },
  helpButton: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 197, 24, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181B',
  },
  pressed: {
    opacity: 0.75,
  },
});
