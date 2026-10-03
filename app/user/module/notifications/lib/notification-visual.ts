import type { LucideIcon } from 'lucide-react-native';
import {
  Bell,
  CalendarCheck,
  CheckCircle2,
  KeyRound,
  MessageCircle,
  Package,
  Truck,
} from 'lucide-react-native';

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
    case 'BOOKING_REMINDER':
      return { icon: CalendarCheck, iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-700' };
    case 'BOOKING_ASSIGNED':
      return { icon: Package, iconBg: 'bg-primary/15', iconColor: 'text-primary' };
    case 'VENDOR_EN_ROUTE':
      return { icon: Truck, iconBg: 'bg-amber-500/15', iconColor: 'text-amber-700' };
    case 'VENDOR_ON_SITE':
      return { icon: Truck, iconBg: 'bg-sky-500/15', iconColor: 'text-sky-700' };
    case 'DELIVERY_CODE':
      return { icon: KeyRound, iconBg: 'bg-violet-500/15', iconColor: 'text-violet-700' };
    case 'BOOKING_COMPLETED':
      return { icon: CheckCircle2, iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-700' };
    default:
      return { icon: Bell, iconBg: 'bg-muted', iconColor: 'text-muted-foreground' };
  }
}
