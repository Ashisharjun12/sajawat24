import { AuthGate } from '@/module/auth/components/AuthGate';
import { getOnboardingAccessRedirect } from '@/module/auth/lib/auth-routing';
import { useAuthStore } from '@/store/auth.store';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  const isReapplyMode = useAuthStore((s) => s.isReapplyMode);

  return (
    <AuthGate
      resolveRedirect={({ accessToken, user }) =>
        getOnboardingAccessRedirect(accessToken, user, isReapplyMode)
      }>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </AuthGate>
  );
}
