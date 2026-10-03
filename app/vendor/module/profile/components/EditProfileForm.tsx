import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { ProfileAvatarPicker } from '@/module/profile/components/ProfileAvatarPicker';
import { formatProfilePhone } from '@/module/profile/lib/profile-format';
import { useUpdateVendorProfile } from '@/module/profile/hooks/use-update-vendor-profile';
import { useAuthStore } from '@/store/auth.store';
import { router } from 'expo-router';
import { useState } from 'react';
import { AppSpinner } from '@/components/ui/app-spinner';
import { Alert, View } from 'react-native';

export function EditProfileForm() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateVendorProfile();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);

  const phoneLabel = formatProfilePhone(user?.phone) ?? '—';
  const canSave = name.trim().length >= 2 && email.trim().includes('@');

  async function handleSave() {
    if (!canSave) return;

    try {
      await updateProfile.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        localAvatarUri,
      });
      router.back();
    } catch {
      Alert.alert('Could not save', 'Check your details and try again.');
    }
  }

  return (
    <View className="gap-5">
      <ProfileAvatarPicker
        name={name}
        avatarUrl={user?.avatar}
        localUri={localAvatarUri}
        onChange={setLocalAvatarUri}
      />

      <View className="gap-2">
        <Label nativeID="name">Name</Label>
        <Input
          nativeID="name"
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          autoCapitalize="words"
        />
      </View>

      <View className="gap-2">
        <Label nativeID="email">Email</Label>
        <Input
          nativeID="email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View className="gap-2">
        <Label nativeID="phone">Phone</Label>
        <Input nativeID="phone" value={phoneLabel} editable={false} className="opacity-70" />
        <Text className="text-muted-foreground text-xs">Phone number cannot be changed here.</Text>
      </View>

      <Button
        className="mt-2 rounded-full"
        disabled={!canSave || updateProfile.isPending}
        onPress={() => void handleSave()}>
        {updateProfile.isPending ? (
          <View className="flex-row items-center gap-2">
            <AppSpinner size="sm" variant="inverse" />
            <Text>Saving…</Text>
          </View>
        ) : (
          <Text>Save changes</Text>
        )}
      </Button>
    </View>
  );
}
