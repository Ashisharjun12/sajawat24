import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { TicketPercent } from 'lucide-react-native';
import { CouponOffersRail } from '@/module/promotions/components/CouponOffersRail';
import { useAvailableCoupons } from '@/module/promotions/hooks/use-available-coupons';
import { couponsForPdpDisplay } from '@/module/promotions/lib/pdp-coupon-display';
import {
  couponOfferIconBadgeClass,
  couponOfferIconClass,
} from '@/module/promotions/lib/coupon-offer-styles';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

/** "View all" link — same green as the PDP chips. */
const VIEW_ALL_GREEN_HEX = '#15803D';

type ProductPdpOffersProps = {
  productId?: string;
  categoryId?: string;
};

export function ProductPdpOffers({ productId, categoryId }: ProductPdpOffersProps) {
  const { coupons, isPending, isError, isEnabled } = useAvailableCoupons({
    productId,
    categoryId,
    scope: 'pdp',
  });

  const visible = useMemo(() => couponsForPdpDisplay(coupons), [coupons]);

  if (!isEnabled) return null;

  if (isPending) {
    return (
      <View className="gap-3">
        <Text className="text-foreground text-base font-semibold">Available offers</Text>
        <View className="flex-row gap-3">
          <Skeleton className="h-[96px] w-[240px] rounded-xl" />
          <Skeleton className="h-[96px] w-[240px] rounded-xl" />
        </View>
      </View>
    );
  }

  if (isError || visible.length === 0) return null;

  function onViewAll() {
    router.push({
      pathname: '/(app)/product/offers',
      params: {
        productId: productId ?? '',
        categoryId: categoryId ?? '',
      },
    });
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          <View
            className={`size-8 items-center justify-center rounded-lg ${couponOfferIconBadgeClass}`}>
            <Icon as={TicketPercent} className={`size-4 ${couponOfferIconClass}`} />
          </View>
          <Text className="text-foreground text-base font-semibold">Available offers</Text>
        </View>
        <ScalePressable haptic onPress={onViewAll} accessibilityRole="button">
          <Text className="text-sm font-semibold" style={{ color: VIEW_ALL_GREEN_HEX }}>
            View all
          </Text>
        </ScalePressable>
      </View>
      <CouponOffersRail coupons={visible} cardVariant="minimal" />
    </View>
  );
}
