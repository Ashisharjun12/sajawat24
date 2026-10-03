import type { CustomerAddress } from '@/api/addresses.api';
import { resolvePincode } from '@/api/geo.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { AddressFormSheet } from '@/module/account/components/AddressFormSheet';
import { AddressOptionsSheet } from '@/module/account/components/AddressOptionsSheet';
import { useDeleteAddress } from '@/module/account/hooks/use-delete-address';
import { useAddressesQuery } from '@/module/account/hooks/use-addresses-query';
import { PlacesAddressAutocomplete } from '@/module/geo/components/PlacesAddressAutocomplete';
import {
  deliverySnapshotFromAddress,
  useDeliveryLocationStore,
  type DeliverySnapshot,
} from '@/store/delivery-location.store';
import { useAuthStore } from '@/store/auth.store';
import { useKeyboardInset } from '@/lib/use-keyboard-inset';
import { ChevronDown, MoreVertical, Plus } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { ScalePressable } from '@/components/shell';

type HomeDeliveryLocationSheetProps = {
  onClose: () => void;
};

function AddressRadio({ selected }: { selected: boolean }) {
  return (
    <View
      className={cn(
        'size-5 items-center justify-center rounded-full border-2',
        selected ? 'border-primary' : 'border-muted-foreground/35',
      )}>
      {selected ? <View className="size-2.5 rounded-full bg-primary" /> : null}
    </View>
  );
}

