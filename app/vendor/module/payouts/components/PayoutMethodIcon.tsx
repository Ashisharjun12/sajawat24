import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import {
  WALLET_BANK_ICON_URL,
  WALLET_UPI_ICON_URL,
} from '@/module/payouts/lib/payout-method.constants';

type PayoutMethodIconProps = {
  type: 'bank' | 'upi';
  size?: number;
  className?: string;
};

export function PayoutMethodIcon({ type, size = 32, className }: PayoutMethodIconProps) {
  const imageUrl = type === 'upi' ? WALLET_UPI_ICON_URL : WALLET_BANK_ICON_URL;
  const label = type === 'upi' ? 'UPI' : 'Bank account';

  return (
    <View
      className={className ?? 'items-center justify-center overflow-hidden rounded-xl bg-muted/50'}
      style={{ width: size + 8, height: size + 8 }}>
      <Image
        source={{ uri: imageUrl }}
        style={[styles.icon, { width: size, height: size }]}
        contentFit="contain"
        transition={200}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 32,
    height: 32,
  },
});
