import { getApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IndiaFlag } from '@/components/ui/india-flag';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { finishLocationFlow, cancelLocationFlowStep } from '@/lib/location-flow-navigation';
import { isValidIndianMobile, sanitizeIndianPhoneInput, toLocalPhone } from '@/lib/phone';
import { NOT_DELIVERABLE_MESSAGE } from '@/lib/pin-delivery-message';
import { PRIMARY_CTA_BUTTON_CLASS } from '@/lib/primary-cta-button';
import { ADD_ADDRESS_HREF } from '@/lib/select-location-route';
import { BRAND_PRIMARY_HEX } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { useKeyboardInset } from '@/lib/use-keyboard-inset';
import { useAddressMutations } from '@/module/account/hooks/use-addresses-query';
import { useAddressPinValidation } from '@/module/account/hooks/use-address-pin-validation';
import {
  buildCreateAddressBody,
  composeAddressLine,
  type AddressFormState,
} from '@/module/account/lib/address-form';
import { useCartQuery } from '@/module/booking/hooks/use-cart-query';
import { emptyCart } from '@/module/booking/lib/cart-types';
import { MapCenterPin } from '@/module/geo/components/MapCenterPin';
import { OlaPinMapView } from '@/module/geo/components/OlaPinMapView';
import { useMapsSdkConfig } from '@/module/geo/hooks/use-maps-sdk-config';
import {
  AddressLabelChips,
  choiceFromLabel,
  resolveAddressLabel,
  type AddressLabelChoice,
} from '@/module/location/components/AddressLabelChips';
import { LocationStackHeader } from '@/module/location/components/LocationStackHeader';
import { applySelectedDeliveryAddress } from '@/module/location/lib/apply-selected-delivery-address';
import { resolveAddressDeliveryContext } from '@/module/location/lib/address-delivery-context';
import { useAddressFormDraftStore } from '@/store/address-form-draft.store';
import { useAuthStore } from '@/store/auth.store';
import { useDeliveryLocationStore } from '@/store/delivery-location.store';
import { useLocationStore } from '@/store/location.store';
import { useQueryClient } from '@tanstack/react-query';
import { type Href, router } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, Pressable, ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CHANGE_LOCATION_HREF = `${ADD_ADDRESS_HREF as string}?from=details` as Href;

type FieldKey =
  | 'pincode'
  | 'houseFloor'
  | 'customLabel'
  | 'receiverName'
  | 'receiverPhone';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="text-foreground text-base font-semibold">{title}</Text>
      {children}
    </View>
  );
}

function FieldError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <Text className="text-destructive text-xs" accessibilityLiveRegion="polite" accessibilityRole="alert">
      {message}
    </Text>
  );
}

/**
 * Add address, step 2 (also the edit screen): small map preview with "Change", house / building /
 * landmark, a Home / Office / Other label, and who receives the setup. Saves the address.
 */
