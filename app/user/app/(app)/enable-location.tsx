import { requestForegroundLocationPermission } from '@/lib/location';
import { PermissionStepScreen } from '@/module/permissions/components/PermissionStepScreen';
import { LOCATION_PERMISSION_ILLUSTRATION } from '@/module/permissions/lib/permission-step-assets';
import { usePermissionsSetupStore } from '@/store/permissions-setup.store';
import { Href, router } from 'expo-router';
import { useState } from 'react';

export default function EnableLocationScreen() {
  const [loading, setLoading] = useState(false);
  const completeLocationStep = usePermissionsSetupStore((s) => s.completeLocationStep);

  async function goToNextStep() {
    await completeLocationStep();
    router.replace('/(app)/enable-notifications' as Href);
  }

  async function handleAllow() {
    setLoading(true);
    try {
      await requestForegroundLocationPermission();
    } finally {
      setLoading(false);
    }
    await goToNextStep();
  }

  return (
    <PermissionStepScreen
      illustrationUri={LOCATION_PERMISSION_ILLUSTRATION}
      illustrationLabel="Map showing your delivery area"
      title="Allow location access"
      description="See decoration and delivery options near you. We only use your location while you're using the app."
      loading={loading}
      allowLabel="Allow location"
      onAllow={() => void handleAllow()}
      onSkip={() => void goToNextStep()}
    />
  );
}
