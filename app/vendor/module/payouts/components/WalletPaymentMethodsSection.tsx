import { PressableScale } from '@/components/motion';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';
import { ChevronRight } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import {
  WALLET_BANK_ICON_URL,
  WALLET_UPI_ICON_URL,
} from '@/module/payouts/lib/payout-method.constants';

type PaymentMethodRowProps = {
  imageUrl: string;
  label: string;
  imageLabel: string;
  onPress: () => void;
};

function PaymentMethodRow({ imageUrl, label, imageLabel, onPress }: PaymentMethodRowProps) {
  return (
    <PressableScale onPress={onPress} className="flex-row items-center justify-between py-3.5">
      <View className="flex-row items-center gap-3">
        <View className="size-10 items-center justify-center overflow-hidden rounded-xl bg-muted/50">
          <Image
            source={{ uri: imageUrl }}
            style={styles.icon}
            contentFit="contain"
            transition={200}
            accessibilityLabel={imageLabel}
          />
        </View>
        <Text className="text-foreground text-base">{label}</Text>
      </View>
      <Icon as={ChevronRight} className="text-muted-foreground size-4" />
    </PressableScale>
  );
}

function SettingsDivider() {
  return <View className="h-px bg-border/40" />;
}

type WalletPaymentMethodsSectionProps = {
  onPressBank: () => void;
  onPressUpi: () => void;
};

export function WalletPaymentMethodsSection({
  onPressBank,
  onPressUpi,
}: WalletPaymentMethodsSectionProps) {
  return (
    <View className="gap-2 px-1">
      <Text className="text-foreground text-base font-bold">Payment methods</Text>
      <View>
        <PaymentMethodRow
          imageUrl={WALLET_BANK_ICON_URL}
          imageLabel="Bank accounts"
          label="Bank accounts"
          onPress={onPressBank}
        />
        <SettingsDivider />
        <PaymentMethodRow
          imageUrl={WALLET_UPI_ICON_URL}
          imageLabel="UPI IDs"
          label="UPI IDs"
          onPress={onPressUpi}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 32,
    height: 32,
  },
});
