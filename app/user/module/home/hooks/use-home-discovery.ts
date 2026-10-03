import { listProductsForCatalogLocation } from '@/lib/catalog-location';
import { normalizeProduct, type HomeProductSection } from '@/module/home/lib/home-catalog';
import { useCatalogSectionsQuery } from '@/module/home/hooks/use-catalog-sections-query';
import { useHomeCatalogCityId } from '@/module/home/hooks/use-home-catalog-city-id';
import { useLocationStore } from '@/store/location.store';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export function useHomeDiscovery() {
  const { catalogCityId, catalogPincode } = useHomeCatalogCityId();
  const status = useLocationStore((s) => s.status);
  const locationReady = status === 'ready';
  const enabled = locationReady && Boolean(catalogCityId);

  const sectionsQuery = useCatalogSectionsQuery();

  const fallbackQuery = useQuery({
    queryKey: [
      'catalog',
      'home-discovery-fallback',
      catalogCityId ?? null,
      catalogPincode ?? null,
    ] as const,
    queryFn: async (): Promise<HomeProductSection[]> => {
      const catalog = await listProductsForCatalogLocation({
        cityId: catalogCityId,
        pincode: catalogPincode,
        page: 1,
        limit: 16,
      });
      const items = ((catalog as { items?: unknown[] })?.items ?? [])
        .map(normalizeProduct)
        .filter(Boolean);
      if (items.length === 0) return [];

      return [
        {
          id: 'popular',
          slug: 'popular',
          title: 'Popular near you',
          subtitle: 'Top picks in your area',
          items: items as HomeProductSection['items'],
        },
      ];
    },
    enabled:
      enabled &&
      sectionsQuery.isSuccess &&
      (sectionsQuery.data?.length ?? 0) === 0,
    staleTime: 60_000,
  });

  const sections = useMemo(() => {
    if ((sectionsQuery.data?.length ?? 0) > 0) {
      return sectionsQuery.data ?? [];
    }
    if (fallbackQuery.data?.length) {
      return fallbackQuery.data;
    }
    return [];
  }, [sectionsQuery.data, fallbackQuery.data]);

  const isPending =
    enabled &&
    (sectionsQuery.isPending || ((sectionsQuery.data?.length ?? 0) === 0 && fallbackQuery.isPending));

  const refetch = async () => {
    const sectionsResult = await sectionsQuery.refetch();
    if ((sectionsResult.data?.length ?? 0) === 0) {
      await fallbackQuery.refetch();
    }
  };

  return {
    sections,
    isPending,
    isRefetching: enabled && (sectionsQuery.isRefetching || fallbackQuery.isRefetching),
    refetch,
    isError: sectionsQuery.isError && fallbackQuery.isError,
  };
}
