import { VENDOR_NEW_JOB_NOTIFICATION_EVENT } from '@/module/bookings/lib/vendor-jobs.events';
import type { LucideIcon } from 'lucide-react-native';
import { Bell, CalendarCheck, IndianRupee, MessageCircle, Package, Truck } from 'lucide-react-native';

type NotificationVisual = {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

export function getNotificationVisual(event?: string): NotificationVisual {
  switch (event) {
    case 'CHAT_MESSAGE':
      return { icon: MessageCircle, iconBg: 'bg-sky-500/15', iconColor: 'text-sky-700' };
    case 'BOOKING_CONFIRMED':
      return { icon: CalendarCheck, iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-700' };
    case VENDOR_NEW_JOB_NOTIFICATION_EVENT:
    case 'BOOKING_ASSIGNED':
      return { icon: Package, iconBg: 'bg-primary', iconColor: 'text-primary-foreground' };
    case 'VENDOR_JOB_ASSIGNED':
      return { icon: Truck, iconBg: 'bg-sky-500/15', iconColor: 'text-sky-700' };
    case 'VENDOR_ON_THE_WAY':
      return { icon: Truck, iconBg: 'bg-amber-500/15', iconColor: 'text-amber-700' };
    case 'PAYOUT_PAID':
      return { icon: IndianRupee, iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-700' };
    case 'PAYOUT_FAILED':
      return { icon: IndianRupee, iconBg: 'bg-destructive/10', iconColor: 'text-destructive' };
    default:
      return { icon: Bell, iconBg: 'bg-muted', iconColor: 'text-muted-foreground' };
  }
}
