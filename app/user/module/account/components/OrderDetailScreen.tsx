import { getApiError } from '@/api/client';
import { Screen, TabScreenTitle } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { formatPaise } from '@/lib/format-money';
import { cn } from '@/lib/utils';
import { useGoBack } from '@/lib/use-go-back';
import { OrderReviewSheet } from '@/module/account/components/order-review/OrderReviewSheet';
import { OrderContactCard } from '@/module/account/components/order-detail/OrderContactCard';
import { OrderDetailTrackingLayout } from '@/module/account/components/order-detail/OrderDetailTrackingLayout';
import { OrderTimeline } from '@/module/account/components/order-detail/OrderTimeline';
import { OrderDetailSkeleton } from '@/module/account/components/OrderDetailSkeleton';
import { useOrderDetailQuery } from '@/module/account/hooks/use-orders-query';
import {
  bookingStatusLabel,
  formatBookingSlot,
} from '@/module/account/lib/booking-ui';
import { isOrderTrackingLayout } from '@/module/account/lib/order-tracking-mode';
import { useCheckoutStore } from '@/store/checkout.store';
import { Image } from 'expo-image';
import { type Href, router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Clock, MapPin, Phone } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';

const HERO_PLACEHOLDER =
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=480&fit=crop';

function statusPillClass(status: string): string {
  if (status === 'COMPLETED') return 'bg-emerald-100';
  if (status === 'CANCELLED') return 'bg-muted';
  if (status === 'PENDING_PAYMENT') return 'bg-amber-100';
  return 'bg-primary/20';
}

function statusPillTextClass(status: string): string {
  if (status === 'COMPLETED') return 'text-emerald-800';
  if (status === 'CANCELLED') return 'text-muted-foreground';
  if (status === 'PENDING_PAYMENT') return 'text-amber-900';
  return 'text-foreground';
}

