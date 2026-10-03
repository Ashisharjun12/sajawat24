import { getSiteShell } from '@/api/cms.api';

type CachedContact = {
  at: number;
  whatsappUrl: string | null;
  contactPhone: string | null;
};

const CACHE_TTL_MS = 10 * 60 * 1000;
let cached: CachedContact | null = null;

export async function loadSiteBrandContact(): Promise<CachedContact> {
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached;
  }

  try {
    const data = await getSiteShell({ platform: 'app' });
    const brand = data?.brand;
    cached = {
      at: Date.now(),
      whatsappUrl: brand?.whatsappUrl?.trim() || null,
      contactPhone: brand?.contactPhone?.trim() || null,
    };
    return cached;
  } catch {
    if (cached) return cached;
    return { at: Date.now(), whatsappUrl: null, contactPhone: null };
  }
}
