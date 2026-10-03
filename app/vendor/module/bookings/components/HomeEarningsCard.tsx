import { PressableScale } from '@/components/motion';
import { triggerHaptic } from '@/components/motion/haptics';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { formatInr } from '@/module/bookings/lib/booking-format';
import { View } from 'react-native';

type EarningsTint = 'today' | 'month';

const TINT_SURFACES: Record<EarningsTint, string> = {
  today: 'bg-emerald-500/15',
  month: 'bg-sky-500/15',
};

function jobCountCaption(count: number): string {
  if (count === 0) return 'No jobs yet';
  return `${count} job${count === 1 ? '' : 's'} done`;
}

type EarningsTileProps = {
  label: string;
  amountPaise: number;
  jobCount: number;
  tint: EarningsTint;
  onPress?: () => void;
};

function EarningsTile({ label, amountPaise, jobCount, tint, onPress }: EarningsTileProps) {
  return (
    <PressableScale
      containerClassName="flex-1"
      className={cn('rounded-3xl px-4 py-5', TINT_SURFACES[tint])}
      onPress={() => {
        if (!onPress) return;
        triggerHaptic();
        onPress();
      }}
      disabled={!onPress}
      scaleTo={0.97}>
      <Text className="text-foreground text-sm font-medium">{label}</Text>
      <Text className="text-foreground mt-1.5 text-2xl font-semibold">
        {formatInr(amountPaise)}
      </Text>
      <Text className="text-muted-foreground mt-1 text-xs">{jobCountCaption(jobCount)}</Text>
    </PressableScale>
  );
}

type HomeEarningsCardProps = {
  earnedTodayPaise: number;
  completedToday: number;
  earnedThisMonthPaise: number;
  completedThisMonth: number;
  onPress?: () => void;
};

export function HomeEarningsCard({
  earnedTodayPaise,
  completedToday,
  earnedThisMonthPaise,
  completedThisMonth,
  onPress,
}: HomeEarningsCardProps) {
  return (
    <View className="flex-row gap-3">
      <EarningsTile
        label="Today"
        amountPaise={earnedTodayPaise}
        jobCount={completedToday}
        tint="today"
        onPress={onPress}
      />
      <EarningsTile
        label="This month"
        amountPaise={earnedThisMonthPaise}
        jobCount={completedThisMonth}
        tint="month"
        onPress={onPress}
      />
    </View>
  );
}
