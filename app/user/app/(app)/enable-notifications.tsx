import { requestNotificationPermission } from '@/lib/notifications';
import { syncPushRegistration } from '@/lib/push-registration';
import { PermissionStepScreen } from '@/module/permissions/components/PermissionStepScreen';
import { NOTIFICATION_PERMISSION_ILLUSTRATION } from '@/module/permissions/lib/permission-step-assets';
import { usePermissionsSetupStore } from '@/store/permissions-setup.store';
import { useAuthStore } from '@/store/auth.store';
import { Href, router } from 'expo-router';
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
      illustrationUri={NOTIFICATION_PERMISSION_ILLUSTRATION}
      illustrationLabel="Phone showing order notifications"
      title="Allow notifications"
      description="See decoration and delivery options for your area, plus order updates and offers."
      loading={loading}
      allowLabel="Allow notifications"
      onAllow={() => void handleAllow()}
      onSkip={() => void finish()}
    />
  );
}
