import { listSections } from '@/api/sections.api';
import { queryKeys } from '@/lib/query-keys';
import { normalizeApiSections, type HomeProductSection } from '@/module/home/lib/home-catalog';
import { useHomeCatalogCityId } from '@/module/home/hooks/use-home-catalog-city-id';
import { useLocationStore } from '@/store/location.store';
import { useQuery } from '@tanstack/react-query';

export function useCatalogSectionsQuery() {
  const { catalogCityId, catalogPincode } = useHomeCatalogCityId();
  const status = useLocationStore((s) => s.status);
  const enabled = status === 'ready' && Boolean(catalogCityId);

  return useQuery({
    queryKey: queryKeys.homeSections(catalogCityId ?? null, catalogPincode ?? null),
    queryFn: async (): Promise<HomeProductSection[]> => {
      const sectionData = await listSections({
        cityId: catalogCityId,
        pincode: catalogPincode,
      });
      return normalizeApiSections(sectionData);
    },
    enabled,
    staleTime: 60_000,
    placeholderData: (previous, previousQuery) => {
      const prevKey = previousQuery?.queryKey;
      const currentKey = queryKeys.homeSections(catalogCityId ?? null, catalogPincode ?? null);
      if (
        prevKey &&
        (prevKey[2] !== currentKey[2] || prevKey[3] !== currentKey[3])
      ) {
        return undefined;
      }
      return previous;
    },
  });
}
