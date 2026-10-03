import {
  applyCartCoupon,
  getCart,
  patchCartItem,
  removeCartCoupon,
  removeCartItem,
} from '@/api/cart.api';
import { queryKeys } from '@/lib/query-keys';
import { emptyCart } from '@/module/booking/lib/cart-types';
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
    mutationFn: (code: string) => applyCartCoupon(code),
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
