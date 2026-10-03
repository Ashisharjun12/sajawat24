import { PermissionStepScreen } from '@/module/permissions/components/PermissionStepScreen';
import { syncPushRegistration } from '@/lib/push-registration';
import { requestNotificationPermission } from '@/lib/notifications';
import { usePermissionsSetupStore } from '@/store/permissions-setup.store';
import { useAuthStore } from '@/store/auth.store';
import { Href, router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { useState } from 'react';

export default function EnableNotificationsScreen() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const [loading, setLoading] = useState(false);
  const completeNotificationStep = usePermissionsSetupStore((s) => s.completeNotificationStep);

  async function finish() {
    await completeNotificationStep();
    router.replace('/(app)' as Href);
  }

  async function handleAllow() {
    setLoading(true);
    try {
      await requestNotificationPermission();
      if (accessToken && userId) {
        await syncPushRegistration(accessToken, userId);
      }
    } finally {
      setLoading(false);
    }
    await finish();
  }

  return (
    <PermissionStepScreen
      icon={Bell}
      title="Turn on notifications"
      description="Get instant alerts when Decoryy assigns you a new booking. You won't miss time-sensitive jobs."
      accentClassName="bg-primary/20"
      loading={loading}
      onAllow={() => void handleAllow()}
      onSkip={() => void finish()}
    />
  );
}
