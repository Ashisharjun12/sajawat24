import type { CustomerAddress } from '@/api/addresses.api';
import { applySelectedDeliveryAddress } from '@/module/location/lib/apply-selected-delivery-address';
import { useCheckoutStore } from '@/store/checkout.store';
import { useDeliveryLocationStore } from '@/store/delivery-location.store';
import type { QueryClient } from '@tanstack/react-query';

/** Avoid re-applying account default on every checkout visit when user never saved a delivery choice. */
let checkoutDefaultAddressSeeded = false;

/**
 * Checkout delivery follows persisted delivery selection.
 * Account default is used only once when the user has no saved delivery yet.
 */
export async function syncCheckoutDeliveryFromStores(
  addresses: CustomerAddress[],
  queryClient?: QueryClient,
): Promise<void> {
  const deliveryState = useDeliveryLocationStore.getState();
  if (!deliveryState.hydrated) return;

  const { selectedAddressId, snapshot } = deliveryState;

  if (selectedAddressId) {
    const addr = addresses.find((a) => a.id === selectedAddressId);
    if (addr?.cityId) {
      useCheckoutStore.getState().setFromAddress(addr);
      return;
    }
  }

  if (snapshot?.cityId) {
    useCheckoutStore.getState().setFromSnapshot(snapshot);
    return;
  }

  if (checkoutDefaultAddressSeeded || addresses.length === 0) return;

  const preferred = addresses.find((a) => a.isDefault) ?? addresses[0];
  if (!preferred?.cityId) return;

  checkoutDefaultAddressSeeded = true;
  await applySelectedDeliveryAddress(preferred, queryClient);
}