export function AddressDetailsScreen() {
  const insets = useSafeAreaInsets();
  const keyboardInset = useKeyboardInset(true);
  const queryClient = useQueryClient();
  const { create, update } = useAddressMutations();

  const draft = useAddressFormDraftStore((s) => s.form);
  const editAddressId = useAddressFormDraftStore((s) => s.editAddressId);
  const clearDraft = useAddressFormDraftStore((s) => s.clear);

  const user = useAuthStore((s) => s.user);
  const locationCity = useLocationStore((s) => s.city);
  const deliverySnapshot = useDeliveryLocationStore((s) => s.snapshot);
  const { data: cart = emptyCart } = useCartQuery(Boolean(user));
  const deliveryContext = useMemo(
    () => resolveAddressDeliveryContext({ cart, delivery: deliverySnapshot, locationCity }),
    [cart, deliverySnapshot, locationCity],
  );

  const { config: sdkConfig } = useMapsSdkConfig();

  // ── Typed fields (the location fields come from the draft, which the map step updates) ──
  const profile = user as { name?: string | null; phone?: string | null } | null;
  const initialLabel = useMemo(
    () => choiceFromLabel(draft.label),
    // Read once: later edits must not be overwritten when the draft changes after "Change".
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [labelChoice, setLabelChoice] = useState<AddressLabelChoice>(initialLabel.choice);
  const [customLabel, setCustomLabel] = useState(initialLabel.custom);
  const [focusCustomLabel, setFocusCustomLabel] = useState(false);
  const [houseFloor, setHouseFloor] = useState(draft.houseFloor);
  const [buildingBlock, setBuildingBlock] = useState(draft.buildingBlock);
  const [landmark, setLandmark] = useState(draft.landmark);
  const [receiverName, setReceiverName] = useState(
    draft.receiverName || profile?.name?.trim() || '',
  );
  const [receiverPhone, setReceiverPhone] = useState(
    draft.receiverPhone || toLocalPhone(profile?.phone ?? ''),
  );
  const [isDefault, setIsDefault] = useState(draft.isDefault);
  const [pinInput, setPinInput] = useState('');
  const [resolvedCity, setResolvedCity] = useState<{ id: string; name: string } | null>(null);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const hasCoords = draft.latitude != null && draft.longitude != null;
  /** The map step already read (and validated) a PIN. Otherwise the user types it here. */
  const pinFromMap = Boolean(draft.pincode);
  const pincode = (draft.pincode || pinInput).replace(/\D/g, '').slice(0, 6);

  const onCityResolved = useCallback((city: { id: string; name: string }) => {
    setResolvedCity(city);
  }, []);
  const { pinStatus, pinMessage, pinValidationError } = useAddressPinValidation({
    pincode,
    formCityId: resolvedCity?.id ?? draft.cityId,
    context: deliveryContext,
    onCityResolved,
  });

  const cityId = resolvedCity?.id ?? draft.cityId ?? deliveryContext.contextCityId;
  const cityName = resolvedCity?.name || draft.cityName || deliveryContext.contextCityName;
  const hasLocation = hasCoords && Boolean(cityId);

  // ── Validation ──
  const composed = composeAddressLine({
    ...draft,
    houseFloor,
    buildingBlock,
  });
  const houseOptional = Boolean(editAddressId) && draft.isLegacy;
  const errors: Partial<Record<FieldKey, string>> = {};
  if (!houseFloor.trim() && !houseOptional) {
    errors.houseFloor = 'Enter your house / flat number and floor.';
  } else if (composed.length < 6) {
    errors.houseFloor = 'Add a few more details so the delivery partner can find you.';
  } else if (composed.length > 500) {
    errors.houseFloor = 'This address is too long. Shorten it a little.';
  }
  if (labelChoice === 'other' && !customLabel.trim()) {
    errors.customLabel = 'Give this address a name, like "Mom\'s place".';
  }
  if (receiverName.trim().length < 2) errors.receiverName = "Enter the receiver's name.";
  if (!isValidIndianMobile(receiverPhone)) {
    errors.receiverPhone = 'Enter a valid 10-digit mobile number.';
  }
  const pinError = pinFromMap
    ? pinStatus === 'error'
      ? pinMessage || NOT_DELIVERABLE_MESSAGE
      : null
    : pinValidationError();
  if (pinError) errors.pincode = pinError;

  const hasErrors = Object.keys(errors).length > 0;
  const show = (key: FieldKey) => (attempted || touched[key] ? errors[key] : undefined);
  const touch = (key: FieldKey) => setTouched((t) => ({ ...t, [key]: true }));

  async function onSave() {
    if (savingRef.current) return;
    setAttempted(true);
    if (!hasLocation) {
      Alert.alert('Location needed', 'Choose the delivery spot on the map first.');
      return;
    }
    if (hasErrors) return;

    const form: AddressFormState = {
      ...draft,
      label: resolveAddressLabel(labelChoice, customLabel),
      houseFloor,
      buildingBlock,
      landmark,
      receiverName,
      receiverPhone,
      pincode,
      cityId: cityId ?? null,
      cityName,
      isDefault,
    };
    const body = buildCreateAddressBody(form);
    if (!body) {
      Alert.alert('Address', 'Please check the address details and try again.');
      return;
    }

    savingRef.current = true;
    setSaving(true);
    Keyboard.dismiss();
    try {
      const saved = editAddressId
        ? await update.mutateAsync({
            id: editAddressId,
            body: {
              label: body.label,
              address: body.address,
              // null clears a field the user emptied; leaving it out would keep the old value.
              landmark: landmark.trim() || null,
              houseFloor: houseFloor.trim() || null,
              buildingBlock: buildingBlock.trim() || null,
              receiverName: body.receiverName ?? null,
              receiverPhone: body.receiverPhone ?? null,
              pincode: body.pincode,
              cityId: body.cityId,
              cityName: body.cityName,
              latitude: body.latitude,
              longitude: body.longitude,
              geoSource: body.geoSource,
              setDefault: body.setDefault,
            },
          })
        : await create.mutateAsync(body);
      await applySelectedDeliveryAddress(saved, queryClient);
      finishLocationFlow();
      // Clear after the screen has slid away, so it never flashes an empty form on the way out.
      setTimeout(clearDraft, 600);
    } catch (err) {
      Alert.alert('Could not save address', getApiError(err));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  const barBottom = keyboardInset > 0 ? 12 : Math.max(insets.bottom, 12);

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <LocationStackHeader
        title={editAddressId ? 'Edit Address Details' : 'Add Address Details'}
        onBack={cancelLocationFlowStep}
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 px-4 pb-8 pt-4"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        {hasCoords ? (
          <View className="gap-3">
            <View
              pointerEvents="none"
              className="bg-muted h-36 overflow-hidden rounded-2xl border border-border">
              {sdkConfig ? (
                <>
                  <OlaPinMapView
                    // New coordinates (after "Change") need a fresh camera.
                    key={`${draft.latitude}:${draft.longitude}`}
                    sdkConfig={sdkConfig}
                    center={{ latitude: draft.latitude!, longitude: draft.longitude! }}
                    zoom={17}
                    interactive={false}
                    className="absolute inset-0"
                  />
                  <MapCenterPin />
                </>
              ) : null}
            </View>
            <View className="flex-row items-start gap-3">
              <Icon as={MapPin} className="text-foreground mt-0.5 size-5 shrink-0" />
              <View className="min-w-0 flex-1">
                <Text className="text-foreground text-base font-bold" numberOfLines={1}>
                  {draft.areaTitle || cityName || 'Delivery location'}
                </Text>
                {draft.address ? (
                  <Text className="text-muted-foreground mt-0.5 text-sm leading-5" numberOfLines={2}>
                    {draft.address}
                  </Text>
                ) : null}
                {pincode.length === 6 ? (
                  <Text className="text-muted-foreground mt-0.5 text-xs">
                    {[cityName, pincode].filter(Boolean).join(' · ')}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={() => router.push(CHANGE_LOCATION_HREF)}
                disabled={saving}
                hitSlop={8}
                className="h-9 items-center justify-center rounded-lg border border-primary px-4 active:bg-primary-tint"
                accessibilityRole="button"
                accessibilityLabel="Change delivery location">
                <Text className="text-primary text-sm font-semibold">Change</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View className="gap-3 rounded-2xl border border-dashed border-border px-5 py-6">
            <Text className="text-foreground text-center text-base font-semibold">
              Choose your delivery spot
            </Text>
            <Text className="text-muted-foreground text-center text-sm">
              Place the pin on the map first, then add your house details.
            </Text>
            <Button
              variant="primary"
              className={PRIMARY_CTA_BUTTON_CLASS}
              onPress={() => router.replace(ADD_ADDRESS_HREF)}>
              <Text>Select on map</Text>
            </Button>
          </View>
        )}

        <Section title="Add address">
          {!pinFromMap ? (
            <View className="gap-1.5">
              <Input
                value={pinInput}
                onChangeText={(t) => setPinInput(t.replace(/\D/g, '').slice(0, 6))}
                onBlur={() => touch('pincode')}
                placeholder="PIN code"
                keyboardType="number-pad"
                maxLength={6}
                editable={!saving}
                className={cn('h-12 rounded-xl', show('pincode') && 'border-destructive')}
                accessibilityLabel="PIN code"
              />
              {pinStatus === 'ok' && !show('pincode') ? (
                <Text className="text-primary text-xs font-medium">{pinMessage}</Text>
              ) : null}
              <FieldError message={show('pincode')} />
            </View>
          ) : show('pincode') ? (
            <FieldError message={show('pincode')} />
          ) : null}

          <View className="gap-1.5">
            <Input
              value={houseFloor}
              onChangeText={setHouseFloor}
              onBlur={() => touch('houseFloor')}
              placeholder="House No. & Floor"
              maxLength={120}
              editable={!saving}
              className={cn('h-12 rounded-xl', show('houseFloor') && 'border-destructive')}
              accessibilityLabel="House number and floor"
            />
            <FieldError message={show('houseFloor')} />
          </View>
          <Input
            value={buildingBlock}
            onChangeText={setBuildingBlock}
            placeholder="Building & Block No. (Optional)"
            maxLength={120}
            editable={!saving}
            className="h-12 rounded-xl"
            accessibilityLabel="Building and block number, optional"
          />
          <Input
            value={landmark}
            onChangeText={setLandmark}
            placeholder="Landmark & Area Name (Optional)"
            maxLength={200}
            editable={!saving}
            className="h-12 rounded-xl"
            accessibilityLabel="Landmark and area name, optional"
          />
        </Section>

        <Section title="Add address label">
          <AddressLabelChips
            value={labelChoice}
            disabled={saving}
            onChange={(next) => {
              if (next === 'other' && labelChoice !== 'other') setFocusCustomLabel(true);
              setLabelChoice(next);
            }}
          />
          {labelChoice === 'other' ? (
            <View className="gap-1.5">
              <Input
                value={customLabel}
                onChangeText={setCustomLabel}
                onBlur={() => touch('customLabel')}
                placeholder="Save as (e.g. Mom's place, Studio)"
                maxLength={40}
                autoFocus={focusCustomLabel}
                editable={!saving}
                className={cn('h-12 rounded-xl', show('customLabel') && 'border-destructive')}
                accessibilityLabel="Custom address name"
              />
              <FieldError message={show('customLabel')} />
            </View>
          ) : null}
        </Section>

        <Section title="Add receiver details">
          <View className="gap-1.5">
            <Input
              value={receiverName}
              onChangeText={setReceiverName}
              onBlur={() => touch('receiverName')}
              placeholder="Receiver's Name"
              autoComplete="name"
              textContentType="name"
              maxLength={80}
              editable={!saving}
              className={cn('h-12 rounded-xl', show('receiverName') && 'border-destructive')}
              accessibilityLabel="Receiver's name"
            />
            <FieldError message={show('receiverName')} />
          </View>
          <View className="gap-1.5">
            <View
              className={cn(
                'h-12 flex-row items-center gap-2.5 rounded-xl border bg-surface px-3.5',
                show('receiverPhone')
                  ? 'border-destructive'
                  : phoneFocused
                    ? 'border-primary'
                    : 'border-input',
              )}>
              <IndiaFlag width={20} />
              <Text className="text-foreground text-body font-medium">+91</Text>
              <View className="bg-border h-5 w-px" />
              <Input
                value={receiverPhone}
                onChangeText={(t) => setReceiverPhone(sanitizeIndianPhoneInput(t))}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => {
                  setPhoneFocused(false);
                  touch('receiverPhone');
                }}
                placeholder="Receiver's Phone Number"
                keyboardType="number-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                editable={!saving}
                className="h-full flex-1 border-0 bg-transparent px-0"
                accessibilityLabel="Receiver's phone number"
              />
            </View>
            <FieldError message={show('receiverPhone')} />
          </View>
        </Section>

        <View className="flex-row items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-3">
          <View className="min-w-0 flex-1">
            <Text className="text-foreground text-sm font-medium">Set as default address</Text>
            <Text className="text-muted-foreground text-xs">Used first at checkout.</Text>
          </View>
          <Switch
            value={isDefault}
            onValueChange={setIsDefault}
            disabled={saving}
            trackColor={{ true: BRAND_PRIMARY_HEX }}
            accessibilityLabel="Set as default address"
          />
        </View>
      </ScrollView>

      {/* Sticky save bar; lifts above the keyboard so the button is never hidden. */}
      <View
        className="border-t border-border bg-background px-4 pt-3"
        style={{ marginBottom: keyboardInset, paddingBottom: barBottom }}>
        <Button
          variant="primary"
          className={PRIMARY_CTA_BUTTON_CLASS}
          loading={saving}
          disabled={!hasLocation}
          onPress={() => void onSave()}
          accessibilityLabel="Save address">
          <Text>Save Address</Text>
        </Button>
      </View>
    </View>
  );
}
