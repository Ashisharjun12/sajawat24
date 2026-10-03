import { Surface } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { formatInr } from '@/module/bookings/lib/booking-format';
import type { PayoutSummary } from '@/module/payouts/lib/payout.types';
import { View } from 'react-native';

type WalletBalanceCardProps = {
  summary: PayoutSummary;
};

export function WalletBalanceCard({ summary }: WalletBalanceCardProps) {
  return (
    <Surface className="border border-emerald-500/15 bg-emerald-500/8 gap-4 p-5 shadow-none">
      <View className="gap-1">
        <Text className="text-muted-foreground text-sm">Available balance</Text>
        <Text className="text-3xl font-bold text-emerald-600">{formatInr(summary.available)}</Text>
        <Text className="text-muted-foreground text-xs">
          Earned {formatInr(summary.earnedThisMonth)} this month
        </Text>
      </View>

      <View className="border-border/60 flex-row flex-wrap gap-4 border-t pt-4">
        <View className="min-w-[45%] flex-1 gap-0.5">
          <Text className="text-muted-foreground text-xs">Pending clearance</Text>
          <Text className="text-foreground text-base font-semibold">
            {formatInr(summary.pending)}
          </Text>
        </View>
        <View className="min-w-[45%] flex-1 gap-0.5">
          <Text className="text-muted-foreground text-xs">Earned this month</Text>
          <Text className="text-foreground text-base font-semibold">
            {formatInr(summary.earnedThisMonth)}
          </Text>
        </View>
        <View className="min-w-[45%] flex-1 gap-0.5">
          <Text className="text-muted-foreground text-xs">COD dues</Text>
          <Text className="text-foreground text-base font-semibold">
            {formatInr(summary.codDues)}
          </Text>
        </View>
      </View>
    </Surface>
  );
}
