import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatPaise } from '@/lib/format-money';
import type { CartSnapshot } from '@/module/booking/lib/cart-types';
import { ChevronRight, TicketPercent } from 'lucide-react-native';
import { View } from 'react-native';

type ConfirmOfferRowProps = {
  cart: CartSnapshot;
  onPress: () => void;
};

export function ConfirmOfferRow({ cart, onPress }: ConfirmOfferRowProps) {
  const code = cart.appliedCoupon?.code;
  const discount = cart.discountPaise ?? 0;

  return (
    <ScalePressable
      pressScale={1}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <View className="size-10 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/40">
        <Icon as={TicketPercent} className="size-5 text-sky-600 dark:text-sky-400" />
      </View>
      <View className="min-w-0 flex-1">
        {code ? (
          <>
            <Text className="text-foreground text-base font-semibold">{code} applied</Text>
            {discount > 0 ? (
              <Text className="text-emerald-600 mt-0.5 text-sm font-medium">
                You save {formatPaise(discount)} on item total
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
