import type { AuthSessionPayload, MobileAuthResponse, PublicUser } from '@/lib/auth.types';
import { mapPublicUserToCustomer } from '@/lib/auth.types';
import { getApiError } from '@/api/client';
import { isAxiosError } from 'axios';

const CONSUMER_ROLES = new Set(['user', 'vendor', 'vendor_staff']);

export function isConsumerAppEligible(user: PublicUser | null | undefined): boolean {
  const role = user?.role;
  return role != null && CONSUMER_ROLES.has(role);
}

export function consumerSessionErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const code = err.response?.data?.code as string | undefined;
    if (code === 'USE_ADMIN_PORTAL') {
      return 'Use the admin portal to sign in with this account.';
    }
    if (code === 'CONSUMER_APP_FORBIDDEN') {
      return 'This account cannot use the customer app.';
    }
    const message = getApiError(err);
    if (message.toLowerCase().includes('account blocked')) {
      return 'This account has been blocked. Contact support if you need help.';
    }
    return message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Could not sign in. Try again.';
}

export function assertConsumerAppUser(user: PublicUser): void {
  if (user?.role === 'admin') {
    throw new Error('Use the admin portal to sign in with this account.');
  }
  if (!isConsumerAppEligible(user)) {
    throw new Error('This account cannot use the customer app.');
  }
}

/** @deprecated Use isConsumerAppEligible */
export function isCustomerUser(user: PublicUser | null | undefined): boolean {
  return isConsumerAppEligible(user);
}

/** @deprecated Use assertConsumerAppUser */
export function assertCustomerUser(user: PublicUser): void {
  assertConsumerAppUser(user);
}

export function toAuthSessionPayload(data: MobileAuthResponse): AuthSessionPayload {
  assertConsumerAppUser(data.user);
  return {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: mapPublicUserToCustomer(data.user),
  };
}
