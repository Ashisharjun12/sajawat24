import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { TicketPercent } from 'lucide-react-native';
import { CouponOffersRail } from '@/module/promotions/components/CouponOffersRail';
import { useAvailableCoupons } from '@/module/promotions/hooks/use-available-coupons';
import { couponsForPdpDisplay } from '@/module/promotions/lib/pdp-coupon-display';
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
          <Skeleton className="h-[88px] w-[168px] rounded-2xl" />
          <Skeleton className="h-[88px] w-[168px] rounded-2xl" />
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
          <View className="size-8 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/40">
            <Icon as={TicketPercent} className="size-4 text-sky-600 dark:text-sky-400" />
          </View>
          <Text className="text-foreground text-base font-semibold">Available offers</Text>
        </View>
        <ScalePressable haptic onPress={onViewAll} accessibilityRole="button">
          <Text className="text-muted-foreground text-sm font-medium">View all</Text>
        </ScalePressable>
      </View>
      <Text className="text-muted-foreground -mt-1 text-xs">
        {visible.length} offer{visible.length === 1 ? '' : 's'} for this setup
      </Text>
      <CouponOffersRail coupons={visible} cardVariant="minimal" />
    </View>
  );
}
