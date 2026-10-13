import type { CustomerAddress } from '@/api/addresses.api';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { isBackendCityId } from '@/lib/location-label';
import { useAddressesQuery } from '@/module/account/hooks/use-addresses-query';
import { applySelectedDeliveryAddress } from '@/module/location/lib/apply-selected-delivery-address';
import { navigateToAddAddressScreen } from '@/module/location/lib/navigate-to-add-address';
import { HomeBottomSheetModal } from '@/module/home/components/HomeBottomSheetModal';
import { useDeliveryLocationStore } from '@/store/delivery-location.store';
import { Map, Plus } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';

type CheckoutAddressPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  cartCityId?: string | null;
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

function NoSavedAddressState() {
  return (
    <View className="items-center px-4 py-8">
      <View className="size-14 items-center justify-center rounded-full bg-primary/10">
        <Icon as={Map} className="text-primary size-7" strokeWidth={2.25} />
      </View>
      <Text className="text-foreground mt-4 text-center text-base font-semibold">No saved address</Text>
      <Text className="text-muted-foreground mt-1.5 text-center text-sm leading-5">
        Add a delivery address to continue with this booking.
      </Text>
    </View>
  );
}

export function CheckoutAddressPickerSheet({
  visible,
  onClose,
  cartCityId,
}: CheckoutAddressPickerSheetProps) {
  const queryClient = useQueryClient();
  const selectedAddressId = useDeliveryLocationStore((s) => s.selectedAddressId);
  const { data: addresses = [], isLoading } = useAddressesQuery(visible);

  async function selectAddress(addr: CustomerAddress) {
    if (!addr.cityId || !isBackendCityId(addr.cityId)) {
      Alert.alert('Address not serviceable', 'This address needs a valid city before delivery.');
      return;
    }
    await applySelectedDeliveryAddress(addr, queryClient);
    onClose();
  }

  function openAddAddress() {
    onClose();
    navigateToAddAddressScreen(cartCityId ? { cityId: cartCityId } : null);
  }

  return (
    <HomeBottomSheetModal
      visible={visible}
      onClose={onClose}
      closeAccessibilityLabel="Close address picker">
      <View className="gap-4 px-5 pb-8 pt-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="text-foreground text-h2 font-semibold">Delivery address</Text>
            <Text className="text-muted-foreground mt-1 text-sm leading-5">
              Choose a saved address for this booking.
            </Text>
          </View>
          <Pressable
            onPress={openAddAddress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Add address"
            className="shrink-0 flex-row items-center gap-1">
            <Icon as={Plus} className="text-primary size-4" strokeWidth={2.5} />
            <Text className="text-primary text-sm font-semibold">Add address</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <ActivityIndicator className="py-6" />
        ) : addresses.length === 0 ? (
          <NoSavedAddressState />
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

        <Button variant="primary" size="md" className="w-full" onPress={openAddAddress}>
          <Icon as={Plus} className="size-4 text-primary-foreground" strokeWidth={2.5} />
          <Text>Add address</Text>
        </Button>
      </View>
    </HomeBottomSheetModal>
  );
}
