import { PressableScale } from '@/components/motion';
import { OpenInMapsChip } from '@/module/bookings/components/OpenInMapsChip';
import { Icon } from '@/components/ui/icon';
import {
  JobTrackingMap,
  type RouteSummary,
} from '@/module/bookings/components/JobTrackingMap';
import { X } from 'lucide-react-native';
import { Modal, View, type ReactNode } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  onClose: () => void;
  orderId: string;
  destination: { latitude: number; longitude: number } | null;
  vendor: { latitude: number; longitude: number } | null;
  onOpenMaps: () => void;
  onRouteLoaded?: (summary: RouteSummary | null) => void;
  footerActions: ReactNode;
};

export function TripMapFullscreenModal({
  visible,
  onClose,
  orderId,
  destination,
  vendor,
  onOpenMaps,
  onRouteLoaded,
  footerActions,
}: Props) {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, 8);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-background">
        <View className="relative min-h-0 flex-1">
          <JobTrackingMap
            orderId={orderId}
            layout="trip"
            destination={destination}
            vendor={vendor}
            followVendor
            refetchRouteOnMove
            onOpenExternalMaps={onOpenMaps}
            onRouteLoaded={onRouteLoaded}
          />
          <View
            className="absolute left-0 right-0 top-0 z-20 flex-row justify-end px-4"
            style={{ paddingTop: topInset }}
            pointerEvents="box-none">
            <PressableScale
              onPress={onClose}
              className="rounded-full border border-border bg-background p-2.5 shadow-md"
              accessibilityLabel="Close map">
              <Icon as={X} className="text-foreground size-6" />
            </PressableScale>
          </View>
          <OpenInMapsChip onPress={onOpenMaps} className="absolute bottom-4 left-4 z-20" />
        </View>
        <View
          className="border-t border-border/80 bg-background px-4 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          {footerActions}
        </View>
      </View>
    </Modal>
  );
}
