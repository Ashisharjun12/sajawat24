import { linkGoogle } from '@/api/user.api';
import { mapPublicUserToCustomer } from '@/lib/auth.types';
import { GOOGLE_WEB_CLIENT_ID } from '@/lib/env';
import { useAuthStore } from '@/store/auth.store';
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';

export { isErrorWithCode, statusCodes };

export async function linkGoogleAccount() {
  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new Error('Google Sign-In is not configured on this build.');
  }

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result = await GoogleSignin.signIn();

  if (result.type !== 'success') {
    const cancelled = Object.assign(new Error('Sign in cancelled'), {
      code: statusCodes.SIGN_IN_CANCELLED,
    });
    throw cancelled;
  }

  const idToken = result.data.idToken;
  if (!idToken) {
    throw new Error('Google did not return a sign-in token. Try again.');
  }

  const data = await linkGoogle(idToken);
  const customer = mapPublicUserToCustomer(data.user);
  await useAuthStore.getState().updateUser(customer);
  return customer;
}
