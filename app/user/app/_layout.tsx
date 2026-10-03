import '@/lib/patch-keep-awake';
import '@/global.css';
import { installOlaMapBootstrap } from '@/lib/ola-map-bootstrap';

installOlaMapBootstrap();

import { registerAccessTokenGetter } from '@/api/client';
import { AuthSessionBridge } from '@/module/auth/components/AuthSessionBridge';
import { ChatSocketBridge } from '@/module/auth/components/ChatSocketBridge';
import { NotificationListenersHost } from '@/module/auth/components/NotificationListenersHost';
import { SocketProvider } from '@/providers/socket-provider';
import { CashfreeCheckoutHost } from '@/module/booking/components/checkout/CashfreeCheckoutHost';
import { CashfreePaymentGatewayHost } from '@/module/booking/components/checkout/CashfreePaymentGatewayHost';
import { LoadingPlaceholder } from '@/components/shell';
import { GOOGLE_WEB_CLIENT_ID } from '@/lib/env';
import { queryClient } from '@/lib/query-client';
import { QueryClientProvider } from '@tanstack/react-query';
import { NAV_THEME } from '@/lib/theme';
import { useAuthStore } from '@/store/auth.store';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { PortalHost } from '@rn-primitives/portal';
import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { configureForegroundNotifications } from '@/lib/notifications';
import { LenisProvider } from '@/lib/lenis-web';
import { ThemeBootstrap } from '@/module/settings/components/ThemeBootstrap';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export {
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    registerAccessTokenGetter(() => useAuthStore.getState().accessToken);
    if (GOOGLE_WEB_CLIENT_ID) {
      GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
    }
    configureForegroundNotifications();
    void hydrate();
  }, [hydrate]);

  const appTree = (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
      <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
        <ThemeBootstrap />
        <AuthSessionBridge />
        <ChatSocketBridge />
        <NotificationListenersHost />
        <CashfreePaymentGatewayHost />
        <CashfreeCheckoutHost />
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }} />
        <PortalHost />
      </ThemeProvider>
      </SocketProvider>
    </QueryClientProvider>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {!hydrated ? (
        <View className="flex-1 items-center justify-center bg-background">
          <LoadingPlaceholder className="py-0" />
        </View>
      ) : (
        Platform.OS === 'web' ? <LenisProvider>{appTree}</LenisProvider> : appTree
      )}
    </GestureHandlerRootView>
  );
}
