import { registerPushDevice, unregisterPushDevice } from '@/api/notifications.api';
import { getExpoPushToken, getNotificationPermissionStatus, getPushPlatform } from '@/lib/notifications';

let cachedPushToken: string | null = null;

export function resetCachedPushToken() {
  cachedPushToken = null;
}

export async function syncPushRegistration(accessToken: string | null, userId: string | null) {
  if (!accessToken || !userId) {
    return;
  }

  const permission = await getNotificationPermissionStatus();
  if (permission !== 'granted') {
    return;
  }

  try {
    const token = await getExpoPushToken();
    if (!token) {
      return;
    }

    if (cachedPushToken === token) {
      return;
    }

    await registerPushDevice({ token, platform: getPushPlatform() });
    cachedPushToken = token;
  } catch (error) {
    cachedPushToken = null;
    console.warn('[push] registration failed', error);
    throw error;
  }
}

export async function clearPushRegistration(accessToken: string | null) {
  if (!accessToken || !cachedPushToken) {
    cachedPushToken = null;
    return;
  }

  try {
    await unregisterPushDevice({ token: cachedPushToken });
  } catch {
    // ignore unregister errors on sign-out
  }

  cachedPushToken = null;
}
