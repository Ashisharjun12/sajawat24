import { api, unwrap } from '@/api/client';

export type PushPlatform = 'android' | 'ios';

export type VendorNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export type VendorNotificationsResponse = {
  items: VendorNotification[];
  total: number;
};

export function registerPushDevice(input: { token: string; platform: PushPlatform }) {
  return api.post('/vendor/devices', input).then(unwrap<{ ok: boolean }>);
}

export function unregisterPushDevice(input: { token: string }) {
  return api.delete('/vendor/devices', { data: input }).then(unwrap<{ ok: boolean }>);
}

export function listVendorNotifications(params?: { page?: number; limit?: number }) {
  return api
    .get('/vendor/notifications', { params })
    .then(unwrap<VendorNotificationsResponse>);
}

export function markVendorNotificationRead(id: string) {
  return api.patch(`/vendor/notifications/${id}/read`).then(unwrap<VendorNotification>);
}

export function markAllVendorNotificationsRead() {
  return api.patch('/vendor/notifications/read-all').then(unwrap<{ count: number }>);
}
