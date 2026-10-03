import {
  completeCashfreeVerify,
  failCashfreePayment,
} from '@/module/booking/lib/cashfree-payment-bridge';
import { isCashfreePgNativeLinked } from '@/module/booking/lib/cashfree-native-availability';
import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Registers Cashfree PG SDK callbacks once at app root (required before doUPIPayment).
 * Android: UPI Intent. iOS: callback registered but checkout uses WebView fallback.
 */
export function CashfreePaymentGatewayHost() {
  useEffect(() => {
    if (Platform.OS === 'web' || !isCashfreePgNativeLinked()) return;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { CFPaymentGatewayService } = require('react-native-cashfree-pg-sdk');

    CFPaymentGatewayService.setCallback({
      onVerify(orderID: string) {
        completeCashfreeVerify(orderID);
      },
      onError(
        error: { getMessage?: () => string },
        orderID: string,
      ) {
        failCashfreePayment(error, orderID);
      },
    });

    return () => {
      CFPaymentGatewayService.removeCallback();
    };
  }, []);

  return null;
}
