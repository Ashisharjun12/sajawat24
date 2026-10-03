import { Text } from '@/components/ui/text';
import type { PayoutMethod } from '@/api/payout-methods.api';
import { PayoutMethodIcon } from '@/module/payouts/components/PayoutMethodIcon';
import { View } from 'react-native';

type UpiIdRowProps = {
  upi: PayoutMethod;
};

export function UpiIdRow({ upi }: UpiIdRowProps) {
  return (
    <View className="flex-row items-center gap-3 py-3.5">
      <PayoutMethodIcon type="upi" />
      <View className="min-w-0 flex-1 gap-0.5">
        <Text className="text-foreground text-base font-medium">{upi.upiId}</Text>
        <Text className="text-muted-foreground text-sm">{upi.accountHolderName}</Text>
      </View>
    </View>
  );
}
