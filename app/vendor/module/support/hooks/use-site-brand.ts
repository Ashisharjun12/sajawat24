import { getSiteShell, type SiteBrandPublic } from '@/api/site-shell.api';
import { useQuery } from '@tanstack/react-query';

const DEFAULT_BRAND: SiteBrandPublic = {
  companyName: 'Decoryy',
  footerDescription:
    'City-priced decoration setups — balloons, backdrops, and lights, dressed for the room you have.',
  logoLightUrl: null,
  logoDarkUrl: null,
  contactPhone: null,
  contactEmail: null,
  whatsappUrl: null,
};

export const siteBrandQueryKey = ['site-shell', 'mobile'] as const;

export function useSiteBrand() {
  const query = useQuery({
    queryKey: siteBrandQueryKey,
    queryFn: () => getSiteShell('mobile'),
    staleTime: 15 * 60_000,
  });

  const brand = query.data?.brand
    ? { ...DEFAULT_BRAND, ...query.data.brand }
    : DEFAULT_BRAND;

  return {
    brand,
    isLoading: query.isLoading && query.data === undefined,
    isError: query.isError,
    refetch: query.refetch,
  };
}
