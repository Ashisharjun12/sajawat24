import { Screen, TabScreenTitle } from '@/components/shell';
import { SmoothScrollView } from '@/components/shell/SmoothScrollView';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { PRIMARY_CTA_BUTTON_CLASS, PRIMARY_CTA_BUTTON_TEXT_CLASS } from '@/lib/primary-cta-button';
import { useGoBack } from '@/lib/use-go-back';
import { CheckoutAddressPickerSheet } from '@/module/booking/components/checkout/CheckoutAddressPickerSheet';
import { BillDetailsCard } from '@/module/booking/components/checkout/BillDetailsCard';
import { CheckoutContactEditSheet } from '@/module/booking/components/checkout/CheckoutContactEditSheet';
import { ConfirmOfferRow } from '@/module/booking/components/checkout/ConfirmOfferRow';
import { ConfirmBookingSkeleton } from '@/module/booking/components/checkout/ConfirmBookingSkeleton';
import { ConfirmProductCard } from '@/module/booking/components/checkout/ConfirmProductCard';
import { DeliveryAddressCard } from '@/module/booking/components/checkout/DeliveryAddressCard';
import { useCartData, useCartMutations, useCartQuery } from '@/module/booking/hooks/use-cart-query';
import { useCartStore } from '@/store/cart.store';
import {
  customerFormValid,
  deliveryFormValid,
} from '@/module/booking/lib/checkout-validation';
import { useAddressesQuery } from '@/module/account/hooks/use-addresses-query';
import { useAuthStore } from '@/store/auth.store';
import { useCheckoutStore } from '@/store/checkout.store';
import { syncCheckoutDeliveryFromStores } from '@/module/booking/lib/sync-checkout-delivery';
import { useDeliveryLocationStore } from '@/store/delivery-location.store';
import { type Href, router, useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ConfirmBookingScreen() {
  const user = useAuthStore((s) => s.user);
  const onBack = useGoBack({ orHome: true });
  const insets = useSafeAreaInsets();
  const { cart, isLoading, isFetching } = useCartData();
  const { remove: removeCartLine } = useCartMutations();
  useCartQuery(Boolean(user));
  const [removingLineId, setRemovingLineId] = useState<string | null>(null);

  const customer = useCheckoutStore((s) => s.customer);
  const delivery = useCheckoutStore((s) => s.delivery);
  const deliveryLabel = useCheckoutStore((s) => s.deliveryLabel);
  const setCustomer = useCheckoutStore((s) => s.setCustomer);
  const hydrateCustomerFromUser = useCheckoutStore((s) => s.hydrateCustomerFromUser);
  const suppressEmptyCartExit = useCheckoutStore((s) => s.suppressEmptyCartExit);
  const cartItemCount = useCartStore((s) => s.itemCount);

  const deliveryHydrated = useDeliveryLocationStore((s) => s.hydrated);
  const selectedAddressId = useDeliveryLocationStore((s) => s.selectedAddressId);
  const deliverySnapshot = useDeliveryLocationStore((s) => s.snapshot);
  const hydrateDelivery = useDeliveryLocationStore((s) => s.hydrate);

  const queryClient = useQueryClient();
  const { data: addresses = [] } = useAddressesQuery(Boolean(user));
  const [contactSheetOpen, setContactSheetOpen] = useState(false);
  const [addressSheetOpen, setAddressSheetOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace('/(onboarding)/login' as Href);
      return;
    }
    hydrateCustomerFromUser(user);
    if (!useDeliveryLocationStore.getState().hydrated) {
      void hydrateDelivery();
    }
  }, [user, hydrateCustomerFromUser, hydrateDelivery]);

  useEffect(() => {
    if (!deliveryHydrated) return;
    void syncCheckoutDeliveryFromStores(addresses, queryClient);
  }, [deliveryHydrated, selectedAddressId, deliverySnapshot, addresses, queryClient]);

  useFocusEffect(
    useCallback(() => {
      if (!deliveryHydrated) return;
      void syncCheckoutDeliveryFromStores(addresses, queryClient);
    }, [deliveryHydrated, selectedAddressId, deliverySnapshot, addresses, queryClient]),
  );

  useFocusEffect(
    useCallback(() => {
      if (suppressEmptyCartExit) return;
      if (!isLoading && cart.items.length === 0 && cartItemCount === 0) {
        router.replace('/(app)/' as Href);
      }
    }, [suppressEmptyCartExit, cartItemCount, isLoading, cart.items.length]),
  );

  const isInstantCart = cart.fulfillmentType === 'instant';
  const addressReady = deliveryFormValid(delivery, isInstantCart);
  const customerReady = customerFormValid(customer);

  const addressLine = useMemo(() => {
    const parts = [delivery.address.trim(), delivery.pincode, delivery.cityName].filter(Boolean);
    return parts.join(', ');
  }, [delivery.address, delivery.pincode, delivery.cityName]);

  function goPayment() {
    if (!addressReady) {
      setAddressSheetOpen(true);
      return;
    }
    if (!customerReady) {
      setContactSheetOpen(true);
      return;
    }
    router.push('/(app)/checkout/payment' as Href);
  }

  const checkoutLoading =
    cart.items.length === 0 && (isLoading || (isFetching && cartItemCount > 0));

  if (checkoutLoading) {
    return <ConfirmBookingSkeleton onBack={onBack} />;
  }

  return (
    <Screen edges={['top', 'left', 'right']} gutter contentClassName="flex-1">
      <TabScreenTitle title="Confirm booking" showBack onBack={onBack} insetFromParentGutter />
      <SmoothScrollView
        className="flex-1"
        contentContainerClassName="gap-4 pb-4 pt-2"
        contentContainerStyle={{ paddingBottom: 132 + insets.bottom }}
        showsVerticalScrollIndicator={false}>
        {cart.items.map((item) => (
          <ConfirmProductCard
            key={item.id}
            item={item}
            scheduledAt={cart.scheduledAt}
            cityId={cart.cityId ?? delivery.cityId}
            pincode={cart.pincode ?? delivery.pincode}
            onEdit={() =>
              router.push({
                pathname: '/(app)/product/[id]',
                params: { id: item.productId },
              } as Href)
            }
            onRemove={() => {
              setRemovingLineId(item.id);
              void removeCartLine
                .mutateAsync(item.id)
                .catch(() => undefined)
                .finally(() => setRemovingLineId(null));
            }}
            removing={removingLineId === item.id}
          />
        ))}
        <ConfirmOfferRow
          cart={cart}
          onPress={() => router.push('/(app)/checkout/offers' as Href)}
        />
        <BillDetailsCard cart={cart} />
        <DeliveryAddressCard
          label={deliveryLabel}
          addressLine={addressLine}
          hasServiceableAddress={addressReady}
          onPress={() => setAddressSheetOpen(true)}
        />
      </SmoothScrollView>
      <View
        className="absolute inset-x-0 bottom-0 border-t border-border/60 bg-background px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        <Button className={PRIMARY_CTA_BUTTON_CLASS} disabled={!addressReady} onPress={goPayment}>
          <Text className={PRIMARY_CTA_BUTTON_TEXT_CLASS}>Proceed to pay</Text>
        </Button>
      </View>
      <CheckoutContactEditSheet
        visible={contactSheetOpen}
        value={customer}
        onChange={setCustomer}
        onClose={() => {
          setContactSheetOpen(false);
          if (customerFormValid(customer)) {
            router.push('/(app)/checkout/payment' as Href);
          }
        }}
      />
      <CheckoutAddressPickerSheet
        visible={addressSheetOpen}
        onClose={() => setAddressSheetOpen(false)}
      />
    </Screen>
  );
}
