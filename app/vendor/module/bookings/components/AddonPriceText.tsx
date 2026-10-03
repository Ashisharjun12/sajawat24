import { Text } from '@/components/ui/text';
import {
  addonLineTotalPaise,
  formatInr,
  isFreeAddon,
} from '@/module/bookings/lib/booking-format';
import { cn } from '@/lib/utils';

type AddonPriceTextProps = {
  pricePaise: number;
  quantity: number;
  className?: string;
  freeClassName?: string;
};

export function AddonPriceText({
  pricePaise,
  quantity,
  className,
  freeClassName,
}: AddonPriceTextProps) {
  const free = isFreeAddon(pricePaise, quantity);

  if (free) {
    return (
      <Text className={cn('font-semibold text-emerald-600', freeClassName ?? 'text-sm')}>
        Free
      </Text>
    );
  }

  return (
    <Text className={cn('font-semibold text-foreground', className ?? 'text-sm')}>
      {formatInr(addonLineTotalPaise(pricePaise, quantity))}
    </Text>
  );
}
