import '@/global.css';
import '@/lib/job-en-route-background-location';
import { installOlaMapBootstrap } from '@/lib/ola-map-bootstrap';

installOlaMapBootstrap();

import { registerAccessTokenGetter, registerPartnerModeGetter } from '@/api/client';
import { NAV_THEME } from '@/lib/theme';
import { useNotificationListeners } from '@/hooks/use-notification-listeners';
import { AuthSessionBridge } from '@/module/auth/components/AuthSessionBridge';
import { ThemeBootstrap } from '@/module/settings/components/ThemeBootstrap';
import { QueryProvider } from '@/providers/query-provider';
import { SocketProvider } from '@/providers/socket-provider';
import { PlatformAccessPausedHost } from '@/module/auth/components/PlatformAccessPausedHost';
import { useAuthStore } from '@/store/auth.store';
import { usePartnerModeStore } from '@/store/partner-mode.store';
import { PortalHost } from '@rn-primitives/portal';
import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { LoadingPlaceholder } from '@/components/shell';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

function NotificationListenersHost() {
  useNotificationListeners();
  return null;
}

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydratePartnerMode = usePartnerModeStore((s) => s.hydrate);

  useEffect(() => {
    registerAccessTokenGetter(() => useAuthStore.getState().accessToken);
    registerPartnerModeGetter(() => usePartnerModeStore.getState().mode);
    void Promise.all([hydrate(), hydratePartnerMode()]);
  }, [hydrate, hydratePartnerMode]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <SocketProvider>
          <PlatformAccessPausedHost />
          {!hydrated ? (
            <View className="flex-1 items-center justify-center bg-background">
              <LoadingPlaceholder className="py-0" />
            </View>
          ) : (
            <>
              <AuthSessionBridge />
              <ThemeBootstrap />
              <NotificationListenersHost />
              <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                <Stack screenOptions={{ headerShown: false }} />
                <PortalHost />
              </ThemeProvider>
            </>
          )}
        </SocketProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
