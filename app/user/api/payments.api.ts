import { api, unwrap } from '@/api/client';

export type PaymentMethodsResponse = {
  cod?: boolean;
  online?: boolean;
  provider?: string | null;
};

export function getPaymentMethods(): Promise<PaymentMethodsResponse> {
  return api.get('/payments/methods').then(unwrap);
}

export function verifyPayment(body: Record<string, unknown>) {
  return api.post('/payments/verify', body).then(unwrap);
}
