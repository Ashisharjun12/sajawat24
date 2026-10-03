import { Button } from '@/components/ui/button';
import { PRIMARY_CTA_BUTTON_CLASS, PRIMARY_CTA_BUTTON_TEXT_CLASS } from '@/lib/primary-cta-button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import type { AddressPinStatus } from '@/module/account/hooks/use-address-pin-validation';
import type { AddressFormState } from '@/module/account/lib/address-form';
import type { AddressDeliveryContext } from '@/module/location/lib/address-delivery-context';
import { PlacesAddressAutocomplete } from '@/module/geo/components/PlacesAddressAutocomplete';
import type { ReactNode } from 'react';
import { Switch, View } from 'react-native';

type AddressFormFieldsProps = {
  form: AddressFormState;
  onChange: (patch: Partial<AddressFormState>) => void;
  fieldErrors: Record<string, string>;
  pinStatus: AddressPinStatus;
  pinMessage: string;
  context: AddressDeliveryContext;
  submitLabel: string;
  onSubmit: () => void;
  submitDisabled?: boolean;
};

function FormSection({ children }: { children: ReactNode }) {
  return (
    <View className="gap-4 rounded-2xl border border-border bg-card p-4">{children}</View>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <Text className="text-foreground text-sm font-medium">{children}</Text>;
}

export function AddressFormFields({
  form,
  onChange,
  fieldErrors,
  pinStatus,
  pinMessage,
  context,
  submitLabel,
  onSubmit,
  submitDisabled,
}: AddressFormFieldsProps) {
  const { contextCityPinHint, contextCityName } = context;

  return (
    <View className="gap-4">
      {contextCityPinHint && contextCityName ? (
        <View className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 dark:border-sky-900 dark:bg-sky-950/40">
          <Text className="text-sky-900 text-sm leading-5 dark:text-sky-100">
            Delivering in{' '}
            <Text className="font-semibold text-sky-900 dark:text-sky-50">{contextCityName}</Text>
            . PIN must be in this city.
          </Text>
        </View>
      ) : null}

      <FormSection>
        <View className="gap-1.5">
          <FieldLabel>Label</FieldLabel>
          <Input
            value={form.label}
            onChangeText={(label) => onChange({ label })}
            placeholder="Home, Office, Venue…"
            className="h-11 rounded-xl"
          />
        </View>

        <View className="gap-1.5">
          <FieldLabel>Search address</FieldLabel>
          <PlacesAddressAutocomplete
            dropdownLayout="inline"
            value={form.address}
            onChange={(address) =>
              onChange({
                address,
                latitude: null,
                longitude: null,
              })
            }
            onPlaceResolved={({ address, pincode, latitude, longitude }) => {
              onChange({
                address,
                pincode: pincode ?? form.pincode,
                latitude: latitude || form.latitude,
                longitude: longitude || form.longitude,
              });
            }}
            placeholder="Search area, street, building…"
            className="h-11 rounded-xl"
          />
          {fieldErrors.address ? (
            <Text className="text-destructive text-xs">{fieldErrors.address}</Text>
          ) : (
            <Text className="text-muted-foreground text-xs">
              Pick a suggestion or type your full address
            </Text>
          )}
        </View>
      </FormSection>

      <FormSection>
        <View className="gap-1.5">
          <FieldLabel>PIN code</FieldLabel>
          <Input
            value={form.pincode}
            onChangeText={(pincode) =>
              onChange({
                pincode: pincode.replace(/\D/g, '').slice(0, 6),
              })
            }
            placeholder="560001"
            keyboardType="number-pad"
            maxLength={6}
            className="h-11 rounded-xl"
          />
          {pinStatus === 'loading' ? (
            <Skeleton className="mt-1 h-4 w-44 rounded-md" accessibilityLabel="Checking delivery" />
          ) : null}
          {pinStatus === 'ok' && !fieldErrors.pincode ? (
            <Text className="text-xs font-medium text-emerald-600">{pinMessage}</Text>
          ) : null}
          {fieldErrors.pincode ? (
            <Text className="text-destructive text-xs">{fieldErrors.pincode}</Text>
          ) : null}
          {pinStatus === 'error' && !fieldErrors.pincode && pinMessage ? (
            <Text className="text-destructive rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs leading-5">
              {pinMessage}
            </Text>
          ) : null}
        </View>

        <View className="gap-1.5">
          <FieldLabel>Landmark (optional)</FieldLabel>
          <Input
            value={form.landmark}
            onChangeText={(landmark) => onChange({ landmark })}
            placeholder="Near metro, gate no…"
            className="h-11 rounded-xl"
          />
        </View>

        <View className="flex-row items-center justify-between pt-1">
          <Text className="text-foreground text-sm font-medium">Set as default</Text>
          <Switch
            value={form.isDefault}
            onValueChange={(isDefault) => onChange({ isDefault })}
          />
        </View>
      </FormSection>

      <Button
        className={PRIMARY_CTA_BUTTON_CLASS}
        disabled={submitDisabled || pinStatus === 'loading'}
        onPress={onSubmit}>
        <Text className={PRIMARY_CTA_BUTTON_TEXT_CLASS}>{submitLabel}</Text>
      </Button>
    </View>
  );
}
