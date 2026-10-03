import { requestForegroundLocationPermission } from '@/lib/location';
import { PermissionStepScreen } from '@/module/permissions/components/PermissionStepScreen';
import { usePermissionsSetupStore } from '@/store/permissions-setup.store';
import { Href, router } from 'expo-router';
import { MapPin } from 'lucide-react-native';
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
      icon={MapPin}
      title="Turn on location"
      description="See decorations and delivery options near you. We only use location while you're using the app."
      accentClassName="bg-sky-500/15"
      loading={loading}
      onAllow={() => void handleAllow()}
      onSkip={() => void goToNextStep()}
    />
  );
}
