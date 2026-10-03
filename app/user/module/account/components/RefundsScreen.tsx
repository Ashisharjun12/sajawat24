import { getApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { AccountSubScreen } from '@/module/account/components/AccountSubScreen';
import { useRefundsQuery } from '@/module/account/hooks/use-refunds-query';
import {
  formatPaise,
  REFUND_STATUS_LABELS,
  refundStatusVariant,
  summarizeRefunds,
} from '@/module/account/lib/refund-ui';
import { getHelpTopic } from '@/module/chat/lib/help-topics';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { type Href, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScalePressable } from '@/components/shell';
import { ActivityIndicator, Image, RefreshControl, ScrollView, View } from 'react-native';

const paymentTopic = getHelpTopic('payment');

function formatRefundDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return format(new Date(iso), 'MMM d, yyyy');
  } catch {
    return '—';
  }
}

function RefundStatusBadge({ status }: { status: string }) {
  const variant = refundStatusVariant(status);
  return (
    <View
      className={cn(
        'rounded-md px-2 py-0.5',
        variant === 'destructive' && 'bg-destructive/15',
        variant === 'default' && 'bg-primary/15',
        variant === 'outline' && 'border border-border bg-muted/40',
      )}>
      <Text
        className={cn(
          'text-[11px] font-semibold',
          variant === 'destructive' && 'text-destructive',
          variant === 'default' && 'text-foreground',
          variant === 'outline' && 'text-muted-foreground',
        )}>
        {REFUND_STATUS_LABELS[status] ?? status}
      </Text>
    </View>
  );
}

export function RefundsScreen() {
  const { data: refunds = [], isLoading, isError, error, refetch, isRefetching } =
    useRefundsQuery();
  const [pullRefreshing, setPullRefreshing] = useState(false);

  const { completedPaise, pendingPaise } = useMemo(
    () => summarizeRefunds(refunds),
    [refunds],
  );

  async function onRefresh() {
    setPullRefreshing(true);
    try {
      await refetch();
    } finally {
      setPullRefreshing(false);
    }
  }

  return (
    <AccountSubScreen title="Refunds">
      <Text className="text-muted-foreground -mt-2 text-sm">
        Track refund requests for cancelled or disputed bookings.
      </Text>

      <View className="mt-4 flex-row gap-3">
        <View className="flex-1 rounded-xl border border-border/70 bg-card px-3.5 py-3">
          <Text className="text-muted-foreground text-xs font-medium">Refunded</Text>
          <Text className="text-foreground mt-1 text-sm font-semibold tabular-nums">
            {formatPaise(completedPaise)}
          </Text>
        </View>
        <View className="flex-1 rounded-xl border border-border/70 bg-card px-3.5 py-3">
          <Text className="text-muted-foreground text-xs font-medium">In progress</Text>
          <Text className="text-foreground mt-1 text-sm font-semibold tabular-nums">
            {formatPaise(pendingPaise)}
          </Text>
        </View>
      </View>

      <ScrollView
        className="mt-6 flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={pullRefreshing || isRefetching} onRefresh={() => void onRefresh()} />
        }>
        {isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator />
          </View>
        ) : null}

        {isError ? (
          <Text className="text-destructive py-4 text-sm">{getApiError(error)}</Text>
        ) : null}

        {!isLoading && !isError && refunds.length === 0 ? (
          <View className="rounded-xl border border-dashed border-border px-6 py-10">
            <Text className="text-muted-foreground text-center text-sm">No refund requests yet.</Text>
            <Button
              variant="outline"
              className="mt-4 self-center rounded-full"
              onPress={() => router.push('/(app)/profile/orders' as Href)}>
              <Text>View my orders</Text>
            </Button>
          </View>
        ) : null}

        {refunds.length > 0 ? (
          <View className="gap-3 pb-8">
            <Text className="text-foreground text-sm font-semibold">Refund activity</Text>
            {refunds.map((row) => (
              <View
                key={row.id}
                className="flex-row gap-3 rounded-xl border border-border/70 bg-card p-3">
                <View className="size-14 shrink-0 overflow-hidden rounded-md bg-muted">
                  {row.imageUrl ? (
                    <Image source={{ uri: row.imageUrl }} className="size-full" />
                  ) : null}
                </View>
                <View className="min-w-0 flex-1">
                  <View className="flex-row flex-wrap items-start justify-between gap-2">
                    <Text className="text-foreground min-w-0 flex-1 text-sm font-semibold leading-snug">
                      {row.productName}
                    </Text>
                    <RefundStatusBadge status={row.status} />
                  </View>
                  <Text className="text-muted-foreground mt-1 text-xs">Order {row.orderRef}</Text>
                  <Text className="text-foreground mt-2 text-sm font-semibold tabular-nums">
                    {formatPaise(row.amountPaise)}
                  </Text>
                  <Text className="text-muted-foreground mt-1 text-xs">
                    Requested {formatRefundDate(row.requestedAt)}
                    {row.completedAt
                      ? ` · Completed ${formatRefundDate(row.completedAt)}`
                      : ''}
                  </Text>
                  {row.orderId ? (
                    <ScalePressable
                      haptic
                      className="mt-1 self-start"
                      onPress={() =>
                        router.push(`/(app)/profile/orders/${row.orderId}` as Href)
                      }>
                      <Text className="text-primary text-xs font-medium underline">View order</Text>
                    </ScalePressable>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View className="mb-8 gap-3 rounded-xl border border-border/70 bg-muted/20 px-4 py-4">
          <Text className="text-foreground text-sm font-semibold">Need help?</Text>
          <Text className="text-muted-foreground text-sm">
            {paymentTopic?.description ?? 'COD, online payment, or refund status.'}
          </Text>
          <Button
            className="self-start rounded-lg"
            onPress={() =>
              router.push('/(app)/profile/help/payment' as Href)
            }>
            <Text>Chat about payment & refunds</Text>
          </Button>
        </View>
      </ScrollView>
    </AccountSubScreen>
  );
}
