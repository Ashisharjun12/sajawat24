import type { Href } from 'expo-router';
import {
  Bell,
  CircleHelp,
  Info,
  LifeBuoy,
  Palette,
  RotateCcw,
  ShoppingCart,
  UserCog,
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

/**
 * Account tab list. My orders, Wishlist, Chat with us and Saved addresses are the
 * 2 × 2 shortcut tiles (`ProfileQuickActions`), so they are not repeated here.
 */
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
      {
        type: 'route',
        id: 'cart',
        label: 'My cart',
        href: '/(app)/checkout',
        icon: ShoppingCart,
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
        type: 'action',
        id: 'appearance',
        label: 'Appearance',
        icon: Palette,
      },
      {
        type: 'notification-toggle',
        id: 'push-notifications',
        label: 'Push notifications',
        icon: Bell,
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
        type: 'route',
        id: 'faq',
        label: "FAQ's",
        href: '/(app)/profile/faq',
        icon: CircleHelp,
      },
    ],
  },
  {
    id: 'more',
    title: 'More',
    items: [
      {
        type: 'route',
        id: 'about',
        label: 'About us',
        href: '/(app)/profile/about',
        icon: Info,
      },
      {
        type: 'route',
        id: 'manage-account',
        label: 'Manage account',
        href: '/(app)/profile/manage-account',
        icon: UserCog,
      },
    ],
  },
];

/** Flat list for legacy callers */
export const PROFILE_MENU_ITEMS: ProfileMenuItem[] = PROFILE_MENU_SECTIONS.flatMap(
  (section) => section.items,
);
