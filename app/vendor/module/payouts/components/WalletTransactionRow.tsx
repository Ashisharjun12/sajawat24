import { IconWell } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { formatInr } from '@/module/bookings/lib/booking-format';
import type { WalletTransaction } from '@/module/payouts/lib/payout.types';
import { cn } from '@/lib/utils';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { View } from 'react-native';

type WalletTransactionRowProps = {
  transaction: WalletTransaction;
};

export function WalletTransactionRow({ transaction }: WalletTransactionRowProps) {
  const isCredit = transaction.direction === 'credit';
  const signedAmount = `${isCredit ? '+' : '−'}${formatInr(transaction.amountPaise)}`;

  return (
    <View className="flex-row items-center gap-3 py-3.5">
      <IconWell
        icon={isCredit ? ArrowDownLeft : ArrowUpRight}
        size="sm"
        className={isCredit ? 'bg-emerald-500/12' : 'bg-red-500/12'}
        iconClassName={isCredit ? 'text-emerald-600' : 'text-red-600'}
      />
      <View className="min-w-0 flex-1 gap-0.5">
        <Text className="text-foreground text-base font-medium">{transaction.title}</Text>
        <Text className="text-muted-foreground text-sm">{transaction.dateLabel}</Text>
      </View>
      <Text
        className={cn(
          'text-base font-semibold',
          isCredit ? 'text-emerald-600' : 'text-red-600',
        )}>
        {signedAmount}
      </Text>
    </View>
  );
}
