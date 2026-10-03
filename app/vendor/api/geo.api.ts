import { api, unwrap } from '@/api/client';
import { API_URL } from '@/lib/env';

export type PublicCity = {
  id: string;
  name: string;
  slug: string;
  state: string;
  imageUrl?: string | null;
};

export async function listCities(): Promise<PublicCity[]> {
  if (!API_URL) {
    throw new Error('API URL not configured');
  }
  const response = await api.get('/geo/cities');
  return unwrap<PublicCity[]>(response) ?? [];
}
