import { getCameraPermissionStatus, type CameraPermissionStatus } from '@/lib/camera';
import {
  getLocationPermissionStatus,
  type LocationPermissionStatus,
} from '@/lib/location';
import {
  getNotificationPermissionStatus,
  type NotificationPermissionStatus,
} from '@/lib/notifications';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

export function useAppPermissions() {
  const [notificationStatus, setNotificationStatus] =
    useState<NotificationPermissionStatus>('undetermined');
  const [locationStatus, setLocationStatus] = useState<LocationPermissionStatus>('undetermined');
  const [cameraStatus, setCameraStatus] = useState<CameraPermissionStatus>('undetermined');

  const refresh = useCallback(async () => {
    const [notifications, location, camera] = await Promise.all([
      getNotificationPermissionStatus(),
      getLocationPermissionStatus(),
      getCameraPermissionStatus(),
    ]);
    setNotificationStatus(notifications);
    setLocationStatus(location);
    setCameraStatus(camera);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return {
    notificationStatus,
    locationStatus,
    cameraStatus,
    refresh,
  };
}
