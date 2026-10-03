import { isPincodeDeliverable, resolvePincode } from "@/api/geo.api";
import { reverseGeocode } from "@/api/maps.api";
import { getDeviceCoords } from "@/lib/geolocation";
import { reverseGeocodeLocation } from "@/lib/reverse-geocode";
import { isBackendCityId } from "@/store/location.store";

function normalizePincodeDigits(value) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 6);
}

function matchCityByName(cities, cityName) {
  const needle = cityName?.trim().toLowerCase();
  if (!needle || !cities?.length) return null;
  const exact = cities.find((c) => c.name.toLowerCase() === needle);
  if (exact) return exact;
  return cities.find(
    (c) => needle.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(needle),
  );
}

function findServedCity(cities, city) {
  if (!city?.id || !isBackendCityId(city.id)) return null;
  return cities.find((c) => c.id === city.id) ?? city;
}

async function reverseGeocodeCoords(latitude, longitude) {
  try {
    return await reverseGeocode(latitude, longitude);
  } catch {
    return reverseGeocodeLocation(latitude, longitude);
  }
}

/**
 * GPS → reverse geocode → served city (pincode only when DB says deliverable).
 * @param {Array<{ id: string, name: string }>} cities — cities from location store
 */
export async function detectLocationFromDevice(cities = []) {
  const coords = await getDeviceCoords();
  const geo = await reverseGeocodeCoords(coords.latitude, coords.longitude);
  const pincodeDigits = normalizePincodeDigits(geo?.pincode);
  const cityName = geo?.cityName ?? "";

  if (pincodeDigits.length === 6) {
    let lookup = null;
    try {
      lookup = await resolvePincode(pincodeDigits);
    } catch {
      lookup = null;
    }

    if (lookup && isPincodeDeliverable(lookup)) {
      return {
        city: lookup.city,
        pincode: lookup.pincode?.code
          ? { code: lookup.pincode.code }
          : { code: pincodeDigits },
        source: "gps",
      };
    }

    const fromPinCity = findServedCity(cities, lookup?.city);
    if (fromPinCity) {
      return {
        city: fromPinCity,
        pincode: null,
        source: "gps",
      };
    }
  }

  const fromName = matchCityByName(cities, cityName);
  if (fromName && isBackendCityId(fromName.id)) {
    return {
      city: fromName,
      pincode: null,
      source: "gps",
    };
  }

  throw new Error(
    "We couldn't find a city we serve near you. Choose one from the list.",
  );
}

export async function resolveLocationFromPincode(pincode) {
  const data = await resolvePincode(pincode);

  return {
    city: data.city,
    pincode: data.pincode,
    source: "manual",
  };
}
