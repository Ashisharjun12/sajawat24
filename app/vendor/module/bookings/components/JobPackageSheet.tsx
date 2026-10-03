import { Surface } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { BookingPackageItem } from '@/module/bookings/components/BookingPackageItem';
import { BookingItemImage } from '@/module/bookings/components/BookingItemImage';
import { formatInr } from '@/module/bookings/lib/booking-format';
import type { VendorJobItem } from '@/module/bookings/lib/booking.types';
import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type JobPackageSheetProps = {
  open: boolean;
  onClose: () => void;
  items: VendorJobItem[];
  subtotalPaise: number;
};

export function JobPackageSheet({ open, onClose, items, subtotalPaise }: JobPackageSheetProps) {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const active = items[activeIndex] ?? items[0];

  useEffect(() => {
    if (open) {
      setActiveIndex(0);
    }
  }, [open]);

  if (!active) return null;

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View
        className="max-h-[85%] rounded-t-3xl bg-background px-5 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-foreground text-lg font-semibold">Package details</Text>
          <Pressable onPress={onClose} className="rounded-full bg-muted p-2">
            <X size={18} className="text-foreground" />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <BookingItemImage uri={active.imageUrl} width="100%" height={208} radius={16} />

          {items.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 mt-4">
              <View className="flex-row gap-2">
                {items.map((item, index) => (
                  <Pressable
                    key={item.id}
                    onPress={() => setActiveIndex(index)}
                    className={`rounded-full px-3 py-1.5 ${index === activeIndex ? 'bg-primary' : 'bg-muted'}`}>
                    <Text
                      className={`text-xs font-medium ${index === activeIndex ? 'text-primary-foreground' : 'text-foreground'}`}>
                      {item.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          ) : (
            <View className="mt-4" />
          )}

          <Surface className="mt-2 p-4">
            <BookingPackageItem item={active} showLineTotal />
          </Surface>

          <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-muted/40 px-4 py-3.5">
            <Text className="text-foreground text-sm font-semibold">Order value</Text>
            <Text className="text-foreground text-xl font-bold">{formatInr(subtotalPaise)}</Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
