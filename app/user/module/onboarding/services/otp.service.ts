import { requestOtp, verifyOtp } from '@/api/auth.api';
import { getAndroidOtpAppHash } from '@/lib/android-app-hash';
import { toAuthSessionPayload } from '@/module/auth/lib/consumer-session';
import { useAuthStore } from '@/store/auth.store';

export async function sendSignInOtp(phone: string) {
  const androidAppHash = await getAndroidOtpAppHash();
  const result = await requestOtp(phone, androidAppHash);
  if (result.otp) {
    useAuthStore.setState({ lastDevOtp: result.otp });
  }
  return result;
}

export async function verifySignInOtp(phone: string, otp: string) {
  const data = await verifyOtp(phone, otp);
  const payload = toAuthSessionPayload(data);
  await useAuthStore.getState().setSession(payload);
  return payload;
}
