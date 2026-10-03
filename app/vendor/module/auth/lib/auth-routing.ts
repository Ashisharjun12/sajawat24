import type { AuthUser } from '@/lib/auth.types';
import type { Href } from 'expo-router';

export function vendorNeedsBlockedGate(user: AuthUser | null, platformAccessPaused: boolean) {
  if (!user) return false;
  if (platformAccessPaused) return true;
  if (user.role === 'vendor' && user.vendor?.onboardingStatus === 'BLOCKED') return true;
  return false;
}

export type AuthRedirectInput = {
  hydrated: boolean;
  hasSeenWelcome: boolean;
  accessToken: string | null;
  user: AuthUser | null;
};

export function isAuthenticated(accessToken: string | null, user: AuthUser | null) {
  return Boolean(accessToken && user);
}

export function isStaffUser(user: AuthUser | null) {
  return user?.role === 'vendor_staff';
}

export function getUnauthenticatedRedirect(hasSeenWelcome: boolean): Href {
  if (!hasSeenWelcome) {
    return '/(onboarding)/welcome' as Href;
  }
  return '/(onboarding)/login-choice' as Href;
}

export function getAuthRedirectPath(state: AuthRedirectInput): Href | null {
  if (!state.hydrated) return null;

  if (!isAuthenticated(state.accessToken, state.user)) {
    return getUnauthenticatedRedirect(state.hasSeenWelcome);
  }

  const user = state.user!;

  if (isStaffUser(user)) {
    return user.partnerMembership ? '/(app)' as Href : '/(onboarding)/login-choice' as Href;
  }

  const vendor = user.vendor;
  if (!vendor) return '/(onboarding)/register' as Href;
  if (vendor.onboardingStatus === 'PENDING') return '/(gate)/pending' as Href;
  if (vendor.onboardingStatus === 'REJECTED') return '/(gate)/rejected' as Href;
  if (vendor.onboardingStatus === 'BLOCKED') return '/(gate)/blocked' as Href;
  if (vendor.onboardingStatus === 'ACTIVE') return '/(app)' as Href;

  return '/(onboarding)/login-choice' as Href;
}

export function getPostOtpRedirectPath(user: AuthUser): Href {
  if (isStaffUser(user) && user.partnerMembership) return '/(app)' as Href;
  if (user.vendor?.onboardingStatus === 'ACTIVE') return '/(app)' as Href;
  if (user.vendor?.onboardingStatus === 'PENDING') return '/(gate)/pending' as Href;
  if (user.vendor?.onboardingStatus === 'REJECTED') return '/(gate)/rejected' as Href;
  if (user.vendor?.onboardingStatus === 'BLOCKED') return '/(gate)/blocked' as Href;
  return '/(onboarding)/login-choice' as Href;
}

export function getAppAccessRedirect(
  accessToken: string | null,
  user: AuthUser | null,
  hasSeenWelcome: boolean,
  platformAccessPaused = false,
): Href | null {
  if (!isAuthenticated(accessToken, user)) {
    return getUnauthenticatedRedirect(hasSeenWelcome);
  }

  if (vendorNeedsBlockedGate(user, platformAccessPaused)) {
    return '/(gate)/blocked' as Href;
  }

  if (isStaffUser(user)) {
    return user!.partnerMembership ? null : '/(onboarding)/login-choice' as Href;
  }

  const status = user!.vendor?.onboardingStatus;
  if (status === 'PENDING') return '/(gate)/pending' as Href;
  if (status === 'REJECTED') return '/(gate)/rejected' as Href;
  if (status === 'BLOCKED') return '/(gate)/blocked' as Href;
  if (status !== 'ACTIVE') return '/(onboarding)/login-choice' as Href;

  return null;
}

export function getGateAccessRedirect(
  accessToken: string | null,
  user: AuthUser | null,
  hasSeenWelcome: boolean,
  platformAccessPaused = false,
): Href | null {
  if (!isAuthenticated(accessToken, user)) {
    return getUnauthenticatedRedirect(hasSeenWelcome);
  }

  if (vendorNeedsBlockedGate(user, platformAccessPaused)) {
    return null;
  }

  if (isStaffUser(user)) {
    return user!.partnerMembership ? '/(app)' as Href : null;
  }

  const status = user!.vendor?.onboardingStatus;
  if (status === 'ACTIVE') return '/(app)' as Href;
  if (status === 'PENDING' || status === 'REJECTED' || status === 'BLOCKED') return null;

  return '/(onboarding)/login-choice' as Href;
}

export function getOnboardingAccessRedirect(
  accessToken: string | null,
  user: AuthUser | null,
  isReapplyMode = false,
): Href | null {
  if (!isAuthenticated(accessToken, user)) {
    return null;
  }

  // Rejected vendors updating shop details stay on onboarding register screens.
  if (isReapplyMode) {
    return null;
  }

  if (isStaffUser(user)) {
    return user!.partnerMembership ? '/(app)' as Href : null;
  }

  const status = user!.vendor?.onboardingStatus;
  if (status === 'ACTIVE') return '/(app)' as Href;
  if (status === 'PENDING') return '/(gate)/pending' as Href;
  if (status === 'REJECTED') return '/(gate)/rejected' as Href;
  if (status === 'BLOCKED') return '/(gate)/blocked' as Href;

  return null;
}
