import { AppSpinner } from '@/components/ui/app-spinner';
import { Text } from '@/components/ui/text';
import { StyleSheet, View } from 'react-native';

type AuthBlockingOverlayProps = {
  visible: boolean;
  message?: string;
};

export function AuthBlockingOverlay({
  visible,
  message = 'Loading…',
}: AuthBlockingOverlayProps) {
  if (!visible) return null;

  return (
    <View
      style={StyleSheet.absoluteFill}
      className="z-50 items-center justify-center bg-background/95 px-8"
      accessibilityViewIsModal
      accessibilityLabel={message}
      pointerEvents="auto">
      <View className="w-full max-w-xs items-center justify-center">
        <AppSpinner size="lg" />
        <Text
          className="text-foreground mt-5 w-full text-center text-lg font-semibold"
          style={{ textAlign: 'center' }}>
          {message}
        </Text>
      </View>
    </View>
  );
}
