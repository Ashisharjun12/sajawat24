import { useMapsSdkConfig } from '@/module/geo/hooks/use-maps-sdk-config';
import { OlaMapView } from '@/module/geo/components/OlaMapView';
import { INDIA_CENTER, isInsideIndiaBounds } from '@/module/geo/lib/india-map';
import { ShopPlacesAutocomplete } from '@/module/onboarding/components/ShopPlacesAutocomplete';
import { OnboardingButton } from '@/module/onboarding/components/OnboardingButton';
import { MapCenterPin } from '@/module/geo/components/MapCenterPin';
import { Icon } from '@/components/ui/icon';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { AppSpinner } from '@/components/ui/app-spinner';
import { requestForegroundLocationPermission } from '@/lib/location';
import * as Location from 'expo-location';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronLeft, ChevronRight, Crosshair, MapPin, Search, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type Pin = { latitude: number; longitude: number };

type Props = {
  address: string;
  pincode: string;
  pin: Pin | null;
  onAddressChange: (address: string) => void;
  onPincodeChange: (pincode: string) => void;
  onPinChange: (pin: Pin) => void;
  error?: string;
};

function formatGeocodedAddress(geo: Location.LocationGeocodedAddress): string {
  const parts = [
    geo.name,
    geo.streetNumber,
    geo.street,
    geo.district,
    geo.subregion,
    geo.city,
    geo.region,
  ].filter((part) => part && String(part).trim().length > 0);
  return parts.join(', ') || 'Current location';
}

function pincodeFromGeocode(geo: Location.LocationGeocodedAddress): string | null {
  const digits = String(geo.postalCode ?? '').replace(/\D/g, '');
  const match = digits.match(/[1-9]\d{5}/);
  return match?.[0] ?? null;
}

