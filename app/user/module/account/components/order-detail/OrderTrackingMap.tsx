import { AppSpinner } from '@/components/ui/app-spinner';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { type OrderStatus, type PublicOrder } from '@/api/orders.api';
import { useOrderTrackingQuery } from '@/module/account/hooks/use-order-tracking-query';
import { useOrderTripRoute } from '@/module/account/hooks/use-order-trip-route';
import { OrderTrackingMapFullscreenModal } from '@/module/account/components/order-detail/OrderTrackingMapFullscreenModal';
import { MapExpandChip, OpenInMapsChip } from '@/module/booking/components/OpenInMapsChip';
import { openGoogleMapsTrip } from '@/module/booking/lib/open-google-maps-trip';
import {
  OlaTrackingMapView,
  type TrackingMapMarker,
} from '@/module/geo/components/OlaTrackingMapView';
import { useMapsSdkConfig } from '@/module/geo/hooks/use-maps-sdk-config';
import { Maximize2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

const DEFAULT_CENTER = { latitude: 28.6139, longitude: 77.209 };

type Props = {
  order: PublicOrder;
  className?: string;
  /** `fullscreen` hides expand control (used inside expand modal). */
  layout?: 'embedded' | 'fullscreen';
};

export function OrderTrackingMap({ order, className, layout = 'embedded' }: Props) {
  const { config, loading, error, retry } = useMapsSdkConfig();
  const { data: tracking, isLoading: trackingLoading } = useOrderTrackingQuery(
    order.id,
    order.status as OrderStatus,
    true,
  );
  const [mapFullscreen, setMapFullscreen] = useState(false);

  const destination = tracking?.destination;
  const vendor = tracking?.vendor;

  const vendorLat = vendor?.latitude ?? null;
  const vendorLng = vendor?.longitude ?? null;
  const hasVendorCoords = vendorLat != null && vendorLng != null;

  const routeEnabled =
    order.status === 'EN_ROUTE' && destination != null && hasVendorCoords;

  const { displayRouteCoords, fallbackLine } = useOrderTripRoute({
    orderId: order.id,
    enabled: routeEnabled,
    vendorLat,
    vendorLng,
    destination,
  });

  const showLivePill =
    order.status === 'EN_ROUTE' &&
    tracking?.liveTrackingEnabled &&
    hasVendorCoords &&
    !vendor?.stale;

  const markers = useMemo((): TrackingMapMarker[] => {
    const list: TrackingMapMarker[] = [];
    if (destination) {
      list.push({
        id: 'destination',
        latitude: destination.latitude,
        longitude: destination.longitude,
        variant: 'customer',
      });
    }
    if (order.status === 'EN_ROUTE' && hasVendorCoords) {
      list.push({
        id: 'vendor',
        latitude: vendorLat!,
        longitude: vendorLng!,
        variant: 'worker',
      });
    }
    return list;
  }, [destination, order.status, hasVendorCoords, vendorLat, vendorLng]);

  const centerFallback = destination ?? DEFAULT_CENTER;

  const statusHint =
    order.status === 'ASSIGNED'
      ? 'Decorator assigned — live map when they are on the way'
      : order.status === 'ON_SITE'
        ? 'Your decorator has arrived at your location'
        : vendor?.stale && order.status === 'EN_ROUTE'
          ? 'Location updating…'
          : !tracking?.liveTrackingEnabled && order.status === 'EN_ROUTE'
            ? 'Live map unavailable'
            : null;

  const showExpand = layout === 'embedded';

  if (loading || trackingLoading) {
    return (
      <View className={`items-center justify-center bg-muted ${className ?? 'flex-1'}`}>
        <AppSpinner />
      </View>
    );
  }

  if (error || !config) {
    return (
      <View className={`items-center justify-center gap-2 bg-muted px-6 ${className ?? 'flex-1'}`}>
        <Text className="text-muted-foreground text-center text-sm">Map could not load.</Text>
        <Text className="text-primary text-sm font-semibold" onPress={() => void retry()}>
          Retry
        </Text>
      </View>
    );
  }

  if (!destination) {
    return (
      <View className={`justify-end bg-muted px-4 pb-4 ${className ?? 'flex-1'}`}>
        <Text className="text-muted-foreground text-sm">
          Map unavailable — your delivery address is on file below.
        </Text>
      </View>
    );
  }

  return (
    <View className={className ?? 'flex-1'}>
      <OlaTrackingMapView
        sdkConfig={config}
        markers={markers}
        centerFallback={centerFallback}
        routeCoordinates={displayRouteCoords}
        fallbackLine={fallbackLine}
      />
      {tracking ? (
        <OpenInMapsChip
          onPress={() => openGoogleMapsTrip(tracking)}
          className="absolute bottom-3 left-3 z-10"
        />
      ) : null}
      {showLivePill ? (
        <View
          className="absolute left-3 top-3 rounded-full bg-background/95 px-3 py-1.5 shadow-sm"
          pointerEvents="none">
          <Text className="text-foreground text-xs font-semibold">Live tracking</Text>
        </View>
      ) : null}
      {statusHint ? (
        <View className="absolute right-3 top-3 max-w-[58%] rounded-xl bg-background/95 px-3 py-2">
          <Text className="text-muted-foreground text-xs leading-snug">{statusHint}</Text>
        </View>
      ) : null}
      {showExpand ? (
        <MapExpandChip
          onPress={() => setMapFullscreen(true)}
          className="absolute bottom-3 right-3 z-10">
          <Icon as={Maximize2} className="text-foreground size-4" />
        </MapExpandChip>
      ) : null}
      {showExpand ? (
        <OrderTrackingMapFullscreenModal
          visible={mapFullscreen}
          onClose={() => setMapFullscreen(false)}
          order={order}
        />
      ) : null}
    </View>
  );
}
