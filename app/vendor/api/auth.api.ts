import { logoutSession, refreshSession } from '@/api/auth-refresh.api';
import { api, unwrap } from '@/api/client';
import type { AuthSessionPayload, AuthUser } from '@/lib/auth.types';
import type { PartnerLoginIntent } from '@/lib/login-intent';
import { Platform } from 'react-native';

export type { AuthSessionPayload, AuthUser };

export type OtpRequestResult = {
  phone: string;
  otp?: string;
};

export function requestOtp(
  phone: string,
  androidAppHash?: string,
  loginIntent?: PartnerLoginIntent,
) {
  return api
    .post('/auth/otp/request', {
      phone,
      ...(androidAppHash ? { androidAppHash } : {}),
      ...(loginIntent ? { loginIntent } : {}),
    })
    .then(unwrap<OtpRequestResult>);
}

export function verifyOtp(phone: string, otp: string, loginIntent?: PartnerLoginIntent) {
  return api
    .post('/auth/otp/verify', {
      phone,
      otp,
      clientType: 'mobile',
      device: Platform.OS === 'ios' ? 'ios' : 'android',
      ...(loginIntent ? { loginIntent, partnerSignIn: true as const } : {}),
    })
    .then(unwrap<AuthSessionPayload>);
}

export function me() {
  return api.get('/auth/me').then(unwrap<AuthUser>);
}

export function refresh(refreshToken: string) {
  return refreshSession(refreshToken);
}

export function logout(refreshToken: string) {
  return logoutSession(refreshToken).then(() => null as null);
}
