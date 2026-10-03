import { WhatsAppIcon } from '@/components/shell/WhatsAppIcon';
import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { CustomerAddress } from '@/api/addresses.api';
import { Screen } from '@/components/shell';
import { openWhatsAppSupport } from '@/lib/support-actions';
import { ADD_ADDRESS_HREF } from '@/lib/select-location-route';
import { LocationAddressListSkeleton } from '@/module/location/components/LocationAddressListSkeleton';
import { LocationStackHeader } from '@/module/location/components/LocationStackHeader';
import { resolveAddressDeliveryContext } from '@/module/location/lib/address-delivery-context';
import { AddressOptionsSheet } from '@/module/account/components/AddressOptionsSheet';
import { useDeleteAddress } from '@/module/account/hooks/use-delete-address';
import { useAddressesQuery } from '@/module/account/hooks/use-addresses-query';
import { emptyCart } from '@/module/booking/lib/cart-types';
import { useCartQuery } from '@/module/booking/hooks/use-cart-query';
import { useAuthStore } from '@/store/auth.store';
import { emptyAddressForm } from '@/module/account/lib/address-form';
import { PlacesAddressAutocomplete } from '@/module/geo/components/PlacesAddressAutocomplete';
import { useAddressFormDraftStore } from '@/store/address-form-draft.store';
import { useDeliveryLocationStore } from '@/store/delivery-location.store';
import { useLocationStore } from '@/store/location.store';
import { cn } from '@/lib/utils';
import { Briefcase, Check, Crosshair, Home, MapPin, MoreVertical, Plane, Plus } from 'lucide-react-native';
import { finishLocationFlow } from '@/lib/location-flow-navigation';
import { navigateBackOrHome } from '@/lib/navigate-back';
import { useLocationFlowStore } from '@/store/location-flow.store';
import { applySelectedDeliveryAddress } from '@/module/location/lib/apply-selected-delivery-address';
import { type Href, router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Keyboard, Pressable, ScrollView, View } from 'react-native';

function addressIcon(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes('work') || lower.includes('office')) return Briefcase;
  if (lower.includes('home')) return Home;
  if (lower.includes('hotel') || lower.includes('pg')) return Plane;
  return MapPin;
}

function QuickAction({
  label,
  icon,
  iconSlot,
  onPress,
  loading,
}: {
  label: string;
  icon?: typeof Crosshair;
  iconSlot?: ReactNode;
  onPress: () => void;
  loading?: boolean;
}) {
  return (
    <ScalePressable
      onPress={onPress}
      disabled={loading}
      haptic
      className="flex-1 items-center rounded-2xl border border-border bg-card px-2 py-3.5 active:bg-muted/40">
      <View className="mb-2 size-10 items-center justify-center rounded-full bg-muted">
        {loading ? (
          <ActivityIndicator size="small" />
        ) : iconSlot ? (
          iconSlot
        ) : icon ? (
          <Icon as={icon} className="text-foreground size-5" />
        ) : null}
      </View>
      <Text className="text-foreground text-center text-[11px] font-semibold leading-4">
        {label}
      </Text>
    </ScalePressable>
  );
}

