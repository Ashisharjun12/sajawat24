import { getApiError } from "@/api/api";

export const NOT_DELIVERABLE_MESSAGE = "We don't deliver to this address.";
export const SELECT_CITY_FIRST_MESSAGE = "Select your city in the header first.";
export const UNKNOWN_PIN_MESSAGE = "We don't recognize this PIN yet.";

export function pinLookupMessage(data) {
  if (data?.deliverable && data?.city?.name) {
    return `Delivering in ${data.city.name}`;
  }
  switch (data?.reason) {
    case "pincode_city_mismatch":
      return "This PIN is not in your selected city.";
    case "pincode_not_serviceable":
      return "We don't deliver to this PIN.";
    case "city_inactive":
      return "We are not operating in this city yet.";
    case "unknown_pin":
      return UNKNOWN_PIN_MESSAGE;
    default:
      return NOT_DELIVERABLE_MESSAGE;
  }
}

/** PIN resolves to a serviceable city that must match the cart (bag) city id. */
export function isDeliveryPinInCartCity(data, cartCityId) {
  return Boolean(
    data?.deliverable && data?.city?.id && cartCityId && data.city.id === cartCityId,
  );
}

export function deliveryPinCartCityMessage(data, cartCityName) {
  const pinCity = data?.city?.name;
  if (pinCity && cartCityName && pinCity !== cartCityName) {
    return `This PIN is for ${pinCity}. Your order is for ${cartCityName}.`;
  }
  return pinLookupMessage(data);
}

export function pinResolveErrorMessage(err) {
  const raw = getApiError(err);
  if (!raw) return NOT_DELIVERABLE_MESSAGE;
  const lower = raw.toLowerCase();
  if (lower.includes("match") && lower.includes("city")) {
    return "This PIN is not in your selected city.";
  }
  if (lower.includes("serviceable") || lower.includes("not deliver") || lower.includes("pincode")) {
    return NOT_DELIVERABLE_MESSAGE;
  }
  return raw;
}
