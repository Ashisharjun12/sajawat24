import type { VendorInboxNotification } from '@/module/notifications/lib/notification-types';

export type NotificationDateSection = {
  title: string;
  data: VendorInboxNotification[];
};

function getDateGroupLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Earlier';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  return 'Most recent';
}

export function groupNotificationsByDate(
  items: VendorInboxNotification[],
): NotificationDateSection[] {
  const sections: NotificationDateSection[] = [];

  for (const item of items) {
    const title = getDateGroupLabel(item.createdAt);
    const last = sections[sections.length - 1];

    if (last?.title === title) {
      last.data.push(item);
      continue;
    }

    sections.push({ title, data: [item] });
  }

  return sections;
}