function LocationOptionRow({
  icon,
  title,
  subtitle,
  onPress,
  loading,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onPress: () => void;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      className="flex-row items-center gap-3 border-b border-border/70 py-4 active:opacity-80">
      <View className="size-10 items-center justify-center rounded-full bg-muted">
        {loading ? (
          <AppSpinner size="sm" />
        ) : (
          <Icon as={icon} className="text-foreground size-5" />
        )}
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-foreground text-base font-semibold">{title}</Text>
        {subtitle ? (
          <Text className="text-muted-foreground mt-0.5 text-sm leading-5" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Icon as={ChevronRight} className="text-muted-foreground size-5 shrink-0" />
    </Pressable>
  );
}

export function ShopLocationPicker({
  address,
  pincode,
  pin,
  onAddressChange,
  onPincodeChange,
  onPinChange,
  error,
}: Props) {
  const insets = useSafeAreaInsets();
  const sheetBottom = Math.max(insets.bottom, 16);

  const [mainSheetOpen, setMainSheetOpen] = useState(false);
  const [searchManualOpen, setSearchManualOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [draftPin, setDraftPin] = useState<Pin>(pin ?? INDIA_CENTER);
  const [pinWarning, setPinWarning] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [currentConfirm, setCurrentConfirm] = useState<{
    address: string;
    pincode: string | null;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  const { config: sdkConfig, loading: sdkLoading, error: sdkError } = useMapsSdkConfig();

  useEffect(() => {
    if (pin) setDraftPin(pin);
  }, [pin?.latitude, pin?.longitude]);

  function openMainSheet() {
    setManualAddress(address);
    setManualError(null);
    setCurrentConfirm(null);
    setMainSheetOpen(true);
  }

  function openPinMap(center?: Pin) {
    setDraftPin(center ?? pin ?? INDIA_CENTER);
    setPinWarning(null);
    setPinOpen(true);
  }

  function confirmPin() {
    if (!isInsideIndiaBounds(draftPin.latitude, draftPin.longitude)) {
      setPinWarning('Move the pin inside India.');
      return;
    }
    onPinChange(draftPin);
    setPinOpen(false);
    setMainSheetOpen(false);
    setSearchManualOpen(false);
    setCurrentConfirm(null);
  }

  function applyPlaceAndOpenPin(details: {
    address: string;
    pincode: string | null;
    latitude: number;
    longitude: number;
  }) {
    onAddressChange(details.address);
    if (details.pincode) onPincodeChange(details.pincode);
    setDraftPin({ latitude: details.latitude, longitude: details.longitude });
    setSearchManualOpen(false);
    setMainSheetOpen(false);
    openPinMap({ latitude: details.latitude, longitude: details.longitude });
  }

  async function handleUseCurrentLocation() {
    setLocating(true);
    try {
      const granted = await requestForegroundLocationPermission();
      if (!granted) {
        setManualError('Turn on location access to use your current position.');
        return;
      }
      const fix = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const results = await Location.reverseGeocodeAsync({
        latitude: fix.coords.latitude,
        longitude: fix.coords.longitude,
      });
      const geo = results[0];
      const formatted = geo ? formatGeocodedAddress(geo) : 'Current location';
      const detectedPin = geo ? pincodeFromGeocode(geo) : null;
      setCurrentConfirm({
        address: formatted,
        pincode: detectedPin,
        latitude: fix.coords.latitude,
        longitude: fix.coords.longitude,
      });
    } catch {
      setManualError('Could not read your location. Try search instead.');
    } finally {
      setLocating(false);
    }
  }

  function confirmCurrentLocation() {
    if (!currentConfirm) return;
    onAddressChange(currentConfirm.address);
    if (currentConfirm.pincode) onPincodeChange(currentConfirm.pincode);
    applyPlaceAndOpenPin({
      address: currentConfirm.address,
      pincode: currentConfirm.pincode,
      latitude: currentConfirm.latitude,
      longitude: currentConfirm.longitude,
    });
    setCurrentConfirm(null);
  }

  const trimmedAddress = address.trim();
  const summary = trimmedAddress.length > 0 ? trimmedAddress : null;
  const searchPreview =
    trimmedAddress.length > 0 ? trimmedAddress : 'Search for area, street name…';

  return (
    <View className="gap-2">
      <Label nativeID="shopLocation">Shop location on map</Label>
      {summary ? (
        <View className="border-input gap-2 rounded-2xl border bg-card p-4">
          <View className="flex-row items-start gap-2">
            <Icon as={MapPin} className="text-primary mt-0.5 size-4 shrink-0" />
            <Text className="text-foreground flex-1 text-sm leading-5">{summary}</Text>
          </View>
          {pincode ? (
            <Text className="text-muted-foreground pl-6 text-xs">Pincode {pincode}</Text>
          ) : null}
          <View className="flex-row gap-4 pl-6 pt-1">
            <Pressable onPress={openMainSheet}>
              <Text className="text-foreground text-sm font-semibold underline">Change</Text>
            </Pressable>
            <Pressable onPress={() => openPinMap()}>
              <Text className="text-foreground text-sm font-semibold underline">Adjust pin</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={openMainSheet}
          className="border-input flex-row items-center gap-3 rounded-2xl border bg-card px-4 py-4 active:opacity-90">
          <View className="size-10 items-center justify-center rounded-full bg-muted">
            <Icon as={MapPin} className="text-foreground size-5" />
          </View>
          <Text className="text-foreground flex-1 text-base font-semibold">Add shop location</Text>
          <Icon as={ChevronRight} className="text-muted-foreground size-5" />
        </Pressable>
      )}
      {error ? <Text className="text-destructive text-sm">{error}</Text> : null}

      {/* Main bottom sheet */}
      <Modal
        visible={mainSheetOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setMainSheetOpen(false)}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View className="flex-1 justify-end">
            <Pressable
              className="absolute inset-0 bg-black/50"
              onPress={() => {
                setMainSheetOpen(false);
                setCurrentConfirm(null);
              }}
            />
            <View
              className="max-h-[85%] rounded-t-3xl bg-background px-5 pt-3"
              style={{ paddingBottom: sheetBottom }}>
              <View className="mx-auto mb-2 h-1 w-10 rounded-full bg-muted-foreground/30" />
              <View className="mb-1 flex-row items-center justify-between">
                <Text className="text-foreground text-xl font-semibold">Select shop location</Text>
                <Pressable
                  hitSlop={12}
                  onPress={() => {
                    setMainSheetOpen(false);
                    setCurrentConfirm(null);
                  }}
                  className="size-9 items-center justify-center rounded-full bg-muted">
                  <Icon as={X} className="text-foreground size-5" />
                </Pressable>
              </View>

              <Pressable
                onPress={() => {
                  setMainSheetOpen(false);
                  setManualAddress(address);
                  setSearchManualOpen(true);
                }}
                className="mt-4 h-11 flex-row items-center gap-2 rounded-xl border border-border bg-card px-3 active:opacity-90">
                <Icon as={Search} className="text-muted-foreground size-4 shrink-0" />
                <Text
                  className={
                    trimmedAddress.length > 0
                      ? 'text-foreground flex-1 text-base'
                      : 'text-muted-foreground flex-1 text-base'
                  }
                  numberOfLines={2}>
                  {searchPreview}
                </Text>
              </Pressable>

              <View className="mt-2">
                <LocationOptionRow
                  icon={Crosshair}
                  title="Use current location"
                  subtitle={locating ? 'Getting GPS fix…' : 'Autofill from where you are now'}
                  onPress={() => void handleUseCurrentLocation()}
                  loading={locating}
                />
                <LocationOptionRow
                  icon={MapPin}
                  title="Search shop address"
                  subtitle="Pick your shop from suggestions"
                  onPress={() => {
                    setMainSheetOpen(false);
                    setManualAddress(address);
                    setManualError(null);
                    setSearchManualOpen(true);
                  }}
                />
              </View>
              {manualError ? (
                <Text className="text-destructive mt-2 text-sm leading-5">{manualError}</Text>
              ) : null}
            </View>

            {/* Current location confirm card */}
            {currentConfirm ? (
              <View className="absolute inset-0 items-center justify-center px-6">
                <Pressable
                  className="absolute inset-0 bg-black/40"
                  onPress={() => setCurrentConfirm(null)}
                />
                <View className="w-full max-w-sm overflow-hidden rounded-3xl bg-background shadow-lg">
                  <View className="items-center bg-muted/40 px-6 pb-4 pt-8">
                    <View className="mb-3 size-14 items-center justify-center rounded-full bg-primary/15">
                      <Icon as={MapPin} className="text-primary size-8" />
                    </View>
                    <Text className="text-foreground text-center text-lg font-semibold leading-6">
                      Use this location for your shop?
                    </Text>
                  </View>
                  <View className="gap-3 px-5 py-5">
                    <Text className="text-muted-foreground text-center text-sm leading-5">
                      {currentConfirm.address}
                    </Text>
                    <OnboardingButton onPress={confirmCurrentLocation}>
                      <Text>Yes, use this location</Text>
                    </OnboardingButton>
                    <Pressable
                      onPress={() => {
                        setCurrentConfirm(null);
                        setMainSheetOpen(false);
                        setSearchManualOpen(true);
                      }}
                      className="h-12 items-center justify-center rounded-2xl border border-border">
                      <Text className="text-foreground text-base font-semibold">
                        No, pick another address
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        </GestureHandlerRootView>
      </Modal>

      {/* Search */}
      <Modal
        visible={searchManualOpen}
        animationType="slide"
        onRequestClose={() => setSearchManualOpen(false)}>
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
          <View className="flex-row items-center border-b border-border/60 px-4 py-3">
            <Pressable
              hitSlop={12}
              accessibilityLabel="Go back"
              onPress={() => {
                setSearchManualOpen(false);
                setMainSheetOpen(true);
              }}
              className="size-10 items-center justify-center">
              <Icon as={ChevronLeft} className="text-foreground size-7" />
            </Pressable>
            <Text className="text-foreground flex-1 text-center text-lg font-semibold">
              Add shop location
            </Text>
            <Pressable
              hitSlop={12}
              accessibilityLabel="Close"
              onPress={() => setSearchManualOpen(false)}
              className="size-10 items-center justify-center">
              <Icon as={X} className="text-muted-foreground size-6" />
            </Pressable>
          </View>
          <ScrollView
            className="flex-1"
            contentContainerClassName="px-5 pb-8 pt-4"
            keyboardShouldPersistTaps="handled">
            <ShopPlacesAutocomplete
              value={manualAddress}
              onChangeText={setManualAddress}
              onPlaceSelected={(details) => applyPlaceAndOpenPin(details)}
            />
            <Text className="text-muted-foreground mt-3 text-sm leading-5">
              Select a result to place your shop on the map.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Pin confirm */}
      <Modal visible={pinOpen} animationType="slide" onRequestClose={() => setPinOpen(false)}>
        <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
          <View className="flex-row items-center justify-between px-5 py-3">
            <Text className="text-lg font-semibold">Confirm pin</Text>
            <Pressable onPress={() => setPinOpen(false)}>
              <Icon as={X} className="text-muted-foreground size-6" />
            </Pressable>
          </View>
          {sdkLoading ? (
            <View className="flex-1 items-center justify-center">
              <AppSpinner size="md" />
            </View>
          ) : sdkError || !sdkConfig ? (
            <View className="flex-1 justify-center px-6">
              <Text className="text-muted-foreground text-center text-sm">
                Map is unavailable. Check API maps config and try again.
              </Text>
              <View className="mt-6">
                <OnboardingButton
                  onPress={() => {
                    if (address.trim().length >= 10 && pin) {
                      setPinOpen(false);
                    }
                  }}>
                  <Text>Close</Text>
                </OnboardingButton>
              </View>
            </View>
          ) : (
            <View className="flex-1 px-4">
              <View className="relative h-[52%] overflow-hidden rounded-2xl">
                <OlaMapView
                  sdkConfig={sdkConfig}
                  center={draftPin}
                  zoom={16}
                  onCenterChange={setDraftPin}
                />
                <MapCenterPin />
              </View>
              <Text className="text-muted-foreground mt-3 text-center text-sm leading-5">
                Move the map so the pin sits on your shop entrance.
              </Text>
              {pinWarning ? (
                <Text className="text-destructive mt-2 text-center text-sm">{pinWarning}</Text>
              ) : null}
              <View className="mt-6 px-2">
                <OnboardingButton onPress={confirmPin}>
                  <Text>Save shop location</Text>
                </OnboardingButton>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}
