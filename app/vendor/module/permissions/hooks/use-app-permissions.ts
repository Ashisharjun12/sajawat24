import {
  getNotificationPermissionStatus,
  type NotificationPermissionStatus,
} from '@/lib/notifications';
import {
  getLocationPermissionStatus,
  type LocationPermissionStatus,
} from '@/lib/location';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

export function useAppPermissions() {
  const [notificationStatus, setNotificationStatus] =
    useState<NotificationPermissionStatus>('undetermined');
  const [locationStatus, setLocationStatus] = useState<LocationPermissionStatus>('undetermined');

  const refresh = useCallback(async () => {
    const [notifications, location] = await Promise.all([
      getNotificationPermissionStatus(),
      getLocationPermissionStatus(),
    ]);
    setNotificationStatus(notifications);
    setLocationStatus(location);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return {
    notificationStatus,
    locationStatus,
    refresh,
  };
}
