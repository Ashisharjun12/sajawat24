import type { Href } from 'expo-router';

/** Web `AccountNav` parity — labels and hrefs for mobile profile hub. */
export const ACCOUNT_NAV_PRIMARY = [
  { id: 'personal-info', label: 'Personal info', href: '/(app)/profile/account' as Href },
  { id: 'orders', label: 'My orders', href: '/(app)/profile/orders' as Href },
  { id: 'addresses', label: 'Addresses', href: '/(app)/profile/addresses' as Href },
  { id: 'refunds', label: 'Refunds', href: '/(app)/profile/returns' as Href },
] as const;

export const ACCOUNT_NAV_SECONDARY = [
  {
    id: 'notifications',
    label: 'Notifications',
    href: '/(app)/notifications?from=profile' as Href,
  },
  { id: 'help', label: 'Help', href: '/(app)/profile/help' as Href },
] as const;
