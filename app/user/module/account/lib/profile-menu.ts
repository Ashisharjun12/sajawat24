import type { Href } from 'expo-router';
import {
  Bell,
  Inbox,
  LifeBuoy,
  MapPin,
  Package,
  Palette,
  RotateCcw,
  UserRound,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

export type ProfileRouteMenuItem = {
  type: 'route';
  id: string;
  label: string;
  href: Href;
  icon: LucideIcon;
  subtitle?: string;
};

export type ProfileActionMenuItem = {
  type: 'action';
  id: string;
  label: string;
  icon?: LucideIcon;
  subtitle?: string;
};

export type ProfileNotificationToggleItem = {
  type: 'notification-toggle';
  id: 'push-notifications';
  label: string;
  icon: LucideIcon;
};

export type ProfileMenuItem =
  | ProfileRouteMenuItem
  | ProfileActionMenuItem
  | ProfileNotificationToggleItem;

export type ProfileMenuSection = {
  id: string;
  title?: string;
  items: ProfileMenuItem[];
};

export const PROFILE_MENU_SECTIONS: ProfileMenuSection[] = [
  {
    id: 'your-account',
    title: 'Your account',
    items: [
      {
        type: 'route',
        id: 'account',
        label: 'Personal info',
        href: '/(app)/profile/account',
        icon: UserRound,
      },
    ],
  },
  {
    id: 'orders-delivery',
    title: 'Orders & delivery',
    items: [
      {
        type: 'route',
        id: 'orders',
        label: 'My orders',
        href: '/(app)/profile/orders',
        icon: Package,
      },
      {
        type: 'route',
        id: 'addresses',
        label: 'Addresses',
        href: '/(app)/profile/addresses',
        icon: MapPin,
      },
      {
        type: 'route',
        id: 'returns',
        label: 'Refunds',
        href: '/(app)/profile/returns',
        icon: RotateCcw,
      },
    ],
  },
  {
    id: 'preferences',
    title: 'Preferences',
    items: [
      {
        type: 'route',
        id: 'appearance',
        label: 'Appearance',
        href: '/(app)/profile/appearance',
        icon: Palette,
      },
      {
        type: 'notification-toggle',
        id: 'push-notifications',
        label: 'Push notifications',
        icon: Bell,
      },
      {
        type: 'route',
        id: 'notifications-inbox',
        label: 'Notifications',
        href: '/(app)/notifications?from=profile',
        icon: Inbox,
      },
    ],
  },
  {
    id: 'support',
    title: 'Support',
    items: [
      {
        type: 'route',
        id: 'help',
        label: 'Help',
        href: '/(app)/profile/help',
        icon: LifeBuoy,
      },
      {
        type: 'action',
        id: 'whatsapp',
        label: 'WhatsApp support',
        subtitle: 'Chat with us',
      },
    ],
  },
];

/** Flat list for legacy callers */
export const PROFILE_MENU_ITEMS: ProfileMenuItem[] = PROFILE_MENU_SECTIONS.flatMap(
  (section) => section.items,
);
