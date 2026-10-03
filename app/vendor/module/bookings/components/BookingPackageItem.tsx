import { Text } from '@/components/ui/text';
import { AddonPriceText } from '@/module/bookings/components/AddonPriceText';
import { BookingItemImage } from '@/module/bookings/components/BookingItemImage';
import { formatInr } from '@/module/bookings/lib/booking-format';
import type { VendorJobItem } from '@/module/bookings/lib/booking.types';
import { View } from 'react-native';

type BookingPackageItemProps = {
  item: VendorJobItem;
  showLineTotal?: boolean;
};

export function BookingPackageItem({ item, showLineTotal = false }: BookingPackageItemProps) {
  const productTotalPaise = item.productPaise * item.quantity;

  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        <BookingItemImage uri={item.imageUrl} size={68} radius={14} />
        <View className="min-w-0 flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <Text className="text-foreground flex-1 text-[15px] font-semibold leading-5">
              {item.name}
            </Text>
            <Text className="text-foreground shrink-0 text-base font-bold">
              {formatInr(productTotalPaise)}
            </Text>
          </View>
          <Text className="text-muted-foreground mt-1 text-xs">Qty {item.quantity}</Text>
        </View>
      </View>

      {item.addons.map((addon) => (
        <View key={addon.id} className="flex-row items-center gap-3 pl-1">
          <BookingItemImage uri={addon.imageUrl} size={44} radius={10} />
          <View className="min-w-0 flex-1">
            <Text className="text-foreground text-sm font-medium">{addon.name}</Text>
            <Text className="text-muted-foreground mt-0.5 text-xs">Qty {addon.quantity}</Text>
          </View>
          <AddonPriceText
            pricePaise={addon.pricePaise}
            quantity={addon.quantity}
            className="text-sm"
            freeClassName="text-sm"
          />
        </View>
      ))}

      {showLineTotal ? (
        <View className="flex-row items-center justify-between border-t border-border/60 pt-3">
          <Text className="text-foreground text-sm font-semibold">Item total</Text>
          <Text className="text-foreground text-base font-bold">
            {formatInr(item.lineTotalPaise)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
