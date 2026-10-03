import { ScalePressable } from '@/components/shell';
import { Text } from '@/components/ui/text';
import type { PublicOrder } from '@/api/orders.api';
import { OrderContactCard } from '@/module/account/components/order-detail/OrderContactCard';
import { OrderDetailsSheet } from '@/module/account/components/order-detail/OrderDetailsSheet';
import { OrderTimeline } from '@/module/account/components/order-detail/OrderTimeline';
import { OrderTrackingMap } from '@/module/account/components/order-detail/OrderTrackingMap';
import { bookingStatusLabel } from '@/module/account/lib/booking-ui';
import { useGoBack } from '@/lib/use-go-back';
import { type Href } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  order: PublicOrder;
  onCompletePayment?: () => void;
};

export function OrderDetailTrackingLayout({ order, onCompletePayment }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const mapHeight = Math.round(height * 0.58);
  const onBack = useGoBack({ fallbackHref: '/(app)/profile/orders' as Href });
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <View className="flex-1 bg-background">
      <View style={{ height: mapHeight }}>
        <OrderTrackingMap order={order} className="flex-1" />
        <View
          className="absolute left-0 right-0 flex-row items-center justify-between px-3"
          style={{ top: insets.top + 8 }}>
          <ScalePressable
            haptic
            onPress={onBack}
            className="size-10 items-center justify-center rounded-full bg-background/90">
            <Icon as={ChevronLeft} className="text-foreground size-6" />
          </ScalePressable>
          <View className="rounded-full bg-background/90 px-4 py-2">
            <Text className="text-foreground text-sm font-semibold">Order tracking</Text>
            <Text className="text-muted-foreground text-center text-xs">
              {bookingStatusLabel(order.status)}
            </Text>
          </View>
          <ScalePressable
            haptic
            onPress={() => setDetailsOpen(true)}
            className="rounded-full bg-background/90 px-3 py-2">
            <Text className="text-foreground text-sm font-semibold">Details</Text>
          </ScalePressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-4 pb-8 pt-4"
        showsVerticalScrollIndicator={false}>
        {order.status === 'EN_ROUTE' ? (
          <Text className="text-foreground rounded-2xl bg-sky-500/10 px-4 py-3 text-sm">
            Your decorator is on the way to your location.
          </Text>
        ) : null}
        {order.status === 'ON_SITE' ? (
          <Text className="text-foreground rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm">
            {order.deliveryCodePending
              ? 'Setup is in progress. Share your completion code when your decorator asks.'
              : 'Your decorator has arrived and setup is in progress.'}
          </Text>
        ) : null}
        <OrderContactCard order={order} />
        <View className="rounded-2xl border border-border bg-card p-4">
          <Text className="text-foreground mb-4 text-base font-semibold">Booking progress</Text>
          <OrderTimeline status={order.status} />
        </View>
      </ScrollView>

      <OrderDetailsSheet
        visible={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        order={order}
        onCompletePayment={onCompletePayment}
      />
    </View>
  );
}
