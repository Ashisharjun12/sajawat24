import type { CustomerAddress } from '@/api/addresses.api';
import { setCartDeliveryGeo, setCartLocation } from '@/api/cart.api';
import { syncCartQueryCache } from '@/module/booking/hooks/use-cart-query';
import { useCheckoutStore } from '@/store/checkout.store';
import { useDeliveryLocationStore } from '@/store/delivery-location.store';
import type { QueryClient } from '@tanstack/react-query';

/** Persist delivery choice locally and align server cart city/pin/geo when possible. */
export async function applySelectedDeliveryAddress(
  addr: CustomerAddress,
  queryClient?: QueryClient,
) {
  await useDeliveryLocationStore.getState().setFromAddress(addr);
  useCheckoutStore.getState().setFromAddress(addr);

  const cityId = addr.cityId;
  const pincode = addr.pincode.replace(/\D/g, '').slice(0, 6);
  if (!cityId || pincode.length !== 6) return;

  try {
    let cart = await setCartLocation({ cityId, pincode });
    if (addr.latitude != null && addr.longitude != null) {
      cart = await setCartDeliveryGeo({
        latitude: addr.latitude,
        longitude: addr.longitude,
      });
    }
    if (queryClient) {
      syncCartQueryCache(queryClient, cart);
    }
  } catch {
    // Checkout can still proceed; cart location may refresh on next load.
  }
}
