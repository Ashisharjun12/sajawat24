import { isPincodeDeliverable, resolvePincode } from '@/api/geo.api';
import { reverseGeocode } from '@/api/maps.api';
import { isBackendCityId } from '@/lib/location-label';
import {
  getLocationPermissionStatus,
  requestForegroundLocationPermission,
} from '@/lib/location';

export type ServiceCity = {
  id: string;
  name: string;
  slug?: string;
};

export type GpsResolvedLocation = {
  city: ServiceCity;
  pincode: { code: string } | null;
};

function normalizePincodeDigits(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, 6);
}

function matchCityByName(cities: ServiceCity[], cityName: string | null | undefined) {
  const needle = cityName?.trim().toLowerCase();
  if (!needle || !cities.length) return null;
  const exact = cities.find((c) => c.name.toLowerCase() === needle);
  if (exact) return exact;
  return cities.find(
    (c) => needle.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(needle),
  );
}

function findServedCity(cities: ServiceCity[], city: ServiceCity | null | undefined) {
  if (!city?.id || !isBackendCityId(city.id)) return null;
  return cities.find((c) => c.id === city.id) ?? city;
}

/**
 * GPS → reverse geocode → service city (pincode only when DB says deliverable). Web-aligned.
 */
export async function resolveLocationFromGps(
  cities: ServiceCity[],
): Promise<GpsResolvedLocation | null> {
  const status = await getLocationPermissionStatus();
  const granted =
    status === 'granted' ||
    (status === 'undetermined' && (await requestForegroundLocationPermission()));
  if (!granted) return null;

  const Location = await import('expo-location');
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const { latitude, longitude } = position.coords;
  const geo = (await reverseGeocode(latitude, longitude)) as {
    pincode?: string | null;
    cityName?: string | null;
    formattedAddress?: string;
  };

  const pincodeDigits = normalizePincodeDigits(geo.pincode);
  const cityName = geo.cityName ?? '';

  if (pincodeDigits.length === 6) {
    let lookup: { deliverable?: boolean; city?: ServiceCity; pincode?: { code?: string } } | null =
      null;
    try {
      lookup = (await resolvePincode(pincodeDigits)) as typeof lookup;
    } catch {
      lookup = null;
    }

    if (lookup && isPincodeDeliverable(lookup)) {
      const code =
        lookup.pincode?.code?.replace(/\D/g, '').slice(0, 6) || pincodeDigits;
      return {
        city: lookup.city as ServiceCity,
        pincode: { code },
      };
    }

    const fromPinCity = findServedCity(cities, lookup?.city ?? null);
    if (fromPinCity) {
      return {
        city: fromPinCity,
        pincode: null,
      };
    }
  }

  const fromName = matchCityByName(cities, cityName);
  if (fromName && isBackendCityId(fromName.id)) {
    return {
      city: fromName,
      pincode: null,
    };
  }

  return null;
}
