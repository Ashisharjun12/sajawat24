import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { LoadingPlaceholder } from '@/components/shell';
import {
  currentPositionMessage,
  getCurrentPositionForMap,
  type CurrentPositionFailure,
} from '@/lib/current-position';
import { cancelLocationFlowStep } from '@/lib/location-flow-navigation';
import { PRIMARY_CTA_BUTTON_CLASS } from '@/lib/primary-cta-button';
import { ADDRESS_DETAILS_HREF } from '@/lib/select-location-route';
import { useCartQuery } from '@/module/booking/hooks/use-cart-query';
import { emptyCart } from '@/module/booking/lib/cart-types';
import { MapCenterPin } from '@/module/geo/components/MapCenterPin';
import { MapLocateFab } from '@/module/geo/components/MapLocateFab';
import { OlaPinMapView } from '@/module/geo/components/OlaPinMapView';
import { PlacesAddressAutocomplete } from '@/module/geo/components/PlacesAddressAutocomplete';
import { useMapsSdkConfig } from '@/module/geo/hooks/use-maps-sdk-config';
import { INDIA_CENTER, isInsideIndiaBounds } from '@/module/geo/lib/india-map';
import { LocationStackHeader } from '@/module/location/components/LocationStackHeader';
import { usePinnedLocation } from '@/module/location/hooks/use-pinned-location';
import { resolveAddressDeliveryContext } from '@/module/location/lib/address-delivery-context';
import { useAddressFormDraftStore } from '@/store/address-form-draft.store';
import { useAuthStore } from '@/store/auth.store';
import { useDeliveryLocationStore } from '@/store/delivery-location.store';
import { useLocationStore } from '@/store/location.store';
import { router, useLocalSearchParams } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, Linking, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Matches `MapCenterPin` (pin tip sits on the map centre). */
const PIN_HEIGHT = 52;
const TOOLTIP_HEIGHT = 52;
const TOOLTIP_GAP = 6;

/**
 * Add address, step 1: put the pin on the exact spot. Opens straight on the map (no form first),
 * finds the phone's current location, reads the address under the pin and only lets the user
 * continue when we deliver there. Step 2 is `AddressDetailsScreen`. Opened from the details screen
 * ("Change") it starts on the saved spot, only updates the location and goes back.
 */
