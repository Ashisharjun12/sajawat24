import type { CustomerUser } from '@/lib/auth.types';
import type { Href } from 'expo-router';

export type AuthRedirectInput = {
  hydrated: boolean;
  hasSeenWelcome: boolean;
  accessToken: string | null;
  user: CustomerUser | null;
};

export function isAuthenticated(accessToken: string | null, user: CustomerUser | null) {
  return Boolean(accessToken && user);
}

export function getUnauthenticatedRedirect(hasSeenWelcome: boolean): Href {
  if (!hasSeenWelcome) {
    return '/(onboarding)/welcome' as Href;
  }
  return '/(onboarding)/login' as Href;
}

export function getAuthRedirectPath(state: AuthRedirectInput): Href | null {
  if (!state.hydrated) return null;

  if (!isAuthenticated(state.accessToken, state.user)) {
    return getUnauthenticatedRedirect(state.hasSeenWelcome);
  }

  return '/(app)/' as Href;
}
