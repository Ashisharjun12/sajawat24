import type { NotificationInboxItem } from '@/module/notifications/lib/notification-inbox-filter';

export type InboxDateSection = {
  title: string;
  data: NotificationInboxItem[];
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

  return 'Earlier';
}

export function groupInboxByDate(items: NotificationInboxItem[]): InboxDateSection[] {
  const sections: InboxDateSection[] = [];

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
