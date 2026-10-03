import { openCashfreeUpiAndroid } from '@/module/booking/lib/cashfree-payment-bridge';
import { isCashfreePgNativeLinked } from '@/module/booking/lib/cashfree-native-availability';
import type { CheckoutCustomerForm } from '@/module/booking/lib/checkout-form-types';
import { Platform } from 'react-native';

export type RazorpayCheckoutPayload = {
  provider?: 'razorpay' | 'cashfree';
  keyId: string;
  amountPaise: number;
  currency?: string;
  name?: string;
  description?: string;
  orderId: string;
  decoryOrderId: string;
  paymentSessionId?: string;
  environment?: string;
};

export type CashfreeCheckoutPayload = {
  provider: 'cashfree';
  paymentSessionId: string;
  orderId: string;
  decoryOrderId: string;
  environment?: string;
};

export type OnlineCheckoutPayload = RazorpayCheckoutPayload | CashfreeCheckoutPayload;

export async function openRazorpayNative(
  checkout: RazorpayCheckoutPayload,
  customer: CheckoutCustomerForm,
): Promise<Record<string, unknown>> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RazorpayCheckout = require('react-native-razorpay').default as {
    open: (options: Record<string, unknown>) => Promise<{
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }>;
  };

  const response = await RazorpayCheckout.open({
    key: checkout.keyId,
    amount: checkout.amountPaise,
    currency: checkout.currency || 'INR',
    name: checkout.name || 'DeccorBuddys',
    description: checkout.description,
    order_id: checkout.orderId,
    prefill: {
      name: customer.name,
      email: customer.email,
      contact: customer.phone.replace(/\D/g, '').slice(-10),
    },
  });

  return {
    provider: 'razorpay',
    orderId: checkout.decoryOrderId,
    razorpayOrderId: response.razorpay_order_id,
    razorpayPaymentId: response.razorpay_payment_id,
    razorpaySignature: response.razorpay_signature,
  };
}

function cashfreeCheckoutHtml(paymentSessionId: string, environment: string) {
  const mode = environment === 'production' ? 'production' : 'sandbox';
  const session = JSON.stringify(paymentSessionId);
  return `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1" />
<script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script></head>
<body style="margin:0;background:#fff;font-family:sans-serif">
<div id="status" style="padding:24px;text-align:center">Opening secure payment…</div>
<script>
(function(){
  var sessionId = ${session};
  var mode = ${JSON.stringify(mode)};
  function post(obj){ if(window.ReactNativeWebView){ window.ReactNativeWebView.postMessage(JSON.stringify(obj)); } }
  try {
    var cashfree = Cashfree({ mode: mode });
    cashfree.checkout({ paymentSessionId: sessionId, redirectTarget: '_self' })
      .then(function(result){
        if(result && result.error){ post({ type:'error', message: result.error.message || 'Payment failed' }); return; }
        post({ type:'success' });
      })
      .catch(function(err){ post({ type:'error', message: (err && err.message) || 'Payment failed' }); });
  } catch(e){ post({ type:'error', message: String(e) }); }
})();
</script></body></html>`;
}

type CashfreeOpener = (input: {
  paymentSessionId: string;
  environment: string;
}) => Promise<void>;

let cashfreeOpener: CashfreeOpener | null = null;

export function registerCashfreeCheckoutOpener(opener: CashfreeOpener | null) {
  cashfreeOpener = opener;
}

export async function openCashfreeNative(
  checkout: CashfreeCheckoutPayload,
): Promise<Record<string, unknown>> {
  if (!checkout.paymentSessionId) {
    throw new Error('Cashfree session missing');
  }

  const sessionCheckout: CashfreeCheckoutPayload = {
    ...checkout,
    orderId: checkout.orderId || checkout.decoryOrderId,
    environment: checkout.environment ?? 'sandbox',
  };

  if (Platform.OS === 'android' && isCashfreePgNativeLinked()) {
    return openCashfreeUpiAndroid(sessionCheckout);
  }

  if (!cashfreeOpener) {
    throw new Error('Cashfree checkout is not ready. Restart the app and try again.');
  }
  await cashfreeOpener({
    paymentSessionId: sessionCheckout.paymentSessionId,
    environment: sessionCheckout.environment ?? 'sandbox',
  });
  return {
    provider: 'cashfree',
    orderId: checkout.decoryOrderId,
  };
}

export { cashfreeCheckoutHtml };

export function isCashfreeCheckout(
  checkout: OnlineCheckoutPayload & { paymentSessionId?: string },
): checkout is CashfreeCheckoutPayload {
  return checkout.provider === 'cashfree';
}

export async function openOnlineCheckout(
  checkout: OnlineCheckoutPayload & { paymentSessionId?: string; keyId?: string },
  customer: CheckoutCustomerForm,
): Promise<Record<string, unknown>> {
  if (isCashfreeCheckout(checkout)) {
    const sessionId = checkout.paymentSessionId;
    if (!sessionId) {
      throw new Error('Cashfree session missing');
    }
    const merchantOrderId =
      (checkout as CashfreeCheckoutPayload).orderId ?? checkout.decoryOrderId;
    return openCashfreeNative({
      provider: 'cashfree',
      paymentSessionId: sessionId,
      orderId: merchantOrderId,
      decoryOrderId: checkout.decoryOrderId,
      environment: checkout.environment,
    });
  }
  if (!checkout.keyId) {
    throw new Error('Online checkout is misconfigured');
  }
  return openRazorpayNative(
    { ...checkout, keyId: checkout.keyId, decoryOrderId: checkout.decoryOrderId },
    customer,
  );
}