export function SelectLocationScreen() {
  const queryClient = useQueryClient();
  const { data: addresses = [], isLoading } = useAddressesQuery();
  const { deleteAddress, isDeleting } = useDeleteAddress(addresses);
  const [menuAddress, setMenuAddress] = useState<CustomerAddress | null>(null);
  const selectedId = useDeliveryLocationStore((s) => s.selectedAddressId);
  const setDraft = useAddressFormDraftStore((s) => s.setDraft);
  const locationCity = useLocationStore((s) => s.city);
  const deliverySnapshot = useDeliveryLocationStore((s) => s.snapshot);
  const user = useAuthStore((s) => s.user);
  const { data: cart = emptyCart } = useCartQuery(Boolean(user));

  const deliveryContext = useMemo(
    () =>
      resolveAddressDeliveryContext({
        cart,
        delivery: deliverySnapshot,
        locationCity,
      }),
    [cart, deliverySnapshot, locationCity],
  );

  const [searchLine, setSearchLine] = useState('');
  const [locating, setLocating] = useState(false);

  function onBackFromSelect() {
    if (useLocationFlowStore.getState().returnTarget === 'checkout') {
      useLocationFlowStore.getState().clearReturn();
      router.replace('/(app)/checkout' as Href);
      return;
    }
    navigateBackOrHome();
  }

  function draftWithServiceCity() {
    const { contextCityId, contextCityName } = deliveryContext;
    return {
      ...emptyAddressForm,
      cityId: contextCityId,
      cityName: contextCityName,
    };
  }

  async function pickAddress(addr: CustomerAddress) {
    if (!addr.cityId) return;
    await applySelectedDeliveryAddress(addr, queryClient);
    finishLocationFlow();
  }

  async function useCurrentLocation() {
    Keyboard.dismiss();
    setLocating(true);
    try {
      const ok = await useLocationStore.getState().detectLocationFromGps();
      if (ok) {
        navigateBackOrHome();
        return;
      }
      Alert.alert('Location', 'Allow location access or pick an address from the list.');
    } finally {
      setLocating(false);
    }
  }

  function openAddAddress() {
    Keyboard.dismiss();
    setDraft(draftWithServiceCity());
    router.push(ADD_ADDRESS_HREF);
  }

  function openEditAddress(addr: CustomerAddress) {
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


  function onSearchPlaceResolved({
    address,
    pincode,
    latitude,
    longitude,
  }: {
    address: string;
    pincode: string | null;
    latitude: number;
    longitude: number;
  }) {
    setDraft({
      ...draftWithServiceCity(),
      address,
      pincode: pincode ?? '',
      latitude,
      longitude,
    });
    router.push(ADD_ADDRESS_HREF);
  }

  return (
    <Screen scroll={false} edges={['top', 'bottom']} contentClassName="flex-1">
      <LocationStackHeader title="Select your location" onBack={onBackFromSelect} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-4 pb-10 pt-3"
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={() => Keyboard.dismiss()}>
        <Text className="text-muted-foreground px-1 text-sm leading-5">
          Choose a saved address or add a new delivery location.
        </Text>

        <View className="relative z-20 rounded-2xl border border-border bg-card p-3" style={{ zIndex: 20 }}>
          <PlacesAddressAutocomplete
            dropdownLayout="inline"
            value={searchLine}
            onChange={setSearchLine}
            onPlaceResolved={onSearchPlaceResolved}
            placeholder="Search an area or address"
            className="h-11 rounded-xl"
          />
        </View>

        <View className="flex-row gap-2.5">
          <QuickAction
            label="Current location"
            icon={Crosshair}
            onPress={() => void useCurrentLocation()}
            loading={locating}
          />
          <QuickAction label="Add address" icon={Plus} onPress={openAddAddress} />
          <QuickAction
            label="WhatsApp"
            iconSlot={<WhatsAppIcon size={22} color="#25D366" />}
            onPress={() => void openWhatsAppSupport()}
          />
        </View>

        {isLoading ? (
          <LocationAddressListSkeleton rows={3} />
        ) : addresses.length > 0 ? (
          <View>
            <Text className="text-muted-foreground mb-3 px-1 text-xs font-semibold uppercase tracking-wide">
              Saved addresses
            </Text>
            <View className="gap-2">
              {addresses.map((addr) => {
                const IconComponent = addressIcon(addr.label);
                const selected = selectedId === addr.id;
                return (
                  <Pressable
                    key={addr.id}
                    onPress={() => void pickAddress(addr)}
                    className={cn(
                      'rounded-2xl border bg-card px-4 py-4 active:bg-muted/30',
                      selected ? 'border-foreground/25' : 'border-border',
                    )}>
                    <View className="flex-row gap-3">
                      <View
                        className={cn(
                          'size-11 items-center justify-center rounded-xl',
                          selected ? 'bg-foreground' : 'bg-muted',
                        )}>
                        <Icon
                          as={IconComponent}
                          className={cn(
                            'size-5',
                            selected ? 'text-background' : 'text-muted-foreground',
                          )}
                        />
                      </View>
                      <View className="min-w-0 flex-1">
                        <View className="flex-row flex-wrap items-center gap-2">
                          <Text className="text-foreground font-semibold">{addr.label}</Text>
                          {selected ? (
                            <View className="flex-row items-center gap-1 rounded-full bg-emerald-600/10 px-2 py-0.5">
                              <Icon as={Check} className="size-3 text-emerald-700" />
                              <Text className="text-[10px] font-bold uppercase text-emerald-700">
                                Selected
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text
                          className="text-muted-foreground mt-1 text-sm leading-5"
                          numberOfLines={2}>
                          {addr.address}
                          {addr.landmark ? `, ${addr.landmark}` : ''}
                        </Text>
                        <Text className="text-muted-foreground mt-0.5 text-xs">
                          {addr.cityName} · {addr.pincode}
                        </Text>
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
        ) : (
          <View className="rounded-2xl border border-dashed border-border bg-card px-4 py-8">
            <Text className="text-foreground text-center text-base font-semibold">
              No saved addresses
            </Text>
            <Text className="text-muted-foreground mt-2 text-center text-sm leading-5">
              Add an address or use your current location to start ordering.
            </Text>
          </View>
        )}
      </ScrollView>

      <AddressOptionsSheet
        address={menuAddress}
        open={menuAddress != null}
        onClose={() => setMenuAddress(null)}
        onEdit={openEditAddress}
        onDelete={(addr) => void deleteAddress(addr)}
        deleting={isDeleting}
      />
    </Screen>
  );
}