export function HomeDeliveryLocationSheet({ onClose }: HomeDeliveryLocationSheetProps) {
  const keyboardInset = useKeyboardInset(true);
  const { height: windowHeight } = useWindowDimensions();
  const listMaxHeight = useMemo(() => {
    const base = Math.round(windowHeight * 0.36);
    if (keyboardInset <= 0) return base;
    return Math.max(120, base - Math.round(keyboardInset * 0.35));
  }, [windowHeight, keyboardInset]);

  const user = useAuthStore((s) => s.user);
  const setFromAddress = useDeliveryLocationStore((s) => s.setFromAddress);
  const setFromSnapshot = useDeliveryLocationStore((s) => s.setFromSnapshot);
  const persistedId = useDeliveryLocationStore((s) => s.selectedAddressId);

  const { data: addresses = [], isLoading } = useAddressesQuery();
  const { deleteAddress, isDeleting } = useDeleteAddress(addresses);
  const [menuAddress, setMenuAddress] = useState<CustomerAddress | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(persistedId);
  const [draftLine, setDraftLine] = useState('');
  const [draftPincode, setDraftPincode] = useState('');
  const [draftCityId, setDraftCityId] = useState<string | null>(null);
  const [draftCityName, setDraftCityName] = useState('');
  const [draftLat, setDraftLat] = useState<number | null>(null);
  const [draftLng, setDraftLng] = useState<number | null>(null);
  const [pinHint, setPinHint] = useState('');
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CustomerAddress | null>(null);

  useEffect(() => {
    if (persistedId) {
      setSelectedId(persistedId);
      return;
    }
    if (addresses.length === 0) return;
    const pick = addresses.find((a) => a.isDefault) ?? addresses[0];
    setSelectedId(pick.id);
  }, [addresses, persistedId]);

  useEffect(() => {
    const code = draftPincode.replace(/\D/g, '');
    if (code.length !== 6) {
      setPinHint('');
      setDraftCityId(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      void resolvePincode(code, draftCityId ? { cityId: draftCityId } : {})
        .then((data) => {
          if (cancelled) return;
          const row = data as {
            deliverable?: boolean;
            city?: { id: string; name: string };
          };
          if (!row?.deliverable || !row.city?.id) {
            setPinHint('We do not deliver to this pincode yet');
            setDraftCityId(null);
            return;
          }
          setDraftCityId(row.city.id);
          setDraftCityName(row.city.name);
          setPinHint(row.city.name);
        })
        .catch(() => {
          if (cancelled) return;
          setPinHint('');
        });
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [draftPincode, draftCityId]);

  function selectSaved(addr: CustomerAddress) {
    setSelectedId(addr.id);
    setDraftLine('');
    setDraftPincode('');
  }

  function buildDraftSnapshot(): DeliverySnapshot | null {
    if (selectedId) {
      const addr = addresses.find((a) => a.id === selectedId);
      if (addr?.cityId) return deliverySnapshotFromAddress(addr);
      return null;
    }
    const pin = draftPincode.replace(/\D/g, '');
    if (draftLine.trim().length < 3 || pin.length !== 6 || !draftCityId) return null;
    return {
      address: draftLine.trim(),
      landmark: null,
      pincode: pin,
      cityId: draftCityId,
      cityName: draftCityName,
      latitude: draftLat,
      longitude: draftLng,
      label: 'Delivery',
    };
  }

  async function handleConfirm() {
    const snapshot = buildDraftSnapshot();
    if (!snapshot) {
      Alert.alert(
        'Choose delivery location',
        'Select a saved address or search for an area and enter a serviceable pincode.',
      );
      return;
    }
    if (selectedId) {
      const addr = addresses.find((a) => a.id === selectedId);
      if (addr) {
        await setFromAddress(addr);
        onClose();
        return;
      }
    }
    await setFromSnapshot(snapshot, null);
    onClose();
  }

  function openAddForm() {
    setEditTarget(null);
    setAddressFormOpen(true);
  }

  function openEditForm(addr: CustomerAddress) {
    setEditTarget(addr);
    setAddressFormOpen(true);
  }

  function onAddressSaved(addr: CustomerAddress) {
    setSelectedId(addr.id);
    setDraftLine('');
    if (addr.isDefault && addr.cityId) {
      void setFromAddress(addr);
    }
  }

  const phoneLabel = user?.phone ? `Mobile: ${user.phone}` : null;

  return (
    <>
      <ScrollView
        className="px-4 pb-2 pt-3"
        style={{ maxHeight: Math.round(windowHeight * 0.78) }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <Text className="text-foreground mb-4 text-lg font-semibold">Delivery location</Text>

        <View className="mb-3 gap-1">
          <Text className="text-foreground text-sm font-medium">Receiver&apos;s country*</Text>
          <View className="flex-row items-center justify-between rounded-xl border border-border px-3 py-3">
            <View className="flex-row items-center gap-2">
              <Text className="text-sm leading-none">🇮🇳</Text>
              <Text className="text-foreground text-base">India</Text>
            </View>
            <Icon as={ChevronDown} className="text-muted-foreground size-4" />
          </View>
        </View>

        <View className="mb-4 gap-1">
          <Text className="text-foreground text-sm font-medium">Delivery location*</Text>
          <PlacesAddressAutocomplete
            value={draftLine}
            onChange={(line) => {
              setSelectedId(null);
              setDraftLine(line);
            }}
            onPlaceResolved={({ address, pincode, latitude, longitude }) => {
              setSelectedId(null);
              setDraftLine(address);
              if (pincode) setDraftPincode(pincode);
              setDraftLat(latitude);
              setDraftLng(longitude);
            }}
            placeholder="Search or enter area"
            className="h-11"
          />
          <Input
            value={draftPincode}
            onChangeText={(text) => {
              setSelectedId(null);
              setDraftPincode(text);
            }}
            placeholder="Pincode"
            keyboardType="number-pad"
            maxLength={6}
            className="mt-2 h-11"
          />
          {pinHint ? <Text className="text-muted-foreground text-xs">{pinHint}</Text> : null}
        </View>

        <ScalePressable
          onPress={openAddForm}
          haptic
          className="mb-4 flex-row items-center justify-center gap-2 rounded-xl border border-border py-3 active:bg-muted/50">
          <Icon as={Plus} className="text-primary size-5" />
          <Text className="text-primary text-sm font-semibold">Add new address</Text>
        </ScalePressable>

        {isLoading ? (
          <Text className="text-muted-foreground py-4 text-center text-sm">Loading addresses…</Text>
        ) : addresses.length > 0 ? (
          <View className="mb-4">
            <Text className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
              Saved addresses
            </Text>
            <ScrollView style={{ maxHeight: listMaxHeight }} nestedScrollEnabled>
              {addresses.map((addr) => {
                const selected = selectedId === addr.id;
                return (
                  <Pressable key={addr.id} onPress={() => selectSaved(addr)}>
                    <View className="mb-3 rounded-xl border border-border p-3 active:bg-muted/40">
                    <View className="flex-row items-start gap-3">
                      <AddressRadio selected={selected} />
                      <View className="min-w-0 flex-1">
                        <View className="flex-row items-center justify-between gap-2">
                          <View className="flex-row flex-wrap items-center gap-2">
                            <Text className="text-foreground font-semibold">
                              {user?.name ?? 'You'}
                            </Text>
                            <View className="rounded-full bg-muted px-2 py-0.5">
                              <Text className="text-muted-foreground text-[10px] font-semibold uppercase">
                                {addr.label}
                              </Text>
                            </View>
                          </View>
                          <ScalePressable
                            onPress={() => setMenuAddress(addr)}
                            hitSlop={8}
                            accessibilityLabel="Address options">
                            <Icon as={MoreVertical} className="text-muted-foreground size-4" />
                          </ScalePressable>
                        </View>
                        <Text className="text-muted-foreground mt-1.5 text-sm leading-5">
                          {addr.address}
                          {addr.landmark ? `, ${addr.landmark}` : ''}, {addr.cityName},{' '}
                          {addr.pincode}
                        </Text>
                        {phoneLabel ? (
                          <Text className="text-muted-foreground mt-1 text-xs">{phoneLabel}</Text>
                        ) : null}
                      </View>
                    </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : (
          <Text className="text-muted-foreground mb-4 text-sm">
            No saved addresses yet. Add one to deliver faster next time.
          </Text>
        )}

        <Button onPress={() => void handleConfirm()} className="mb-2">
          <Text>Confirm</Text>
        </Button>
      </ScrollView>

      <AddressFormSheet
        visible={addressFormOpen}
        onClose={() => setAddressFormOpen(false)}
        editAddress={editTarget}
        onSaved={onAddressSaved}
      />

      <AddressOptionsSheet
        address={menuAddress}
        open={menuAddress != null}
        onClose={() => setMenuAddress(null)}
        onEdit={openEditForm}
        onDelete={(addr) => void deleteAddress(addr)}
        deleting={isDeleting}
      />
    </>
  );
}
