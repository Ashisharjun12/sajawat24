import { api, unwrap } from '@/api/client';

export type WalletSummary = {
  pendingPaise: number;
  availablePaise: number;
  codDuesPaise: number;
  earnedPaise: number;
  earnedThisMonthPaise: number;
  minWithdrawalPaise: number;
  codMaxDuePaise: number;
  autoNetCodFromEarnings: boolean;
  assignable: boolean;
  hasPayoutMethod: boolean;
  hasActiveWithdrawal: boolean;
};

export type PayoutRequest = {
  id: string;
  vendorId: string;
  vendorName: string;
  amountPaise: number;
  status: string;
  provider: string | null;
  createdAt: string;
};

export type WalletActivityItem = {
  id: string;
  type: 'earning' | 'cod_due' | 'cod_settled' | 'withdrawal' | 'withdrawal_failed_reversal';
  title: string;
  amountPaise: number;
  direction: 'credit' | 'debit';
  createdAt: string;
  orderId: string | null;
  orderReference: string | null;
  payoutRequestId: string | null;
  status: string | null;
};

export function getWalletSummary() {
  return api.get('/vendor/wallet/summary').then(unwrap<WalletSummary>);
}

export function getWalletActivity(params?: {
  page?: number;
  limit?: number;
  type?: string;
  from?: string;
  to?: string;
}) {
  return api
    .get('/vendor/wallet/activity', { params })
    .then(unwrap<{ items: WalletActivityItem[]; total: number; page: number; limit: number }>);
}

export function getWalletTransactions(params?: { page?: number; limit?: number }) {
  return api
    .get('/vendor/wallet/transactions', { params })
    .then(unwrap<{ items: unknown[]; total: number; page: number; limit: number }>);
}

export function requestWalletWithdraw(amountPaise: number, payoutMethodId: string) {
  return api
    .post('/vendor/wallet/withdraw', { amountPaise, payoutMethodId })
    .then(unwrap);
}

export function getPayoutRequests(params?: { page?: number; limit?: number }) {
  return api
    .get('/vendor/wallet/payout-requests', { params })
    .then(unwrap<{ items: PayoutRequest[]; total: number; page: number; limit: number }>);
}
