import * as SecureStore from 'expo-secure-store';

const DELIVERY_KEY = 'deccorbuddys_delivery_location_v1';
const PROMPT_KEY = 'deccorbuddys_delivery_sheet_prompted_v1';

export type DeliverySnapshot = {
  address: string;
  landmark: string | null;
  pincode: string;
  cityId: string;
  cityName: string;
  latitude: number | null;
  longitude: number | null;
  label: string;
};

export type PersistedDeliveryLocation = {
  selectedAddressId: string | null;
  displayLine: string;
  snapshot: DeliverySnapshot | null;
};

export async function loadPersistedDelivery(): Promise<PersistedDeliveryLocation | null> {
  const raw = await SecureStore.getItemAsync(DELIVERY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedDeliveryLocation;
  } catch {
    return null;
  }
}

export async function savePersistedDelivery(data: PersistedDeliveryLocation): Promise<void> {
  await SecureStore.setItemAsync(DELIVERY_KEY, JSON.stringify(data));
}

export async function loadDeliverySheetPrompted(): Promise<boolean> {
  const raw = await SecureStore.getItemAsync(PROMPT_KEY);
  return raw === '1';
}

export async function saveDeliverySheetPrompted(): Promise<void> {
  await SecureStore.setItemAsync(PROMPT_KEY, '1');
}
