import { Text } from '@/components/ui/text';
import { TicketPercent } from 'lucide-react-native';
import { View } from 'react-native';
import { Icon } from '@/components/ui/icon';

type CouponOffersListProps = {
  coupons: Record<string, unknown>[];
  limit?: number;
};

function couponLabel(coupon: Record<string, unknown>) {
  const code = String(coupon.code ?? '').trim();
  const name = String(coupon.name ?? coupon.title ?? '').trim();
  const discount =
    String(coupon.discountLabel ?? coupon.description ?? '').trim() || 'Special offer';
  return { code, name, discount };
}

export function CouponOffersList({ coupons, limit }: CouponOffersListProps) {
  const visible = limit != null ? coupons.slice(0, limit) : coupons;
  if (visible.length === 0) return null;

  return (
    <View className="gap-0">
      {visible.map((coupon, index) => {
        const { code, name, discount } = couponLabel(coupon);
        if (!code) return null;
        return (
          <View
            key={code}
            className={`flex-row items-center gap-2.5 py-3 ${index > 0 ? 'border-t border-border/40' : ''}`}>
            <View className="bg-primary/25 flex size-9 shrink-0 items-center justify-center rounded-xl">
              <Icon as={TicketPercent} className="text-foreground size-4" />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-foreground text-sm font-semibold leading-tight">{discount}</Text>
              {name ? (
                <Text className="text-muted-foreground text-xs" numberOfLines={1}>{name}</Text>
              ) : null}
            </View>
            <View className="border-primary/45 bg-primary/10 shrink-0 rounded-lg border px-2 py-1">
              <Text className="text-foreground font-mono text-[11px] font-bold uppercase">
                {code}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
