import {
  applyCartCoupon,
  getCart,
  patchCartItem,
  removeCartCoupon,
  removeCartItem,
} from '@/api/cart.api';
import { queryKeys } from '@/lib/query-keys';
import { emptyCart, type CartSnapshot } from '@/module/booking/lib/cart-types';
import type { CouponLike } from '@/module/booking/lib/coupon-preview';
import { useCartStore } from '@/store/cart.store';
import type { QueryClient } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

function syncCartCount(cart: { itemCount?: number }) {
  useCartStore.getState().setItemCount(cart?.itemCount ?? 0);
}

export function syncCartQueryCache(
  queryClient: QueryClient,
  cart: Awaited<ReturnType<typeof getCart>>,
) {
  queryClient.setQueryData(queryKeys.cart(), cart);
  syncCartCount(cart);
}

export function useCartQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.cart(),
    queryFn: async () => {
      const cart = await getCart();
      syncCartCount(cart);
      return cart;
    },
    staleTime: 15_000,
    enabled,
  });
}

export type ApplyCouponInput = {
  code: string;
  /** Listed coupon row — used for optimistic applied state before API returns. */
  coupon?: CouponLike | null;
};

function resolveCouponCodeInput(input: ApplyCouponInput | string): string {
  const raw = typeof input === 'string' ? input : input.code;
  return raw.trim();
}

export function useCartMutations() {
  const queryClient = useQueryClient();

  function invalidate(cart: Awaited<ReturnType<typeof getCart>>) {
    queryClient.setQueryData(queryKeys.cart(), cart);
    syncCartCount(cart);
  }

  const patchQty = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      patchCartItem(id, { quantity }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeCartItem(id),
    onSuccess: invalidate,
  });

  const applyCoupon = useMutation({
    mutationFn: (input: ApplyCouponInput | string) => applyCartCoupon(resolveCouponCodeInput(input)),
    onMutate: async (input) => {
      const code = resolveCouponCodeInput(input);
      if (!code) return { previous: undefined as CartSnapshot | undefined };
      const hint = typeof input === 'string' ? null : input.coupon;
      await queryClient.cancelQueries({ queryKey: queryKeys.cart() });
      const previous = queryClient.getQueryData<CartSnapshot>(queryKeys.cart());
      if (previous) {
        queryClient.setQueryData<CartSnapshot>(queryKeys.cart(), {
          ...previous,
          appliedCoupon: hint
            ? { ...hint, code: hint.code?.trim() || code }
            : { code },
        });
      }
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.cart(), context.previous);
      }
    },
    onSuccess: invalidate,
  });

  const clearCoupon = useMutation({
    mutationFn: () => removeCartCoupon(),
    onSuccess: invalidate,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.cart() });

  return { patchQty, remove, applyCoupon, clearCoupon, refresh };
}

export function useCartData() {
  const query = useCartQuery();
  return {
    cart: query.data ?? emptyCart,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
