import { refreshSession } from '@/api/auth-refresh.api';
import { toAuthSessionPayload } from '@/module/auth/lib/consumer-session';
import { loadRefreshToken } from '@/lib/secure-storage';
import { useAuthStore } from '@/store/auth.store';
import axios from 'axios';

let refreshPromise: Promise<string> | null = null;

export function isAccessTokenExpired(token: string | null | undefined, skewSeconds = 60): boolean {
  if (!token) return true;
  const parts = token.split('.');
  if (parts.length < 2) return true;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    if (typeof atob !== 'function') return true;
    const json = atob(padded);
    const payload = JSON.parse(json) as { exp?: number };
    if (!payload.exp) return true;
    return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
  } catch {
    return true;
  }
}

export function shouldAttemptRefresh(url: string): boolean {
  const path = url || '';
  return !(
    path.includes('/auth/google') ||
    path.includes('/auth/otp') ||
    path.includes('/auth/refresh') ||
    path.includes('/auth/logout')
  );
}

export class SessionRefreshError extends Error {
  readonly hardLogout: boolean;

  constructor(message: string, hardLogout: boolean) {
    super(message);
    this.name = 'SessionRefreshError';
    this.hardLogout = hardLogout;
  }
}

/** Single-flight refresh; returns new access token. */
export async function refreshAccessTokenOnce(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = await loadRefreshToken();
    if (!refreshToken) {
      throw new SessionRefreshError('No refresh token', true);
    }

    try {
      const data = await refreshSession(refreshToken);
      const payload = toAuthSessionPayload(data);
      await useAuthStore.getState().setSession(payload);
      return payload.accessToken;
    } catch (err) {
      if (err instanceof SessionRefreshError) {
        throw err;
      }
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        throw new SessionRefreshError('Session refresh failed', true);
      }
      throw err;
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}
