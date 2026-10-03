import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

const HASH_PATTERN = /^[A-Za-z0-9+/=]{11}$/;

export function canUseAndroidSmsAutofill() {
  if (Platform.OS !== 'android') return false;
  return Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}

export async function getAndroidOtpAppHash(): Promise<string | undefined> {
  if (!canUseAndroidSmsAutofill()) return undefined;

  try {
    const mod = require('@avasapp/react-native-otp-autofill/build/module') as {
      AvasOtpAutofillModule?: { getHash: () => Promise<string[]> };
      default?: { getHash: () => Promise<string[]> };
    };
    const module = mod.AvasOtpAutofillModule ?? mod.default;
    if (!module?.getHash) return undefined;

    const hashes = await module.getHash();
    const hash = hashes?.[0]?.trim();
    return hash && HASH_PATTERN.test(hash) ? hash : undefined;
  } catch {
    return undefined;
  }
}
