import { Text } from '@/components/ui/text';
import { AddonPriceText } from '@/module/bookings/components/AddonPriceText';
import { BookingItemImage } from '@/module/bookings/components/BookingItemImage';
import type { VendorJobItemAddon } from '@/module/bookings/lib/booking.types';
import { View } from 'react-native';

type AddonCardProps = {
  addon: VendorJobItemAddon;
  imageSize?: number;
};

export function AddonCard({ addon, imageSize = 64 }: AddonCardProps) {
  return (
    <View className="gap-2 rounded-2xl border border-border/70 bg-background p-3">
      <BookingItemImage uri={addon.imageUrl} size={imageSize} radius={12} />
      <Text className="text-foreground text-sm font-medium">{addon.name}</Text>
      <AddonPriceText
        pricePaise={addon.pricePaise}
        quantity={addon.quantity}
        className="text-sm"
        freeClassName="text-sm"
      />
    </View>
  );
}
