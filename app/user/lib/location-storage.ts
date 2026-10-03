import * as SecureStore from 'expo-secure-store';

const LOCATION_KEY = 'deccorbuddys_user_location_v1';

export type PersistedLocation = {
  city: { id: string; name: string; slug?: string } | null;
  pincode: { code: string } | null;
  source?: string | null;
};

export async function loadPersistedLocation(): Promise<PersistedLocation | null> {
  const raw = await SecureStore.getItemAsync(LOCATION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedLocation;
  } catch {
    return null;
  }
}

export async function savePersistedLocation(data: PersistedLocation): Promise<void> {
  await SecureStore.setItemAsync(LOCATION_KEY, JSON.stringify(data));
}
