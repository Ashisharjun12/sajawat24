import { usePushRegistration } from '@/hooks/use-push-registration';

/** Registers Expo push token with backend when the customer session is active. */
export function PushRegistrationBridge() {
  usePushRegistration();
  return null;
}
