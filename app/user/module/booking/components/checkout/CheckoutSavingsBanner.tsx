import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { formatPaise } from '@/lib/format-money';
import {
  orderSavingsBadgeClass,
  orderSavingsBadgeLabelClass,
  orderSavingsBandClass,
  orderSavingsTextClass,
} from '@/lib/checkout-savings-styles';
import { View } from 'react-native';

type CheckoutSavingsBannerProps = {
  savingsPaise: number;
  /** Full-width strip on sticky bar; inset rounded block in bill card. */
  variant?: 'strip' | 'card';
};

export function CheckoutSavingsBanner({
  savingsPaise,
  variant = 'strip',
}: CheckoutSavingsBannerProps) {
  if (savingsPaise <= 0) return null;

  const amount = formatPaise(savingsPaise);
  const isCard = variant === 'card';

  return (
    <View
      className={cn(
        orderSavingsBandClass,
        isCard ? 'mt-2 rounded-xl px-3 py-2.5' : 'px-4 py-2.5',
      )}>
      <View className="flex-row items-center gap-2.5">
        <View className={orderSavingsBadgeClass}>
          <Text className={orderSavingsBadgeLabelClass}>%</Text>
        </View>
        <Text className={cn('min-w-0 flex-1 text-sm', orderSavingsTextClass)}>
          You&apos;ll save{' '}
          <Text className="text-success text-sm font-bold">{amount}</Text> on this order
        </Text>
      </View>
    </View>
  );
}
