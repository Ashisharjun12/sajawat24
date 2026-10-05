import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatPaise } from '@/lib/format-money';
import type { CartSnapshot } from '@/module/booking/lib/cart-types';
import { ChevronRight, TicketPercent } from 'lucide-react-native';
import { checkoutSectionShell } from '@/module/booking/lib/checkout-section-shell';
import { orderSavingsTextClass } from '@/lib/checkout-savings-styles';
import {
  couponOfferIconBadgeClass,
  couponOfferIconClass,
} from '@/module/promotions/lib/coupon-offer-styles';
import { cn } from '@/lib/utils';
import { View } from 'react-native';

type ConfirmOfferRowProps = {
  cart: CartSnapshot;
  onPress: () => void;
  fullBleed?: boolean;
};

export function ConfirmOfferRow({ cart, onPress, fullBleed = false }: ConfirmOfferRowProps) {
  const code = cart.appliedCoupon?.code;
  const discount = cart.discountPaise ?? 0;

  return (
    <ScalePressable
      pressScale={1}
      onPress={onPress}
      className={cn('flex-row items-center gap-3 p-4', checkoutSectionShell(!fullBleed))}>
      <View
        className={`size-10 items-center justify-center rounded-xl ${couponOfferIconBadgeClass}`}>
        <Icon as={TicketPercent} className={`size-5 ${couponOfferIconClass}`} />
      </View>
      <View className="min-w-0 flex-1">
        {code ? (
          <>
            <Text className="text-foreground text-base font-semibold">{code} applied</Text>
            {discount > 0 ? (
              <Text className={cn('mt-0.5 text-sm', orderSavingsTextClass)}>
                You&apos;ll save {formatPaise(discount)} on item total
              </Text>
            ) : null}
          </>
        ) : (
          <>
            <Text className="text-foreground text-base font-semibold">Apply offers</Text>
            <Text className="text-muted-foreground mt-0.5 text-sm">Coupons and promo codes</Text>
          </>
        )}
      </View>
      <Icon as={ChevronRight} className="text-muted-foreground size-5" />
    </ScalePressable>
  );
}
