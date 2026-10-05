import { getApiError } from '@/api/client';
import { Screen, TabScreenTitle } from '@/components/shell';
import { Button } from '@/components/ui/button';
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
import { formatBookingSlot } from '@/module/account/lib/booking-ui';
import {
  isCheckoutAbandonedOrder,
  orderStatusDisplayLabel,
  orderStatusPillClass,
  orderStatusPillTextClass,
  orderStatusTone,
  shouldShowBookingTimeline,
} from '@/module/account/lib/order-status-ui';
import { isOrderTrackingLayout } from '@/module/account/lib/order-tracking-mode';
import { useCheckoutStore } from '@/store/checkout.store';
import { Image } from 'expo-image';
import { type Href, router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Clock, MapPin, Phone } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

const HERO_PLACEHOLDER =
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=480&fit=crop';

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
  const checkoutAbandoned = isCheckoutAbandonedOrder(order);
  const statusTone = orderStatusTone(order.status, checkoutAbandoned);
  const showTimeline = shouldShowBookingTimeline(order.status, checkoutAbandoned);

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
              <View className={cn('rounded-full px-3 py-1', orderStatusPillClass(statusTone))}>
                <Text className={cn('text-xs font-semibold', orderStatusPillTextClass(statusTone))}>
                  {orderStatusDisplayLabel(order.status, checkoutAbandoned)}
                </Text>
              </View>
            </View>
          </View>
          <View className="gap-1 border-t border-border/60 bg-muted/20 px-4 py-3">
            <Text className="text-foreground text-lg font-bold" numberOfLines={2}>
              {order.items?.[0]?.name ?? 'Your booking'}
            </Text>
            <Text className="text-muted-foreground font-mono text-xs">{order.reference}</Text>
            <Text className="text-foreground mt-1 text-display font-semibold tabular-nums">
              {formatPaise(order.totalPaise)}
            </Text>
          </View>
        </View>

        {order.status === 'ON_SITE' ? (
          <Text className="text-foreground rounded-2xl bg-success/15 px-4 py-3 text-sm">
            {order.deliveryCodePending
              ? 'Your decorator has arrived. Share your completion code when they ask.'
              : 'Your decorator is on site and setup is in progress.'}
          </Text>
        ) : null}

        {checkoutAbandoned ? (
          <Text className="text-destructive rounded-2xl bg-destructive/10 px-4 py-3 text-sm leading-5">
            Payment was not completed for this attempt. Nothing was charged — book again from your
            bag when you are ready.
          </Text>
        ) : null}

        {!checkoutAbandoned && order.status === 'PENDING_PAYMENT' ? (
          <Text className="text-cta rounded-2xl bg-cta/10 px-4 py-3 text-sm leading-5">
            This booking is waiting for payment. Complete checkout to confirm your slot.
          </Text>
        ) : null}

        <OrderContactCard order={order} />

        <View className="rounded-2xl border border-border bg-card p-4 gap-4">
          <View className="flex-row gap-3">
            <Icon as={Clock} className="text-primary size-5" />
            <View className="flex-1">
              <Text className="text-muted-foreground text-xs uppercase">Setup slot</Text>
              <Text className="text-foreground text-sm">{formatBookingSlot(order.scheduledAt)}</Text>
            </View>
          </View>
          <View className="flex-row gap-3">
            <Icon as={MapPin} className="text-primary size-5" />
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
            <OrderTimeline status={order.status} checkoutAbandoned={checkoutAbandoned} />
          </View>
        ) : !showTimeline && (order.status === 'CANCELLED' || order.status === 'PENDING_PAYMENT') ? (
          <View className="rounded-2xl border border-border bg-card p-4">
            <Text className="text-foreground mb-4 font-semibold">Status</Text>
            <OrderTimeline status={order.status} checkoutAbandoned={checkoutAbandoned} />
          </View>
        ) : null}

        {order.canReview && !order.reviewSubmitted ? (
          <Button variant="secondary" className="w-full" onPress={() => setReviewOpen(true)}>
            <Text>Leave a review</Text>
          </Button>
        ) : null}

        {order.reviewSubmitted ? (
          <Text className="text-muted-foreground text-center text-sm">
            Thanks — your review is on its way to our community.
          </Text>
        ) : null}

        {order.status === 'PENDING_PAYMENT' && !checkoutAbandoned ? (
          <Button variant="cta" className="w-full" onPress={openCompletePayment}>
            <Text>Complete payment</Text>
          </Button>
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
