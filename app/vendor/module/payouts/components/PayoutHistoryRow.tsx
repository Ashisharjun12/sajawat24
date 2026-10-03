import { IconWell } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { formatInr } from '@/module/bookings/lib/booking-format';
import {
  PAYOUT_STATUS_LABELS,
  type SettlementPayout,
  type PayoutStatus,
} from '@/module/payouts/lib/payout.types';
import { cn } from '@/lib/utils';
import { ArrowDownLeft } from 'lucide-react-native';
import { View } from 'react-native';

function payoutStatusDotClass(status: PayoutStatus) {
  switch (status) {
    case 'PAID':
      return 'bg-emerald-500';
    case 'PROCESSING':
    case 'PENDING':
      return 'bg-amber-500';
    case 'FAILED':
      return 'bg-destructive';
    default:
      return 'bg-muted-foreground';
  }
}

type PayoutHistoryRowProps = {
  payout: SettlementPayout;
  variant?: 'card' | 'flat';
};

export function PayoutHistoryRow({ payout, variant = 'card' }: PayoutHistoryRowProps) {
  if (variant === 'flat') {
    return (
      <View className="flex-row items-center gap-3 py-3.5">
        <IconWell
          icon={ArrowDownLeft}
          size="sm"
          className="bg-emerald-500/12"
          iconClassName="text-emerald-600"
        />
        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="text-foreground text-base font-medium">{payout.title}</Text>
          <Text className="text-muted-foreground text-sm">{payout.dateLabel}</Text>
        </View>
        <View className="items-end gap-1">
          <Text className="text-base font-semibold text-emerald-600">
            +{formatInr(payout.amount)}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <View className={cn('size-1.5 rounded-full', payoutStatusDotClass(payout.status))} />
            <Text className="text-muted-foreground text-xs">
              {PAYOUT_STATUS_LABELS[payout.status]}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-3 rounded-2xl bg-muted/60 px-4 py-3">
      <IconWell
        icon={ArrowDownLeft}
        size="sm"
        className="bg-emerald-500/12"
        iconClassName="text-emerald-600"
      />
      <View className="flex-1 gap-0.5">
        <Text className="text-foreground text-sm font-medium">{payout.title}</Text>
        <Text className="text-muted-foreground text-xs">{payout.dateLabel}</Text>
      </View>
      <View className="items-end gap-1">
        <Text className="text-sm font-semibold text-emerald-600">+{formatInr(payout.amount)}</Text>
        <View className="flex-row items-center gap-1.5">
          <View className={cn('size-1.5 rounded-full', payoutStatusDotClass(payout.status))} />
          <Text className="text-muted-foreground text-xs">{PAYOUT_STATUS_LABELS[payout.status]}</Text>
        </View>
      </View>
    </View>
  );
}