export function PickAddressLocationScreen() {
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const fromDetails = from === 'details';

  const form = useAddressFormDraftStore((s) => s.form);
  const editAddressId = useAddressFormDraftStore((s) => s.editAddressId);
  const setDraft = useAddressFormDraftStore((s) => s.setDraft);

  const locationCity = useLocationStore((s) => s.city);
  const deliverySnapshot = useDeliveryLocationStore((s) => s.snapshot);
  const user = useAuthStore((s) => s.user);
  const { data: cart = emptyCart } = useCartQuery(Boolean(user));
  const deliveryContext = useMemo(
    () => resolveAddressDeliveryContext({ cart, delivery: deliverySnapshot, locationCity }),
    [cart, deliverySnapshot, locationCity],
  );

  const { config: sdkConfig, loading: sdkLoading, error: sdkError, retry: retryMap } =
    useMapsSdkConfig();

  /** The user's last selected address, used only when their current location is unavailable. */
  const savedSpot = useMemo(() => {
    const lat = deliverySnapshot?.latitude;
    const lng = deliverySnapshot?.longitude;
    return lat != null && lng != null && isInsideIndiaBounds(lat, lng)
      ? { latitude: lat, longitude: lng }
      : null;
  }, [deliverySnapshot?.latitude, deliverySnapshot?.longitude]);

  // A spot that is already known (editing it, changing it, or coming from a search result) is
  // shown as is. Otherwise we find the phone's current location instead of showing a random place.
  const start = useMemo(() => {
    if (
      form.latitude != null &&
      form.longitude != null &&
      isInsideIndiaBounds(form.latitude, form.longitude)
    ) {
      return { latitude: form.latitude, longitude: form.longitude, zoom: 17, known: true };
    }
    // Neutral backdrop while we look for the user; nothing is read from it.
    return savedSpot
      ? { ...savedSpot, zoom: 14, known: false }
      : { ...INDIA_CENTER, zoom: 5, known: false };
    // Only the first render decides the starting camera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [mapCenter, setMapCenter] = useState({ latitude: start.latitude, longitude: start.longitude });
  const [mapZoom, setMapZoom] = useState(start.zoom);
  const [flyKey, setFlyKey] = useState(0);
  /** True once there is a real spot to read (known spot, search, GPS or pin drag). */
  const [picked, setPicked] = useState(start.known);
  /** 'finding' = still looking for the phone's location. */
  const [phase, setPhase] = useState<'finding' | 'located'>(start.known ? 'located' : 'finding');
  const [notice, setNotice] = useState<CurrentPositionFailure | null>(null);
  const [searchLine, setSearchLine] = useState('');
  const [locating, setLocating] = useState(false);
  const [cardHeight, setCardHeight] = useState(200);
  /** Set as soon as the user searches, drags or taps locate: a late automatic result must not override it. */
  const userMovedRef = useRef(false);

  const pinned = usePinnedLocation({
    latitude: mapCenter.latitude,
    longitude: mapCenter.longitude,
    enabled: picked,
    context: deliveryContext,
  });

  function flyTo(latitude: number, longitude: number, zoom = 17) {
    setMapCenter({ latitude, longitude });
    setMapZoom(zoom);
    setFlyKey((k) => k + 1);
    setPicked(true);
  }

  /** The user took control (search, drag or locate button). */
  function takeOver() {
    userMovedRef.current = true;
    setPhase('located');
    setNotice(null);
  }

  // On open: find the current location (asks for permission if needed). Falls back to the last
  // selected address, or the whole-India view, with a short explanation.
  useEffect(() => {
    if (start.known) return;
    let cancelled = false;
    void (async () => {
      const result = await getCurrentPositionForMap({
        ask: true,
        onApproximate: ({ latitude, longitude }) => {
          if (!cancelled && !userMovedRef.current) flyTo(latitude, longitude, 16);
        },
      });
      if (cancelled || userMovedRef.current) return;
      setPhase('located');
      if (result.ok) {
        setNotice(null);
        flyTo(result.latitude, result.longitude);
        return;
      }
      setNotice(result.reason);
      if (savedSpot) flyTo(savedSpot.latitude, savedSpot.longitude, 16);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function useCurrentLocation() {
    Keyboard.dismiss();
    takeOver();
    setLocating(true);
    try {
      const result = await getCurrentPositionForMap({ ask: true });
      if (result.ok) flyTo(result.latitude, result.longitude);
      else setNotice(result.reason);
    } finally {
      setLocating(false);
    }
  }

  function confirm() {
    if (pinned.status !== 'ready') return;
    Keyboard.dismiss();
    const fallbackCity = form.cityId
      ? { id: form.cityId, name: form.cityName }
      : deliveryContext.contextCityId
        ? { id: deliveryContext.contextCityId, name: deliveryContext.contextCityName }
        : null;
    const city = pinned.city ?? fallbackCity;

    setDraft(
      {
        ...form,
        address: pinned.line,
        areaTitle: pinned.title,
        pincode: pinned.pincode,
        cityId: city?.id ?? null,
        cityName: city?.name ?? '',
        latitude: mapCenter.latitude,
        longitude: mapCenter.longitude,
      },
      editAddressId,
    );
    // From the details screen's "Change": just go back to it. Otherwise move on to the details,
    // replacing this screen so saving returns straight to where the flow started.
    if (fromDetails) router.back();
    else router.replace(ADDRESS_DETAILS_HREF);
  }

  const canConfirm = pinned.status === 'ready';
  const findingYou = phase === 'finding' && pinned.status === 'idle';

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <LocationStackHeader title="Select Your Location" onBack={cancelLocationFlowStep} />

      <View className="relative flex-1">
        {sdkLoading ? (
          <View className="flex-1 items-center justify-center">
            <LoadingPlaceholder className="py-0" />
          </View>
        ) : sdkError || !sdkConfig ? (
          <View className="flex-1 justify-center px-6">
            <Text className="text-muted-foreground text-center text-sm">
              Map is unavailable right now. Check your connection and try again.
            </Text>
            <Button variant="secondary" className={`mt-4 ${PRIMARY_CTA_BUTTON_CLASS}`} onPress={retryMap}>
              <Text>Retry</Text>
            </Button>
          </View>
        ) : (
          <>
            <OlaPinMapView
              sdkConfig={sdkConfig}
              center={mapCenter}
              zoom={mapZoom}
              flyToKey={flyKey}
              showUserLocation
              onCenterChange={({ latitude, longitude, zoom, userInteraction }) => {
                if (userInteraction) {
                  takeOver();
                  setPicked(true);
                  if (zoom != null) setMapZoom(zoom);
                }
                setMapCenter({ latitude, longitude });
              }}
              className="absolute inset-0 z-0"
            />
            {/* No pin or tooltip while we are still looking for the user. */}
            {!findingYou ? <MapCenterPin /> : null}

            {picked && !findingYou ? (
              <View
                pointerEvents="none"
                className="absolute left-0 right-0 z-10 items-center"
                style={{ top: '50%', marginTop: -(PIN_HEIGHT + TOOLTIP_GAP + TOOLTIP_HEIGHT) }}>
                <View
                  className="justify-center rounded-xl bg-slate-900 px-4"
                  style={{ height: TOOLTIP_HEIGHT }}>
                  <Text className="text-center text-sm font-semibold text-white">
                    Order will be delivered here
                  </Text>
                  <Text className="text-center text-xs text-white/75">
                    Place the pin to your exact location
                  </Text>
                </View>
              </View>
            ) : null}

            <View
              pointerEvents="box-none"
              className="absolute left-0 right-0 top-3 z-30 px-4"
              style={{ elevation: 30 }}>
              <PlacesAddressAutocomplete
                value={searchLine}
                onChange={setSearchLine}
                onPlaceResolved={({ latitude, longitude }) => {
                  Keyboard.dismiss();
                  takeOver();
                  setSearchLine('');
                  if (!isInsideIndiaBounds(latitude, longitude)) {
                    Alert.alert('Location', 'Select a location within India.');
                    return;
                  }
                  flyTo(latitude, longitude);
                }}
                placeholder="Search for apartment, street name…"
                className="h-12 rounded-xl border border-border bg-surface shadow-md"
              />
            </View>

            <MapLocateFab
              bottom={cardHeight + 12}
              loading={locating}
              onPress={() => void useCurrentLocation()}
            />
          </>
        )}

        <View
          onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}
          className="absolute bottom-0 left-0 right-0 z-40 rounded-t-3xl border-t border-border bg-card px-5 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16), elevation: 40 }}>
          {notice ? (
            <View className="mb-3 gap-1 rounded-lg bg-primary-tint px-3 py-2.5">
              <Text className="text-foreground text-xs leading-4">{currentPositionMessage(notice)}</Text>
              {notice === 'blocked' ? (
                <Text
                  className="text-primary text-xs font-semibold"
                  onPress={() => void Linking.openSettings()}
                  accessibilityRole="button">
                  Open settings
                </Text>
              ) : null}
            </View>
          ) : null}

          {findingYou || pinned.status === 'locating' ? (
            <View className="gap-2">
              <View className="bg-muted h-5 w-2/3 rounded-md" />
              <View className="bg-muted h-4 w-full rounded-md" />
              <Text className="text-muted-foreground text-xs">
                {findingYou ? 'Finding your location…' : 'Finding this place…'}
              </Text>
            </View>
          ) : pinned.status === 'idle' ? (
            <View className="gap-1">
              <Text className="text-foreground text-lg font-semibold">Set your delivery location</Text>
              <Text className="text-muted-foreground text-sm leading-5">
                Search above, use your current location, or move the map to place the pin.
              </Text>
            </View>
          ) : pinned.status === 'error' ? (
            <View className="gap-1.5">
              <Text className="text-foreground text-lg font-semibold">Couldn't read this spot</Text>
              <Text className="text-destructive text-sm">{pinned.message}</Text>
              <Text
                className="text-primary pt-1 text-sm font-semibold"
                onPress={pinned.retry}
                accessibilityRole="button">
                Try again
              </Text>
            </View>
          ) : (
            <View className="flex-row items-start gap-2.5">
              <Icon as={MapPin} className="text-primary mt-0.5 size-5 shrink-0" />
              <View className="min-w-0 flex-1">
                <Text className="text-foreground text-lg font-bold" numberOfLines={1}>
                  {pinned.title}
                </Text>
                {pinned.line ? (
                  <Text className="text-muted-foreground mt-0.5 text-sm leading-5" numberOfLines={2}>
                    {pinned.line}
                  </Text>
                ) : null}
                {pinned.status === 'blocked' ? (
                  <Text className="text-destructive mt-1.5 text-sm font-medium">{pinned.message}</Text>
                ) : pinned.city ? (
                  <Text className="text-muted-foreground mt-1 text-xs">
                    {pinned.city.name}
                    {pinned.pincode ? ` · ${pinned.pincode}` : ''}
                  </Text>
                ) : null}
              </View>
            </View>
          )}

          <Button
            variant="primary"
            className={`mt-4 ${PRIMARY_CTA_BUTTON_CLASS}`}
            disabled={!canConfirm}
            onPress={confirm}
            accessibilityLabel="Confirm location">
            <Text>Confirm Location</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}
