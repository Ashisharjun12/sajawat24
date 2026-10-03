import { api, unwrap } from '@/api/client';

export function listCities() {
  return api.get('/geo/cities').then(unwrap);
}

export function isPincodeDeliverable(data: unknown): boolean {
  const row = data as { deliverable?: boolean; city?: { id?: string } } | null;
  return Boolean(row?.deliverable && row?.city?.id);
}

export function resolvePincode(pincode: string, options: { cityId?: string } = {}) {
  return api
    .get('/geo/resolve', {
      params: {
        pincode,
        ...(options.cityId ? { cityId: options.cityId } : {}),
      },
    })
    .then(unwrap);
}
