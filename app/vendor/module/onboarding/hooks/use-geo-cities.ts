import { getApiError } from '@/api/client';
import { listCities, type PublicCity } from '@/api/geo.api';
import { getStatesFromCities } from '@/module/onboarding/lib/geo';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

type UseGeoCitiesResult = {
  cities: PublicCity[];
  states: string[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useGeoCities(): UseGeoCitiesResult {
  const query = useQuery({
    queryKey: ['geo', 'cities'],
    queryFn: listCities,
    staleTime: 5 * 60 * 1000,
  });

  const cities = query.data ?? [];
  const states = useMemo(() => getStatesFromCities(cities), [cities]);

  return {
    cities,
    states,
    loading: query.isLoading,
    error: query.error ? getApiError(query.error) : null,
    refetch: () => {
      void query.refetch();
    },
  };
}
