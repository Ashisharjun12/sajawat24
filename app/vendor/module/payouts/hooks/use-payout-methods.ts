import {
  addBankPayoutMethod,
  addUpiPayoutMethod,
  listPayoutMethods,
  removePayoutMethod,
  setDefaultPayoutMethod,
} from '@/api/payout-methods.api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const payoutMethodKeys = {
  all: ['payout-methods'] as const,
  list: () => [...payoutMethodKeys.all, 'list'] as const,
};

export function usePayoutMethods() {
  return useQuery({
    queryKey: payoutMethodKeys.list(),
    queryFn: listPayoutMethods,
  });
}

export function useAddBankPayoutMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addBankPayoutMethod,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: payoutMethodKeys.all });
    },
  });
}

export function useAddUpiPayoutMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addUpiPayoutMethod,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: payoutMethodKeys.all });
    },
  });
}

export function useSetDefaultPayoutMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setDefaultPayoutMethod,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: payoutMethodKeys.all });
    },
  });
}

export function useRemovePayoutMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removePayoutMethod,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: payoutMethodKeys.all });
    },
  });
}
