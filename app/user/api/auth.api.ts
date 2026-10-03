import { api, unwrap } from '@/api/client';
import type { MobileAuthResponse, OtpRequestResult } from '@/lib/auth.types';
import { Platform } from 'react-native';

export function googleLogin(idToken: string) {
  return api
    .post('/auth/google', {
      idToken,
      clientType: 'mobile',
      device: 'android',
    })
    .then(unwrap<MobileAuthResponse>);
}

export function requestOtp(phone: string, androidAppHash?: string) {
  return api
    .post('/auth/otp/request', {
      phone,
      ...(androidAppHash ? { androidAppHash } : {}),
    })
    .then(unwrap<OtpRequestResult>);
}

export function verifyOtp(phone: string, otp: string) {
  return api
    .post('/auth/otp/verify', {
      phone,
      otp,
      clientType: 'mobile',
      device: Platform.OS === 'ios' ? 'ios' : 'android',
    })
    .then(unwrap<MobileAuthResponse>);
}
