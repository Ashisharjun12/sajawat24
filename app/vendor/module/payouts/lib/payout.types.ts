export type PayoutStatus = 'PAID' | 'PROCESSING' | 'PENDING' | 'FAILED' | 'CANCELLED';

export type SettlementPayout = {
  id: string;
  dateLabel: string;
  amount: number;
  status: PayoutStatus;
  title: string;
};

export type PayoutSummary = {
  available: number;
  pending: number;
  earnedThisMonth: number;
  codDues: number;
  codCapWarning: boolean;
  minWithdrawalPaise: number;
  canWithdraw: boolean;
  withdrawDisabledReason: string | null;
};

export type WalletTransactionDirection = 'credit' | 'debit';

export type WalletTransaction = {
  id: string;
  title: string;
  dateLabel: string;
  amountPaise: number;
  direction: WalletTransactionDirection;
};

export const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  PAID: 'Paid',
  PROCESSING: 'Processing',
  PENDING: 'Pending',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};
