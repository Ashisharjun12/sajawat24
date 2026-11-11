import { getApiError } from "@/api/api";

/**
 * Catalog location rules (same as the user app `lib/catalog-location.ts`).
 *
 * The backend validates `pincode` alone strictly: a PIN that is missing from the table or marked
 * non-serviceable fails with "pincode not serviceable". When `cityId` is sent too, a PIN that is
 * not in the table is accepted for that city. So we always send both, and if the backend still
 * rejects the PIN we retry with the city alone instead of showing an error page.
 */

export function normalizeCatalogPincode(pincode) {
  const pin = String(pincode ?? "")
    .replace(/\D/g, "")
    .slice(0, 6);
  return pin || undefined;
}

export function isPincodeNotServiceableError(err) {
  const msg = getApiError(err).toLowerCase();
  return msg.includes("pincode") && msg.includes("serviceable");
}

/**
 * Runs `attempt({ cityId, pincode })` with cityId + pincode first, then city only when the
 * PIN is rejected. With only a PIN (no backend city yet) it sends the PIN alone.
 */
export async function withCatalogLocationRetry(attempt, { cityId, pincode } = {}) {
  const pin = normalizeCatalogPincode(pincode);

  if (cityId && pin) {
    try {
      return await attempt({ cityId, pincode: pin });
    } catch (err) {
      if (isPincodeNotServiceableError(err)) {
        return await attempt({ cityId });
      }
      throw err;
    }
  }
  if (pin) return attempt({ pincode: pin });
  if (cityId) return attempt({ cityId });
  return attempt({});
}

function friendlyCatalogMessage(raw) {
  const msg = String(raw ?? "").toLowerCase();
  if (msg.includes("pincode") && msg.includes("serviceable")) {
    return "This pincode is not serviceable yet. Try another city or pincode from the location bar.";
  }
  if (msg.includes("not priced")) {
    return "This setup is not offered in your selected city. Pick another city from the location bar.";
  }
  if (msg.includes("product not found")) {
    return "This setup is not available here. It may be inactive or not priced for your city.";
  }
  if (msg.includes("pincode or cityid is required")) {
    return "Choose your delivery city first, then open this setup again.";
  }
  return null;
}

export function catalogLocationErrorMessage(err) {
  const raw = getApiError(err);
  return friendlyCatalogMessage(raw) ?? raw;
}
