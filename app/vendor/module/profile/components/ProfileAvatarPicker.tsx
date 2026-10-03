import { PressableScale } from '@/components/motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { getProfileInitials } from '@/module/profile/lib/profile-format';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import { Alert, View } from 'react-native';

type ProfileAvatarPickerProps = {
  name: string;
  avatarUrl?: string | null;
  localUri?: string | null;
  onChange: (uri: string | null) => void;
};

export function ProfileAvatarPicker({
  name,
  avatarUrl,
  localUri,
  onChange,
}: ProfileAvatarPickerProps) {
  const previewUri = localUri ?? avatarUrl ?? null;
  const initials = getProfileInitials(name);

  async function handlePick() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to update your profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      onChange(result.assets[0].uri);
    }
  }

  return (
    <View className="items-center gap-2 py-2">
      <PressableScale onPress={() => void handlePick()} scaleTo={0.97}>
        <View className="rounded-full border-2 border-border/60 p-0.5">
          <Avatar className="size-24" alt={name}>
            {previewUri ? <AvatarImage source={{ uri: previewUri }} /> : null}
            <AvatarFallback className="bg-primary/15">
              <Text className="text-primary text-2xl font-semibold">{initials}</Text>
            </AvatarFallback>
          </Avatar>
        </View>
      </PressableScale>
      <PressableScale onPress={() => void handlePick()} scaleTo={0.97}>
        <View className="flex-row items-center gap-1.5">
          <Icon as={Camera} className="text-primary size-4" />
          <Text className="text-primary text-sm font-medium">Change photo</Text>
        </View>
      </PressableScale>
    </View>
  );
}
