import { reverseGeocode } from '@/api/maps.api';
import { getApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { LoadingPlaceholder, ScalePressable } from '@/components/shell';
import { requestForegroundLocationPermission } from '@/lib/location';
import { PRIMARY_CTA_BUTTON_CLASS, PRIMARY_CTA_BUTTON_TEXT_CLASS } from '@/lib/primary-cta-button';
import { buildCreateAddressBody } from '@/module/account/lib/address-form';
import { useAddressMutations } from '@/module/account/hooks/use-addresses-query';
import { MapCenterPin } from '@/module/geo/components/MapCenterPin';
import { MapLocateFab } from '@/module/geo/components/MapLocateFab';
import { OlaPinMapView } from '@/module/geo/components/OlaPinMapView';
import { useMapsSdkConfig } from '@/module/geo/hooks/use-maps-sdk-config';
import { INDIA_CENTER, isInsideIndiaBounds } from '@/module/geo/lib/india-map';
import { LocationStackHeader } from '@/module/location/components/LocationStackHeader';
import { PlacesAddressAutocomplete } from '@/module/geo/components/PlacesAddressAutocomplete';
import { useAddressFormDraftStore } from '@/store/address-form-draft.store';
import { MapPin, Search } from 'lucide-react-native';
import { cancelLocationFlowStep, finishLocationFlow } from '@/lib/location-flow-navigation';
import { navigateBackOrHome } from '@/lib/navigate-back';
import { applySelectedDeliveryAddress } from '@/module/location/lib/apply-selected-delivery-address';
import { useLocationFlowStore } from '@/store/location-flow.store';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const REVERSE_DEBOUNCE_MS = 500;

export function ConfirmAddressMapScreen() {
  const insets = useSafeAreaInsets();
  const form = useAddressFormDraftStore((s) => s.form);
  const editAddressId = useAddressFormDraftStore((s) => s.editAddressId);
  const clearDraft = useAddressFormDraftStore((s) => s.clear);
  const queryClient = useQueryClient();
  const returnTarget = useLocationFlowStore((s) => s.returnTarget);

  const { create, update } = useAddressMutations();
  const { config: sdkConfig, loading: sdkLoading, error: sdkError, retry } = useMapsSdkConfig();

  const hasSearchCoords =
    form.latitude != null &&
    form.longitude != null &&
    isInsideIndiaBounds(form.latitude, form.longitude);

  const initial = hasSearchCoords
    ? { latitude: form.latitude!, longitude: form.longitude! }
    : INDIA_CENTER;

  const [mapCenter, setMapCenter] = useState(initial);
  const [mapZoom, setMapZoom] = useState(hasSearchCoords ? 17 : 5);
  const [mapFlyKey, setMapFlyKey] = useState(hasSearchCoords ? 1 : 0);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [placeTitle, setPlaceTitle] = useState(
    form.label.trim() || form.cityName || 'Delivery address',
  );
  const [placeLine, setPlaceLine] = useState(form.address.trim());
  const [geoLoading, setGeoLoading] = useState(false);
  const [searchLine, setSearchLine] = useState('');
  const [mapSearchOpen, setMapSearchOpen] = useState(!hasSearchCoords);

  const reverseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reverseFromPinRef = useRef(!hasSearchCoords);
  const holdSearchCenterRef = useRef(hasSearchCoords);

  const scheduleReverse = useCallback((latitude: number, longitude: number) => {
    if (reverseTimer.current) clearTimeout(reverseTimer.current);
    reverseTimer.current = setTimeout(() => {
      setGeoLoading(true);
      void reverseGeocode(latitude, longitude)
        .then((data) => {
          const row = data as {
            placeName?: string | null;
            formattedAddress?: string;
            cityName?: string | null;
            pincode?: string | null;
          };
          if (row.placeName) setPlaceTitle(row.placeName);
          else if (row.cityName) setPlaceTitle(row.cityName);
          if (row.formattedAddress) setPlaceLine(row.formattedAddress);
        })
        .finally(() => setGeoLoading(false));
    }, REVERSE_DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    if (!form.latitude || !form.longitude) return;
    if (!isInsideIndiaBounds(form.latitude, form.longitude)) return;
    setMapCenter({ latitude: form.latitude, longitude: form.longitude });
    setMapZoom(17);
    setMapFlyKey((k) => k + 1);
    setPlaceLine(form.address.trim());
    setPlaceTitle(form.label.trim() || form.cityName || 'Delivery address');
    setSearchLine('');
    setMapSearchOpen(false);
    reverseFromPinRef.current = false;
    holdSearchCenterRef.current = true;
  }, [form.latitude, form.longitude, form.address, form.label, form.cityName]);

  useEffect(() => {
    if (!reverseFromPinRef.current) return;
    scheduleReverse(mapCenter.latitude, mapCenter.longitude);
    return () => {
      if (reverseTimer.current) clearTimeout(reverseTimer.current);
    };
  }, [mapCenter.latitude, mapCenter.longitude, scheduleReverse]);

  useEffect(() => {
    if (!form.address && !form.cityId) {
      Alert.alert('Address', 'Fill in your address first.', [
        {
          text: 'OK',
          onPress: () => {
            if (returnTarget === 'checkout') {
              cancelLocationFlowStep();
            } else {
              navigateBackOrHome();
            }
          },
        },
      ]);
    }
  }, [form.address, form.cityId, returnTarget]);

  async function useCurrentLocation() {
    Keyboard.dismiss();
    setLocating(true);
    try {
      const granted = await requestForegroundLocationPermission();
      if (!granted) {
        Alert.alert('Location', 'Allow location access to use this.');
        return;
      }
      const Location = await import('expo-location');
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;
      if (!isInsideIndiaBounds(latitude, longitude)) {
        Alert.alert('Location', 'Select a location within India.');
        return;
      }
      holdSearchCenterRef.current = false;
      reverseFromPinRef.current = true;
      setMapCenter({ latitude, longitude });
      setMapZoom(17);
      setMapFlyKey((k) => k + 1);
    } catch {
      Alert.alert('Location', 'Could not get your location.');
    } finally {
      setLocating(false);
    }
  }

  async function saveAddress() {
    const { latitude, longitude } = mapCenter;
    if (!isInsideIndiaBounds(latitude, longitude)) {
      Alert.alert('Location', 'Move the pin inside India.');
      return;
    }
    const body = buildCreateAddressBody({
      ...form,
      latitude,
      longitude,
    });
    if (!body) {
      Alert.alert('Address', 'Complete address and pincode on the previous screen.');
      return;
    }
    setSaving(true);
    try {
      let saved;
      if (editAddressId) {
        saved = await update.mutateAsync({
          id: editAddressId,
          body: {
            label: body.label,
            address: body.address,
            landmark: body.landmark,
            pincode: body.pincode,
            cityId: body.cityId,
            cityName: body.cityName,
            latitude: body.latitude,
            longitude: body.longitude,
            geoSource: body.geoSource,
            setDefault: body.setDefault,
          },
        });
      } else {
        saved = await create.mutateAsync(body);
      }
      await applySelectedDeliveryAddress(saved, queryClient);
      clearDraft();
      finishLocationFlow();
    } catch (err) {
      Alert.alert('Could not save address', getApiError(err));
    } finally {
      setSaving(false);
    }
  }

  const locateFabBottom = Math.max(insets.bottom, 16) + 200;

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <LocationStackHeader title="Select delivery location" onBack={navigateBackOrHome} />

      <View className="relative flex-1">
        {sdkLoading ? (
          <View className="flex-1 items-center justify-center">
            <LoadingPlaceholder className="py-0" />
          </View>
        ) : sdkError || !sdkConfig ? (
          <View className="flex-1 justify-center px-6">
            <Text className="text-muted-foreground text-center text-sm">
              Map is unavailable. Check maps configuration and try again.
            </Text>
            <Button className={`mt-4 ${PRIMARY_CTA_BUTTON_CLASS}`} onPress={retry}>
              <Text className={PRIMARY_CTA_BUTTON_TEXT_CLASS}>Retry</Text>
            </Button>
          </View>
        ) : (
          <>
            <OlaPinMapView
              sdkConfig={sdkConfig}
              center={mapCenter}
              zoom={mapZoom}
              flyToKey={mapFlyKey}
              showUserLocation
              onCenterChange={({ latitude, longitude, zoom, userInteraction }) => {
                if (!userInteraction && holdSearchCenterRef.current) return;
                if (userInteraction) {
                  holdSearchCenterRef.current = false;
                  reverseFromPinRef.current = true;
                }
                setMapCenter({ latitude, longitude });
                if (userInteraction && zoom != null) {
                  setMapZoom(zoom);
                }
              }}
              className="absolute inset-0 z-0"
            />
            <MapCenterPin />

            <View
              pointerEvents="box-none"
              className="absolute left-0 right-0 top-3 z-30 px-4"
              style={{ elevation: 30 }}>
              {mapSearchOpen ? (
                <PlacesAddressAutocomplete
                  value={searchLine}
                  onChange={setSearchLine}
                  onPlaceResolved={({ address, latitude, longitude }) => {
                    Keyboard.dismiss();
                    holdSearchCenterRef.current = false;
                    reverseFromPinRef.current = true;
                    setMapCenter({ latitude, longitude });
                    setMapZoom(17);
                    setMapFlyKey((k) => k + 1);
                    setPlaceLine(address);
                    setPlaceTitle(form.cityName || 'Delivery address');
                    setSearchLine('');
                    setMapSearchOpen(false);
                  }}
                  placeholder="Search an area or address"
                  className="h-12 rounded-2xl border-0 bg-background shadow-md"
                />
              ) : (
                <ScalePressable
                  haptic
                  onPress={() => {
                    setSearchLine('');
                    setMapSearchOpen(true);
                  }}
                  className="h-12 flex-row items-center justify-center gap-2 rounded-2xl border border-border bg-background/95 px-4 shadow-md">
                  <Icon as={Search} className="text-muted-foreground size-4" />
                  <Text className="text-muted-foreground text-sm font-medium">
                    Search another area
                  </Text>
                </ScalePressable>
              )}
            </View>

            <MapLocateFab
              bottom={locateFabBottom}
              loading={locating}
              disabled={saving}
              onPress={() => void useCurrentLocation()}
            />
          </>
        )}

        <View
          className="absolute bottom-0 left-0 right-0 z-40 rounded-t-3xl border-t border-border bg-card px-5 pb-6 pt-4 shadow-lg"
          style={{ paddingBottom: Math.max(insets.bottom, 16), elevation: 40 }}>
          <Text className="text-muted-foreground text-center text-xs">
            Order will be delivered here
          </Text>
          <View className="mt-3 flex-row items-start gap-2">
            <Icon as={MapPin} className="text-primary mt-0.5 size-5 shrink-0" />
            <View className="min-w-0 flex-1">
              <Text className="text-foreground text-lg font-bold" numberOfLines={1}>
                {geoLoading ? 'Finding this place…' : placeTitle}
              </Text>
              <Text className="text-muted-foreground mt-1 text-sm leading-5" numberOfLines={3}>
                {geoLoading ? 'Move the pin over your building' : placeLine}
              </Text>
              {form.cityName ? (
                <Text className="text-muted-foreground mt-1 text-xs">
                  {form.cityName} · {form.pincode}
                </Text>
              ) : null}
            </View>
          </View>
          <Button
            className={`mt-5 ${PRIMARY_CTA_BUTTON_CLASS}`}
            onPress={() => void saveAddress()}
            disabled={saving || sdkLoading}>
            <Text className={PRIMARY_CTA_BUTTON_TEXT_CLASS}>
              {saving ? 'Saving…' : 'Save address'}
            </Text>
          </Button>
        </View>
      </View>
    </View>
  );
}
