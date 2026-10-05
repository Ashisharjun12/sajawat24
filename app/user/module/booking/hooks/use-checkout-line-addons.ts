import { addCartItem } from '@/api/cart.api';
import { getApiError } from '@/api/client';
import { queryClient } from '@/lib/query-client';
import { queryKeys } from '@/lib/query-keys';
import {
  addonSelectionsFromQty,
  cartLineQtyById,
  patchCartLineAddonQty,
} from '@/module/booking/lib/checkout-line-addons';
import { syncCartQueryCache } from '@/module/booking/hooks/use-cart-query';
import type { CartItemLine, CartSnapshot } from '@/module/booking/lib/cart-types';
import {
  addonMaxQuantity,
  isAddonAvailable,
} from '@/module/catalog/lib/addon-pricing';
import type { PublicAddonForCity } from '@/module/catalog/lib/product-detail';
import type { FulfillmentMode } from '@/module/catalog/components/ProductFulfillmentTabs';
import { isBackendCityId } from '@/lib/location-label';
import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';

type UseCheckoutLineAddonsArgs = {
  item: CartItemLine;
  cart: CartSnapshot;
  catalogAddons?: PublicAddonForCity[];
};

export function useCheckoutLineAddons({
  item,
  cart,
  catalogAddons = [],
}: UseCheckoutLineAddonsArgs) {
  const [pendingAddonId, setPendingAddonId] = useState<string | null>(null);
  const qtyById = useMemo(() => cartLineQtyById(item), [item]);

  const serviceCityId =
    cart.cityId && isBackendCityId(cart.cityId) ? cart.cityId : undefined;
  const pincode = cart.pincode?.replace(/\D/g, '').slice(0, 6) || undefined;

  const catalogById = useMemo(
    () => new Map(catalogAddons.map((a) => [a.id, a])),
    [catalogAddons],
  );

  const persistQty = useCallback(
    async (triggerAddonId: string, nextQtyById: Record<string, number>) => {
      if (!item.id || !item.productId) return;

      const fulfillment =
        cart.fulfillmentType === 'instant' || cart.fulfillmentType === 'scheduled'
          ? (cart.fulfillmentType as FulfillmentMode)
          : undefined;

      const prevCart = queryClient.getQueryData<CartSnapshot>(queryKeys.cart());
      if (prevCart) {
        const optimistic = patchCartLineAddonQty(
          prevCart,
          item.id,
          nextQtyById,
          catalogAddons,
        );
        syncCartQueryCache(queryClient, optimistic);
      }

      setPendingAddonId(triggerAddonId);

      try {
        const selections = addonSelectionsFromQty(nextQtyById);
        const updated = await addCartItem({
          productId: item.productId,
          quantity: item.quantity ?? 1,
          addons: selections.length ? selections : undefined,
          cityId: serviceCityId,
          pincode,
          scheduledAt: cart.scheduledAt ?? undefined,
          fulfillmentType: fulfillment,
        });
        syncCartQueryCache(queryClient, updated);
      } catch (err) {
        if (prevCart) syncCartQueryCache(queryClient, prevCart);
        Alert.alert('Could not update add-ons', getApiError(err));
      } finally {
        setPendingAddonId(null);
      }
    },
    [
      cart.fulfillmentType,
      cart.scheduledAt,
      catalogAddons,
      item.id,
      item.productId,
      item.quantity,
      pincode,
      serviceCityId,
    ],
  );

  const setQty = useCallback(
    (addonId: string, qty: number) => {
      const next = { ...qtyById };
      if (qty <= 0) delete next[addonId];
      else next[addonId] = qty;
      void persistQty(addonId, next);
    },
    [persistQty, qtyById],
  );

  const resolveMax = useCallback(
    (addonId: string) => {
      const cat = catalogById.get(addonId);
      return cat ? addonMaxQuantity(cat) : 99;
    },
    [catalogById],
  );

  const increment = useCallback(
    (addonId: string) => {
      const cat = catalogById.get(addonId);
      if (cat && !isAddonAvailable(cat.pricePaise)) return;
      const max = resolveMax(addonId);
      const current = qtyById[addonId] ?? 0;
      setQty(addonId, current === 0 ? 1 : Math.min(max, current + 1));
    },
    [catalogById, qtyById, resolveMax, setQty],
  );

  const decrement = useCallback(
    (addonId: string) => {
      const current = qtyById[addonId] ?? 0;
      setQty(addonId, Math.max(0, current - 1));
    },
    [qtyById, setQty],
  );

  const toggle = useCallback(
    (addonId: string) => {
      const cat = catalogById.get(addonId);
      if (cat && !isAddonAvailable(cat.pricePaise)) return;
      const on = (qtyById[addonId] ?? 0) > 0;
      setQty(addonId, on ? 0 : 1);
    },
    [catalogById, qtyById, setQty],
  );

  return {
    qtyById,
    pendingAddonId,
    setQty,
    increment,
    decrement,
    toggle,
    resolveMax,
    catalogById,
  };
}
