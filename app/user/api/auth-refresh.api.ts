import type { MobileAuthResponse } from '@/lib/auth.types';
import { API_URL } from '@/lib/env';
import axios from 'axios';
import { Platform } from 'react-native';

/** Bare client — avoids main API 401 refresh interceptor loops. */
const authHttp = axios.create({
  baseURL: API_URL || undefined,
  timeout: 15000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});

function mobileDevice() {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

function unwrap<T>(response: { data?: { data?: T } }): T {
  return response.data?.data as T;
}

export function refreshSession(refreshToken: string) {
  return authHttp
    .post('/auth/refresh', {
      refreshToken,
      clientType: 'mobile',
      device: mobileDevice(),
    })
    .then((res) => unwrap<MobileAuthResponse>(res));
}

export function logoutSession(refreshToken: string) {
  return authHttp.post('/auth/logout', {
    refreshToken,
    clientType: 'mobile',
    device: mobileDevice(),
  });
}
