import { ScalePressable, Screen, TabScreenTitle } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Href } from 'expo-router';
import type { CouponLike } from '@/module/booking/lib/coupon-preview';
import { CouponDetailSheet } from '@/module/promotions/components/CouponDetailSheet';
import { CouponOffersFilterSheet } from '@/module/promotions/components/CouponOffersFilterSheet';
import { CouponTicketCard } from '@/module/promotions/components/CouponTicketCard';
import { useAvailableCoupons } from '@/module/promotions/hooks/use-available-coupons';
import {
  couponOffersFilterLabel,
  filterCouponsByOffersFilter,
  type CouponOffersFilter,
} from '@/module/promotions/lib/coupon-offers-filter';
import { useLocalSearchParams } from 'expo-router';
import { ListFilter } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { CouponTicketListSkeleton } from '@/module/promotions/components/CouponTicketListSkeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { View } from 'react-native';

const PAGE_SIZE = 12;

export function OffersScreen() {
  const params = useLocalSearchParams<{ productId?: string; categoryId?: string }>();
  const productId = params.productId?.trim() || undefined;
  const categoryId = params.categoryId?.trim() || undefined;
  const showProductFilters = Boolean(productId && categoryId);
  const pdpFallbackHref = productId
    ? (`/(app)/product/${productId}` as Href)
    : undefined;

  const { coupons, isPending } = useAvailableCoupons({
    productId,
    categoryId,
    scope: 'city',
  });

  const [filter, setFilter] = useState<CouponOffersFilter>('all');
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<CouponLike | null>(null);

  useEffect(() => {
    setVisibleLimit(PAGE_SIZE);
  }, [filter]);

  const filteredCoupons = useMemo(
    () => filterCouponsByOffersFilter(coupons, filter),
    [coupons, filter],
  );

  const displayed = useMemo(
    () => filteredCoupons.slice(0, visibleLimit),
    [filteredCoupons, visibleLimit],
  );

  const canLoadMore = visibleLimit < filteredCoupons.length;

  function openCoupon(coupon: CouponLike) {
    setSelected(coupon);
    setSheetOpen(true);
  }

  return (
    <Screen edges={['top', 'left', 'right']} gutter contentClassName="pb-8">
      <TabScreenTitle
        title="Offers & coupons"
        showBack
        fallbackHref={pdpFallbackHref}
        backAccessibilityLabel="Go back"
        insetFromParentGutter
      />

      <View className="mt-3 flex-row items-center justify-between gap-3">
        {isPending ? (
          <Skeleton className="h-4 w-24 rounded-md" />
        ) : (
          <Text className="text-muted-foreground text-sm">
            {coupons.length > 0 ? `${filteredCoupons.length} offers` : ''}
          </Text>
        )}
        {showProductFilters && !isPending ? (
          <ScalePressable
            haptic
            onPress={() => setFilterOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Filter offers"
            className="flex-row items-center gap-1.5 rounded-full border border-border px-3 py-1.5">
            <Icon as={ListFilter} className="text-foreground size-4" />
            <Text className="text-foreground text-sm font-medium">
              {couponOffersFilterLabel(filter)}
            </Text>
          </ScalePressable>
        ) : showProductFilters && isPending ? (
          <Skeleton className="h-8 w-28 rounded-full" />
        ) : null}
      </View>

      {isPending ? (
        <View className="mt-6">
          <CouponTicketListSkeleton count={4} variant="ticket" />
        </View>
      ) : coupons.length === 0 ? (
        <View className="mt-10 rounded-3xl border border-dashed border-border px-6 py-14">
          <Text className="text-foreground text-center text-lg font-semibold">No offers right now</Text>
          <Text className="text-muted-foreground mt-2 text-center text-sm">
            Check back soon or try another city.
          </Text>
        </View>
      ) : filteredCoupons.length === 0 ? (
        <View className="mt-10 rounded-3xl border border-dashed border-border px-6 py-14">
          <Text className="text-foreground text-center text-lg font-semibold">
            No offers match this filter
          </Text>
        </View>
      ) : (
        <View className="mt-6 gap-3">
          {displayed.map((coupon, index) => (
            <CouponTicketCard
              key={String(coupon.code)}
              coupon={coupon}
              index={index}
              layout="stack"
              onPress={() => openCoupon(coupon)}
            />
          ))}
          {canLoadMore ? (
            <Button
              variant="outline"
              className="mt-1 rounded-xl"
              onPress={() => setVisibleLimit((v) => v + PAGE_SIZE)}>
              <Text>Load more</Text>
            </Button>
          ) : null}
        </View>
      )}

      <CouponOffersFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        value={filter}
        onChange={setFilter}
        showProductFilters={showProductFilters}
      />

      <CouponDetailSheet
        coupon={selected}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelected(null);
        }}
      />
    </Screen>
  );
}
