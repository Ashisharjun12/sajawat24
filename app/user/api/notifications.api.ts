import { api, unwrap } from '@/api/client';

export type PushPlatform = 'android' | 'ios';

export type UserNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export type UserNotificationsResponse = {
  items: UserNotification[];
  total: number;
};

export function registerPushDevice(input: { token: string; platform: PushPlatform }) {
  return api.post('/user/devices', input).then(unwrap<{ ok: boolean }>);
}

export function unregisterPushDevice(input: { token: string }) {
  return api.delete('/user/devices', { data: input }).then(unwrap<{ ok: boolean }>);
}

export function listUserNotifications(params?: { page?: number; limit?: number }) {
  return api.get('/user/notifications', { params }).then(unwrap<UserNotificationsResponse>);
}

export function markUserNotificationRead(id: string) {
  return api.patch(`/user/notifications/${id}/read`).then(unwrap<UserNotification>);
}

export function markAllUserNotificationsRead() {
  return api.patch('/user/notifications/read-all').then(unwrap<{ count: number }>);
}
