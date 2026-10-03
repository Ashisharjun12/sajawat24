import { type PublicOrderSummary } from '@/api/orders.api';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatPaise } from '@/lib/format-money';
import {
  bookingStatusLabel,
  formatBookingSlot,
  orderCardTitle,
} from '@/module/account/lib/booking-ui';
import { useCheckoutStore } from '@/store/checkout.store';
import { Image } from 'expo-image';
import { type Href, router } from 'expo-router';
import { Clock, MapPin } from 'lucide-react-native';
import { OrderReviewSheet } from '@/module/account/components/order-review/OrderReviewSheet';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

type OrderListCardProps = {
  order: PublicOrderSummary;
};

function deliveryLine(order: PublicOrderSummary): string {
  const street = [order.delivery?.address, order.delivery?.landmark].filter(Boolean).join(', ');
  const place = [order.cityName, order.pincode].filter(Boolean).join(', ');
  return [street, place].filter(Boolean).join(' · ');
}

export function OrderListCard({ order }: OrderListCardProps) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const setPendingOrderId = useCheckoutStore((s) => s.setPendingOrderId);
  const setPaymentIncomplete = useCheckoutStore((s) => s.setPaymentIncomplete);
  const setPaymentUserCancelled = useCheckoutStore((s) => s.setPaymentUserCancelled);

  const title = orderCardTitle(order.primaryName, order.itemCount);
  const inProgress = order.status !== 'COMPLETED' && order.status !== 'CANCELLED';
  const statusHeadline = inProgress ? 'Order in progress' : bookingStatusLabel(order.status);
  const totalPaise = order.subtotalPaise;

  function openCompletePayment() {
    setPendingOrderId(order.id);
    setPaymentIncomplete(true);
    setPaymentUserCancelled(false);
    router.push('/(app)/checkout/payment' as Href);
  }

  function openOrderDetail() {
    router.push(`/(app)/profile/orders/${order.id}` as Href);
  }

  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">
      <Pressable onPress={openOrderDetail} className="active:opacity-95">
        <View className="flex-row gap-3 p-3">
          <View className="size-24 shrink-0 overflow-hidden rounded-xl bg-muted">
            {order.primaryImageUrl ? (
              <Image
                source={{ uri: order.primaryImageUrl }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                accessibilityLabel={order.primaryName}
              />
            ) : (
              <View className="size-full items-center justify-center bg-muted">
                <Text className="text-muted-foreground text-xs">No image</Text>
              </View>
            )}
          </View>
          <View className="min-w-0 flex-1">
            <View className="flex-row items-start justify-between gap-2">
              <Text className="text-foreground min-w-0 flex-1 text-base font-semibold" numberOfLines={2}>
                {title}
              </Text>
              <Text className="text-foreground shrink-0 text-base font-bold tabular-nums">
                {formatPaise(totalPaise)}
              </Text>
            </View>
            <Text className="text-muted-foreground mt-1 text-sm" numberOfLines={1}>
              {statusHeadline}
              {order.reference ? ` · ${order.reference}` : ''}
            </Text>
            <View className="mt-2 flex-row items-start gap-2">
              <View className="mt-0.5 size-7 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                <Icon as={Clock} className="size-3.5 text-amber-700" />
              </View>
              <Text className="text-muted-foreground min-w-0 flex-1 text-xs leading-5">
                <Text className="text-foreground font-medium">Setup </Text>
                {formatBookingSlot(order.scheduledAt)}
              </Text>
            </View>
            {deliveryLine(order) ? (
              <View className="mt-2 flex-row items-start gap-2">
                <View className="mt-0.5 size-7 shrink-0 items-center justify-center rounded-lg bg-rose-50">
                  <Icon as={MapPin} className="size-3.5 text-rose-600" />
                </View>
                <Text className="text-muted-foreground min-w-0 flex-1 text-xs leading-5" numberOfLines={3}>
                  {deliveryLine(order)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>

      <View className="gap-2 border-t border-border/60 px-3 py-3">
        {order.status === 'PENDING_PAYMENT' ? (
          <Pressable
            onPress={openCompletePayment}
            className="w-full items-center rounded-full bg-primary py-3 active:opacity-90"
            accessibilityRole="button">
            <Text className="text-primary-foreground text-sm font-semibold">Complete payment</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={openOrderDetail}
          className="w-full items-center rounded-full bg-primary py-3 active:opacity-90"
          accessibilityRole="button">
          <Text className="text-primary-foreground text-sm font-semibold">View order</Text>
        </Pressable>
        {order.canReview && !order.reviewSubmitted ? (
          <Pressable
            onPress={() => setReviewOpen(true)}
            className="w-full items-center rounded-full border border-border bg-muted/30 py-3 active:opacity-90"
            accessibilityRole="button">
            <Text className="text-foreground text-sm font-semibold">Leave review</Text>
          </Pressable>
        ) : null}
      </View>

      <OrderReviewSheet
        visible={reviewOpen}
        onClose={() => setReviewOpen(false)}
        orderId={order.id}
        productName={order.primaryName}
      />
    </View>
  );
}
