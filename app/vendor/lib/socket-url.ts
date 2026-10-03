import { API_URL } from '@/lib/env';

export function getSocketUrl(): string {
  if (!API_URL) return '';
  return API_URL.replace(/\/api\/v1\/?$/, '');
}
