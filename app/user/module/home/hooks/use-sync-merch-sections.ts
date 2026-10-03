import { useCatalogSectionsQuery } from '@/module/home/hooks/use-catalog-sections-query';
import { useHomeCatalogCityId } from '@/module/home/hooks/use-home-catalog-city-id';
import { useMerchSectionsStore } from '@/store/merch-sections.store';
import { useLocationStore } from '@/store/location.store';
import { useEffect, useRef } from 'react';

export function useSyncMerchSections() {
  const locationStatus = useLocationStore((s) => s.status);
  const { catalogCityId, catalogPincode } = useHomeCatalogCityId();
  const locationKey = `${catalogCityId ?? ''}:${catalogPincode ?? ''}`;

  const setFromSections = useMerchSectionsStore((s) => s.setFromSections);
  const clear = useMerchSectionsStore((s) => s.clear);

  const prevLocationKeyRef = useRef(locationKey);

  const { data, isPending, isError, dataUpdatedAt } = useCatalogSectionsQuery();

  useEffect(() => {
    if (locationStatus !== 'ready' || !catalogCityId) {
      clear();
      prevLocationKeyRef.current = locationKey;
      return;
    }

    if (prevLocationKeyRef.current !== locationKey) {
      prevLocationKeyRef.current = locationKey;
      clear();
    }
  }, [locationStatus, catalogCityId, locationKey, clear]);

  useEffect(() => {
    if (locationStatus !== 'ready' || !catalogCityId) {
      return;
    }

    if (isPending) {
      return;
    }

    if (isError || !data?.length) {
      clear();
      return;
    }

    setFromSections(data);
  }, [
    locationStatus,
    catalogCityId,
    data,
    dataUpdatedAt,
    isPending,
    isError,
    setFromSections,
    clear,
  ]);
}
