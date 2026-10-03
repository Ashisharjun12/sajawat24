import { requestNotificationPermission } from '@/lib/notifications';
import { syncPushRegistration } from '@/lib/push-registration';
import { PermissionStepScreen } from '@/module/permissions/components/PermissionStepScreen';
import { usePermissionsSetupStore } from '@/store/permissions-setup.store';
import { useAuthStore } from '@/store/auth.store';
import { Href, router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { useState } from 'react';

export default function EnableNotificationsScreen() {
  const [loading, setLoading] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const completeNotificationStep = usePermissionsSetupStore((s) => s.completeNotificationStep);

  async function finish() {
    await completeNotificationStep();
    router.replace('/(app)/' as Href);
  }

  async function handleAllow() {
    setLoading(true);
    try {
      await requestNotificationPermission();
      await syncPushRegistration(accessToken, userId);
    } finally {
      setLoading(false);
    }
    await finish();
  }

  return (
    <PermissionStepScreen
      icon={Bell}
      title="Turn on notifications"
      description="Get order updates, booking reminders, and offers for your area."
      accentClassName="bg-primary/20"
      loading={loading}
      onAllow={() => void handleAllow()}
      onSkip={() => void finish()}
    />
  );
}
