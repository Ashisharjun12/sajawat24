import { Screen } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { getApiError } from '@/api/client';
import { PRIMARY_CTA_BUTTON_CLASS, PRIMARY_CTA_BUTTON_TEXT_CLASS } from '@/lib/primary-cta-button';
import { useOrderDetailQuery } from '@/module/account/hooks/use-orders-query';
import { useCartMutations } from '@/module/booking/hooks/use-cart-query';
import { BOOKING_CONFIRMED_ICON_URI } from '@/module/booking/lib/booking-assets';
import { useCheckoutStore } from '@/store/checkout.store';
import { type Href, router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useLayoutEffect } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function BookingConfirmedScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { refresh } = useCartMutations();
  const setSuppressEmptyCartExit = useCheckoutStore((s) => s.setSuppressEmptyCartExit);
  const setPendingOrderId = useCheckoutStore((s) => s.setPendingOrderId);
  const setPaymentIncomplete = useCheckoutStore((s) => s.setPaymentIncomplete);
  const setPaymentUserCancelled = useCheckoutStore((s) => s.setPaymentUserCancelled);
  const confirmedOrderId = useCheckoutStore((s) => s.confirmedOrderId);
  const setConfirmedOrderId = useCheckoutStore((s) => s.setConfirmedOrderId);
  const { orderId: orderIdParam } = useLocalSearchParams<{ orderId?: string | string[] }>();
  const orderIdRaw = Array.isArray(orderIdParam) ? orderIdParam[0] : orderIdParam;
  const orderId = orderIdRaw?.trim() || null;
  const { data: order, isLoading, isError, error } = useOrderDetailQuery(orderId);

  useLayoutEffect(() => {
    const tab = navigation.getParent();
    tab?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      tab?.setOptions({ tabBarStyle: undefined });
    };
  }, [navigation]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function browseProducts() {
    setSuppressEmptyCartExit(false);
    setConfirmedOrderId(null);
    router.replace('/(app)/' as Href);
  }

  function viewBooking() {
    setSuppressEmptyCartExit(false);
    setConfirmedOrderId(null);
    router.replace('/(app)/profile/orders' as Href);
  }

  function completePayment() {
    if (!orderId) return;
    setPendingOrderId(orderId);
    setPaymentIncomplete(true);
    setPaymentUserCancelled(false);
    router.replace('/(app)/checkout/payment' as Href);
  }

  const status = order?.status;
  const isConfirmed =
    status === 'CONFIRMED' ||
    status === 'ASSIGNED' ||
    status === 'EN_ROUTE' ||
    status === 'ON_SITE' ||
    status === 'COMPLETED';
  const isPending = status === 'PENDING_PAYMENT';
  const isCancelled = status === 'CANCELLED';
  const justPlaced = Boolean(orderId && confirmedOrderId === orderId);
  const showPaymentIncomplete =
    !isLoading && !isError && Boolean(order) && isPending && !justPlaced;
  const showConfirmedHero =
    justPlaced ||
    isLoading ||
    (!isError && Boolean(order) && !showPaymentIncomplete && !isCancelled);

  return (
    <Screen scroll={false} edges={['top', 'left', 'right', 'bottom']} contentClassName="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-8">
        {isError || (!isLoading && !order && !justPlaced) ? (
          <>
            <Text className="text-foreground text-center text-xl font-bold">Could not load booking</Text>
            <Text className="text-muted-foreground mt-2 text-center text-sm">
              {getApiError(error)}
            </Text>
          </>
        ) : showPaymentIncomplete ? (
          <>
            <Text className="text-foreground text-center text-2xl font-bold leading-tight">
              Payment incomplete
            </Text>
            <Text className="text-muted-foreground mt-3 text-center text-base leading-relaxed">
              Your booking is not confirmed yet. Complete payment to secure your slot.
            </Text>
          </>
        ) : isCancelled && !justPlaced && !isLoading ? (
          <>
            <Text className="text-foreground text-center text-2xl font-bold leading-tight">
              Booking cancelled
            </Text>
            <Text className="text-muted-foreground mt-3 text-center text-base leading-relaxed">
              This order was cancelled. You can place a new booking from the home screen.
            </Text>
          </>
        ) : showConfirmedHero ? (
          <>
            <Image
              source={{ uri: BOOKING_CONFIRMED_ICON_URI }}
              style={{ width: 112, height: 112 }}
              contentFit="contain"
              cachePolicy="memory-disk"
              accessibilityIgnoresInvertColors
              accessibilityLabel="Booking confirmed"
            />
            <Text className="text-foreground mt-8 text-center text-2xl font-bold leading-tight">
              Your booking is confirmed
            </Text>
            <Text className="text-muted-foreground mt-3 text-center text-base leading-relaxed">
              {isConfirmed || justPlaced || isLoading
                ? 'You will receive an email or SMS notification shortly.'
                : 'We are updating your booking details.'}
            </Text>
          </>
        ) : null}
        {orderId ? (
          <Text className="text-muted-foreground mt-4 text-center text-xs">
            Order ref · {String(orderId).slice(0, 8).toUpperCase()}
          </Text>
        ) : null}
      </View>

      <View
        className="gap-3 px-5 pt-2"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        {showPaymentIncomplete ? (
          <Button className={PRIMARY_CTA_BUTTON_CLASS} onPress={completePayment}>
            <Text className={PRIMARY_CTA_BUTTON_TEXT_CLASS}>Complete payment</Text>
          </Button>
        ) : null}
        <Button
          className={showPaymentIncomplete ? 'h-12 w-full rounded-full' : PRIMARY_CTA_BUTTON_CLASS}
          variant={showPaymentIncomplete ? 'outline' : 'default'}
          onPress={browseProducts}>
          <Text
            className={
              showPaymentIncomplete
                ? 'text-foreground text-base font-semibold'
                : PRIMARY_CTA_BUTTON_TEXT_CLASS
            }>
            Browse more products
          </Text>
        </Button>
        {!showPaymentIncomplete && !(isCancelled && !justPlaced) ? (
          <Button variant="outline" className="h-12 w-full rounded-full" onPress={viewBooking}>
            <Text className="text-foreground text-base font-semibold">View order</Text>
          </Button>
        ) : null}
      </View>
    </Screen>
  );
}
