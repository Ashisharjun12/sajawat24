import type { CouponLike } from '@/module/booking/lib/coupon-preview';
import {
  announcementDisplayCopy,
  type HomeAnnouncement,
} from '@/module/home/lib/announcement';
import type { UserInboxNotification } from '@/module/notifications/lib/notification-types';

export type NotificationInboxFilter = 'all' | 'offers' | 'updates';

export type InboxItemKind = 'push' | 'cms' | 'coupon';

export type NotificationInboxItem = {
  id: string;
  kind: InboxItemKind;
  title: string;
  body: string;
  createdAt: string;
  unread: boolean;
  push?: UserInboxNotification;
  cms?: HomeAnnouncement;
  coupon?: CouponLike;
};

const UPDATE_EVENTS = new Set([
  'BOOKING_CONFIRMED',
  'BOOKING_ASSIGNED',
  'VENDOR_EN_ROUTE',
  'VENDOR_ON_SITE',
  'DELIVERY_CODE',
  'BOOKING_COMPLETED',
  'BOOKING_REMINDER',
  'CHAT_MESSAGE',
  'LOGIN_OTP',
  'PAYOUT_PAID',
  'PAYOUT_FAILED',
  'DISPATCH_EXHAUSTED',
]);

function pushCategory(item: UserInboxNotification): string | undefined {
  const raw = item.data as Record<string, unknown>;
  return typeof raw.category === 'string' ? raw.category : undefined;
}

export function isOfferPushNotification(item: UserInboxNotification): boolean {
  return pushCategory(item) === 'offer';
}

export function isUpdatePushNotification(item: UserInboxNotification): boolean {
  if (isOfferPushNotification(item)) return false;
  const event = item.data.event;
  if (!event) return true;
  return UPDATE_EVENTS.has(event);
}

function mapPush(item: UserInboxNotification): NotificationInboxItem {
  return {
    id: `push:${item.id}`,
    kind: 'push',
    title: item.title,
    body: item.body,
    createdAt: item.createdAt,
    unread: !item.readAt,
    push: item,
  };
}

function mapCms(item: HomeAnnouncement, index: number): NotificationInboxItem {
  const { title, subtitle } = announcementDisplayCopy(item);
  const stamp = new Date(Date.now() - index * 60_000).toISOString();
  return {
    id: `cms:${item.id}`,
    kind: 'cms',
    title,
    body: subtitle || item.message,
    createdAt: stamp,
    unread: true,
    cms: item,
  };
}

function couponKey(coupon: CouponLike, index: number): string {
  const code = String(coupon.code ?? '').trim();
  return code || `coupon-${index}`;
}

function mapCoupon(coupon: CouponLike, index: number): NotificationInboxItem {
  const code = String(coupon.code ?? '').trim();
  const name = String(coupon.name ?? coupon.title ?? '').trim();
  const title = name || code || 'Special offer';
  const body =
    String(coupon.discountLabel ?? coupon.description ?? coupon.eligibilitySummary ?? '').trim() ||
    'Tap to view offer details';
  const stamp = new Date(Date.now() - (index + 10) * 60_000).toISOString();
  return {
    id: `coupon:${couponKey(coupon, index)}`,
    kind: 'coupon',
    title,
    body,
    createdAt: stamp,
    unread: false,
    coupon,
  };
}

function sortInbox(items: NotificationInboxItem[]): NotificationInboxItem[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function buildNotificationInboxItems({
  filter,
  notifications,
  announcements,
  coupons,
}: {
  filter: NotificationInboxFilter;
  notifications: UserInboxNotification[];
  announcements: HomeAnnouncement[];
  coupons: CouponLike[];
}): NotificationInboxItem[] {
  const pushes = notifications.map(mapPush);
  const cmsItems = announcements.map(mapCms);
  const couponItems = coupons.map(mapCoupon);

  if (filter === 'updates') {
    return sortInbox(pushes.filter((row) => row.push && isUpdatePushNotification(row.push)));
  }

  if (filter === 'offers') {
    const offerPushes = pushes.filter((row) => row.push && isOfferPushNotification(row.push));
    return sortInbox([...offerPushes, ...cmsItems, ...couponItems]);
  }

  return sortInbox([...pushes, ...cmsItems, ...couponItems]);
}
