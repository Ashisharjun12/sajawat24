import { Text } from '@/components/ui/text';
import { getApiError } from '@/api/client';
import {
  addressFormFromCustomer,
  buildCreateAddressBody,
  emptyAddressForm,
  type AddressFormState,
} from '@/module/account/lib/address-form';
import { useAddressPinValidation } from '@/module/account/hooks/use-address-pin-validation';
import { useAddressMutations } from '@/module/account/hooks/use-addresses-query';
import type { CustomerAddress } from '@/api/addresses.api';
import { AddressFormFields } from '@/module/location/components/AddressFormFields';
import { resolveAddressDeliveryContext } from '@/module/location/lib/address-delivery-context';
import { emptyCart } from '@/module/booking/lib/cart-types';
import { useCartQuery } from '@/module/booking/hooks/use-cart-query';
import { HomeBottomSheetModal } from '@/module/home/components/HomeBottomSheetModal';
import { useAuthStore } from '@/store/auth.store';
import { useDeliveryLocationStore } from '@/store/delivery-location.store';
import { useLocationStore } from '@/store/location.store';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView } from 'react-native';

type AddressFormSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSaved?: (address: CustomerAddress) => void;
  editAddress?: CustomerAddress | null;
  title?: string;
};

export function AddressFormSheet({
  visible,
  onClose,
  onSaved,
  editAddress = null,
  title,
}: AddressFormSheetProps) {
  const { create, update } = useAddressMutations();
  const user = useAuthStore((s) => s.user);
  const locationCity = useLocationStore((s) => s.city);
  const deliverySnapshot = useDeliveryLocationStore((s) => s.snapshot);
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
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible) return;
    const seedCityId = editAddress?.cityId ?? deliveryContext.contextCityId;
    const seedCityName = editAddress?.cityName || deliveryContext.contextCityName;
    setForm(
      editAddress
        ? addressFormFromCustomer(editAddress)
        : {
            ...emptyAddressForm,
            cityId: seedCityId,
            cityName: seedCityName,
          },
    );
    setFieldErrors({});
  }, [visible, editAddress, deliveryContext.contextCityId, deliveryContext.contextCityName]);

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
    enabled: visible,
  });

  function patchForm(patch: Partial<AddressFormState>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (form.address.trim().length < 6) {
      errors.address = 'Add flat, street, and area (at least 6 characters).';
    }
    const pinError = pinValidationError();
    if (pinError) errors.pincode = pinError;
    if (form.latitude == null || form.longitude == null) {
      errors.address =
        errors.address ?? 'Pick an address from search so we can locate it on the map.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const body = buildCreateAddressBody({
        ...form,
        cityId: form.cityId ?? deliveryContext.contextCityId,
        cityName: form.cityName || deliveryContext.contextCityName,
      });
      if (!body) return;
      if (editAddress?.id) {
        const saved = await update.mutateAsync({
          id: editAddress.id,
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
        onSaved?.(saved);
        onClose();
        return;
      }
      const saved = await create.mutateAsync(body);
      onSaved?.(saved);
      onClose();
    } catch (err) {
      Alert.alert('Could not save address', getApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const heading = title ?? (editAddress ? 'Edit address' : 'Add new address');

  return (
    <HomeBottomSheetModal
      visible={visible}
      onClose={onClose}
      closeAccessibilityLabel="Close address form">
      <ScrollView
        className="max-h-[85%] px-4 pb-6 pt-3"
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled>
        <Text className="text-foreground mb-4 text-lg font-semibold">{heading}</Text>
        <AddressFormFields
          form={form}
          onChange={patchForm}
          fieldErrors={fieldErrors}
          pinStatus={pinStatus}
          pinMessage={pinMessage}
          context={deliveryContext}
          submitLabel={submitting ? 'Saving…' : 'Save address'}
          onSubmit={() => void handleSave()}
          submitDisabled={submitting}
        />
      </ScrollView>
    </HomeBottomSheetModal>
  );
}
