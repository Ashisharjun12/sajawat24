import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { formatPaise } from '@/lib/format-money';
import type { PublicOrder } from '@/api/orders.api';
import { formatBookingSlot } from '@/module/account/lib/booking-ui';
import { HomeBottomSheetModal } from '@/module/home/components/HomeBottomSheetModal';
import { Image } from 'expo-image';
import { Clock, MapPin, Phone } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { View } from 'react-native';

const HERO_PLACEHOLDER =
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=480&fit=crop';

type Props = {
  visible: boolean;
  onClose: () => void;
  order: PublicOrder;
  onCompletePayment?: () => void;
};

export function OrderDetailsSheet({ visible, onClose, order, onCompletePayment }: Props) {
  return (
    <HomeBottomSheetModal
      visible={visible}
      onClose={onClose}
      closeAccessibilityLabel="Close details"
      sheetMinHeight={420}>
      <View className="max-h-[70vh] px-5">
      <Text className="text-foreground mb-1 text-lg font-bold">Order details</Text>
      <Text className="text-muted-foreground mb-4 font-mono text-xs">{order.reference}</Text>

      <View className="mb-4 rounded-2xl border border-border bg-muted/20 p-4">
        <Text className="text-muted-foreground text-xs">Amount</Text>
        <Text className="text-foreground text-2xl font-bold tabular-nums">
          {formatPaise(order.totalPaise)}
        </Text>
      </View>

      <View className="gap-4">
        <View className="flex-row gap-3">
          <Icon as={Clock} className="text-amber-700 size-5" />
          <View className="flex-1">
            <Text className="text-muted-foreground text-xs uppercase">Setup slot</Text>
            <Text className="text-foreground text-sm">{formatBookingSlot(order.scheduledAt)}</Text>
          </View>
        </View>
        <View className="flex-row gap-3">
          <Icon as={MapPin} className="text-rose-600 size-5" />
          <View className="flex-1">
            <Text className="text-muted-foreground text-xs uppercase">Delivery</Text>
            <Text className="text-foreground text-sm">{order.delivery.address}</Text>
            <Text className="text-muted-foreground text-sm">
              {[order.delivery.cityName, order.delivery.pincode].filter(Boolean).join(', ')}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-3">
          <Icon as={Phone} className="text-muted-foreground size-5" />
          <View className="flex-1">
            <Text className="text-muted-foreground text-xs uppercase">Contact</Text>
            <Text className="text-foreground text-sm">{order.customer.name}</Text>
            <Text className="text-muted-foreground text-sm">{order.customer.phone}</Text>
          </View>
        </View>
      </View>

      {order.items?.length ? (
        <View className="mt-5 gap-3">
          <Text className="text-foreground font-semibold">Items</Text>
          {order.items.map((item, index) => (
            <View key={`${item.productId}-${index}`} className="flex-row gap-3">
              <View className="size-14 overflow-hidden rounded-lg bg-muted">
                <Image
                  source={{ uri: item.imageUrl ?? HERO_PLACEHOLDER }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              </View>
              <View className="flex-1">
                <Text className="text-foreground text-sm font-medium">{item.name}</Text>
                <Text className="text-muted-foreground text-xs">Qty {item.quantity}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {order.status === 'PENDING_PAYMENT' && onCompletePayment ? (
        <Button className="mt-6 rounded-full" onPress={onCompletePayment}>
          <Text>Complete payment</Text>
        </Button>
      ) : null}
      </View>
    </HomeBottomSheetModal>
  );
}
