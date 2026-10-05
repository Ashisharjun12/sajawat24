import { type PublicOrderSummary } from '@/api/orders.api';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatPaise } from '@/lib/format-money';
import { formatBookingSlot, orderCardTitle } from '@/module/account/lib/booking-ui';
import {
  isCheckoutAbandonedOrder,
  orderStatusDisplayLabel,
} from '@/module/account/lib/order-status-ui';
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
  const checkoutAbandoned = isCheckoutAbandonedOrder(order);
  const statusHeadline = orderStatusDisplayLabel(order.status, checkoutAbandoned);
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
        <View className="flex-row gap-2.5 p-2.5">
          <View className="size-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-muted">
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
              <Text className="text-foreground min-w-0 flex-1 text-sm font-semibold" numberOfLines={2}>
                {title}
              </Text>
              <Text className="text-foreground shrink-0 text-sm font-bold tabular-nums">
                {formatPaise(totalPaise)}
              </Text>
            </View>
            <Text className="text-muted-foreground mt-0.5 text-xs" numberOfLines={1}>
              {statusHeadline}
              {order.reference ? ` · ${order.reference}` : ''}
            </Text>
            <View className="mt-1.5 flex-row items-center gap-1.5">
              <Icon as={Clock} className="size-3.5 shrink-0 text-primary" />
              <Text className="text-muted-foreground min-w-0 flex-1 text-xs leading-4" numberOfLines={1}>
                {formatBookingSlot(order.scheduledAt)}
              </Text>
            </View>
            {deliveryLine(order) ? (
              <View className="mt-1 flex-row items-center gap-1.5">
                <Icon as={MapPin} className="size-3.5 shrink-0 text-primary" />
                <Text className="text-muted-foreground min-w-0 flex-1 text-xs leading-4" numberOfLines={1}>
                  {deliveryLine(order)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>

      <View className="gap-1.5 border-t border-border/60 px-2.5 py-2">
        {order.status === 'PENDING_PAYMENT' ? (
          <Button variant="primary" size="sm" className="w-full" onPress={openCompletePayment}>
            <Text>Complete payment</Text>
          </Button>
        ) : null}
        <Button variant="secondary" size="sm" className="w-full" onPress={openOrderDetail}>
          <Text>View order</Text>
        </Button>
        {order.canReview && !order.reviewSubmitted ? (
          <Button variant="text" size="sm" className="w-full" onPress={() => setReviewOpen(true)}>
            <Text>Leave review</Text>
          </Button>
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
