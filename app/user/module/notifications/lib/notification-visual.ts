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

/** Brand palette only: teal for activity, green for completed states. */
export function getNotificationVisual(event?: string): NotificationVisual {
  switch (event) {
    case 'BOOKING_CONFIRMED':
    case 'BOOKING_REMINDER':
      return { icon: CalendarCheck, iconBg: 'bg-success/15', iconColor: 'text-success' };
    case 'BOOKING_COMPLETED':
      return { icon: CheckCircle2, iconBg: 'bg-success/15', iconColor: 'text-success' };
    case 'CHAT_MESSAGE':
      return { icon: MessageCircle, iconBg: 'bg-primary-tint', iconColor: 'text-primary' };
    case 'BOOKING_ASSIGNED':
      return { icon: Package, iconBg: 'bg-primary-tint', iconColor: 'text-primary' };
    case 'VENDOR_EN_ROUTE':
    case 'VENDOR_ON_SITE':
      return { icon: Truck, iconBg: 'bg-primary-tint', iconColor: 'text-primary' };
    case 'DELIVERY_CODE':
      return { icon: KeyRound, iconBg: 'bg-primary-tint', iconColor: 'text-primary' };
    default:
      return { icon: Bell, iconBg: 'bg-muted', iconColor: 'text-muted-foreground' };
  }
}
