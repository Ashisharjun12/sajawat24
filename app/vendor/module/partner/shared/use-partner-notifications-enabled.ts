import type { AuthUser } from '@/lib/auth.types';

export function usePartnerNotificationsEnabled(
  accessToken: string | null,
  user: AuthUser | null,
): boolean {
  if (!accessToken || !user) return false;
  if (user.role === 'vendor_staff' || user.partnerMembership) return true;
  return user.vendor?.onboardingStatus === 'ACTIVE';
}
