import { patchDuty } from '@/api/vendor.api';
import { postVendorPresence } from '@/api/jobs.api';
import { getApiError } from '@/api/client';
import { getLocationPermissionStatus } from '@/lib/location';
import * as Location from 'expo-location';
import { useAuthStore } from '@/store/auth.store';
import { useMutation } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { Alert } from 'react-native';

export function useVendorDuty() {
  const vendor = useAuthStore((s) => s.user?.vendor);
  const onboardingStatus = vendor?.onboardingStatus ?? null;
  const isOnDuty = vendor?.isOnDuty ?? false;
  const canToggle = onboardingStatus === 'ACTIVE';

  const mutation = useMutation({
    mutationFn: (next: boolean) => patchDuty(next),
    onSuccess: (data) => {
      useAuthStore.setState({ user: data.user });
    },
  });

  async function setOnDuty(next: boolean, options?: { pendingActionCount?: number }) {
    if (!canToggle || mutation.isPending) return;

    if (next) {
      const locationStatus = await getLocationPermissionStatus();
      if (locationStatus !== 'granted') {
        Alert.alert(
          'Location required',
          'Turn on location access before going online so we can route assignments correctly.',
          [
            { text: 'Not now', style: 'cancel' },
            {
              text: 'Open settings',
              onPress: () => router.push('/(app)/enable-location' as Href),
            },
          ],
        );
        return;
      }
    } else {
      const pendingCount = options?.pendingActionCount ?? 0;
      if (pendingCount > 0) {
        return new Promise<void>((resolve) => {
          Alert.alert(
            'Go offline?',
            `You have ${pendingCount} booking${pendingCount === 1 ? '' : 's'} waiting. You can still open them, but you must go online to accept.`,
            [
              { text: 'Stay online', style: 'cancel', onPress: () => resolve() },
              {
                text: 'Go offline',
                style: 'destructive',
                onPress: async () => {
                  try {
                    const data = await mutation.mutateAsync(false);
                    useAuthStore.setState({ user: data.user });
                  } catch (err) {
                    Alert.alert('Could not update status', getApiError(err));
                  }
                  resolve();
                },
              },
            ],
          );
        });
      }
    }

    try {
      const data = await mutation.mutateAsync(next);
      useAuthStore.setState({ user: data.user });
      if (next) {
        try {
          const fix = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          await postVendorPresence({
            latitude: fix.coords.latitude,
            longitude: fix.coords.longitude,
            onDuty: true,
          });
        } catch {
          // duty already updated; dispatch may fall back to shop base until next presence ping
        }
      }
    } catch (err) {
      Alert.alert('Could not update status', getApiError(err));
    }
  }

  return {
    vendor,
    onboardingStatus,
    isOnDuty,
    canToggle,
    isUpdating: mutation.isPending,
    setOnDuty,
  };
}
