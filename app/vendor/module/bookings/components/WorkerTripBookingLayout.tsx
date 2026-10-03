import { PressableScale } from '@/components/motion';
import { Surface } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { BookingItemsList } from '@/module/bookings/components/BookingItemsList';
import { BookingStatusBadge } from '@/module/bookings/components/BookingStatusBadge';
import {
  JobTrackingMap,
  type RouteSummary,
} from '@/module/bookings/components/JobTrackingMap';
import { TripMapFullscreenModal } from '@/module/bookings/components/TripMapFullscreenModal';
import { TripScreenTabs, type TripScreenTab } from '@/module/bookings/components/TripScreenTabs';
import { formatRouteSummary } from '@/module/bookings/lib/format-route-summary';
import { MapExpandChip, OpenInMapsChip } from '@/module/bookings/components/OpenInMapsChip';
import type { BookingStatus, VendorJobItem } from '@/module/bookings/lib/booking.types';
import { formatInr } from '@/module/bookings/lib/booking-format';
import { Href, router } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Maximize2,
  MessageCircle,
  Phone,
  User,
} from 'lucide-react-native';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { BackHandler, Linking, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  orderId: string;
  orderRef: string;
  packageName: string;
  status: BookingStatus;
  customerName: string;
  customerPhone: string | null;
  addressLine: string;
  cityPinLine: string;
  slotLabel?: string;
  paymentLabel: string;
  items: VendorJobItem[];
  subtotalPaise: number;
  onViewPackage?: () => void;
  packageOpen?: boolean;
  onPackageClose?: () => void;
  canChat: boolean;
  destination: { latitude: number; longitude: number } | null;
  vendorFix: { latitude: number; longitude: number } | null;
  followVendor: boolean;
  showMap?: boolean;
  onOpenMaps: () => void;
  actions: ReactNode;
};

