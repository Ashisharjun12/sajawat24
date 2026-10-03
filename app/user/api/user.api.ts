import { api, unwrap } from '@/api/client';
import type { PublicUser } from '@/lib/auth.types';

export function getMe() {
  return api.get('/user/me').then(unwrap<{ user: PublicUser }>);
}

export function linkPhone(phone: string, otp: string) {
  return api.post('/user/link-phone', { phone, otp }).then(unwrap<{ user: PublicUser }>);
}

export function linkGoogle(idToken: string) {
  return api.post('/user/link-google', { idToken }).then(unwrap<{ user: PublicUser }>);
}
