import { FadeInView, PressableScale, SlideInBottom } from '@/components/motion';
import { triggerHaptic } from '@/components/motion/haptics';
import * as Haptics from 'expo-haptics';
import { IconWell, LoadingPlaceholder, SoftSection, Surface } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { getApiError } from '@/api/client';
import { BookingItemsList } from '@/module/bookings/components/BookingItemsList';
import { BookingStatusBadge } from '@/module/bookings/components/BookingStatusBadge';
import { CollectCashSheet } from '@/module/bookings/components/CollectCashSheet';
import { DeclineBookingSheet } from '@/module/bookings/components/DeclineBookingSheet';
import { DeliveryCompleteSheet } from '@/module/bookings/components/DeliveryCompleteSheet';
import { JobCompletedSuccessSheet } from '@/module/bookings/components/JobCompletedSuccessSheet';
import { JobPackageSheet } from '@/module/bookings/components/JobPackageSheet';
import { JobTrackingMap } from '@/module/bookings/components/JobTrackingMap';
import { OpenInMapsChip } from '@/module/bookings/components/OpenInMapsChip';
import { WorkerTripBookingLayout } from '@/module/bookings/components/WorkerTripBookingLayout';
import { useJobLocationPing } from '@/module/bookings/hooks/use-job-location-ping';
import { useJobTrackingPoll } from '@/module/bookings/hooks/use-job-tracking-poll';
import {
  SwipeToAcceptButton,
  SwipeToConfirmButton,
} from '@/module/bookings/components/SwipeToConfirmButton';
import {
  collectionStatusTone,
  collectionQrImageUri,
  formatCollectionSessionExpiry,
  formatCollectionStatus,
  formatInr,
  hasCollectionQrDisplay,
  isCollectionSessionExpired,
} from '@/module/bookings/lib/booking-format';
import {
  useCollectCash,
  useCollectOnline,
  useCollectionStatus,
} from '@/module/bookings/hooks/use-collection';
import {
  useAcceptVendorJob,
  useDeclineVendorJob,
  useMarkEnRoute,
  useMarkOnSite,
  useSendDeliveryCode,
  useVendorJob,
  vendorJobsKeys,
} from '@/module/bookings/hooks/use-vendor-jobs';
import { useVendorDuty } from '@/module/duty/hooks/use-vendor-duty';
import { useNotificationJobPreview } from '@/module/notifications/hooks/use-notification-job-preview';
import { useAuthStore } from '@/store/auth.store';
import { AssignedWorkerChip } from '@/module/team/components/AssignedWorkerChip';
import { JobAssignSection } from '@/module/team/components/JobAssignSection';
import { EN_ROUTE_FGS_NOTIFICATION } from '@/lib/en-route-notification-copy';
import { useEnRouteTripStore } from '@/store/en-route-trip.store';
import { selectIsFieldShell, usePartnerModeStore } from '@/store/partner-mode.store';
import { Href, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  MessageCircle,
  Phone,
  User,
} from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Alert,
  Image,
  InteractionManager,
  Linking,
  Platform,
  ScrollView,
  Share,
  View,
} from 'react-native';
import { cn } from '@/lib/utils';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const NEEDS_ACTION_BAR_HEIGHT = 120;

function bottomActionOffset(insets: { bottom: number }) {
  return Math.max(insets.bottom, 12);
}

type BookingAcceptActionsProps = {
  onAccept: () => void;
  onDecline: () => void;
  acceptLoading?: boolean;
  disabled?: boolean;
  declineDisabled?: boolean;
  swipeLabel?: string;
  showSwipe?: boolean;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryLoading?: boolean;
};

function BookingAcceptActions({
  onAccept,
  onDecline,
  acceptLoading = false,
  disabled = false,
  declineDisabled = false,
  swipeLabel = 'Swipe to accept booking',
  showSwipe = true,
  primaryLabel,
  onPrimary,
  primaryLoading = false,
}: BookingAcceptActionsProps) {
  const actionsDisabled = disabled || acceptLoading || primaryLoading;

  return (
    <View className="gap-3">
      {showSwipe ? (
        <SwipeToAcceptButton
          label={swipeLabel}
          loading={acceptLoading}
          disabled={actionsDisabled}
          onAccept={onAccept}
        />
      ) : (
        <Button
          className="h-14 rounded-full"
          disabled={actionsDisabled}
          onPress={onPrimary}>
          <Text>{primaryLoading ? 'Going online…' : acceptLoading ? 'Accepting…' : primaryLabel}</Text>
        </Button>
      )}
      <Button
        className="h-11 rounded-full"
        variant="ghost"
        disabled={actionsDisabled || declineDisabled}
        onPress={onDecline}>
        <Text className="text-destructive font-medium">Decline</Text>
      </Button>
    </View>
  );
}

