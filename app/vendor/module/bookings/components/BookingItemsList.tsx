import { Surface } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { BookingPackageItem } from '@/module/bookings/components/BookingPackageItem';
import { formatInr } from '@/module/bookings/lib/booking-format';
import type { VendorJobItem } from '@/module/bookings/lib/booking.types';
import { Pressable, View } from 'react-native';

type BookingItemsListProps = {
  items: VendorJobItem[];
  subtotalPaise: number;
  onViewAll?: () => void;
};

export function BookingItemsList({ items, subtotalPaise, onViewAll }: BookingItemsListProps) {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-foreground text-base font-semibold">
          Package & items ({items.length})
        </Text>
        {onViewAll ? (
          <Pressable onPress={onViewAll} hitSlop={8}>
            <Text className="text-foreground text-sm font-bold">View all</Text>
          </Pressable>
        ) : null}
      </View>
      <Surface className="gap-0 p-0">
        {items.map((item, index) => (
          <Pressable
            key={item.id}
            onPress={onViewAll}
            className={`px-4 py-4 ${index < items.length - 1 ? 'border-b border-border' : ''}`}>
            <BookingPackageItem item={item} />
          </Pressable>
        ))}
        <View className="flex-row items-center justify-between border-t border-border bg-muted/30 px-4 py-3.5">
          <Text className="text-foreground text-sm font-semibold">Order value</Text>
          <Text className="text-foreground text-lg font-bold">{formatInr(subtotalPaise)}</Text>
        </View>
      </Surface>
    </View>
  );
}
