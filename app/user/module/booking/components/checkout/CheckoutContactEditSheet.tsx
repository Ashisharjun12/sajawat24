import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { PRIMARY_CTA_BUTTON_CLASS, PRIMARY_CTA_BUTTON_TEXT_CLASS } from '@/lib/primary-cta-button';
import { HomeBottomSheetModal } from '@/module/home/components/HomeBottomSheetModal';
import type { CheckoutCustomerForm } from '@/module/booking/lib/checkout-form-types';
import { customerFormValid } from '@/module/booking/lib/checkout-validation';
import { View } from 'react-native';

type CheckoutContactEditSheetProps = {
  visible: boolean;
  value: CheckoutCustomerForm;
  onChange: (next: CheckoutCustomerForm) => void;
  onClose: () => void;
};

export function CheckoutContactEditSheet({
  visible,
  value,
  onChange,
  onClose,
}: CheckoutContactEditSheetProps) {
  function patch<K extends keyof CheckoutCustomerForm>(key: K, next: CheckoutCustomerForm[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <HomeBottomSheetModal visible={visible} onClose={onClose} closeAccessibilityLabel="Close">
      <View className="gap-4 px-5 pb-8 pt-4">
        <View className="items-center gap-1.5 px-2">
          <Text className="text-foreground text-center text-xl font-semibold">Your details</Text>
          <Text className="text-muted-foreground text-center text-sm leading-5">
            We need this to confirm your booking and send updates.
          </Text>
        </View>

        <View className="gap-3">
          <View className="gap-1.5">
            <Text className="text-foreground text-sm font-medium">Full name</Text>
            <Input
              value={value.name}
              onChangeText={(t) => patch('name', t)}
              placeholder="Full name"
              className="h-11 rounded-xl"
            />
          </View>
          <View className="gap-1.5">
            <Text className="text-foreground text-sm font-medium">Phone</Text>
            <Input
              value={value.phone}
              onChangeText={(t) => patch('phone', t)}
              placeholder="10-digit mobile"
              keyboardType="phone-pad"
              className="h-11 rounded-xl"
            />
          </View>
          <View className="gap-1.5">
            <Text className="text-foreground text-sm font-medium">Email</Text>
            <Input
              value={value.email}
              onChangeText={(t) => patch('email', t)}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              className="h-11 rounded-xl"
            />
          </View>
        </View>

        <Button
          className={`mt-1 ${PRIMARY_CTA_BUTTON_CLASS}`}
          disabled={!customerFormValid(value)}
          onPress={onClose}>
          <Text className={PRIMARY_CTA_BUTTON_TEXT_CLASS}>Save</Text>
        </Button>
      </View>
    </HomeBottomSheetModal>
  );
}
