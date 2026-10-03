import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { HomeBottomSheetModal } from '@/module/home/components/HomeBottomSheetModal';
import {
  COUPON_OFFERS_FILTER_OPTIONS,
  type CouponOffersFilter,
} from '@/module/promotions/lib/coupon-offers-filter';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react-native';
import { View } from 'react-native';

type CouponOffersFilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: CouponOffersFilter;
  onChange: (value: CouponOffersFilter) => void;
  showProductFilters: boolean;
};

export function CouponOffersFilterSheet({
  open,
  onOpenChange,
  value,
  onChange,
  showProductFilters,
}: CouponOffersFilterSheetProps) {
  const options = COUPON_OFFERS_FILTER_OPTIONS.filter(
    (o) => !o.productOnly || showProductFilters,
  );

  function select(next: CouponOffersFilter) {
    onChange(next);
    onOpenChange(false);
  }

  return (
    <HomeBottomSheetModal
      visible={open}
      onClose={() => onOpenChange(false)}
      closeAccessibilityLabel="Close filter">
      <View className="px-5 pt-5">
        <Text className="text-foreground text-lg font-semibold tracking-tight">Filter offers</Text>
        <View className="mt-4 gap-1">
          {options.map((option) => {
            const selected = value === option.value;
            return (
              <ScalePressable
                key={option.value}
                haptic
                onPress={() => select(option.value)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className={cn(
                  'flex-row items-center justify-between rounded-xl px-3 py-3.5',
                  selected && 'bg-muted',
                )}>
                <Text className={cn('text-base', selected ? 'text-foreground font-semibold' : 'text-foreground')}>
                  {option.label}
                </Text>
                {selected ? <Icon as={Check} className="text-foreground size-5" /> : null}
              </ScalePressable>
            );
          })}
        </View>
      </View>
    </HomeBottomSheetModal>
  );
}
