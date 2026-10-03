import { formatLocationLabel, isBackendCityId } from '@/lib/location-label';
import { loadPersistedLocation, savePersistedLocation } from '@/lib/location-storage';
import { resolveLocationFromGps, type ServiceCity } from '@/lib/detect-gps-location';
import { listCities } from '@/api/geo.api';
import { create } from 'zustand';

export type { ServiceCity };

type LocationState = {
  city: ServiceCity | null;
  pincode: { code: string } | null;
  source: string | null;
  cities: ServiceCity[];
  status: 'idle' | 'loading' | 'ready';
  bootstrapDone: boolean;
  hydrate: () => Promise<void>;
  fetchCities: () => Promise<void>;
  bootstrapLocation: () => Promise<void>;
  detectLocationFromGps: () => Promise<boolean>;
  setLocation: (input: {
    city: ServiceCity;
    pincode?: { code: string } | null;
    source?: string;
  }) => Promise<void>;
  locationLabel: () => string;
  serviceCityId: () => string | undefined;
  pincodeCode: () => string | undefined;
  isLocationChosen: () => boolean;
};

export const useLocationStore = create<LocationState>((set, get) => ({
  city: null,
  pincode: null,
  source: null,
  cities: [],
  status: 'idle',
  bootstrapDone: false,

  locationLabel: () => formatLocationLabel(get().city, get().pincode),

  serviceCityId: () => {
    const id = get().city?.id;
    return isBackendCityId(id) ? id : undefined;
  },

  pincodeCode: () => get().pincode?.code,

  isLocationChosen: () => {
    const { city, source } = get();
    if (!city?.id || !isBackendCityId(city.id)) return false;
    return source !== 'default' && source !== null;
  },

  hydrate: async () => {
    set({ status: 'loading' });
    const persisted = await loadPersistedLocation();
    if (persisted?.city?.id && isBackendCityId(persisted.city.id)) {
      const source = persisted.source ?? 'persisted';
      set({
        city: persisted.city,
        pincode: persisted.pincode,
        source,
        status: 'ready',
      });
      return;
    }
    set({ status: 'ready' });
  },

  fetchCities: async () => {
    try {
      const data = await listCities();
      const raw = Array.isArray(data)
        ? data
        : (data as { items?: ServiceCity[]; cities?: ServiceCity[] })?.items ??
          (data as { cities?: ServiceCity[] })?.cities ??
          [];
      const cities = raw
        .filter((c) => c?.id && c?.name)
        .map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
      set({ cities });
    } catch {
      set({ cities: [] });
    }
  },

  bootstrapLocation: async () => {
    if (get().bootstrapDone) return;
    await get().hydrate();
    await get().fetchCities();
    set({ bootstrapDone: true });
  },

  detectLocationFromGps: async () => {
    const resolved = await resolveLocationFromGps(get().cities);
    if (!resolved) return false;
    await get().setLocation({
      city: resolved.city,
      pincode: resolved.pincode,
      source: 'device',
    });
    return true;
  },

  setLocation: async ({ city, pincode = null, source = 'manual' }) => {
    set({ city, pincode, source, status: 'ready' });
    await savePersistedLocation({ city, pincode, source });
  },
}));
