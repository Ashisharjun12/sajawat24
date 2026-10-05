import { Screen, TabScreenTitle } from '@/components/shell';
import { SmoothScrollView } from '@/components/shell/SmoothScrollView';
import { useGoBack } from '@/lib/use-go-back';
import {
  CheckoutProceedBar,
  checkoutProceedBarScrollPad,
} from '@/module/booking/components/checkout/CheckoutProceedBar';
import { CheckoutAddressPickerSheet } from '@/module/booking/components/checkout/CheckoutAddressPickerSheet';
import { BillDetailsCard } from '@/module/booking/components/checkout/BillDetailsCard';
import { CheckoutContactEditSheet } from '@/module/booking/components/checkout/CheckoutContactEditSheet';
import { ConfirmOfferRow } from '@/module/booking/components/checkout/ConfirmOfferRow';
import { ConfirmBookingSkeleton } from '@/module/booking/components/checkout/ConfirmBookingSkeleton';
import { ConfirmProductCard } from '@/module/booking/components/checkout/ConfirmProductCard';
import { CheckoutSuggestedAddonsRail } from '@/module/booking/components/checkout/CheckoutSuggestedAddonsRail';
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
import { getProductForCatalogLocation } from '@/lib/catalog-location';
import { isBackendCityId } from '@/lib/location-label';
import { useCheckoutLineAddons } from '@/module/booking/hooks/use-checkout-line-addons';
import type { CatalogProductDetail } from '@/module/catalog/lib/product-detail';
import { useQuery } from '@tanstack/react-query';
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

  const subtotalPaise = cart.subtotalPaise ?? 0;
  const discountPaise = cart.discountPaise ?? 0;
  const totalPaise = cart.totalPaise ?? Math.max(0, subtotalPaise - discountPaise);
  const scrollPad = checkoutProceedBarScrollPad(insets.bottom, discountPaise > 0);

  const checkoutLoading =
    cart.items.length === 0 && (isLoading || (isFetching && cartItemCount > 0));

  const primaryLine = cart.items[0];
  const checkoutCityId =
    (cart.cityId && isBackendCityId(cart.cityId) ? cart.cityId : null) ||
    (delivery.cityId && isBackendCityId(delivery.cityId) ? delivery.cityId : null);
  const checkoutPincode =
    cart.pincode?.replace(/\D/g, '').slice(0, 6) ||
    delivery.pincode.replace(/\D/g, '').slice(0, 6) ||
    undefined;

  const checkoutProductQuery = useQuery({
    queryKey: ['checkout-line-product', primaryLine?.productId, checkoutCityId, checkoutPincode],
    queryFn: async () =>
      (await getProductForCatalogLocation(primaryLine!.productId, {
        cityId: checkoutCityId ?? undefined,
        pincode: checkoutPincode,
      })) as CatalogProductDetail,
    enabled: Boolean(primaryLine?.productId) && Boolean(checkoutCityId || checkoutPincode),
    staleTime: 120_000,
  });

  const catalogAddons = checkoutProductQuery.data?.addons ?? [];

  const lineAddons = useCheckoutLineAddons({
    item:
      primaryLine ?? {
        id: '',
        productId: '',
        name: '',
        quantity: 1,
        lineTotalPaise: 0,
      },
    cart,
    catalogAddons,
  });

  if (checkoutLoading) {
    return <ConfirmBookingSkeleton onBack={onBack} />;
  }

  return (
    <Screen scroll={false} edges={['left', 'right']} contentClassName="flex-1 bg-bg">
      <TabScreenTitle title="Confirm booking" tone="primary" showBack onBack={onBack} />
      <SmoothScrollView
        className="flex-1 bg-bg"
        contentContainerClassName="pb-4"
        contentContainerStyle={{ paddingBottom: scrollPad }}
        showsVerticalScrollIndicator={false}>
        {cart.items.map((item, index) => (
          <ConfirmProductCard
            key={item.id}
            fullBleed
            item={item}
            lineAddons={index === 0 ? lineAddons : undefined}
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
        {primaryLine ? (
          <CheckoutSuggestedAddonsRail
            fullBleed
            item={primaryLine}
            cart={cart}
            lineAddons={lineAddons}
            catalogAddons={catalogAddons}
          />
        ) : null}
        <ConfirmOfferRow
          fullBleed
          cart={cart}
          onPress={() => router.push('/(app)/checkout/offers' as Href)}
        />
        <BillDetailsCard fullBleed cart={cart} />
        <DeliveryAddressCard
          fullBleed
          label={deliveryLabel}
          addressLine={addressLine}
          hasServiceableAddress={addressReady}
          onPress={() => setAddressSheetOpen(true)}
        />
      </SmoothScrollView>
      <CheckoutProceedBar
        subtotalPaise={subtotalPaise}
        discountPaise={discountPaise}
        totalPaise={totalPaise}
        ctaLabel="Proceed to pay"
        disabled={!addressReady}
        onPress={goPayment}
      />
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
        cartCityId={cart.cityId ?? delivery.cityId}
      />
    </Screen>
  );
}
