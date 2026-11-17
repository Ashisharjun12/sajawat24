import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { TicketPercent } from 'lucide-react-native';
import { ViewAllButton } from '@/module/catalog/components/ViewAllButton';
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
        <ViewAllButton onPress={onViewAll} accessibilityLabel="View all offers" />
      </View>
      <CouponOffersRail coupons={visible} cardVariant="minimal" />
    </View>
  );
}
