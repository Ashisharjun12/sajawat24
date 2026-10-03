import { PressableScale } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import type { WalletActivityItem } from '@/api/wallet.api';
import { WalletActivityCustomDateSheet } from '@/module/payouts/components/WalletActivityCustomDateSheet';
import { WalletActivityFilters } from '@/module/payouts/components/WalletActivityFilters';
import { WalletActivitySkeleton } from '@/module/payouts/components/WalletActivitySkeleton';
import { WalletTransactionRow } from '@/module/payouts/components/WalletTransactionRow';
import { useWalletActivity } from '@/module/payouts/hooks/use-wallet';
import {
  resolveWalletActivityDateRange,
  startOfToday,
  subtractDays,
  type WalletActivityDatePreset,
} from '@/module/payouts/lib/wallet-activity-date';
import { useMemo, useState } from 'react';
import { AppSpinner } from '@/components/ui/app-spinner';
import { View } from 'react-native';

type WalletActivityTab = 'earnings' | 'cod' | 'withdrawals';

function ListDivider() {
  return <View className="h-px bg-border/40" />;
}

function mapActivityToRow(item: WalletActivityItem) {
  return {
    id: item.id,
    title: item.title,
    dateLabel: new Date(item.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    amountPaise: item.amountPaise,
    direction: item.direction,
  };
}

export function WalletActivitySection() {
  const [tab, setTab] = useState<WalletActivityTab>('earnings');
  const [datePreset, setDatePreset] = useState<WalletActivityDatePreset>('30d');
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);
  const [customSheetOpen, setCustomSheetOpen] = useState(false);

  const dateRange = useMemo(
    () => resolveWalletActivityDateRange(datePreset, customFrom, customTo),
    [datePreset, customFrom, customTo],
  );

  const { items, hasMore, isLoading, isLoadingMore, isError, refetch, loadMore } = useWalletActivity(
    tab,
    dateRange,
  );

  function openCustomSheet() {
    const today = startOfToday();
    if (!customFrom || !customTo) {
      setCustomFrom(subtractDays(today, 29));
      setCustomTo(today);
    }
    setCustomSheetOpen(true);
  }

  function onDatePresetChange(preset: WalletActivityDatePreset) {
    if (preset === 'custom') {
      openCustomSheet();
      return;
    }
    setDatePreset(preset);
  }

  function onApplyCustomRange(from: Date, to: Date) {
    setCustomFrom(from);
    setCustomTo(to);
    setDatePreset('custom');
  }

  const emptyMessage =
    datePreset === 'all'
      ? 'No activity yet.'
      : 'No activity in this date range. Try a wider range.';

  return (
    <View className="gap-3">
      <Text className="text-foreground px-1 text-base font-bold">Activity</Text>

      <WalletActivityFilters
        tab={tab}
        onTabChange={setTab}
        datePreset={datePreset}
        onDatePresetChange={onDatePresetChange}
      />

      <View className="px-1">
        {isLoading ? (
          <WalletActivitySkeleton />
        ) : isError ? (
          <View className="gap-3 rounded-2xl bg-muted/50 px-4 py-6">
            <Text className="text-muted-foreground text-center text-sm">
              Could not load activity. Check your connection and try again.
            </Text>
            <Button className="rounded-full" variant="secondary" onPress={() => void refetch()}>
              <Text>Retry</Text>
            </Button>
          </View>
        ) : items.length === 0 ? (
          <Text className="text-muted-foreground py-6 text-center text-sm">{emptyMessage}</Text>
        ) : (
          <View>
            {items.map((item, index) => (
              <View key={item.id}>
                <WalletTransactionRow transaction={mapActivityToRow(item)} />
                {index < items.length - 1 ? <ListDivider /> : null}
              </View>
            ))}

            {hasMore ? (
              <PressableScale
                className="mt-2"
                onPress={() => void loadMore()}
                disabled={isLoadingMore}
                scaleTo={0.98}>
                <View className="items-center justify-center rounded-full border border-border/60 py-3">
                  {isLoadingMore ? (
                    <AppSpinner size="sm" />
                  ) : (
                    <Text className="text-foreground text-sm font-medium">View more</Text>
                  )}
                </View>
              </PressableScale>
            ) : null}
          </View>
        )}
      </View>

      <WalletActivityCustomDateSheet
        open={customSheetOpen}
        initialFrom={customFrom}
        initialTo={customTo}
        onClose={() => setCustomSheetOpen(false)}
        onApply={onApplyCustomRange}
      />
    </View>
  );
}
