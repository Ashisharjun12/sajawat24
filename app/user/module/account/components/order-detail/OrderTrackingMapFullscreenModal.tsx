import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import type { PublicOrder } from '@/api/orders.api';
import { OrderTrackingMap } from '@/module/account/components/order-detail/OrderTrackingMap';
import { X } from 'lucide-react-native';
import { Modal, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  onClose: () => void;
  order: PublicOrder;
};

export function OrderTrackingMapFullscreenModal({ visible, onClose, order }: Props) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, 8);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-background">
        <View className="relative min-h-0 flex-1">
          <OrderTrackingMap order={order} className="flex-1" layout="fullscreen" />
          <View
            className="absolute left-0 right-0 top-0 z-20 flex-row justify-end px-4"
            style={{ paddingTop: topInset }}
            pointerEvents="box-none">
            <ScalePressable
              haptic
              onPress={onClose}
              className="rounded-full border border-border bg-background p-2.5 shadow-md"
              accessibilityLabel="Close map">
              <Icon as={X} className="text-foreground size-6" />
            </ScalePressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
