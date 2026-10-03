import {
  CASHFREE_NATIVE_REBUILD_HINT,
  isCashfreePgNativeLinked,
} from '@/module/booking/lib/cashfree-native-availability';
import { Platform } from 'react-native';

export type CashfreeUpiCheckoutInput = {
  paymentSessionId: string;
  orderId: string;
  decoryOrderId: string;
  environment?: string;
};

type PendingCashfree = {
  resolve: (value: Record<string, unknown>) => void;
  reject: (err: Error) => void;
  decoryOrderId: string;
};

let pending: PendingCashfree | null = null;

export function completeCashfreeVerify(_orderIdFromSdk: string) {
  if (!pending) return;
  const { resolve, decoryOrderId } = pending;
  pending = null;
  resolve({
    provider: 'cashfree',
    orderId: decoryOrderId,
  });
}

export function failCashfreePayment(
  error: { getMessage?: () => string },
  _orderIdFromSdk: string,
) {
  if (!pending) return;
  const { reject } = pending;
  pending = null;
  const message = error?.getMessage?.() ?? 'Payment failed or was cancelled';
  reject(new Error(message));
}

export function clearPendingCashfreePayment() {
  pending = null;
}

export async function openCashfreeUpiAndroid(
  checkout: CashfreeUpiCheckoutInput,
): Promise<Record<string, unknown>> {
  if (Platform.OS !== 'android') {
    throw new Error('Cashfree UPI Intent is only available on Android');
  }
  if (!isCashfreePgNativeLinked()) {
    throw new Error(CASHFREE_NATIVE_REBUILD_HINT);
  }
  if (!checkout.paymentSessionId) {
    throw new Error('Cashfree session missing');
  }

  const merchantOrderId = checkout.orderId || checkout.decoryOrderId;

  return new Promise((resolve, reject) => {
    if (pending) {
      reject(new Error('Another payment is already in progress'));
      return;
    }

    pending = { resolve, reject, decoryOrderId: checkout.decoryOrderId };

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { CFPaymentGatewayService } = require('react-native-cashfree-pg-sdk');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const {
        CFEnvironment,
        CFSession,
        CFThemeBuilder,
        CFUPIIntentCheckoutPayment,
      } = require('cashfree-pg-api-contract');

      const env =
        checkout.environment === 'production'
          ? CFEnvironment.PRODUCTION
          : CFEnvironment.SANDBOX;

      const session = new CFSession(
        checkout.paymentSessionId,
        merchantOrderId,
        env,
      );

      const theme = new CFThemeBuilder()
        .setNavigationBarBackgroundColor('#171717')
        .setNavigationBarTextColor('#FFFFFF')
        .setButtonBackgroundColor('#F59E0B')
        .setButtonTextColor('#171717')
        .setPrimaryTextColor('#171717')
        .setSecondaryTextColor('#737373')
        .setBackgroundColor('#FFFFFF')
        .build();

      const upiPayment = new CFUPIIntentCheckoutPayment(session, theme);
      CFPaymentGatewayService.doUPIPayment(upiPayment);
    } catch (err) {
      pending = null;
      reject(err instanceof Error ? err : new Error('Could not start Cashfree payment'));
    }
  });
}
