import { LoadingPlaceholder } from '@/components/shell';
import { useHideTabBarWhileMounted } from '@/lib/use-hide-tab-bar';
import { BookingChatScreen } from '@/module/chat/components/BookingChatScreen';
import { useOrderDetailQuery } from '@/module/account/hooks/use-orders-query';
import { canChatWithVendor } from '@/module/account/lib/order-contact';
import { type Href, router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrderBookingChatRoute() {
  useHideTabBarWhileMounted();
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = id?.trim() ?? '';
  const { data: order, isLoading: orderLoading } = useOrderDetailQuery(orderId);

  useEffect(() => {
    if (!orderLoading && order && !canChatWithVendor(order)) {
      router.replace(`/(app)/profile/orders/${orderId}` as Href);
    }
  }, [order, orderLoading, orderId]);

  if (orderLoading || !order) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <LoadingPlaceholder />
      </SafeAreaView>
    );
  }

  return <BookingChatScreen orderId={orderId} order={order} />;
}
