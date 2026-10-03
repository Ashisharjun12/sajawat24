import { isBackendCityId } from '@/lib/location-label';
import { useLocationStore } from '@/store/location.store';
import { useMemo } from 'react';

/** Chosen service city, or first listed city for browse-only home feed before user picks. */
export function useHomeCatalogCityId() {
  const cityId = useLocationStore((s) => s.serviceCityId());
  const pincode = useLocationStore((s) => s.pincodeCode());
  const cities = useLocationStore((s) => s.cities);
  const locationChosen = useLocationStore((s) => s.isLocationChosen());

  const browseCityId = useMemo(() => {
    if (cityId) return cityId;
    const first = cities.find((c) => isBackendCityId(c.id));
    return first?.id;
  }, [cityId, cities]);

  return {
    catalogCityId: browseCityId,
    catalogPincode: locationChosen ? pincode : undefined,
    locationChosen,
  };
}