export function OrderDetailScreen() {
  const onBack = useGoBack({ fallbackHref: '/(app)/profile/orders' as Href });
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = id?.trim() ?? '';
  const { data: order, isLoading, isError, error, refetch } = useOrderDetailQuery(orderId);
  const [reviewOpen, setReviewOpen] = useState(false);
  const setPendingOrderId = useCheckoutStore((s) => s.setPendingOrderId);
  const setPaymentIncomplete = useCheckoutStore((s) => s.setPaymentIncomplete);
  const setPaymentUserCancelled = useCheckoutStore((s) => s.setPaymentUserCancelled);

  useFocusEffect(
    useCallback(() => {
      if (orderId) void refetch();
    }, [orderId, refetch]),
  );

  function openCompletePayment() {
    if (!order) return;
    setPendingOrderId(order.id);
    setPaymentIncomplete(true);
    setPaymentUserCancelled(false);
    router.push('/(app)/checkout/payment' as Href);
  }

  if (isLoading) {
    return (
      <Screen edges={['top', 'left', 'right']} gutter contentClassName="pb-10">
        <TabScreenTitle title="Order details" showBack onBack={onBack} insetFromParentGutter />
        <OrderDetailSkeleton />
      </Screen>
    );
  }

  if (isError || !order) {
    return (
      <Screen edges={['top', 'left', 'right']} gutter contentClassName="pb-10">
        <TabScreenTitle title="Order details" showBack onBack={onBack} insetFromParentGutter />
        <Text className="text-destructive mt-6 text-sm">
          {error ? getApiError(error) : 'Could not load this order.'}
        </Text>
      </Screen>
    );
  }

  if (isOrderTrackingLayout(order)) {
    return <OrderDetailTrackingLayout order={order} onCompletePayment={openCompletePayment} />;
  }

  const heroImage = order.items?.find((item) => item.imageUrl)?.imageUrl ?? HERO_PLACEHOLDER;
  const showTimeline =
    order.status !== 'PENDING_PAYMENT' &&
    (order.status === 'COMPLETED' ||
      order.status === 'CANCELLED' ||
      order.status === 'CONFIRMED' ||
      order.status === 'ASSIGNED' ||
      order.status === 'ON_SITE' ||
      order.status === 'COMPLETED');

  return (
    <Screen edges={['top', 'left', 'right']} gutter contentClassName="pb-10">
      <TabScreenTitle title="Order details" showBack onBack={onBack} insetFromParentGutter />
      <View className="mt-4 gap-5">
        <View className="overflow-hidden rounded-2xl border border-border bg-card">
          <View className="relative h-44 w-full bg-muted">
            <Image
              source={{ uri: heroImage }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
            <View className="absolute left-4 top-4">
              <View className={cn('rounded-full px-3 py-1', statusPillClass(order.status))}>
                <Text className={cn('text-xs font-semibold', statusPillTextClass(order.status))}>
                  {bookingStatusLabel(order.status)}
                </Text>
              </View>
            </View>
          </View>
          <View className="gap-1 border-t border-border/60 bg-muted/20 px-4 py-3">
            <Text className="text-foreground text-lg font-bold" numberOfLines={2}>
              {order.items?.[0]?.name ?? 'Your booking'}
            </Text>
            <Text className="text-muted-foreground font-mono text-xs">{order.reference}</Text>
            <Text className="text-foreground mt-1 text-2xl font-bold tabular-nums">
              {formatPaise(order.totalPaise)}
            </Text>
          </View>
        </View>

        {order.status === 'ON_SITE' ? (
          <Text className="text-foreground rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm">
            {order.deliveryCodePending
              ? 'Your decorator has arrived. Share your completion code when they ask.'
              : 'Your decorator is on site and setup is in progress.'}
          </Text>
        ) : null}

        <OrderContactCard order={order} />

        <View className="rounded-2xl border border-border bg-card p-4 gap-4">
          <View className="flex-row gap-3">
            <Icon as={Clock} className="text-amber-700 size-5" />
            <View className="flex-1">
              <Text className="text-muted-foreground text-xs uppercase">Setup slot</Text>
              <Text className="text-foreground text-sm">{formatBookingSlot(order.scheduledAt)}</Text>
            </View>
          </View>
          <View className="flex-row gap-3">
            <Icon as={MapPin} className="text-rose-600 size-5" />
            <View className="flex-1">
              <Text className="text-muted-foreground text-xs uppercase">Delivery</Text>
              <Text className="text-foreground text-sm">{order.delivery.address}</Text>
            </View>
          </View>
          <View className="flex-row gap-3">
            <Icon as={Phone} className="text-muted-foreground size-5" />
            <View className="flex-1">
              <Text className="text-muted-foreground text-xs uppercase">Contact</Text>
              <Text className="text-foreground text-sm">{order.customer.phone}</Text>
            </View>
          </View>
        </View>

        {showTimeline ? (
          <View className="rounded-2xl border border-border bg-card p-4">
            <Text className="text-foreground mb-4 font-semibold">Booking progress</Text>
            <OrderTimeline status={order.status} />
          </View>
        ) : null}

        {order.canReview && !order.reviewSubmitted ? (
          <Pressable
            onPress={() => setReviewOpen(true)}
            className="w-full items-center rounded-full bg-primary py-3.5 active:opacity-90">
            <Text className="text-primary-foreground text-sm font-semibold">Leave a review</Text>
          </Pressable>
        ) : null}

        {order.reviewSubmitted ? (
          <Text className="text-muted-foreground text-center text-sm">
            Thanks — your review is on its way to our community.
          </Text>
        ) : null}

        {order.status === 'PENDING_PAYMENT' ? (
          <Pressable
            onPress={openCompletePayment}
            className="w-full items-center rounded-full bg-primary py-3.5">
            <Text className="text-primary-foreground text-sm font-semibold">Complete payment</Text>
          </Pressable>
        ) : null}
      </View>

      <OrderReviewSheet
        visible={reviewOpen}
        onClose={() => setReviewOpen(false)}
        orderId={order.id}
        productName={order.items?.[0]?.name}
        productId={order.items?.length === 1 ? order.items[0].productId : undefined}
      />
    </Screen>
  );
}
