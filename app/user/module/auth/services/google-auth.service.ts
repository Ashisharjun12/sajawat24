import { googleLogin } from '@/api/auth.api';
import type { AuthSessionPayload } from '@/lib/auth.types';
import { toAuthSessionPayload } from '@/module/auth/lib/consumer-session';
import { GOOGLE_WEB_CLIENT_ID } from '@/lib/env';
import { useAuthStore } from '@/store/auth.store';
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';

export { statusCodes, isErrorWithCode };

export async function signInWithGoogle(): Promise<AuthSessionPayload> {
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

  const data = await googleLogin(idToken);
  const payload = toAuthSessionPayload(data);

  await useAuthStore.getState().setSession(payload);
  return payload;
}
