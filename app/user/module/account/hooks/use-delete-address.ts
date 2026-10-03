import type { CustomerAddress } from '@/api/addresses.api';
import { getApiError } from '@/api/client';
import { useAddressMutations } from '@/module/account/hooks/use-addresses-query';
import { useDeliveryLocationStore } from '@/store/delivery-location.store';
import { emptyCheckoutDelivery, useCheckoutStore } from '@/store/checkout.store';
import { Alert } from 'react-native';

export function useDeleteAddress(allAddresses: CustomerAddress[]) {
  const { remove } = useAddressMutations();

  async function deleteAddress(addr: CustomerAddress) {
    try {
      const wasSelected = useDeliveryLocationStore.getState().selectedAddressId === addr.id;
      const remaining = allAddresses.filter((a) => a.id !== addr.id);

      await remove.mutateAsync(addr.id);

      if (!wasSelected) return;

      const next = remaining.find((a) => a.isDefault) ?? remaining[0];
      if (next?.cityId) {
        await useDeliveryLocationStore.getState().setFromAddress(next);
        useCheckoutStore.getState().setFromAddress(next);
        return;
      }
      await useDeliveryLocationStore.getState().clearSelection();
      useCheckoutStore.getState().setDelivery(emptyCheckoutDelivery, 'Home');
    } catch (err) {
      Alert.alert('Could not delete', getApiError(err));
      throw err;
    }
  }

  return { deleteAddress, isDeleting: remove.isPending };
}
