import { Text } from '@/components/ui/text';
import { formatPaise } from '@/lib/format-money';
import { CheckoutSavingsBanner } from '@/module/booking/components/checkout/CheckoutSavingsBanner';
import { checkoutSectionShell } from '@/module/booking/lib/checkout-section-shell';
import type { CartSnapshot } from '@/module/booking/lib/cart-types';
import { cn } from '@/lib/utils';
import { View } from 'react-native';

type BillDetailsCardProps = {
  cart: CartSnapshot;
  totalLabel?: string;
  fullBleed?: boolean;
};

export function BillDetailsCard({
  cart,
  totalLabel = 'To pay',
  fullBleed = false,
}: BillDetailsCardProps) {
  const subtotal = cart.subtotalPaise ?? 0;
  const discount = cart.discountPaise ?? 0;
  const total = cart.totalPaise ?? Math.max(0, subtotal - discount);
  const promoCode = cart.appliedCoupon?.code;

  return (
    <View className={cn('p-4', checkoutSectionShell(!fullBleed))}>
      <Text className="text-foreground mb-3 text-base font-semibold">Bill details</Text>
      <View className="gap-2.5">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="text-muted-foreground min-w-0 flex-1 text-sm">Item total</Text>
          <Text className="text-foreground shrink-0 text-sm font-medium tabular-nums">
            {formatPaise(subtotal)}
          </Text>
        </View>
        <View className="flex-row items-center justify-between gap-3">
          <Text className="text-muted-foreground min-w-0 flex-1 text-sm">Delivery</Text>
          <Text className="shrink-0 text-sm font-medium text-success">Free</Text>
        </View>
        {discount > 0 ? (
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-primary min-w-0 flex-1 text-sm" numberOfLines={1}>
              Coupon{promoCode ? ` (${promoCode})` : ''}
            </Text>
            <Text className="text-primary shrink-0 text-sm font-semibold tabular-nums">
              −{formatPaise(discount)}
            </Text>
          </View>
        ) : null}
        <CheckoutSavingsBanner savingsPaise={discount} variant="card" />
        <View className="mt-1 flex-row items-center justify-between gap-3 border-t border-border/60 pt-3">
          <Text className="text-foreground shrink-0 text-base font-semibold" numberOfLines={1}>
            {totalLabel}
          </Text>
          <Text className="text-foreground shrink-0 text-lg font-bold tabular-nums">
            {formatPaise(total)}
          </Text>
        </View>
      </View>
    </View>
  );
}
