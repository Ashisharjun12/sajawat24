import { getApiError } from '@/api/client';
import { Screen, TabScreenTitle } from '@/components/shell';
import { SmoothScrollView } from '@/components/shell/SmoothScrollView';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { devApiLog } from '@/lib/dev-api-log';
import { formatPaise } from '@/lib/format-money';
import { PRIMARY_CTA_BUTTON_CLASS, PRIMARY_CTA_BUTTON_TEXT_CLASS } from '@/lib/primary-cta-button';
import { useGoBack } from '@/lib/use-go-back';
import { BillDetailsCard } from '@/module/booking/components/checkout/BillDetailsCard';
import { PaymentMethodCard } from '@/module/booking/components/checkout/PaymentMethodCard';
import { useCartData, useCartMutations, useCartQuery } from '@/module/booking/hooks/use-cart-query';
import { usePaymentMethodsQuery } from '@/module/booking/hooks/use-payment-methods-query';
import { abandonIncompleteOnlinePayment } from '@/module/booking/lib/abandon-incomplete-online-payment';
import {
  customerFormValid,
  deliveryFormValid,
} from '@/module/booking/lib/checkout-validation';
import type { CheckoutPaymentMethod } from '@/module/booking/lib/checkout-form-types';
import { formatCartSlotLabel } from '@/module/booking/lib/format-cart-slot';
import { getCouponPaymentWarning } from '@/module/booking/lib/coupon-eligibility';
import { navigateToBookingConfirmed } from '@/module/booking/lib/navigate-booking-confirmed';
import { OnlinePaymentIncompleteError } from '@/module/booking/lib/payment-flow-errors';
import { placeOrder } from '@/module/booking/lib/place-order';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useCheckoutStore } from '@/store/checkout.store';
import { type Href, router, useFocusEffect } from 'expo-router';
import { Banknote, ShieldCheck, Wallet } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function payCtaLabel(payment: CheckoutPaymentMethod, total: string, placing: boolean): string {
  if (placing) return 'Placing order…';
  if (payment === 'online') return `Pay online · ${total}`;
  if (payment === 'cod') return `Place order (COD) · ${total}`;
  return `Pay · ${total}`;
}

