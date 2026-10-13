import { Screen, TabScreenTitle } from '@/components/shell';
import { WhatsAppIcon } from '@/components/shell/WhatsAppIcon';
import { requestNotificationPermission } from '@/lib/notifications';
import { syncPushRegistration } from '@/lib/push-registration';
import { openWhatsAppSupport } from '@/lib/support-actions';
import { ProfileHeaderCard } from '@/module/account/components/ProfileHeaderCard';
import { ProfileMenuRow } from '@/module/account/components/ProfileMenuRow';
import { ProfileSettingsGroup } from '@/module/account/components/ProfileSettingsGroup';
import { ProfileToggleRow } from '@/module/account/components/ProfileToggleRow';
import {
  PROFILE_MENU_SECTIONS,
  type ProfileMenuItem,
} from '@/module/account/lib/profile-menu';
import { useCurrentUserQuery } from '@/module/account/hooks/use-current-user-query';
import { AppearanceSheet } from '@/module/settings/components/AppearanceSheet';
import { useAppTheme } from '@/module/settings/hooks/use-app-theme';
import { useNotificationPermissionStatus } from '@/module/permissions/hooks/use-notification-permission-status';
import { useAuthStore } from '@/store/auth.store';
import { Href, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';

function renderMenuItem(
  item: ProfileMenuItem,
  isLast: boolean,
  itemKey: string,
  options: {
    appearanceSubtitle?: string;
    onAppearancePress?: () => void;
  },
) {
  if (item.type === 'notification-toggle') {
    return null;
  }
  if (item.type === 'route') {
    return (
      <ProfileMenuRow
        key={itemKey}
        label={item.label}
        subtitle={item.subtitle}
        icon={item.icon}
        isLast={isLast}
        onPress={() => router.push(item.href)}
      />
    );
  }
  if (item.id === 'appearance') {
    return (
      <ProfileMenuRow
        key={itemKey}
        label={item.label}
        subtitle={options.appearanceSubtitle}
        icon={item.icon}
        isLast={isLast}
        onPress={() => options.onAppearancePress?.()}
      />
    );
  }
  return (
    <ProfileMenuRow
      key={itemKey}
      label={item.label}
      subtitle={item.subtitle}
      isLast={isLast}
      iconSlot={<WhatsAppIcon size={18} color="#25D366" />}
      onPress={() => void openWhatsAppSupport()}
    />
  );
}

export function ProfileTabScreen() {
  useCurrentUserQuery();
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { notificationStatus, refresh } = useNotificationPermissionStatus();
  const notificationsOn = notificationStatus === 'granted';
  const { themeLabel } = useAppTheme();
  const [appearanceOpen, setAppearanceOpen] = useState(false);

  const onNotificationToggle = useCallback(
    async (next: boolean) => {
      if (next) {
        await requestNotificationPermission();
        await syncPushRegistration(accessToken, userId);
        await refresh();
        return;
      }
      if (notificationStatus === 'granted') {
        await Linking.openSettings();
      }
      await refresh();
    },
    [notificationStatus, refresh, accessToken, userId],
  );

  return (
    <Screen scroll={false} edges={['top', 'left', 'right']} gutter contentClassName="flex-1">
      <TabScreenTitle
        title="Profile"
        showBack
        onBack={() => router.navigate('/(app)/' as Href)}
        backAccessibilityLabel="Back to home"
        insetFromParentGutter
      />
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-28 pt-3"
        showsVerticalScrollIndicator={false}>
        <ProfileHeaderCard />

        <View className="mt-8 gap-7">
          {PROFILE_MENU_SECTIONS.map((section) => (
            <ProfileSettingsGroup key={section.id} title={section.title}>
              {section.items.map((item, index) => {
                const isLast = index === section.items.length - 1;
                const itemKey = `${section.id}-${item.id}`;
                if (item.type === 'notification-toggle') {
                  return (
                    <ProfileToggleRow
                      key={itemKey}
                      label={item.label}
                      icon={item.icon}
                      value={notificationsOn}
                      onValueChange={(next) => void onNotificationToggle(next)}
                      isLast={isLast}
                    />
                  );
                }
                return renderMenuItem(item, isLast, itemKey, {
                  appearanceSubtitle: themeLabel,
                  onAppearancePress: () => setAppearanceOpen(true),
                });
              })}
            </ProfileSettingsGroup>
          ))}
        </View>

      </ScrollView>
      <AppearanceSheet visible={appearanceOpen} onClose={() => setAppearanceOpen(false)} />
    </Screen>
  );
}
