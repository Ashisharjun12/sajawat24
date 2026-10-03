import { Screen } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { ProfileHeaderRow } from '@/module/profile/components/ProfileHeaderRow';
import { ProfileSettingsSection } from '@/module/profile/components/ProfileSettingsSection';
import { SwitchPartnerModeSheet } from '@/module/profile/components/SwitchPartnerModeSheet';
import { useAppTheme } from '@/module/settings/hooks/use-app-theme';
import { useAuthStore } from '@/store/auth.store';
import { selectIsFieldShell, usePartnerModeStore } from '@/store/partner-mode.store';
import { router } from 'expo-router';
import {
  Bell,
  CreditCard,
  HelpCircle,
  Palette,
  Shield,
  User,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const vendor = user?.vendor;
  const signOut = useAuthStore((s) => s.signOut);
  const partnerMode = usePartnerModeStore((s) => s.mode);
  const setPartnerMode = usePartnerModeStore((s) => s.setMode);
  const isFieldShell = selectIsFieldShell(partnerMode, user);
  const canSwitchMode = user?.capabilities?.canSwitchToFieldMode;
  const { themeLabel } = useAppTheme();
  const [modeSwitchOpen, setModeSwitchOpen] = useState(false);
  const [modeSwitchLoading, setModeSwitchLoading] = useState(false);

  const displayName = user?.name ?? 'Partner';
  const modeSwitchTarget = isFieldShell ? 'owner' : 'field';

  function handleSignOut() {
    void signOut().then(() => router.replace('/'));
  }

  function showComingSoon(feature: string) {
    Alert.alert(feature, 'This will be available in a future update.');
  }

  function openModeSwitchSheet() {
    setModeSwitchOpen(true);
  }

  async function handleConfirmModeSwitch() {
    setModeSwitchLoading(true);
    try {
      await setPartnerMode(modeSwitchTarget);
      setModeSwitchOpen(false);
    } finally {
      setModeSwitchLoading(false);
    }
  }

  const settingsItems = [
    ...(canSwitchMode
      ? [
          {
            id: 'worker-mode',
            label: isFieldShell ? 'Switch to owner mode' : 'Switch to worker mode',
            icon: Wrench,
            onPress: openModeSwitchSheet,
          },
        ]
      : []),
    ...(user?.capabilities?.isShopOwner && !isFieldShell
      ? [
          {
            id: 'team',
            label: 'Team',
            icon: Users,
            onPress: () => router.push('/(app)/team'),
          },
        ]
      : []),
    {
      id: 'personal',
      label: 'Personal information',
      icon: User,
      onPress: () => router.push('/(app)/edit-profile'),
    },
    {
      id: 'permissions',
      label: 'App permissions',
      icon: Shield,
      onPress: () => router.push('/(app)/app-permissions'),
    },
    {
      id: 'theme',
      label: 'App theme',
      icon: Palette,
      value: themeLabel,
      onPress: () => router.push('/(app)/app-theme'),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      onPress: () => router.push('/(app)/notifications'),
    },
    ...(!isFieldShell
      ? [
          {
            id: 'wallet',
            label: 'Payments & payouts',
            icon: Wallet,
            onPress: () => router.push('/(app)/payouts'),
          },
        ]
      : []),
    {
      id: 'bank',
      label: 'Bank details',
      icon: CreditCard,
      onPress: () => showComingSoon('Bank details'),
    },
    {
      id: 'support',
      label: 'Help & support',
      icon: HelpCircle,
      onPress: () => router.push('/(app)/help-support'),
    },
  ];

  return (
    <>
      <Screen>
        <View className="gap-5 px-1">
          <Text className="text-foreground text-2xl font-bold">Profile</Text>

          <ProfileHeaderRow
            name={displayName}
            avatarUrl={user?.avatar ?? null}
            cityName={vendor?.cityName}
            state={vendor?.state}
            onPress={() => router.push('/(app)/edit-profile')}
          />

          <ProfileSettingsSection items={settingsItems} />

          <Pressable onPress={handleSignOut} className="py-3">
            <Text className="text-center text-base font-medium text-destructive">Sign out</Text>
          </Pressable>
        </View>
      </Screen>

      <SwitchPartnerModeSheet
        open={modeSwitchOpen}
        targetMode={modeSwitchTarget}
        loading={modeSwitchLoading}
        onClose={() => {
          if (!modeSwitchLoading) setModeSwitchOpen(false);
        }}
        onConfirm={() => {
          void handleConfirmModeSwitch();
        }}
      />
    </>
  );
}
