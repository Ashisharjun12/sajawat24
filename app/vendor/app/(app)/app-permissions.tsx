import { PressableScale } from '@/components/motion';
import { Screen } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { AppPermissionsPanel } from '@/module/permissions/components/AppPermissionsPanel';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { View } from 'react-native';

export default function AppPermissionsScreen() {
  return (
    <Screen>
      <View className="gap-5 px-1">
        <View className="flex-row items-center gap-3">
          <PressableScale
            onPress={() => router.back()}
            className="-ml-1"
            accessibilityLabel="Go back"
            scaleTo={0.92}>
            <View className="size-10 items-center justify-center">
              <Icon as={ArrowLeft} className="text-foreground size-5" />
            </View>
          </PressableScale>
          <Text className="text-foreground text-2xl font-bold">App permissions</Text>
        </View>

        <Text className="text-muted-foreground text-sm">
          Manage access for notifications and location while you work.
        </Text>

        <AppPermissionsPanel />
      </View>
    </Screen>
  );
}
