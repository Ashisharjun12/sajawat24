import { getApiError } from '@/api/client';
import { Screen, SmoothScrollView, TabScreenTitle } from '@/components/shell';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useGoBack } from '@/lib/use-go-back';
import { isBackendCityId } from '@/lib/location-label';
import { useCartData, useCartMutations, useCartQuery } from '@/module/booking/hooks/use-cart-query';
import { couponRequiresCity } from '@/module/booking/lib/coupon-eligibility';
import {
  buildCouponPreviewFromApplied,
  type CouponLike,
} from '@/module/booking/lib/coupon-preview';
import { listAvailableCouponsForLocation } from '@/module/promotions/lib/coupons-location';
import { resolveCouponCode } from '@/module/promotions/lib/pdp-coupon-display';
import { useAuthStore } from '@/store/auth.store';
import { useCheckoutStore } from '@/store/checkout.store';
import { useQuery } from '@tanstack/react-query';
import { TicketPercent } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { type Href, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const APPLIED_BACK_DELAY_MS = 1600;

function couponTitle(c: CouponLike) {
  const preview = buildCouponPreviewFromApplied(c);
  if (preview?.discount) return preview.discount;
  return c.title || c.name || c.code || 'Offer';
}

function couponSubtitle(c: CouponLike) {
  const preview = buildCouponPreviewFromApplied(c);
  return preview?.subtitle || c.description || 'Tap to apply';
}

export function CheckoutOffersScreen() {
  const user = useAuthStore((s) => s.user);
  const onBack = useGoBack();
  const insets = useSafeAreaInsets();
  const { cart } = useCartData();
  useCartQuery(Boolean(user));
  const delivery = useCheckoutStore((s) => s.delivery);
  const { applyCoupon, clearCoupon } = useCartMutations();

  const cityId =
    (delivery.cityId && isBackendCityId(delivery.cityId) ? delivery.cityId : null) ||
    (cart.cityId && isBackendCityId(cart.cityId) ? cart.cityId : null);
  const pincode =
    delivery.pincode.replace(/\D/g, '').slice(0, 6) ||
    cart.pincode?.replace(/\D/g, '').slice(0, 6) ||
    undefined;

  const [code, setCode] = useState(cart.appliedCoupon?.code ?? '');
  const backTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (backTimerRef.current) clearTimeout(backTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!user) router.replace('/(onboarding)/login' as Href);
  }, [user]);

  useEffect(() => {
    if (cart.appliedCoupon?.code) setCode(cart.appliedCoupon.code);
  }, [cart.appliedCoupon?.code]);

  const needsCity = couponRequiresCity(cart);
  const applying = applyCoupon.isPending || clearCoupon.isPending;

  const couponsQuery = useQuery({
    queryKey: ['checkout-offers', cityId, pincode],
    queryFn: async () => {
      const data = await listAvailableCouponsForLocation({
        scope: 'city',
        cityId: cityId ?? undefined,
        pincode,
      });
      const payload = data as { items?: CouponLike[] };
      return Array.isArray(payload?.items) ? payload.items : [];
    },
    enabled: Boolean(cityId || pincode),
    staleTime: 60_000,
  });

  function scheduleReturnToCheckout() {
    if (backTimerRef.current) clearTimeout(backTimerRef.current);
    backTimerRef.current = setTimeout(() => {
      backTimerRef.current = null;
      router.back();
    }, APPLIED_BACK_DELAY_MS);
  }

  async function onApplyCode() {
    const trimmed = code.trim();
    if (!trimmed) return;
    try {
      await applyCoupon.mutateAsync(trimmed);
      scheduleReturnToCheckout();
    } catch (e) {
      Alert.alert('Promo failed', getApiError(e));
    }
  }

  async function onApplyListed(coupon: CouponLike) {
    const cCode = resolveCouponCode(coupon) || coupon.code?.trim();
    if (!cCode) return;
    try {
      await applyCoupon.mutateAsync(cCode);
      scheduleReturnToCheckout();
    } catch (e) {
      Alert.alert('Could not apply', getApiError(e));
    }
  }

  const coupons = couponsQuery.data ?? [];
  const appliedCode = cart.appliedCoupon?.code;

  return (
    <Screen edges={['top', 'left', 'right']} gutter contentClassName="flex-1">
      <TabScreenTitle
        title="Save more with coupons"
        showBack
        onBack={onBack}
        insetFromParentGutter
      />
      <SmoothScrollView
        className="flex-1"
        contentContainerClassName="gap-4 pb-6 pt-2"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View className="flex-row items-center gap-2 rounded-2xl border border-border bg-card px-3 py-1">
          <Input
            className="flex-1 border-0 bg-transparent shadow-none"
            placeholder="Enter coupon code"
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
            editable={!needsCity && !applying}
          />
          <Pressable
            disabled={applying || needsCity || !code.trim()}
            onPress={() => void onApplyCode()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Add coupon">
            <Text
              className={
                applying || needsCity || !code.trim()
                  ? 'text-muted-foreground text-sm font-semibold'
                  : 'text-foreground text-sm font-bold'
              }>
              Add Coupon
            </Text>
          </Pressable>
        </View>

        {needsCity ? (
          <Text className="text-muted-foreground text-xs">Select a delivery address to apply coupons.</Text>
        ) : null}

        {appliedCode ? (
          <Pressable
            onPress={() => {
              if (backTimerRef.current) {
                clearTimeout(backTimerRef.current);
                backTimerRef.current = null;
              }
              void clearCoupon.mutateAsync().then(() => setCode(''));
            }}
            disabled={applying}
            className="flex-row items-center justify-between rounded-2xl border border-emerald-500/40 bg-emerald-50 px-4 py-3 dark:bg-emerald-950/35">
            <Text className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              {appliedCode} applied
            </Text>
            <Text className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Remove</Text>
          </Pressable>
        ) : null}

        {!cityId && !pincode ? (
          <Text className="text-muted-foreground text-sm">Select an address to see coupons.</Text>
        ) : couponsQuery.isPending ? (
          <ActivityIndicator className="py-8" />
        ) : coupons.length === 0 ? (
          <View className="items-center rounded-2xl bg-muted/40 px-6 py-10">
            <View className="size-16 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/40">
              <Icon as={TicketPercent} className="size-8 text-sky-600 dark:text-sky-400" />
            </View>
            <Text className="text-foreground mt-4 text-center text-base font-semibold">
              No best coupons available
            </Text>
            <Text className="text-muted-foreground mt-1 text-center text-sm">
              Try a promo code above or check back later.
            </Text>
          </View>
        ) : (
          <View className="gap-2.5">
            {coupons.map((c) => {
              const cCode = resolveCouponCode(c) || c.code?.trim();
              if (!cCode) return null;
              const isApplied = appliedCode === cCode;
              return (
                <Pressable
                  key={cCode}
                  disabled={applying || isApplied}
                  onPress={() => void onApplyListed(c)}
                  className={cn(
                    'flex-row items-center gap-3 rounded-2xl border px-4 py-3.5 active:opacity-80',
                    isApplied
                      ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/35'
                      : 'border-border bg-card',
                  )}>
                  <View className="size-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/40">
                    <Icon as={TicketPercent} className="size-5 text-sky-600 dark:text-sky-400" />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="text-foreground text-sm font-semibold">{couponTitle(c)}</Text>
                    <Text className="text-muted-foreground mt-0.5 text-xs" numberOfLines={2}>
                      {couponSubtitle(c)}
                    </Text>
                    <Text className="text-foreground mt-1.5 text-xs font-bold tracking-wide">{cCode}</Text>
                  </View>
                  <Text
                    className={cn(
                      'text-xs font-bold',
                      isApplied
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-muted-foreground font-semibold',
                    )}>
                    {isApplied ? 'Applied' : 'Apply'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </SmoothScrollView>
    </Screen>
  );
}
