import { getApiError } from '@/api/client';

/** Map vendor register/reapply geo-related API errors for the location step. */
export function registerGeoErrorMessage(err: unknown): string {
  const raw = getApiError(err);
  if (!raw) return 'Something went wrong. Try again.';
  const lower = raw.toLowerCase();
  if (lower.includes('city not found') || lower.includes('city_inactive')) {
    return 'We are not operating in this city yet. Pick another city.';
  }
  if (lower.includes('invalid pincode')) {
    return 'Enter a valid 6-digit pincode.';
  }
  return raw;
}
