import { AuthGate } from '@/module/auth/components/AuthGate';
import { getGateAccessRedirect } from '@/module/auth/lib/auth-routing';
import { Stack } from 'expo-router';

export default function GateLayout() {
  return (
    <AuthGate
      resolveRedirect={({ accessToken, user, hasSeenWelcome, platformAccessPaused }) =>
        getGateAccessRedirect(accessToken, user, hasSeenWelcome, platformAccessPaused)
      }>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </AuthGate>
  );
}
