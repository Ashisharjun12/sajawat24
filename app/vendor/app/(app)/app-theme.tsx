import { PressableScale } from '@/components/motion';
import { Screen } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { AppThemeOptions } from '@/module/settings/components/AppThemeOptions';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { View } from 'react-native';

export default function AppThemeScreen() {
  return (
    <Screen>
      <View className="flex-row items-center gap-3 px-1 pb-2">
        <PressableScale
          onPress={() => router.back()}
          className="-ml-1"
          accessibilityLabel="Go back"
          scaleTo={0.92}>
          <View className="size-10 items-center justify-center">
            <Icon as={ArrowLeft} className="text-foreground size-5" />
          </View>
        </PressableScale>
        <Text className="text-foreground text-2xl font-bold">App theme</Text>
      </View>

      <Text className="text-muted-foreground mb-4 px-1 text-sm">
        Choose how Decoryy Partner looks on your device.
      </Text>

      <AppThemeOptions />
    </Screen>
  );
}
