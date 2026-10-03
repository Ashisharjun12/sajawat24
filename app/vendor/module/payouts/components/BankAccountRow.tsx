import { Text } from '@/components/ui/text';
import type { PayoutMethod } from '@/api/payout-methods.api';
import { PayoutMethodIcon } from '@/module/payouts/components/PayoutMethodIcon';
import { View } from 'react-native';

type BankAccountRowProps = {
  account: PayoutMethod;
};

export function BankAccountRow({ account }: BankAccountRowProps) {
  const masked = account.accountNumberLast4 ? `•••• ${account.accountNumberLast4}` : '—';

  return (
    <View className="flex-row items-center gap-3 py-3.5">
      <PayoutMethodIcon type="bank" />
      <View className="min-w-0 flex-1 gap-0.5">
        <Text className="text-foreground text-base font-medium">{account.bankName}</Text>
        <Text className="text-muted-foreground text-sm">
          {account.accountHolderName} · {masked}
        </Text>
        <Text className="text-muted-foreground text-xs">{account.ifsc}</Text>
      </View>
    </View>
  );
}
