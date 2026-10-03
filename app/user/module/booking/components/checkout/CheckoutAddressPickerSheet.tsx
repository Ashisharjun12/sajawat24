import type { CustomerAddress } from '@/api/addresses.api';
import { ScalePressable } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { PRIMARY_CTA_BUTTON_CLASS } from '@/lib/primary-cta-button';
import { cn } from '@/lib/utils';
import { isBackendCityId } from '@/lib/location-label';
import { AddressFormSheet } from '@/module/account/components/AddressFormSheet';
import { useAddressesQuery } from '@/module/account/hooks/use-addresses-query';
import { applySelectedDeliveryAddress } from '@/module/location/lib/apply-selected-delivery-address';
import { HomeBottomSheetModal } from '@/module/home/components/HomeBottomSheetModal';
import { useDeliveryLocationStore } from '@/store/delivery-location.store';
import { Plus } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';

type CheckoutAddressPickerSheetProps = {
  visible: boolean;
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

export function CheckoutAddressPickerSheet({ visible, onClose }: CheckoutAddressPickerSheetProps) {
  const queryClient = useQueryClient();
  const selectedAddressId = useDeliveryLocationStore((s) => s.selectedAddressId);
  const { data: addresses = [], isLoading } = useAddressesQuery(visible);
  const [addressFormOpen, setAddressFormOpen] = useState(false);

  async function selectAddress(addr: CustomerAddress) {
    if (!addr.cityId || !isBackendCityId(addr.cityId)) {
      Alert.alert('Address not serviceable', 'This address needs a valid city before delivery.');
      return;
    }
    await applySelectedDeliveryAddress(addr, queryClient);
    onClose();
  }

  function onAddressSaved(addr: CustomerAddress) {
    setAddressFormOpen(false);
    void selectAddress(addr);
  }

  return (
    <>
      <HomeBottomSheetModal
        visible={visible && !addressFormOpen}
        onClose={onClose}
        closeAccessibilityLabel="Close address picker">
        <View className="gap-4 px-5 pb-8 pt-4">
          <View className="items-center gap-1.5 px-2">
            <Text className="text-foreground text-center text-xl font-semibold">
              Delivery address
            </Text>
            <Text className="text-muted-foreground text-center text-sm leading-5">
              Choose a saved address for this booking.
            </Text>
          </View>

          <ScalePressable
            onPress={() => setAddressFormOpen(true)}
            haptic
            className="flex-row items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 active:bg-muted/50">
            <Icon as={Plus} className="text-foreground size-5" />
            <Text className="text-foreground text-sm font-semibold">Add new address</Text>
          </ScalePressable>

          {isLoading ? (
            <ActivityIndicator className="py-6" />
          ) : addresses.length === 0 ? (
            <Text className="text-muted-foreground text-center text-sm">
              No saved addresses yet. Add one above to continue checkout.
            </Text>
          ) : (
            <ScrollView className="max-h-72" nestedScrollEnabled showsVerticalScrollIndicator={false}>
              <View className="gap-3">
                {addresses.map((addr) => {
                  const selected = selectedAddressId === addr.id;
                  return (
                    <Pressable key={addr.id} onPress={() => void selectAddress(addr)}>
                      <View
                        className={cn(
                          'rounded-xl border p-3 active:bg-muted/40',
                          selected ? 'border-primary bg-primary/5' : 'border-border',
                        )}>
                        <View className="flex-row items-start gap-3">
                          <AddressRadio selected={selected} />
                          <View className="min-w-0 flex-1">
                            <View className="flex-row flex-wrap items-center gap-2">
                              <Text className="text-foreground font-semibold">{addr.label}</Text>
                              {addr.isDefault ? (
                                <View className="rounded-full bg-muted px-2 py-0.5">
                                  <Text className="text-muted-foreground text-[10px] font-semibold uppercase">
                                    Default
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                            <Text className="text-muted-foreground mt-1.5 text-sm leading-5">
                              {addr.address}
                              {addr.landmark ? `, ${addr.landmark}` : ''}, {addr.cityName}{' '}
                              {addr.pincode}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}

          <Button variant="outline" className={PRIMARY_CTA_BUTTON_CLASS} onPress={onClose}>
            <Text className="text-foreground text-base font-semibold">Cancel</Text>
          </Button>
        </View>
      </HomeBottomSheetModal>

      <AddressFormSheet
        visible={addressFormOpen}
        onClose={() => setAddressFormOpen(false)}
        onSaved={onAddressSaved}
        title="Add delivery address"
      />
    </>
  );
}