function newIdempotencyKey() {
  return `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function PaymentScreen() {
  const user = useAuthStore((s) => s.user);
  const onBack = useGoBack();
  const insets = useSafeAreaInsets();
  const customer = useCheckoutStore((s) => s.customer);
  const delivery = useCheckoutStore((s) => s.delivery);
  const { cart, isLoading } = useCartData();
  useCartQuery(Boolean(user));
  const { refresh } = useCartMutations();
  const {
    platformPay,
    isLoading: methodsLoading,
    isError: methodsError,
    refetch: refetchMethods,
    isFetching: methodsFetching,
  } = usePaymentMethodsQuery();

  const [payment, setPayment] = useState<CheckoutPaymentMethod>('');
  const [placing, setPlacing] = useState(false);
  const idempotencyKeyRef = useRef(newIdempotencyKey());
  const suppressEmptyCartExit = useCheckoutStore((s) => s.suppressEmptyCartExit);
  const setSuppressEmptyCartExit = useCheckoutStore((s) => s.setSuppressEmptyCartExit);
  const clearPendingPayment = useCheckoutStore((s) => s.clearPendingPayment);
  const cartItemCount = useCartStore((s) => s.itemCount);

  useFocusEffect(
    useCallback(() => {
      if (suppressEmptyCartExit) return;
      if (!isLoading && cart.items.length === 0 && cartItemCount === 0) {
        router.replace('/(app)/' as Href);
      }
    }, [suppressEmptyCartExit, cartItemCount, isLoading, cart.items.length]),
  );

  const isInstantCart = cart.fulfillmentType === 'instant';
  const ready =
    customerFormValid(customer) && deliveryFormValid(delivery, isInstantCart);

  useEffect(() => {
    if (!ready && !isLoading) {
      router.replace('/(app)/checkout' as Href);
    }
  }, [ready, isLoading]);

  const items = cart.items;
  const allowCod =
    platformPay.cod && items.length > 0 && items.every((item) => item.paymentCod !== false);
  const allowOnline =
    platformPay.online && items.length > 0 && items.every((item) => item.paymentOnline);

  useEffect(() => {
    if (__DEV__ && !allowOnline && items.length > 0) {
      devApiLog('info', 'Payment · pay online unavailable', {
        platformOnline: platformPay.online,
        methodsError,
      });
    }
  }, [allowOnline, items.length, methodsError, platformPay.online]);

  useEffect(() => {
    if (payment === 'cod' && !allowCod) setPayment('');
    if (payment === 'online' && !allowOnline) setPayment('');
    if (!payment) {
      if (allowOnline) setPayment('online');
      else if (allowCod) setPayment('cod');
    }
  }, [allowCod, allowOnline, payment]);

  const paymentWarning = useMemo(
    () => getCouponPaymentWarning(cart.appliedCoupon, payment),
    [cart.appliedCoupon, payment],
  );

  const slotLabel = formatCartSlotLabel(cart.scheduledAt);
  const totalStr = formatPaise(cart.totalPaise);

  const canPay =
    ready &&
    (payment === 'cod' || payment === 'online') &&
    !paymentWarning &&
    !methodsError;

  async function onOnlinePaymentAbandoned(orderId: string) {
    await abandonIncompleteOnlinePayment(orderId);
    clearPendingPayment();
    idempotencyKeyRef.current = newIdempotencyKey();
    setSuppressEmptyCartExit(false);
    await refresh();
    Alert.alert(
      'Order not placed',
      'No payment was taken. Your bag is unchanged — you can review and checkout again.',
      [{ text: 'OK', onPress: () => router.replace('/(app)/checkout' as Href) }],
    );
  }

  async function onPlace() {
    if (!canPay || placing) return;
    setPlacing(true);
    setSuppressEmptyCartExit(true);
    try {
      const result = await placeOrder({
        customer,
        delivery,
        payment,
        cart,
        idempotencyKey: idempotencyKeyRef.current,
      });
      clearPendingPayment();
      navigateToBookingConfirmed(result.orderId);
      void refresh();
    } catch (err) {
      setSuppressEmptyCartExit(false);
      if (err instanceof OnlinePaymentIncompleteError) {
        await onOnlinePaymentAbandoned(err.orderId);
        return;
      }
      Alert.alert('Could not place order', getApiError(err));
    } finally {
      setPlacing(false);
    }
  }

  if (isLoading && items.length === 0) {
    return (
      <Screen edges={['top', 'left', 'right']} gutter contentClassName="flex-1">
        <ActivityIndicator className="mt-10" />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']} gutter contentClassName="flex-1">
      <TabScreenTitle title="Payment" showBack onBack={onBack} insetFromParentGutter />
      <SmoothScrollView
        className="flex-1"
        contentContainerClassName="gap-5 pb-4 pt-2"
        contentContainerStyle={{ paddingBottom: 130 + insets.bottom }}>
        <View className="flex-row items-center justify-between gap-3">
          <Text className="text-foreground text-lg font-bold">How to pay</Text>
          <View className="shrink-0 flex-row items-center gap-1">
            <Icon as={ShieldCheck} className="size-4 text-green-600" />
            <Text className="text-muted-foreground text-xs font-medium">100% secure</Text>
          </View>
        </View>

        {methodsError ? (
          <View className="rounded-2xl border border-border bg-card p-4">
            <Text className="text-muted-foreground text-sm">
              Couldn&apos;t load payment options. Check your connection and try again.
            </Text>
            <Button
              variant="outline"
              className="mt-3 self-start rounded-full"
              disabled={methodsFetching}
              onPress={() => void refetchMethods()}>
              <Text>{methodsFetching ? 'Retrying…' : 'Retry'}</Text>
            </Button>
          </View>
        ) : methodsLoading && !allowCod && !allowOnline ? (
          <Text className="text-muted-foreground text-sm">Loading payment options…</Text>
        ) : (
          <View className="gap-2.5">
            {allowOnline ? (
              <PaymentMethodCard
                label="Pay online"
                icon={Wallet}
                iconContainerClassName="bg-sky-50 dark:bg-sky-950/40"
                iconClassName="text-sky-600 dark:text-sky-400"
                selected={payment === 'online'}
                onSelect={() => setPayment('online')}
              />
            ) : null}
            {allowCod ? (
              <PaymentMethodCard
                label="Cash on delivery"
                icon={Banknote}
                iconContainerClassName="bg-emerald-50 dark:bg-emerald-950/40"
                iconClassName="text-emerald-600 dark:text-emerald-400"
                selected={payment === 'cod'}
                onSelect={() => setPayment('cod')}
                subtitle="Pay the decorator after setup"
              />
            ) : null}
            {!allowCod && !allowOnline ? (
              <Text className="text-muted-foreground text-sm">
                No payment method is available for this booking.
              </Text>
            ) : null}
          </View>
        )}

        {paymentWarning ? (
          <Text className="text-destructive text-xs">{paymentWarning}</Text>
        ) : null}

        <BillDetailsCard cart={cart} totalLabel="To pay" />

        {slotLabel ? (
          <Text className="text-muted-foreground text-center text-sm leading-relaxed">
            Complete payment soon to confirm your slot ({slotLabel}).
          </Text>
        ) : null}
      </SmoothScrollView>

      <View
        className="absolute inset-x-0 bottom-0 border-t border-border/60 bg-background px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        <Button
          className={PRIMARY_CTA_BUTTON_CLASS}
          disabled={!canPay || placing}
          onPress={() => void onPlace()}>
          <Text className={PRIMARY_CTA_BUTTON_TEXT_CLASS}>
            {payCtaLabel(payment, totalStr, placing)}
          </Text>
        </Button>
        <View className="mt-2 flex-row items-center justify-center gap-1.5">
          <Icon as={ShieldCheck} className="size-3.5 text-green-600" />
          <Text className="text-muted-foreground text-xs">100% secure payment</Text>
        </View>
      </View>
    </Screen>
  );
}
