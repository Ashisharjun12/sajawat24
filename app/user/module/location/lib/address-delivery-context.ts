import { isBackendCityId } from '@/lib/location-label';
import type { CartSnapshot } from '@/module/booking/lib/cart-types';
import type { DeliverySnapshot } from '@/store/delivery-location.store';
import type { ServiceCity } from '@/store/location.store';

export type AddressDeliveryContext = {
  contextCityId: string | null;
  contextCityName: string;
  contextCityPinHint: boolean;
};

export function resolveAddressDeliveryContext(input: {
  cart?: Pick<CartSnapshot, 'cityId'> | null;
  delivery?: DeliverySnapshot | null;
  locationCity?: ServiceCity | null;
}): AddressDeliveryContext {
  const cartCityId =
    input.cart?.cityId && isBackendCityId(input.cart.cityId) ? input.cart.cityId : null;
  const deliveryCityId =
    input.delivery?.cityId && isBackendCityId(input.delivery.cityId)
      ? input.delivery.cityId
      : null;
  const locationCityId =
    input.locationCity?.id && isBackendCityId(input.locationCity.id)
      ? input.locationCity.id
      : null;

  const contextCityId = cartCityId ?? deliveryCityId ?? locationCityId;

  let contextCityName = '';
  if (contextCityId) {
    if (cartCityId === contextCityId && input.locationCity?.id === contextCityId) {
      contextCityName = input.locationCity.name;
    } else if (deliveryCityId === contextCityId && input.delivery?.cityName) {
      contextCityName = input.delivery.cityName;
    } else if (input.locationCity?.id === contextCityId) {
      contextCityName = input.locationCity.name;
    } else if (input.delivery?.cityName) {
      contextCityName = input.delivery.cityName;
    }
  }

  return {
    contextCityId,
    contextCityName,
    contextCityPinHint: Boolean(contextCityId && contextCityName),
  };
}
