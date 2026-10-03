import { Screen } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { CONFIRM_ADDRESS_MAP_HREF } from '@/lib/select-location-route';
import { useAddressPinValidation } from '@/module/account/hooks/use-address-pin-validation';
import {
  addressFormFromCustomer,
  emptyAddressForm,
  type AddressFormState,
} from '@/module/account/lib/address-form';
import { useAddressesQuery } from '@/module/account/hooks/use-addresses-query';
import { AddressFormFields } from '@/module/location/components/AddressFormFields';
import { LocationStackHeader } from '@/module/location/components/LocationStackHeader';
import { resolveAddressDeliveryContext } from '@/module/location/lib/address-delivery-context';
import { emptyCart } from '@/module/booking/lib/cart-types';
import { useCartQuery } from '@/module/booking/hooks/use-cart-query';
import { useAuthStore } from '@/store/auth.store';
import { useAddressFormDraftStore } from '@/store/address-form-draft.store';
import { useDeliveryLocationStore } from '@/store/delivery-location.store';
import { useLocationStore } from '@/store/location.store';
import { navigateBackOrHome } from '@/lib/navigate-back';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

export function AddAddressScreen() {
  const draftForm = useAddressFormDraftStore((s) => s.form);
  const editAddressId = useAddressFormDraftStore((s) => s.editAddressId);
  const setDraft = useAddressFormDraftStore((s) => s.setDraft);

  const { data: addresses = [] } = useAddressesQuery();
  const editAddress = editAddressId ? addresses.find((a) => a.id === editAddressId) : null;

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

  const [form, setForm] = useState<AddressFormState>(emptyAddressForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formSeededRef = useRef(false);

  useEffect(() => {
    formSeededRef.current = false;
  }, [editAddressId]);

  useEffect(() => {
    if (editAddress) {
      setForm(addressFormFromCustomer(editAddress));
      return;
    }
    if (formSeededRef.current) return;
    formSeededRef.current = true;

    const seedCityId = draftForm.cityId ?? deliveryContext.contextCityId;
    const seedCityName = draftForm.cityName || deliveryContext.contextCityName;
    setForm({
      ...emptyAddressForm,
      ...draftForm,
      cityId: seedCityId,
      cityName: seedCityName || draftForm.cityName,
    });
  }, [
    editAddress,
    draftForm.address,
    draftForm.pincode,
    draftForm.latitude,
    draftForm.longitude,
    deliveryContext.contextCityId,
    deliveryContext.contextCityName,
  ]);

  const onCityResolved = useCallback((city: { id: string; name: string }) => {
    setForm((f) => ({
      ...f,
      cityId: city.id,
      cityName: city.name,
    }));
  }, []);

  const { pinStatus, pinMessage, pinValidationError } = useAddressPinValidation({
    pincode: form.pincode,
    formCityId: form.cityId,
    context: deliveryContext,
    onCityResolved,
  });

  function patchForm(patch: Partial<AddressFormState>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function validateDetails(): boolean {
    const errors: Record<string, string> = {};
    if (form.address.trim().length < 6) {
      errors.address = 'Add flat, street, and area (at least 6 characters).';
    }
    const pinError = pinValidationError();
    if (pinError) errors.pincode = pinError;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function openReviewMap() {
    if (!validateDetails()) return;
    const cityId = form.cityId ?? deliveryContext.contextCityId;
    const cityName = form.cityName || deliveryContext.contextCityName;
    setDraft({ ...form, cityId, cityName }, editAddressId);
    router.push(CONFIRM_ADDRESS_MAP_HREF);
  }

  const title = editAddress ? 'Edit address' : 'Add address';

  return (
    <Screen scroll={false} edges={['top', 'bottom']} contentClassName="flex-1">
      <LocationStackHeader title={title} onBack={navigateBackOrHome} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-4 pb-10 pt-3"
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled
        keyboardDismissMode="on-drag">
        <View className="px-1">
          <Text className="text-muted-foreground text-sm leading-5">
            Enter your delivery details. Next you will review them on the map.
          </Text>
        </View>
        <AddressFormFields
          form={form}
          onChange={patchForm}
          fieldErrors={fieldErrors}
          pinStatus={pinStatus}
          pinMessage={pinMessage}
          context={deliveryContext}
          submitLabel="Review address on map"
          onSubmit={openReviewMap}
        />
      </ScrollView>
    </Screen>
  );
}
