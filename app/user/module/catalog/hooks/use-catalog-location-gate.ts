import { isBackendCityId } from '@/lib/location-label';
import { useLocationStore } from '@/store/location.store';

/** User-chosen service city — same rule as home CMS and Instant tab. */
export function useCatalogLocationGate() {
  const city = useLocationStore((s) => s.city);
  const pincode = useLocationStore((s) => s.pincode);
  const locationChosen = useLocationStore((s) => s.isLocationChosen());

  const cityId = city?.id && isBackendCityId(city.id) ? city.id : undefined;
  const pincodeCode = pincode?.code?.replace(/\D/g, '').slice(0, 6) || undefined;
  const ready = locationChosen && Boolean(cityId);

  return { ready, cityId, pincodeCode };
}
