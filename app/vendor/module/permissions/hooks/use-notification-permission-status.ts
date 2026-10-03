import { useEffect, useState, useCallback } from 'react';
import {
  getNotificationPermissionStatus,
  type NotificationPermissionStatus,
} from '@/lib/notifications';
import { useFocusEffect } from 'expo-router';

export function useNotificationPermissionStatus() {
  const [notificationStatus, setNotificationStatus] =
    useState<NotificationPermissionStatus>('undetermined');

  const refresh = useCallback(async () => {
    const status = await getNotificationPermissionStatus();
    setNotificationStatus(status);
    return status;
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { notificationStatus, refresh };
}
