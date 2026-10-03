import { getApiError } from '@/api/client';

export const NOT_DELIVERABLE_MESSAGE = "We don't deliver to this address.";
export const SELECT_CITY_FIRST_MESSAGE = 'Select your city in the header first.';
export const UNKNOWN_PIN_MESSAGE = "We don't recognize this PIN yet.";

type PinLookupData = {
  deliverable?: boolean;
  reason?: string;
  city?: { id?: string; name?: string };
};

export function pinLookupMessage(data: PinLookupData | null | undefined): string {
  if (data?.deliverable && data?.city?.name) {
    return `Delivering in ${data.city.name}`;
  }
  switch (data?.reason) {
    case 'pincode_city_mismatch':
      return 'This PIN is not in your selected city.';
    case 'pincode_not_serviceable':
      return "We don't deliver to this PIN.";
    case 'city_inactive':
      return 'We are not operating in this city yet.';
    case 'unknown_pin':
      return UNKNOWN_PIN_MESSAGE;
    default:
      return NOT_DELIVERABLE_MESSAGE;
  }
}

/** PIN resolves to a serviceable city that must match the order / header city id. */
export function isDeliveryPinInCartCity(
  data: PinLookupData | null | undefined,
  cartCityId: string | null | undefined,
): boolean {
  return Boolean(
    data?.deliverable && data?.city?.id && cartCityId && data.city.id === cartCityId,
  );
}

export function deliveryPinCartCityMessage(
  data: PinLookupData | null | undefined,
  cartCityName: string,
): string {
  const pinCity = data?.city?.name;
  if (pinCity && cartCityName && pinCity !== cartCityName) {
    return `This PIN is for ${pinCity}. Your order is for ${cartCityName}.`;
  }
  return pinLookupMessage(data);
}

export function pinResolveErrorMessage(err: unknown): string {
  const raw = getApiError(err);
  if (!raw) return NOT_DELIVERABLE_MESSAGE;
  const lower = raw.toLowerCase();
  if (lower.includes('match') && lower.includes('city')) {
    return 'This PIN is not in your selected city.';
  }
  if (lower.includes('serviceable') || lower.includes('not deliver') || lower.includes('pincode')) {
    return NOT_DELIVERABLE_MESSAGE;
  }
  return raw;
}
