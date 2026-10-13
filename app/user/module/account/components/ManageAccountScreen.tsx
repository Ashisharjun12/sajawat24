import { deleteAccount } from '@/api/account.api';
import { getApiError } from '@/api/client';
import { queryClient } from '@/lib/query-client';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { AccountSubScreen } from '@/module/account/components/AccountSubScreen';
import { DeleteAccountConfirmSheet } from '@/module/account/components/DeleteAccountConfirmSheet';
import { LogoutConfirmSheet } from '@/module/account/components/LogoutConfirmSheet';
import { ProfileMenuRow } from '@/module/account/components/ProfileMenuRow';
import { ProfileSettingsGroup } from '@/module/account/components/ProfileSettingsGroup';
import { useProfileSignOut } from '@/module/account/hooks/use-profile-sign-out';
import { LogOut, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

export function ManageAccountScreen() {
  const { loggingOut, performSignOut } = useProfileSignOut();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function onConfirmDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteAccount();
      setDeleteOpen(false);
      queryClient.clear();
      await performSignOut();
    } catch (err) {
      Alert.alert('Could not delete account', getApiError(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AccountSubScreen title="Manage account">
      <ProfileSettingsGroup>
        <Pressable
          onPress={() => setDeleteOpen(true)}
          className="flex-row items-center gap-3.5 rounded-2xl py-3.5 active:bg-muted/50"
          accessibilityRole="button"
          accessibilityLabel="Delete your account">
          <View className="size-10 items-center justify-center rounded-xl bg-destructive/10">
            <Icon as={Trash2} className="text-destructive size-[19px]" />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-destructive text-[17px] font-medium leading-snug">
              Delete your account
            </Text>
          </View>
        </Pressable>
        <ProfileMenuRow
          label="Log out"
          icon={LogOut}
          isLast
          onPress={() => setLogoutOpen(true)}
        />
      </ProfileSettingsGroup>

      <DeleteAccountConfirmSheet
        visible={deleteOpen}
        loading={deleting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void onConfirmDelete()}
      />

      <LogoutConfirmSheet
        visible={logoutOpen}
        loading={loggingOut}
        onClose={() => setLogoutOpen(false)}
        onConfirm={() => void performSignOut()}
      />
    </AccountSubScreen>
  );
}
