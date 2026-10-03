import type { CouponLike } from '@/module/booking/lib/coupon-preview';
import { CouponDetailSheet } from '@/module/promotions/components/CouponDetailSheet';
import { CouponTicketCard } from '@/module/promotions/components/CouponTicketCard';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

export const PDP_COUPON_PREVIEW_LIMIT = 8;

type CouponOffersRailProps = {
  coupons: CouponLike[];
  limit?: number;
  cardVariant?: 'ticket' | 'minimal';
};

export function CouponOffersRail({
  coupons,
  limit = PDP_COUPON_PREVIEW_LIMIT,
  cardVariant = 'ticket',
}: CouponOffersRailProps) {
  const visible = coupons.slice(0, limit);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<CouponLike | null>(null);

  function openCoupon(coupon: CouponLike) {
    setSelected(coupon);
    setSheetOpen(true);
  }

  if (visible.length === 0) return null;

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="pr-1">
        {visible.map((coupon, index) => (
          <CouponTicketCard
            key={String(coupon.code)}
            coupon={coupon}
            index={index}
            variant={cardVariant}
            onPress={() => openCoupon(coupon)}
          />
        ))}
      </ScrollView>

      <CouponDetailSheet
        coupon={selected}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelected(null);
        }}
      />
    </View>
  );
}
