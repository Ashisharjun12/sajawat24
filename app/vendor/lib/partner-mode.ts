import * as SecureStore from 'expo-secure-store';

const PARTNER_MODE_KEY = 'decoryy_vendor_partner_mode';

export type PartnerMode = 'owner' | 'field';

export async function loadPartnerMode(): Promise<PartnerMode | null> {
  const value = await SecureStore.getItemAsync(PARTNER_MODE_KEY);
  if (value === 'owner' || value === 'field') return value;
  return null;
}

export async function savePartnerMode(mode: PartnerMode) {
  await SecureStore.setItemAsync(PARTNER_MODE_KEY, mode);
}

export async function clearPartnerMode() {
  await SecureStore.deleteItemAsync(PARTNER_MODE_KEY);
}
