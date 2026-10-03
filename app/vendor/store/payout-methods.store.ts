import type { BankAccount, UpiId } from '@/module/payouts/lib/payout-method.types';
import { create } from 'zustand';

type AddBankInput = Omit<BankAccount, 'id' | 'createdAt'>;
type AddUpiInput = Omit<UpiId, 'id' | 'createdAt'>;

type PayoutMethodsState = {
  bankAccounts: BankAccount[];
  upiIds: UpiId[];
  addBankAccount: (input: AddBankInput) => void;
  addUpiId: (input: AddUpiInput) => void;
  removeBankAccount: (id: string) => void;
  removeUpiId: (id: string) => void;
};

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const usePayoutMethodsStore = create<PayoutMethodsState>((set) => ({
  bankAccounts: [],
  upiIds: [],

  addBankAccount: (input) =>
    set((state) => ({
      bankAccounts: [
        {
          ...input,
          id: createId('bank'),
          createdAt: new Date().toISOString(),
        },
        ...state.bankAccounts,
      ],
    })),

  addUpiId: (input) =>
    set((state) => ({
      upiIds: [
        {
          ...input,
          id: createId('upi'),
          createdAt: new Date().toISOString(),
        },
        ...state.upiIds,
      ],
    })),

  removeBankAccount: (id) =>
    set((state) => ({
      bankAccounts: state.bankAccounts.filter((account) => account.id !== id),
    })),

  removeUpiId: (id) =>
    set((state) => ({
      upiIds: state.upiIds.filter((upi) => upi.id !== id),
    })),
}));