function BottomActionBar({
  bottom,
  children,
}: {
  bottom: number;
  children: ReactNode;
}) {
  return (
    <View className="absolute left-0 right-0 px-5" style={{ bottom }}>
      <SlideInBottom className="rounded-3xl bg-background pt-1 shadow-soft-lg">{children}</SlideInBottom>
    </View>
  );
}

function AssignedJobFallback({
  orderId,
  preview,
}: {
  orderId: string;
  preview: ReturnType<typeof useNotificationJobPreview>;
}) {
  const insets = useSafeAreaInsets();
  const actionBottom = bottomActionOffset(insets);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-5 pt-4"
        contentContainerStyle={{
          paddingBottom: preview?.needsAction ? NEEDS_ACTION_BAR_HEIGHT + actionBottom : 32 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}>
        <PressableScale onPress={() => router.back()} className="mb-1 flex-row items-center gap-2">
          <Icon as={ArrowLeft} className="text-foreground size-5" />
          <Text className="text-foreground text-sm font-medium">Back</Text>
        </PressableScale>

        <FadeInView>
          <View className="gap-2">
            <Text className="text-muted-foreground text-sm">
              {preview?.orderRef ?? `Order ${orderId.slice(0, 8)}`}
            </Text>
            <Text className="text-foreground text-2xl font-semibold">
              {preview?.title ?? 'New booking assigned'}
            </Text>
            <View className="self-start rounded-full bg-amber-500/15 px-3 py-1">
              <Text className="text-xs font-medium text-amber-800">Action required</Text>
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={60}>
          <Surface className="bg-primary/10 p-5">
            <Text className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Scheduled slot
            </Text>
            <Text className="text-foreground mt-1 text-xl font-semibold">
              {preview?.scheduledAt || 'See notification for timing'}
            </Text>
          </Surface>
        </FadeInView>

        <FadeInView delay={120}>
          <SoftSection className="gap-4">
            <View className="flex-row items-start gap-3">
              <IconWell icon={MapPin} />
              <View className="flex-1">
                <Text className="text-muted-foreground text-xs">Address</Text>
                <Text className="text-foreground text-sm leading-5">
                  {preview?.address || preview?.body || 'Loading full details…'}
                </Text>
              </View>
            </View>
          </SoftSection>
        </FadeInView>
        {!preview?.needsAction ? (
          <FadeInView delay={150}>
            <Button className="h-12 rounded-full" onPress={() => router.push('/(app)/bookings' as Href)}>
              <Text>View all bookings</Text>
            </Button>
          </FadeInView>
        ) : null}
      </ScrollView>

      {preview?.needsAction ? (
        <BottomActionBar bottom={actionBottom}>
          <BookingAcceptActions
            onAccept={() => {}}
            onDecline={() => {}}
            disabled
            swipeLabel="Swipe to accept booking"
          />
        </BottomActionBar>
      ) : null}
    </SafeAreaView>
  );
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = String(id ?? '');
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const preview = useNotificationJobPreview(orderId);
  const { data: booking, isLoading, isError } = useVendorJob(orderId);
  const user = useAuthStore((s) => s.user);
  const partnerMode = usePartnerModeStore((s) => s.mode);
  const isFieldShell = selectIsFieldShell(partnerMode, user);
  const isOwnerShell = !isFieldShell;
  const acceptMutation = useAcceptVendorJob(orderId);
  const declineMutation = useDeclineVendorJob(orderId);
  const enRouteMutation = useMarkEnRoute(orderId);
  const onSiteMutation = useMarkOnSite(orderId);
  const sendCodeMutation = useSendDeliveryCode(orderId);
  const collectCashMutation = useCollectCash(orderId);
  const collectOnlineMutation = useCollectOnline(orderId);
  const autoSendCodeRef = useRef(false);
  const bookingScrollRef = useRef<ScrollView>(null);
  const scrollToCollectQrAfterGenRef = useRef(false);
  const [packageOpen, setPackageOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineError, setDeclineError] = useState<string | null>(null);
  const [cashCollectOpen, setCashCollectOpen] = useState(false);
  const [cashCollectError, setCashCollectError] = useState<string | null>(null);
  const [jobCompletedOpen, setJobCompletedOpen] = useState(false);
  const [completedSnapshot, setCompletedSnapshot] = useState<{
    paymentMethod: string;
    collectionMethod: string | null;
    vendorSharePaise: number | null;
  } | null>(null);

  useEffect(() => {
    autoSendCodeRef.current = false;
  }, [orderId]);

  const codOnSite =
    booking?.paymentMethod === 'COD' && booking?.status === 'ON_SITE';
  const shouldFetchCollection =
    codOnSite &&
    (booking?.collectionStatus === 'pending' ||
      (booking?.collectionStatus === 'collected_online' && !booking?.deliveryCodeSent));
  const shouldPollCollection =
    codOnSite && booking?.collectionStatus === 'pending';

  useFocusEffect(
    useCallback(() => {
      if (!orderId) return;
      void queryClient.invalidateQueries({ queryKey: vendorJobsKeys.detail(orderId) });
      void queryClient.invalidateQueries({
        queryKey: [...vendorJobsKeys.detail(orderId), 'collection'],
      });
    }, [orderId, queryClient]),
  );

  const advanceAfterOnlinePayment = useCallback(() => {
    if (autoSendCodeRef.current || sendCodeMutation.isPending) return;
    autoSendCodeRef.current = true;
    void sendCodeMutation
      .mutateAsync()
      .then(() => {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        InteractionManager.runAfterInteractions(() => {
          bookingScrollRef.current?.scrollTo({ y: 0, animated: true });
          setCompleteOpen(true);
        });
      })
      .catch((err: unknown) => {
        autoSendCodeRef.current = false;
        Alert.alert('Payment received', getApiError(err));
      });
  }, [orderId, sendCodeMutation]);

  const { data: collectionStatus } = useCollectionStatus(orderId, {
    enabled: shouldFetchCollection,
    poll: shouldPollCollection,
    onCollected: (status) => {
      if (status === 'collected_online') {
        advanceAfterOnlinePayment();
      }
    },
  });

  useEffect(() => {
    if (!booking) return;
    if (booking.paymentMethod !== 'COD' || booking.status !== 'ON_SITE') return;
    if (booking.collectionStatus !== 'collected_online') return;
    if (booking.deliveryCodeSent) return;
    autoSendCodeRef.current = false;
    advanceAfterOnlinePayment();
  }, [
    booking?.id,
    booking?.paymentMethod,
    booking?.status,
    booking?.collectionStatus,
    booking?.deliveryCodeSent,
    advanceAfterOnlinePayment,
    booking,
  ]);
  const { isOnDuty, setOnDuty, isUpdating: dutyUpdating } = useVendorDuty();
  /** Live map + GPS pings only while en route; hide after worker marks on site. */
  const trackTrip = booking?.status === 'EN_ROUTE';
  const enRouteOnly = booking?.status === 'EN_ROUTE';
  const backgroundSharing = useEnRouteTripStore((s) => s.backgroundSharing);
  const permissionDeniedAt = useEnRouteTripStore((s) => s.permissionDeniedAt);
  const clearPermissionDenied = useEnRouteTripStore((s) => s.clearPermissionDenied);
  const endEnRouteTrip = useEnRouteTripStore((s) => s.endTrip);
  const pingTrip = Boolean(trackTrip && isFieldShell && !backgroundSharing);
  const { lastFix: pingFix, suggestOnSite } = useJobLocationPing(orderId, pingTrip);
  const fieldTracking = useJobTrackingPoll(
    orderId,
    Boolean(isFieldShell && trackTrip && backgroundSharing),
  );
  const vendorFix = useMemo(() => {
    if (
      backgroundSharing &&
      fieldTracking?.vendor?.latitude != null &&
      fieldTracking?.vendor?.longitude != null
    ) {
      return {
        latitude: fieldTracking.vendor.latitude,
        longitude: fieldTracking.vendor.longitude,
      };
    }
    return pingFix;
  }, [backgroundSharing, fieldTracking?.vendor?.latitude, fieldTracking?.vendor?.longitude, pingFix]);
  const ownerTracking = useJobTrackingPoll(orderId, Boolean(isOwnerShell && trackTrip));
  const permissionAlertShownRef = useRef<number | null>(null);
  const sharingOnAlertOrderRef = useRef<string | null>(null);

  useEffect(() => {
    if (!booking || booking.status === 'EN_ROUTE') return;
    if (useEnRouteTripStore.getState().activeOrderId !== orderId) return;
    void endEnRouteTrip();
  }, [booking?.status, orderId, endEnRouteTrip, booking]);

  useEffect(() => {
    if (!enRouteOnly || !permissionDeniedAt) return;
    if (permissionAlertShownRef.current === permissionDeniedAt) return;
    permissionAlertShownRef.current = permissionDeniedAt;
    const androidBatteryHint =
      Platform.OS === 'android'
        ? ' Also set Location to Allow all the time and turn off battery restrictions for this app (see dontkillmyapp.com if needed).'
        : '';
    Alert.alert(
      'Background location off',
      `Live tracking only works while this screen is open until you allow background location in settings.${androidBatteryHint}`,
      [
        { text: 'Open settings', onPress: () => void Linking.openSettings() },
        { text: 'OK', onPress: () => clearPermissionDenied() },
      ],
    );
  }, [enRouteOnly, permissionDeniedAt, clearPermissionDenied]);

  useEffect(() => {
    if (!enRouteOnly || !backgroundSharing || Platform.OS !== 'android') return;
    if (sharingOnAlertOrderRef.current === orderId) return;
    sharingOnAlertOrderRef.current = orderId;
    Alert.alert(
      'Live sharing on',
      `Keep "${EN_ROUTE_FGS_NOTIFICATION.title}" visible in the notification bar. Do not force-stop the app until you mark arrived.`,
      [{ text: 'OK' }],
    );
  }, [enRouteOnly, backgroundSharing, orderId]);

  useEffect(() => {
    if (!scrollToCollectQrAfterGenRef.current) return;
    if (!booking) return;

    const needsCodCollection =
      booking.paymentMethod === 'COD' && booking.collectionStatus === 'pending';
    const session = collectionStatus?.activeSession ?? null;
    if (!needsCodCollection || !session) return;

    const qrUri = collectionQrImageUri(session);
    const hasQr = hasCollectionQrDisplay(session);
    const canShowCollectUi = (hasQr && qrUri != null) || Boolean(session.shareUrl);
    if (!canShowCollectUi) return;

    scrollToCollectQrAfterGenRef.current = false;
    const timeout = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        bookingScrollRef.current?.scrollToEnd({ animated: true });
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [booking, collectionStatus?.activeSession]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <LoadingPlaceholder className="py-0" />
      </SafeAreaView>
    );
  }

  if (isError || !booking) {
    return <AssignedJobFallback orderId={orderId} preview={preview} />;
  }

  const paymentLabel =
    booking.paymentMethod === 'COD' ? 'Cash on delivery' : 'Paid online';
  const effectiveCollectionStatus =
    collectionStatus?.collectionStatus ?? booking.collectionStatus;
  const collectionTone = collectionStatusTone(effectiveCollectionStatus);
  const collectionChipClass =
    collectionTone === 'amber'
      ? 'bg-amber-500/15'
      : collectionTone === 'emerald'
        ? 'bg-emerald-500/15'
        : 'bg-muted';
  const collectionTextClass =
    collectionTone === 'amber'
      ? 'text-amber-800'
      : collectionTone === 'emerald'
        ? 'text-emerald-800'
        : 'text-muted-foreground';

  async function onAccept() {
    try {
      await acceptMutation.mutateAsync();
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      Alert.alert('Could not accept', getApiError(err));
    }
  }

  async function onGoOnlineAndAccept() {
    await setOnDuty(true);
    if (useAuthStore.getState().user?.vendor?.isOnDuty) {
      await onAccept();
    }
  }

  function onDeclinePress() {
    setDeclineError(null);
    setDeclineOpen(true);
  }

  function onDeclineClose() {
    if (declineMutation.isPending) return;
    setDeclineOpen(false);
    setDeclineError(null);
  }

  async function onConfirmDecline() {
    try {
      setDeclineError(null);
      await declineMutation.mutateAsync();
      setDeclineOpen(false);
      triggerHaptic();
      router.replace('/(app)/bookings' as Href);
    } catch (err) {
      setDeclineError(getApiError(err));
    }
  }

  function onCashCollectPress() {
    setCashCollectError(null);
    setCashCollectOpen(true);
  }

  function onCashCollectClose() {
    if (collectCashMutation.isPending) return;
    setCashCollectOpen(false);
    setCashCollectError(null);
  }

  async function onConfirmCashCollect() {
    try {
      setCashCollectError(null);
      await collectCashMutation.mutateAsync();
      setCashCollectOpen(false);
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      setCashCollectError(getApiError(err));
    }
  }

  async function onSwipePayOnline() {
    try {
      scrollToCollectQrAfterGenRef.current = true;
      await collectOnlineMutation.mutateAsync();
      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      scrollToCollectQrAfterGenRef.current = false;
      Alert.alert('Could not create payment QR', getApiError(err));
    }
  }

  const actionBottom = bottomActionOffset(insets);
  const scrollBottomPadding = booking.needsAction
    ? NEEDS_ACTION_BAR_HEIGHT + actionBottom
    : 160 + actionBottom;
  const tripBusy =
    enRouteMutation.isPending ||
    onSiteMutation.isPending ||
    sendCodeMutation.isPending ||
    collectCashMutation.isPending ||
    collectOnlineMutation.isPending;

  const needsCollection =
    booking.paymentMethod === 'COD' && effectiveCollectionStatus === 'pending';
  const collectionSettled = !needsCollection;
  const activeCollectSession =
    needsCollection ? (collectionStatus?.activeSession ?? null) : null;
  const collectQrUri =
    activeCollectSession != null ? collectionQrImageUri(activeCollectSession) : null;
  const hasActiveCollectQr =
    activeCollectSession != null && hasCollectionQrDisplay(activeCollectSession);
  const collectSessionLive =
    activeCollectSession != null &&
    !isCollectionSessionExpired(activeCollectSession.expiresAt);
  const delivery = booking.delivery;

  function openMaps() {
    const query = encodeURIComponent(
      [delivery.address, delivery.landmark, delivery.cityName, delivery.pincode]
        .filter(Boolean)
        .join(', '),
    );
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  }

  function openTripInExternalMaps() {
    const worker = ownerTracking?.vendor;
    const destPoint = tripDestination;
    if (
      worker?.latitude != null &&
      worker?.longitude != null &&
      destPoint?.latitude != null &&
      destPoint?.longitude != null
    ) {
      const origin = `${worker.latitude},${worker.longitude}`;
      const dest = `${destPoint.latitude},${destPoint.longitude}`;
      void Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`,
      );
      return;
    }
    openMaps();
  }

  async function runTripAction(
    label: string,
    action: () => Promise<unknown>,
  ) {
    try {
      await action();
      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      Alert.alert(`Could not ${label}`, getApiError(err));
    }
  }

  const useTripMapLayout = isFieldShell && booking.status === 'EN_ROUTE';

  const fieldTripActions = (
    <SwipeToConfirmButton
      variant="accept"
      label="Swipe — I've reached location"
      loadingLabel="Updating…"
      loading={onSiteMutation.isPending}
      disabled={tripBusy}
      onConfirm={() =>
        void runTripAction('mark arrived', () => onSiteMutation.mutateAsync())
      }
    />
  );

  const fieldOnSiteActions = (
    <View className="gap-2">
      {needsCollection && !collectionSettled ? (
        <View className="gap-3">
          <Text className="text-muted-foreground text-center text-sm">
            Collect {formatInr(booking.subtotalPaise)} before sending the delivery code
          </Text>
          <SwipeToConfirmButton
            variant="accept"
            label={
              hasActiveCollectQr && collectSessionLive
                ? 'Swipe to regenerate QR'
                : 'Swipe — Customer pays online'
            }
            loadingLabel={hasActiveCollectQr ? 'Regenerating QR…' : 'Creating QR…'}
            loading={collectOnlineMutation.isPending}
            disabled={tripBusy || cashCollectOpen}
            onConfirm={() => void onSwipePayOnline()}
          />
          <Button
            className="h-12 rounded-full"
            variant="outline"
            disabled={tripBusy || collectOnlineMutation.isPending}
            onPress={onCashCollectPress}>
            <Text>Cash collected</Text>
          </Button>
        </View>
      ) : null}
      {!booking.deliveryCodeSent && collectionSettled ? (
        <Button
          className="h-12 rounded-full"
          disabled={tripBusy}
          onPress={() => void runTripAction('send code', () => sendCodeMutation.mutateAsync())}>
          <Text>{sendCodeMutation.isPending ? 'Sending…' : 'Send delivery code'}</Text>
        </Button>
      ) : null}
      {booking.deliveryCodeSent ? (
        <Button className="h-12 rounded-full" onPress={() => setCompleteOpen(true)}>
          <Text>Complete with code</Text>
        </Button>
      ) : null}
      {booking.deliveryCodeSent ? (
        <Button
          className="h-12 rounded-full"
          variant="outline"
          disabled={tripBusy}
          onPress={() => void runTripAction('resend code', () => sendCodeMutation.mutateAsync())}>
          <Text>{sendCodeMutation.isPending ? 'Sending…' : 'Resend code'}</Text>
        </Button>
      ) : null}
    </View>
  );

  const tripDestination =
    booking.delivery.latitude != null && booking.delivery.longitude != null
      ? { latitude: booking.delivery.latitude, longitude: booking.delivery.longitude }
      : null;

  const sharedSheets = (
    <>
      <JobPackageSheet
        open={packageOpen}
        onClose={() => setPackageOpen(false)}
        items={booking.items}
        subtotalPaise={booking.subtotalPaise}
      />
      <DeliveryCompleteSheet
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        orderId={orderId}
        onCompleted={() => {
          triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
          setCompletedSnapshot({
            paymentMethod: booking.paymentMethod,
            collectionMethod: booking.collectionMethod,
            vendorSharePaise: booking.vendorSharePaise,
          });
          setJobCompletedOpen(true);
        }}
      />
      {completedSnapshot ? (
        <JobCompletedSuccessSheet
          open={jobCompletedOpen}
          onClose={() => setJobCompletedOpen(false)}
          paymentMethod={completedSnapshot.paymentMethod}
          collectionMethod={completedSnapshot.collectionMethod}
          vendorSharePaise={completedSnapshot.vendorSharePaise}
        />
      ) : null}
      <DeclineBookingSheet
        open={declineOpen}
        onClose={onDeclineClose}
        bookingLabel={booking.packageName}
        onDecline={() => void onConfirmDecline()}
        loading={declineMutation.isPending}
        error={declineError}
      />
      <CollectCashSheet
        open={cashCollectOpen}
        onClose={onCashCollectClose}
        amountPaise={booking.subtotalPaise}
        onCollect={() => void onConfirmCashCollect()}
        loading={collectCashMutation.isPending}
        error={cashCollectError}
      />
    </>
  );

  if (useTripMapLayout) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={[]}>
        <WorkerTripBookingLayout
          orderId={orderId}
          orderRef={booking.orderRef}
          packageName={booking.packageName}
          status={booking.status}
          customerName={booking.customer.name}
          customerPhone={booking.customer.phone}
          addressLine={booking.addressLine}
          cityPinLine={`${booking.delivery.cityName} · ${booking.delivery.pincode}`}
          slotLabel={booking.slotLabel}
          paymentLabel={paymentLabel}
          items={booking.items}
          subtotalPaise={booking.subtotalPaise}
          onViewPackage={() => setPackageOpen(true)}
          packageOpen={packageOpen}
          onPackageClose={() => setPackageOpen(false)}
          canChat={booking.canChat}
          destination={tripDestination}
          vendorFix={vendorFix}
          followVendor={booking.status === 'EN_ROUTE'}
          showMap={!onSiteMutation.isPending}
          onOpenMaps={openMaps}
          actions={fieldTripActions}
        />
        {sharedSheets}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        ref={bookingScrollRef}
        className="flex-1"
        contentContainerClassName="gap-5 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
        showsVerticalScrollIndicator={false}>
        <View className="mb-1 flex-row items-center justify-between gap-3">
          <PressableScale onPress={() => router.back()} className="flex-row items-center gap-2">
            <Icon as={ArrowLeft} className="text-foreground size-5" />
            <Text className="text-foreground text-sm font-medium">Back</Text>
          </PressableScale>
          {booking.canChat ? (
            <PressableScale
              className="flex-row items-center gap-1.5 rounded-full border border-amber-400 bg-primary px-3.5 py-2.5"
              accessibilityLabel="Chat with customer"
              onPress={() => router.push(`/(app)/bookings/${orderId}/chat` as Href)}>
              <Icon as={MessageCircle} className="size-4 text-[#1A1A1A]" />
              <Text className="text-sm font-bold text-[#1A1A1A]">Chat</Text>
            </PressableScale>
          ) : null}
        </View>

        <FadeInView>
          <View className="gap-2">
            <Text className="text-muted-foreground text-sm">{booking.orderRef}</Text>
            <Text className="text-foreground text-2xl font-semibold">{booking.packageName}</Text>
            <BookingStatusBadge
              status={booking.needsAction ? 'CONFIRMED' : booking.status}
              className="self-start"
            />
            {isOwnerShell && booking.vendorResponse === 'accepted' ? (
              <AssignedWorkerChip orderId={orderId} />
            ) : null}
          </View>
        </FadeInView>

        <FadeInView delay={60}>
          <Surface className="bg-primary/10 p-5">
            <Text className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Scheduled slot
            </Text>
            <Text className="text-foreground mt-1 text-xl font-semibold">{booking.slotLabel}</Text>
          </Surface>
        </FadeInView>

        <FadeInView delay={120}>
          <SoftSection className="gap-4">
            <View className="flex-row items-center gap-3">
              <IconWell icon={User} />
              <View className="flex-1">
                <Text className="text-muted-foreground text-xs">Customer</Text>
                <Text className="text-foreground text-base font-medium">{booking.customer.name}</Text>
              </View>
            </View>
            {booking.customer.phone ? (
              <View className="flex-row items-center gap-3">
                <IconWell icon={Phone} />
                <View className="min-w-0 flex-1">
                  <Text className="text-muted-foreground text-xs">Phone</Text>
                  <Text className="text-foreground text-base font-medium">
                    {booking.customer.phone}
                  </Text>
                </View>
                <PressableScale
                  onPress={() => Linking.openURL(`tel:${booking.customer.phone}`)}
                  className="rounded-full border border-amber-400 bg-primary px-4 py-2">
                  <Text className="text-sm font-bold text-[#1A1A1A]">Call</Text>
                </PressableScale>
              </View>
            ) : null}
            <View className="flex-row items-start gap-3">
              <IconWell icon={MapPin} />
              <View className="flex-1">
                <Text className="text-muted-foreground text-xs">Address</Text>
                <Text className="text-foreground text-sm leading-5">{booking.addressLine}</Text>
                <Text className="text-muted-foreground mt-1 text-sm">
                  {booking.delivery.cityName} · {booking.delivery.pincode}
                </Text>
              </View>
            </View>
            {trackTrip && isOwnerShell ? (
              <View className="gap-2">
                {ownerTracking?.vendor?.distanceMeters != null &&
                !ownerTracking.vendor.stale ? (
                  <Text className="text-muted-foreground text-sm">
                    Worker about {Math.max(0, Math.round(ownerTracking.vendor.distanceMeters / 100) / 10)} km
                    from customer
                  </Text>
                ) : null}
                <OpenInMapsChip
                  onPress={openTripInExternalMaps}
                  label="Open in Maps"
                  className="self-start"
                />
              </View>
            ) : null}
            {trackTrip && isFieldShell ? (
              <JobTrackingMap
                orderId={orderId}
                layout="compact"
                refetchRouteOnMove
                onOpenExternalMaps={openMaps}
                destination={tripDestination}
                vendor={vendorFix}
              />
            ) : null}
            <View className="flex-row items-start gap-3 border-t border-border/70 pt-4">
              <IconWell icon={CreditCard} />
              <View className="min-w-0 flex-1 gap-3">
                <View>
                  <Text className="text-muted-foreground text-xs">Payment</Text>
                  <Text className="text-foreground text-base font-medium">{paymentLabel}</Text>
                  {booking.paymentMethod === 'COD' ? (
                    <View className={cn('mt-2 self-start rounded-full px-3 py-1', collectionChipClass)}>
                      <Text className={cn('text-xs font-medium', collectionTextClass)}>
                        {formatCollectionStatus(effectiveCollectionStatus)}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <View>
                  <Text className="text-muted-foreground text-xs">Order value</Text>
                  <Text className="text-foreground text-2xl font-bold tracking-tight">
                    {formatInr(booking.subtotalPaise)}
                  </Text>
                  {booking.vendorSharePaise != null && collectionSettled ? (
                    <Text className="text-emerald-700 mt-1 text-sm font-medium">
                      Your share: {formatInr(booking.vendorSharePaise)}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          </SoftSection>
        </FadeInView>

        {isOwnerShell && booking.vendorResponse === 'accepted' ? (
          <FadeInView delay={160}>
            <JobAssignSection orderId={orderId} accepted />
          </FadeInView>
        ) : null}

        <FadeInView delay={180}>
          <BookingItemsList
            items={booking.items}
            subtotalPaise={booking.subtotalPaise}
            onViewAll={() => setPackageOpen(true)}
          />
        </FadeInView>

        {needsCollection && activeCollectSession ? (
          <FadeInView delay={220}>
            <Surface className="gap-4 p-5 shadow-none">
              {hasActiveCollectQr && collectQrUri ? (
                <>
                  <Text className="text-foreground text-center text-base font-semibold">
                    Scan UPI QR to pay
                  </Text>
                  <Text className="text-muted-foreground text-center text-sm leading-5">
                    Pay on delivery — customer scans with any UPI app for{' '}
                    {formatInr(booking.subtotalPaise)}
                  </Text>
                  {formatCollectionSessionExpiry(activeCollectSession.expiresAt) ? (
                    <Text className="text-muted-foreground text-center text-xs">
                      {isCollectionSessionExpired(activeCollectSession.expiresAt)
                        ? 'This QR has expired. Swipe to regenerate QR.'
                        : `Valid until ${formatCollectionSessionExpiry(activeCollectSession.expiresAt)}`}
                    </Text>
                  ) : null}
                  <Image
                    source={{ uri: collectQrUri }}
                    className="mx-auto h-56 w-56 rounded-xl bg-white p-2"
                    resizeMode="contain"
                    accessibilityLabel="Payment QR code"
                  />
                </>
              ) : activeCollectSession.shareUrl ? (
                <>
                  <Text className="text-foreground text-center text-base font-semibold">
                    Payment link ready
                  </Text>
                  <Text className="text-muted-foreground text-center text-sm">
                    Open the link so the customer can pay {formatInr(booking.subtotalPaise)} online
                  </Text>
                  <Button
                    className="h-12 rounded-full"
                    onPress={() => void Linking.openURL(activeCollectSession.shareUrl!)}>
                    <Text className="font-semibold">Open payment link</Text>
                  </Button>
                  <Button
                    className="h-11 rounded-full"
                    variant="outline"
                    onPress={() =>
                      void Share.share({
                        message: `Pay ${formatInr(booking.subtotalPaise)} for your Decoryy booking: ${activeCollectSession.shareUrl}`,
                        url: activeCollectSession.shareUrl!,
                      })
                    }>
                    <Text>Share link with customer</Text>
                  </Button>
                </>
              ) : null}
            </Surface>
          </FadeInView>
        ) : null}
      </ScrollView>

      {sharedSheets}

      {isOwnerShell && booking.needsAction ? (
        <BottomActionBar bottom={actionBottom}>
          <BookingAcceptActions
            showSwipe={isOnDuty}
            swipeLabel="Swipe to accept booking"
            onAccept={() => void onAccept()}
            onDecline={onDeclinePress}
            acceptLoading={acceptMutation.isPending}
            declineDisabled={declineOpen || declineMutation.isPending}
            disabled={dutyUpdating}
            primaryLabel="Go online to accept"
            onPrimary={() => void onGoOnlineAndAccept()}
            primaryLoading={dutyUpdating}
          />
        </BottomActionBar>
      ) : !isFieldShell || booking.status === 'COMPLETED' ? null : (
        <BottomActionBar bottom={actionBottom}>
          <View className="gap-2">
            {booking.status === 'ASSIGNED' ? (
              <View className="gap-3">
                <SwipeToConfirmButton
                  variant="accept"
                  label="Swipe — I'm on the way"
                  loadingLabel="Updating…"
                  loading={enRouteMutation.isPending}
                  disabled={tripBusy}
                  onConfirm={() =>
                    void runTripAction('mark en route', () => enRouteMutation.mutateAsync())
                  }
                />
                <Button className="h-11 rounded-full" variant="outline" onPress={openMaps}>
                  <Text>Open in Maps</Text>
                </Button>
              </View>
            ) : null}
            {booking.status === 'ON_SITE' ? (
              <>
                {suggestOnSite ? (
                  <Text className="text-center text-sm text-emerald-700">
                    You appear to be at the venue — complete the steps below.
                  </Text>
                ) : null}
                {fieldOnSiteActions}
              </>
            ) : null}
          </View>
        </BottomActionBar>
      )}
    </SafeAreaView>
  );
}
