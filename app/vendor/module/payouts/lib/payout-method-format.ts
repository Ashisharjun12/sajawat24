import type { PayoutMethod } from '@/api/payout-methods.api';

export function resolveDefaultPayoutMethod(methods: PayoutMethod[]): PayoutMethod | null {
  if (methods.length === 0) return null;
  return methods.find((method) => method.isDefault) ?? methods[0];
}

export function formatPayoutMethodLabel(method: PayoutMethod): string {
  if (method.type === 'upi') {
    return method.upiId ?? 'UPI account';
  }
  const last4 = method.accountNumberLast4 ?? '';
  return `${method.bankName ?? 'Bank'} · •••• ${last4}`;
}

export function formatPayoutMethodSubtitle(method: PayoutMethod): string {
  if (method.type === 'upi') {
    return method.accountHolderName;
  }
  return [method.accountHolderName, method.ifsc].filter(Boolean).join(' · ');
}

export function maskAccountNumber(accountNumber: string) {
  const digits = accountNumber.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  return `****${digits.slice(-4)}`;
}

export function normalizeIfsc(value: string) {
  return value.replace(/\s/g, '').toUpperCase();
}

export function isValidIfsc(value: string) {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(normalizeIfsc(value));
}

export function isValidUpiVpa(value: string) {
  return /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/.test(value.trim());
}
