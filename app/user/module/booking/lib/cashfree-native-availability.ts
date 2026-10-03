import { NativeModules, Platform } from 'react-native';

/**
 * Official package: `react-native-cashfree-pg-sdk` (Cashfree Payments, npm).
 * Native module exists only after a dev/production build — not in Expo Go.
 * Rebuild: `cd app/user && npx expo run:android`
 */
export function isCashfreePgNativeLinked(): boolean {
  if (Platform.OS === 'web') return false;
  return Boolean(NativeModules.CashfreePgApi);
}

export const CASHFREE_NATIVE_REBUILD_HINT =
  'Cashfree UPI needs a dev build with native modules. Run: npx expo run:android (not Expo Go), then try again.';
