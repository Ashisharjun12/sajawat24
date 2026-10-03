import type { CustomerAddress } from '@/api/addresses.api';
import {
  loadPersistedDelivery,
  savePersistedDelivery,
  type DeliverySnapshot,
} from '@/lib/delivery-location-storage';
import { isBackendCityId } from '@/lib/location-label';
import { useLocationStore } from '@/store/location.store';
import { create } from 'zustand';

export type { DeliverySnapshot };

function formatDisplayLine(snapshot: DeliverySnapshot): string {
  const parts = [snapshot.pincode, snapshot.cityName].filter(Boolean);
  const prefix = parts.length ? `${parts.join(', ')}` : '';
  const line = snapshot.address.trim();
  if (prefix && line) return `${prefix} · ${line}`;
  return line || prefix || '';
}

function snapshotFromAddress(addr: CustomerAddress): DeliverySnapshot {
  return {
    address: addr.address,
    landmark: addr.landmark,
    pincode: addr.pincode,
    cityId: addr.cityId ?? '',
    cityName: addr.cityName,
    latitude: addr.latitude,
    longitude: addr.longitude,
    label: addr.label,
  };
}

type DeliveryLocationState = {
  selectedAddressId: string | null;
  displayLine: string;
  snapshot: DeliverySnapshot | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setFromAddress: (addr: CustomerAddress) => Promise<void>;
  setFromSnapshot: (snapshot: DeliverySnapshot, addressId?: string | null) => Promise<void>;
  clearSelection: () => Promise<void>;
  applyToLocationStore: () => Promise<void>;
  headerSubtitle: (fallbackCityPincode: string) => string;
};

export const useDeliveryLocationStore = create<DeliveryLocationState>((set, get) => ({
  selectedAddressId: null,
  displayLine: '',
  snapshot: null,
  hydrated: false,

  hydrate: async () => {
    const persisted = await loadPersistedDelivery();
    if (persisted?.snapshot?.cityId && isBackendCityId(persisted.snapshot.cityId)) {
      set({
        selectedAddressId: persisted.selectedAddressId,
        displayLine: persisted.displayLine,
        snapshot: persisted.snapshot,
        hydrated: true,
      });
      await get().applyToLocationStore();
      return;
    }
    set({ hydrated: true });
  },

  setFromAddress: async (addr) => {
    const snapshot = snapshotFromAddress(addr);
    if (!snapshot.cityId || !isBackendCityId(snapshot.cityId)) return;
    const displayLine = formatDisplayLine(snapshot);
    set({
      selectedAddressId: addr.id,
      displayLine,
      snapshot,
    });
    await savePersistedDelivery({
      selectedAddressId: addr.id,
      displayLine,
      snapshot,
    });
    await get().applyToLocationStore();
  },

  setFromSnapshot: async (snapshot, addressId = null) => {
    if (!snapshot.cityId || !isBackendCityId(snapshot.cityId)) return;
    const displayLine = formatDisplayLine(snapshot);
    set({
      selectedAddressId: addressId,
      displayLine,
      snapshot,
    });
    await savePersistedDelivery({
      selectedAddressId: addressId,
      displayLine,
      snapshot,
    });
    await get().applyToLocationStore();
  },

  clearSelection: async () => {
    set({
      selectedAddressId: null,
      displayLine: '',
      snapshot: null,
      hydrated: true,
    });
    await savePersistedDelivery({
      selectedAddressId: null,
      displayLine: '',
      snapshot: null,
    });
  },

  applyToLocationStore: async () => {
    const { snapshot } = get();
    if (!snapshot?.cityId || !isBackendCityId(snapshot.cityId)) return;
    await useLocationStore.getState().setLocation({
      city: { id: snapshot.cityId, name: snapshot.cityName },
      pincode: snapshot.pincode ? { code: snapshot.pincode } : null,
      source: 'address',
    });
  },

  headerSubtitle: (fallbackCityPincode) => {
    const { displayLine } = get();
    if (displayLine.trim()) return displayLine;
    const { city, source, pincode } = useLocationStore.getState();
    if (source === 'device' && city?.name) {
      if (pincode?.code) return `Near ${city.name} · ${pincode.code}`;
      return `Near ${city.name}`;
    }
    if (
      fallbackCityPincode &&
      fallbackCityPincode !== 'Select city' &&
      city?.name
    ) {
      return fallbackCityPincode;
    }
    const chosen = useLocationStore.getState().isLocationChosen();
    if (chosen && fallbackCityPincode && fallbackCityPincode !== 'Select city') {
      return fallbackCityPincode;
    }
    return 'Tap to set delivery location';
  },
}));

export function deliverySnapshotFromAddress(addr: CustomerAddress): DeliverySnapshot {
  return snapshotFromAddress(addr);
}
