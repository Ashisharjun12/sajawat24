import { getHomeCms } from '@/api/cms.api';
import { queryKeys } from '@/lib/query-keys';
import { normalizeHomeCms } from '@/module/home/lib/home-catalog';
import { useHomeCatalogCityId } from '@/module/home/hooks/use-home-catalog-city-id';
import { useLocationStore } from '@/store/location.store';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export function useHomeCms() {
  const { catalogCityId, catalogPincode } = useHomeCatalogCityId();
  const status = useLocationStore((s) => s.status);

  const query = useQuery({
    queryKey: queryKeys.cmsHome(catalogCityId ?? null, catalogPincode ?? null),
    queryFn: () =>
      getHomeCms({
        cityId: catalogCityId,
        pincode: catalogPincode,
        platform: 'android',
      }),
    enabled: status === 'ready',
    staleTime: 5 * 60_000,
    placeholderData: (previous) => previous,
  });

  const cms = useMemo(() => normalizeHomeCms(query.data), [query.data]);
  const useCmsLayout = cms.layoutBlocks.length > 0;

  const locationReady = status === 'ready';

  return {
    ...cms,
    useCmsLayout,
    isPending: locationReady && query.isPending,
    isRefetching: locationReady && query.isRefetching,
    refetch: query.refetch,
    isError: query.isError,
  };
}
