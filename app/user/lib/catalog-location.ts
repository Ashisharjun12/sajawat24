import { getApiError } from '@/api/client';
import { getProduct, listProducts } from '@/api/products.api';
import { API_URL } from '@/lib/env';
import axios from 'axios';

type ListProductsParams = {
  pincode?: string;
  cityId?: string;
  categoryIds?: string[];
  minPricePaise?: number;
  maxPricePaise?: number;
  sort?: string;
  q?: string;
  instant?: boolean;
  page?: number;
  limit?: number;
};

export type CatalogLocationInput = {
  cityId?: string;
  pincode?: string;
};

export function normalizeCatalogPincode(pincode?: string): string | undefined {
  const pin = pincode?.replace(/\D/g, '').slice(0, 6);
  return pin || undefined;
}

export function isPincodeNotServiceableError(err: unknown): boolean {
  const msg = getApiError(err).toLowerCase();
  return msg.includes('pincode') && msg.includes('serviceable');
}

/** Cart / checkout location body (web LocationPicker.syncCartLocation). */
export function cartLocationBody({ cityId, pincode }: CatalogLocationInput) {
  const pin = normalizeCatalogPincode(pincode);
  if (!cityId) {
    return pin ? { pincode: pin } : {};
  }
  return pin ? { cityId, pincode: pin } : { cityId };
}

async function withCatalogLocationRetry<T>(
  attempt: (location: { cityId?: string; pincode?: string }) => Promise<T>,
  { cityId, pincode }: CatalogLocationInput,
): Promise<T> {
  const pin = normalizeCatalogPincode(pincode);

  if (cityId && pin) {
    try {
      return await attempt({ cityId, pincode: pin });
    } catch (err) {
      if (isPincodeNotServiceableError(err)) {
        return await attempt({ cityId, pincode: undefined });
      }
      throw err;
    }
  }

  if (pin) {
    return await attempt({ pincode: pin, cityId: undefined });
  }

  if (cityId) {
    return await attempt({ cityId, pincode: undefined });
  }

  throw new Error('pincode or cityId is required');
}

export async function getProductForCatalogLocation(
  productId: string,
  location: CatalogLocationInput,
) {
  return withCatalogLocationRetry(
    (loc) => getProduct(productId, loc),
    location,
  );
}

/** List products with cityId+pincode first; retry city-only when pincode is rejected. */
export async function listProductsForCatalogLocation(
  params: ListProductsParams & CatalogLocationInput,
) {
  const { cityId, pincode, ...rest } = params;
  return withCatalogLocationRetry(
    (loc) => listProducts({ ...rest, ...loc }),
    { cityId, pincode },
  );
}

function friendlyCatalogMessage(raw: string): string | null {
  const msg = raw.toLowerCase();
  if (msg.includes('pincode') && msg.includes('serviceable')) {
    return 'This pincode is not serviceable yet. Try another city or pincode from the location bar.';
  }
  if (msg.includes('not priced')) {
    return 'This setup is not offered in your selected city. Pick another city from the search bar on Home.';
  }
  if (msg.includes('product not found')) {
    return 'This setup is not available here. It may be inactive or not priced for your city.';
  }
  if (msg.includes('pincode or cityid is required')) {
    return 'Choose your delivery city first, then open this setup again.';
  }
  return null;
}

export function catalogLocationErrorMessage(err: unknown): string {
  const raw = getApiError(err);
  const friendly = friendlyCatalogMessage(raw);
  if (friendly) return friendly;

  if (axios.isAxiosError(err) && !err.response) {
    if (__DEV__) {
      return API_URL
        ? `${raw}\n\nDev API: ${API_URL}`
        : `${raw}\n\nSet EXPO_PUBLIC_API_URL in app/user/.env and restart Metro.`;
    }
  }

  return raw;
}
