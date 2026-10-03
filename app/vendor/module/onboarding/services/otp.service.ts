import { requestOtp, verifyOtp } from '@/api/auth.api';
import { getAndroidOtpAppHash } from '@/lib/android-app-hash';
import { useAuthStore } from '@/store/auth.store';

export async function sendSignInOtp(phone: string) {
  const androidAppHash = await getAndroidOtpAppHash();
  const loginIntent = useAuthStore.getState().pendingLoginIntent ?? undefined;
  const result = await requestOtp(phone, androidAppHash, loginIntent);
  if (result.otp) {
    useAuthStore.setState({ lastDevOtp: result.otp });
  }
  return result;
}

export async function verifySignInOtp(phone: string, otp: string) {
  const loginIntent = useAuthStore.getState().pendingLoginIntent ?? undefined;
  const result = await verifyOtp(phone, otp, loginIntent);
  await useAuthStore.getState().setSession(result);
  return result;
}

export async function verifyRegisterOtp(phone: string, otp: string) {
  return verifySignInOtp(phone, otp);
}
