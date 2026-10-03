import { LoadingPlaceholder, VendorTabBar } from '@/components/shell';
import { NAV_THEME } from '@/lib/theme';
import { AuthGate } from '@/module/auth/components/AuthGate';
import { EnRouteLocationController } from '@/module/bookings/components/EnRouteLocationController';
import { VendorDispatchPresenceController } from '@/module/duty/components/VendorDispatchPresenceController';
import { getAppAccessRedirect } from '@/module/auth/lib/auth-routing';
import { useAppSessionState } from '@/module/chat/hooks/use-app-session-state';
import { usePermissionsSetupPrompt } from '@/module/permissions/hooks/use-permissions-setup-prompt';
import { useAuthStore } from '@/store/auth.store';
import { selectIsFieldShell, usePartnerModeStore } from '@/store/partner-mode.store';
import { Redirect, Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { View } from 'react-native';

function AppTabs() {
  const { colorScheme } = useColorScheme();
  const theme = NAV_THEME[colorScheme ?? 'light'];
  const user = useAuthStore((s) => s.user);
  const partnerMode = usePartnerModeStore((s) => s.mode);
  const isFieldShell = selectIsFieldShell(partnerMode, user);
  const { pendingRoute, isLoading } = usePermissionsSetupPrompt();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <LoadingPlaceholder className="py-0" />
      </View>
    );
  }

  if (pendingRoute) {
    return <Redirect href={pendingRoute} />;
  }

  return (
    <Tabs
      tabBar={(props) => <VendorTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text + '80',
      }}>
      <Tabs.Screen name="index" options={{ title: isFieldShell ? 'Today' : 'Home' }} />
      <Tabs.Screen name="bookings" options={{ title: isFieldShell ? 'My jobs' : 'Bookings' }} />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          href: isFieldShell ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="payouts"
        options={{
          title: 'Wallet',
          href: isFieldShell ? null : undefined,
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="help-support" options={{ href: null }} />
      <Tabs.Screen name="support" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="enable-notifications" options={{ href: null }} />
      <Tabs.Screen name="enable-location" options={{ href: null }} />
      <Tabs.Screen name="app-permissions" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="app-theme" options={{ href: null }} />
      <Tabs.Screen name="bank-accounts" options={{ href: null }} />
      <Tabs.Screen name="add-bank-account" options={{ href: null }} />
      <Tabs.Screen name="upi-ids" options={{ href: null }} />
      <Tabs.Screen name="add-upi-id" options={{ href: null }} />
      <Tabs.Screen name="team" options={{ href: null }} />
    </Tabs>
  );
}

function AppSessionStateHost() {
  useAppSessionState();
  return null;
}

export default function AppLayout() {
  return (
    <AuthGate
      resolveRedirect={({ accessToken, user, hasSeenWelcome, platformAccessPaused }) =>
        getAppAccessRedirect(accessToken, user, hasSeenWelcome, platformAccessPaused)
      }>
      <AppSessionStateHost />
      <EnRouteLocationController />
      <VendorDispatchPresenceController />
      <AppTabs />
    </AuthGate>
  );
}
