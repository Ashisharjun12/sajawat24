import { getPaymentMethods, type PaymentMethodsResponse } from '@/api/payments.api';
import { queryKeys } from '@/lib/query-keys';
import { useQuery } from '@tanstack/react-query';

const STALE_MS = 5 * 60_000;

export type PlatformPaymentFlags = {
  cod: boolean;
  online: boolean;
  provider: string | null;
};

function normalizePlatformPay(data: PaymentMethodsResponse | undefined): PlatformPaymentFlags {
  return {
    cod: data?.cod !== false,
    online: Boolean(data?.online),
    provider: data?.provider ?? null,
  };
}

export function usePaymentMethodsQuery() {
  const query = useQuery({
    queryKey: queryKeys.paymentMethods(),
    queryFn: getPaymentMethods,
    staleTime: STALE_MS,
    retry: 2,
  });

  return {
    platformPay: normalizePlatformPay(query.data),
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
