import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { getApiError } from '@/api/client';
import type { CustomerAddress } from '@/api/addresses.api';
import { AccountSubScreen } from '@/module/account/components/AccountSubScreen';
import { ADD_ADDRESS_HREF } from '@/lib/select-location-route';
import { useAddressFormDraftStore } from '@/store/address-form-draft.store';
import { emptyAddressForm } from '@/module/account/lib/address-form';
import { router } from 'expo-router';
import { AddressOptionsSheet } from '@/module/account/components/AddressOptionsSheet';
import { useDeleteAddress } from '@/module/account/hooks/use-delete-address';
import { useAddressMutations, useAddressesQuery } from '@/module/account/hooks/use-addresses-query';
import { cn } from '@/lib/utils';
import { Briefcase, Home, MapPin, MoreVertical, Plane } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';

function addressIcon(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes('work') || lower.includes('office')) return Briefcase;
  if (lower.includes('home')) return Home;
  if (lower.includes('hotel') || lower.includes('pg')) return Plane;
  return MapPin;
}

export function AddressesScreen() {
  const { data: addresses = [], isLoading, isError, error } = useAddressesQuery();
  const { setDefault } = useAddressMutations();
  const { deleteAddress, isDeleting } = useDeleteAddress(addresses);
  const [menuAddress, setMenuAddress] = useState<CustomerAddress | null>(null);
  const setDraft = useAddressFormDraftStore((s) => s.setDraft);

  function openAdd() {
    setDraft(emptyAddressForm);
    router.push(ADD_ADDRESS_HREF);
  }

  function openEdit(addr: CustomerAddress) {
    setDraft(
      {
        label: addr.label,
        address: addr.address,
        landmark: addr.landmark ?? '',
        pincode: addr.pincode,
        cityName: addr.cityName,
        cityId: addr.cityId,
        isDefault: addr.isDefault,
        latitude: addr.latitude,
        longitude: addr.longitude,
      },
      addr.id,
    );
    router.push(ADD_ADDRESS_HREF);
  }

  async function makeDefault(addr: CustomerAddress) {
    if (addr.isDefault) return;
    try {
      await setDefault.mutateAsync(addr.id);
    } catch (err) {
      Alert.alert('Could not update', getApiError(err));
    }
  }

  return (
    <AccountSubScreen title="Addresses">
      <Pressable
        onPress={openAdd}
        className="bg-primary rounded-xl py-3.5 active:opacity-90"
        accessibilityRole="button">
        <Text className="text-primary-foreground text-center text-sm font-semibold">
          Add new address
        </Text>
      </Pressable>

      {isLoading ? (
        <ActivityIndicator className="py-8" />
      ) : isError ? (
        <Text className="text-destructive text-sm">{getApiError(error)}</Text>
      ) : addresses.length === 0 ? (
        <Text className="text-muted-foreground text-sm leading-6">
          No saved addresses yet. Add one for faster checkout.
        </Text>
      ) : (
        <View className="gap-3">
          <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
            Saved addresses
          </Text>
          <View className="border-t border-border">
            {addresses.map((addr, index) => {
              const IconComponent = addressIcon(addr.label);
              const isLast = index === addresses.length - 1;
              return (
                <Pressable
                  key={addr.id}
                  onPress={() => void makeDefault(addr)}
                  className={cn('border-b border-border', isLast && 'border-b-0')}>
                  <View className="flex-row gap-3 py-4">
                    <View className="w-11 shrink-0 items-center">
                      <View className="size-10 items-center justify-center rounded-lg bg-muted/80">
                        <Icon as={IconComponent} className="text-foreground size-[18px]" />
                      </View>
                    </View>
                    <View className="min-w-0 flex-1">
                      <View className="flex-row flex-wrap items-center gap-2">
                        <Text className="text-foreground text-base font-semibold">{addr.label}</Text>
                        {addr.isDefault ? (
                          <View className="rounded-full bg-primary px-2 py-0.5">
                            <Text className="text-primary-foreground text-[10px] font-bold uppercase">
                              Default
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text className="text-muted-foreground mt-1.5 text-sm leading-5">
                        {addr.address}
                        {addr.landmark ? `, ${addr.landmark}` : ''}, {addr.cityName} {addr.pincode}
                      </Text>
                      <Text className="text-muted-foreground mt-1 text-xs">Tap to set default</Text>
                    </View>
                    <Pressable
                      hitSlop={8}
                      accessibilityLabel="Address options"
                      onPress={() => setMenuAddress(addr)}>
                      <Icon as={MoreVertical} className="text-muted-foreground size-5" />
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <AddressOptionsSheet
        address={menuAddress}
        open={menuAddress != null}
        onClose={() => setMenuAddress(null)}
        onEdit={openEdit}
        onDelete={(addr) => void deleteAddress(addr)}
        deleting={isDeleting}
      />
    </AccountSubScreen>
  );
}
