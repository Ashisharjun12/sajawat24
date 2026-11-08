import { Screen, TabScreenTitle } from '@/components/shell';
import { requestNotificationPermission } from '@/lib/notifications';
import { syncPushRegistration } from '@/lib/push-registration';
import { ProfileHeaderCard } from '@/module/account/components/ProfileHeaderCard';
import {
  ProfileMenuCard,
  ProfileMenuCardRow,
  ProfileMenuCardToggleRow,
} from '@/module/account/components/ProfileMenuCard';
import { ProfileQuickActions } from '@/module/account/components/ProfileQuickActions';
import { PROFILE_MENU_SECTIONS } from '@/module/account/lib/profile-menu';
import { LEGAL_PAGES, legalPageHref } from '@/module/account/lib/legal-pages';
import { Text } from '@/components/ui/text';
import Constants from 'expo-constants';
import { useCurrentUserQuery } from '@/module/account/hooks/use-current-user-query';
import { AppearanceSheet } from '@/module/settings/components/AppearanceSheet';
import { useAppTheme } from '@/module/settings/hooks/use-app-theme';
import { useNotificationPermissionStatus } from '@/module/permissions/hooks/use-notification-permission-status';
import { useAuthStore } from '@/store/auth.store';
import { Href, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

/**
 * Account tab: account card → 2 × 2 shortcuts (orders, wishlist, chat, addresses)
 * → grouped white cards (your account, preferences, support, more).
 */
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
        title="My Account"
        showBack
        onBack={() => router.navigate('/(app)/' as Href)}
        backAccessibilityLabel="Back to home"
        insetFromParentGutter
      />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 pb-28 pt-4"
        showsVerticalScrollIndicator={false}>
        <View className="gap-3">
          <ProfileHeaderCard />
          <ProfileQuickActions />
        </View>

        {PROFILE_MENU_SECTIONS.map((section) => (
          <ProfileMenuCard key={section.id} title={section.title}>
            {section.items.map((item, index) => {
              const isLast = index === section.items.length - 1;
              const key = `${section.id}-${item.id}`;

              if (item.type === 'notification-toggle') {
                return (
                  <ProfileMenuCardToggleRow
                    key={key}
                    label={item.label}
                    icon={item.icon}
                    value={notificationsOn}
                    onValueChange={(next) => void onNotificationToggle(next)}
                    isLast={isLast}
                  />
                );
              }
              if (item.type === 'route') {
                return (
                  <ProfileMenuCardRow
                    key={key}
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
                  <ProfileMenuCardRow
                    key={key}
                    label={item.label}
                    subtitle={themeLabel}
                    icon={item.icon}
                    isLast={isLast}
                    onPress={() => setAppearanceOpen(true)}
                  />
                );
              }
              return null;
            })}
          </ProfileMenuCard>
        ))}

        {/* Legal links (CMS pages) + app version, at the very bottom. */}
        <View className="items-center gap-2 pt-2">
          <View className="flex-row flex-wrap items-center justify-center gap-x-1 gap-y-1">
            {LEGAL_PAGES.map((page, index) => (
              <View key={page.id} className="flex-row items-center gap-x-1">
                {index > 0 ? (
                  <Text className="text-muted-foreground/60 text-xs" accessibilityElementsHidden>
                    ·
                  </Text>
                ) : null}
                <Pressable
                  onPress={() => router.push(legalPageHref(page.id))}
                  hitSlop={8}
                  accessibilityRole="link"
                  accessibilityLabel={page.label}>
                  <Text className="text-muted-foreground text-xs font-medium underline">
                    {page.label}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
          <Text className="text-muted-foreground/70 text-[11px]">Version {APP_VERSION}</Text>
        </View>
      </ScrollView>
      <AppearanceSheet visible={appearanceOpen} onClose={() => setAppearanceOpen(false)} />
    </Screen>
  );
}
