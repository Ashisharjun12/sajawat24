import { requestOtp } from '@/api/auth.api';
import { linkPhone } from '@/api/user.api';
import { mapPublicUserToCustomer } from '@/lib/auth.types';
import { getAndroidOtpAppHash } from '@/lib/android-app-hash';
import { useAuthStore } from '@/store/auth.store';

export async function sendLinkPhoneOtp(phone: string) {
  const androidAppHash = await getAndroidOtpAppHash();
  const result = await requestOtp(phone, androidAppHash);
  if (result.otp) {
    useAuthStore.setState({ lastDevOtp: result.otp });
  }
  return result;
}

export async function confirmLinkPhone(phone: string, otp: string) {
  const data = await linkPhone(phone, otp);
  const customer = mapPublicUserToCustomer(data.user);
  await useAuthStore.getState().updateUser(customer);
  return customer;
}
