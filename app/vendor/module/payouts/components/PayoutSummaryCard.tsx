import { Card, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { formatInr } from '@/module/bookings/lib/booking-format';
import type { PayoutSummary } from '@/module/payouts/lib/payout.types';
import { View } from 'react-native';

type PayoutSummaryCardProps = {
  summary: PayoutSummary;
};

export function PayoutSummaryCard({ summary }: PayoutSummaryCardProps) {
  return (
    <Card className="border-primary/20 bg-primary/5 gap-0 py-5">
      <CardContent className="gap-4">
        <View className="gap-1">
          <Text className="text-muted-foreground text-sm">Available balance</Text>
          <Text className="text-foreground text-3xl font-bold">{formatInr(summary.available)}</Text>
        </View>

        <View className="border-border flex-row gap-4 border-t pt-4">
          <View className="flex-1 gap-1">
            <Text className="text-muted-foreground text-xs">Pending clearance</Text>
            <Text className="text-foreground text-base font-semibold">
              {formatInr(summary.pending)}
            </Text>
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-muted-foreground text-xs">Earned this month</Text>
            <Text className="text-foreground text-base font-semibold">
              {formatInr(summary.earnedThisMonth)}
            </Text>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}
