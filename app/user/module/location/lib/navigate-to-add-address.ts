import { ADD_ADDRESS_HREF } from '@/lib/select-location-route';
import { emptyAddressForm } from '@/module/account/lib/address-form';
import { resolveAddressDeliveryContext } from '@/module/location/lib/address-delivery-context';
import { useAddressFormDraftStore } from '@/store/address-form-draft.store';
import { useDeliveryLocationStore } from '@/store/delivery-location.store';
import {
  beginLocationFlowForCheckout,
  beginLocationFlowReturningTo,
} from '@/store/location-flow.store';
import { useLocationStore } from '@/store/location.store';
import { type Href, router } from 'expo-router';

/**
 * Full-screen add-address flow (form → map), not the account address sheet.
 * Returns to checkout after saving, or to `returnHref` when given (e.g. the product page).
 */
export function navigateToAddAddressScreen(
  cart?: { cityId?: string | null } | null,
  options?: { returnHref?: Href },
) {
  if (options?.returnHref) {
    beginLocationFlowReturningTo(options.returnHref);
  } else {
    beginLocationFlowForCheckout();
  }
  const locationCity = useLocationStore.getState().city;
  const deliverySnapshot = useDeliveryLocationStore.getState().snapshot;
  const ctx = resolveAddressDeliveryContext({
    cart: cart?.cityId ? { cityId: cart.cityId } : null,
    delivery: deliverySnapshot,
    locationCity,
  });

  useAddressFormDraftStore.getState().setDraft({
    ...emptyAddressForm,
    cityId: ctx.contextCityId,
    cityName: ctx.contextCityName,
  });
  router.push(ADD_ADDRESS_HREF as Href);
}
