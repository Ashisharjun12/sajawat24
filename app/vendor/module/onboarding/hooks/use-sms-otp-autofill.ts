import { canUseAndroidSmsAutofill } from '@/lib/android-app-hash';
import { useEffect, useRef } from 'react';

type UseSmsOtpAutofillOptions = {
  onOtpReceived: (otp: string) => void;
  length?: number;
};

type OtpAutofillModule = {
  startOtpListener: () => Promise<boolean>;
  stopSmsRetriever: () => Promise<string>;
  addListener: (
    event: 'onSmsReceived' | 'onTimeout' | 'onError',
    callback: (payload: Record<string, string | number | undefined>) => void
  ) => { remove: () => void };
};

function sanitizeOtp(value: string, length: number) {
  return value.replace(/\D/g, '').slice(0, length);
}

function loadOtpAutofillModule(): OtpAutofillModule | null {
  if (!canUseAndroidSmsAutofill()) return null;

  try {
    const mod = require('@avasapp/react-native-otp-autofill/build/module') as {
      AvasOtpAutofillModule?: OtpAutofillModule;
      default?: OtpAutofillModule;
    };
    return mod.AvasOtpAutofillModule ?? mod.default ?? null;
  } catch {
    return null;
  }
}

/**
 * Android SMS Retriever autofill for production/dev builds.
 * iOS uses TextInput oneTimeCode autofill in OtpInput.
 */
export function useSmsOtpAutofill({ onOtpReceived, length = 6 }: UseSmsOtpAutofillOptions) {
  const onOtpReceivedRef = useRef(onOtpReceived);

  useEffect(() => {
    onOtpReceivedRef.current = onOtpReceived;
  }, [onOtpReceived]);

  useEffect(() => {
    const module = loadOtpAutofillModule();
    if (!module) return;

    const subscriptions: { remove: () => void }[] = [];
    let active = false;

    function cleanup() {
      subscriptions.forEach((subscription) => subscription.remove());
      subscriptions.length = 0;
      module.stopSmsRetriever().catch(() => {});
      active = false;
    }

    async function startListener() {
      try {
        subscriptions.push(
          module.addListener('onSmsReceived', ({ otp }) => {
            if (typeof otp !== 'string') return;
            const cleaned = sanitizeOtp(otp, length);
            if (cleaned.length === length) {
              onOtpReceivedRef.current(cleaned);
            }
            cleanup();
          })
        );

        subscriptions.push(
          module.addListener('onTimeout', () => {
            cleanup();
          })
        );

        subscriptions.push(
          module.addListener('onError', () => {
            cleanup();
          })
        );

        const started = await module.startOtpListener();
        if (!started) {
          cleanup();
          return;
        }

        active = true;
      } catch {
        cleanup();
      }
    }

    startListener();

    return () => {
      if (active) cleanup();
    };
  }, [length]);
}