export function WorkerTripBookingLayout({
  orderId,
  orderRef,
  packageName,
  status,
  customerName,
  customerPhone,
  addressLine,
  cityPinLine,
  slotLabel,
  paymentLabel,
  items,
  subtotalPaise,
  onViewPackage,
  packageOpen = false,
  onPackageClose,
  canChat,
  destination,
  vendorFix,
  followVendor,
  showMap = true,
  onOpenMaps,
  actions,
}: Props) {
  const insets = useSafeAreaInsets();
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [tab, setTab] = useState<TripScreenTab>('onTheWay');
  const [mapFullscreen, setMapFullscreen] = useState(false);

  useEffect(() => {
    if (!showMap) setMapFullscreen(false);
  }, [showMap]);

  const headerSummary =
    routeSummary != null
      ? formatRouteSummary(routeSummary.distanceMeters, routeSummary.durationSeconds) +
        (routeSummary.isEstimate ? ' (est.)' : '')
      : null;

  const onTripBack = useCallback(() => {
    if (packageOpen) {
      onPackageClose?.();
      return;
    }
    if (mapFullscreen) {
      setMapFullscreen(false);
      return;
    }
    if (tab === 'orderDetails') {
      setTab('onTheWay');
      return;
    }
    router.back();
  }, [packageOpen, onPackageClose, mapFullscreen, tab]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (packageOpen) {
        onPackageClose?.();
        return true;
      }
      if (mapFullscreen) {
        setMapFullscreen(false);
        return true;
      }
      if (tab === 'orderDetails') {
        setTab('onTheWay');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [packageOpen, onPackageClose, mapFullscreen, tab]);

  const backLabel = tab === 'orderDetails' ? 'Trip map' : 'Back';

  const packageButton = onViewPackage ? (
    <PressableScale
      onPress={onViewPackage}
      className="items-center rounded-full border border-amber-400 bg-primary py-3.5">
      <Text className="text-sm font-bold text-[#1A1A1A]">Open package with photos</Text>
    </PressableScale>
  ) : null;

  return (
    <View className="flex-1 bg-background">
      <View
        className="z-10 bg-background px-4"
        style={{ paddingTop: Math.max(insets.top, 8) }}>
        <View className="flex-row items-center justify-between gap-3 pb-2">
          <PressableScale onPress={onTripBack} className="flex-row items-center gap-2">
            <Icon as={ArrowLeft} className="text-foreground size-5" />
            <Text className="text-foreground text-sm font-medium">{backLabel}</Text>
          </PressableScale>
          {headerSummary ? (
            <Text className="text-muted-foreground text-xs font-medium">{headerSummary}</Text>
          ) : (
            <View className="w-8" />
          )}
          {canChat ? (
            <PressableScale
              className="flex-row items-center gap-1.5 rounded-full border border-amber-400 bg-primary px-3.5 py-2"
              onPress={() => router.push(`/(app)/bookings/${orderId}/chat` as Href)}>
              <Icon as={MessageCircle} className="size-4 text-[#1A1A1A]" />
              <Text className="text-sm font-bold text-[#1A1A1A]">Chat</Text>
            </PressableScale>
          ) : (
            <View className="w-16" />
          )}
        </View>
        <TripScreenTabs value={tab} onChange={setTab} />
      </View>

      {tab === 'onTheWay' ? (
        <>
          <View className="relative min-h-0 flex-1 px-1 pt-1">
            <JobTrackingMap
              orderId={orderId}
              layout="trip"
              destination={destination}
              vendor={vendorFix}
              followVendor={followVendor}
              refetchRouteOnMove={followVendor}
              showMap={showMap}
              onOpenExternalMaps={onOpenMaps}
              onRouteLoaded={setRouteSummary}
            />
            <OpenInMapsChip onPress={onOpenMaps} className="absolute bottom-3 left-3 z-10" />
            <MapExpandChip onPress={() => setMapFullscreen(true)} className="absolute bottom-3 right-3 z-10">
              <Icon as={Maximize2} className="text-foreground size-4" />
            </MapExpandChip>
          </View>

          <Surface
            className="rounded-t-3xl border-t border-border/80 shadow-lg"
            style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
            <View className="gap-3 px-4 pt-4">
              <View className="flex-row items-center gap-3">
                <Icon as={User} className="text-muted-foreground size-4" />
                <Text className="text-foreground flex-1 text-base font-medium">{customerName}</Text>
                {customerPhone ? (
                  <PressableScale
                    onPress={() => Linking.openURL(`tel:${customerPhone}`)}
                    className="rounded-full border border-amber-400 bg-primary px-4 py-2">
                    <View className="flex-row items-center gap-1.5">
                      <Icon as={Phone} className="size-3.5 text-[#1A1A1A]" />
                      <Text className="text-sm font-bold text-[#1A1A1A]">Call</Text>
                    </View>
                  </PressableScale>
                ) : null}
              </View>

              <View className="flex-row items-start gap-2">
                <Icon as={MapPin} className="text-muted-foreground mt-0.5 size-4" />
                <View className="min-w-0 flex-1">
                  <Text className="text-foreground text-sm leading-5" numberOfLines={2}>
                    {addressLine}
                  </Text>
                  <Text className="text-muted-foreground mt-0.5 text-xs">{cityPinLine}</Text>
                </View>
              </View>

              <PressableScale
                onPress={() => setTab('orderDetails')}
                className="items-center rounded-full border border-amber-400 bg-primary py-3.5">
                <Text className="text-sm font-bold text-[#1A1A1A]">Full order details</Text>
              </PressableScale>

              <View className="gap-2 pt-1">{actions}</View>
            </View>
          </Surface>
        </>
      ) : (
        <View className="min-h-0 flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-4 pb-6 pt-4"
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <View className="gap-1">
            <Text className="text-muted-foreground text-xs">{orderRef}</Text>
            <Text className="text-foreground text-lg font-semibold">{packageName}</Text>
            <BookingStatusBadge status={status} className="self-start" />
          </View>

          {slotLabel ? (
            <Surface className="bg-primary/10 p-4">
              <Text className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Scheduled slot
              </Text>
              <Text className="text-foreground mt-1 text-lg font-semibold">{slotLabel}</Text>
            </Surface>
          ) : null}

          <View className="gap-3 rounded-2xl border border-border/70 p-4">
            <View className="flex-row items-center gap-3">
              <Icon as={User} className="text-muted-foreground size-4" />
              <Text className="text-foreground flex-1 text-base font-medium">{customerName}</Text>
              {customerPhone ? (
                <PressableScale
                  onPress={() => Linking.openURL(`tel:${customerPhone}`)}
                  className="rounded-full border border-amber-400 bg-primary px-4 py-2">
                  <Text className="text-sm font-bold text-[#1A1A1A]">Call</Text>
                </PressableScale>
              ) : null}
            </View>
            <View className="flex-row items-start gap-2">
              <Icon as={MapPin} className="text-muted-foreground mt-0.5 size-4" />
              <View className="min-w-0 flex-1">
                <Text className="text-foreground text-sm leading-5">{addressLine}</Text>
                <Text className="text-muted-foreground mt-0.5 text-xs">{cityPinLine}</Text>
              </View>
            </View>
          </View>

          <View className="gap-1">
            <Text className="text-muted-foreground text-xs">Payment</Text>
            <Text className="text-foreground text-base font-medium">{paymentLabel}</Text>
            <Text className="text-foreground mt-2 text-2xl font-bold tracking-tight">
              {formatInr(subtotalPaise)}
            </Text>
          </View>

          <BookingItemsList
            items={items}
            subtotalPaise={subtotalPaise}
            onViewAll={onViewPackage}
          />
          {packageButton}
        </ScrollView>
        </View>
      )}

      <TripMapFullscreenModal
        visible={mapFullscreen && showMap}
        onClose={() => setMapFullscreen(false)}
        orderId={orderId}
        destination={destination}
        vendor={vendorFix}
        onOpenMaps={onOpenMaps}
        onRouteLoaded={setRouteSummary}
        footerActions={actions}
      />
    </View>
  );
}
