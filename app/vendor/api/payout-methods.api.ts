import { api, unwrap } from '@/api/client';

export type PayoutMethod = {
  id: string;
  type: 'bank' | 'upi';
  isDefault: boolean;
  accountHolderName: string;
  bankName: string | null;
  accountNumberLast4: string | null;
  ifsc: string | null;
  upiId: string | null;
  createdAt: string;
};

export function listPayoutMethods() {
  return api.get('/vendor/payout-methods').then(unwrap<PayoutMethod[]>);
}

export function addBankPayoutMethod(payload: {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  isDefault?: boolean;
}) {
  return api.post('/vendor/payout-methods/bank', payload).then(unwrap<PayoutMethod>);
}

export function addUpiPayoutMethod(payload: {
  accountHolderName: string;
  upiId: string;
  isDefault?: boolean;
}) {
  return api.post('/vendor/payout-methods/upi', payload).then(unwrap<PayoutMethod>);
}

export function setDefaultPayoutMethod(id: string) {
  return api.patch(`/vendor/payout-methods/${id}/default`).then(unwrap<PayoutMethod>);
}

export function removePayoutMethod(id: string) {
  return api.delete(`/vendor/payout-methods/${id}`).then(unwrap<{ ok: boolean }>);
}
