import { PressableScale } from '@/components/motion';
import { Screen } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { EditProfileForm } from '@/module/profile/components/EditProfileForm';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { View } from 'react-native';

export default function EditProfileScreen() {
  return (
    <Screen>
      <View className="flex-row items-center gap-3 pb-2">
        <PressableScale
          onPress={() => router.back()}
          className="-ml-1"
          accessibilityLabel="Go back"
          scaleTo={0.92}>
          <View className="size-10 items-center justify-center">
            <Icon as={ArrowLeft} className="text-foreground size-5" />
          </View>
        </PressableScale>
        <Text className="text-foreground text-2xl font-bold">Edit profile</Text>
      </View>

      <EditProfileForm />
    </Screen>
  );
}
