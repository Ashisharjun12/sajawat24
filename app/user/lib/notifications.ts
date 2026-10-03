import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const ANDROID_CHANNEL_DEFAULT = 'customer-default';
export const ANDROID_CHANNEL_ORDERS = 'customer-orders';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export function getEasProjectId(): string | null {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? null;
  if (!projectId || projectId === 'REPLACE_AFTER_EAS_INIT') return null;
  return projectId;
}

export async function ensureAndroidNotificationChannels() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_DEFAULT, {
    name: 'DeccorBuddys',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ORDERS, {
    name: 'Order updates',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
  });
}

export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return 'granted';
  if (current.status === 'denied') return 'denied';
  return 'undetermined';
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const current = await getNotificationPermissionStatus();
  if (current === 'granted') return true;

  const requested = await Notifications.requestPermissionsAsync();
  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function getExpoPushToken(): Promise<string | null> {
  const projectId = getEasProjectId();
  if (!projectId) {
    console.warn('[push] Missing EAS projectId. Run `npx eas init` and update app.json.');
    return null;
  }

  await ensureAndroidNotificationChannels();

  const granted = await getNotificationPermissionStatus();
  if (granted !== 'granted') {
    return null;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (error) {
    console.warn(
      '[push] Could not get Expo push token. On Android, configure FCM credentials and rebuild the native app.',
      error,
    );
    return null;
  }
}

export function getPushPlatform(): 'android' | 'ios' {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

const CUSTOMER_ORDER_PUSH_EVENTS = new Set([
  'BOOKING_CONFIRMED',
  'BOOKING_ASSIGNED',
  'VENDOR_EN_ROUTE',
  'VENDOR_ON_SITE',
  'BOOKING_COMPLETED',
  'BOOKING_REMINDER',
  'CHAT_MESSAGE',
]);

export function configureForegroundNotifications() {
  void ensureAndroidNotificationChannels();

  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = notification.request.content.data as Record<string, unknown>;
      const event = typeof data.event === 'string' ? data.event : undefined;
      const isOrder =
        Boolean(event && CUSTOMER_ORDER_PUSH_EVENTS.has(event)) ||
        Boolean(data.orderId);

      if (Platform.OS === 'android' && isOrder) {
        await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ORDERS, {
          name: 'Order updates',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
        });
      }

      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    },
  });
}
