import { FadeInView } from '@/components/motion';
import { ActionRequiredBanner } from '@/module/bookings/components/ActionRequiredBanner';
import { HomeBookingsPreview } from '@/module/bookings/components/HomeBookingsPreview';
import { HomeEarningsCard } from '@/module/bookings/components/HomeEarningsCard';
import { HomeIdleCard } from '@/module/bookings/components/HomeIdleCard';
import { NextJobHero } from '@/module/bookings/components/NextBookingHero';
import { useVendorJobsScreen } from '@/module/bookings/hooks/use-vendor-jobs-screen';
import { getMonthlyStats, getTodayEarnings } from '@/module/bookings/lib/booking-stats';
import { getHomePreviewBookings } from '@/module/bookings/lib/get-home-preview-bookings';
import { getHomeViewModel } from '@/module/bookings/lib/get-home-state';
import { HomeScreenSkeleton } from '@/module/bookings/components/skeletons/HomeScreenSkeleton';
import { DutyStatusCard } from '@/module/duty/components/DutyStatusCard';
import { VendorStoreStatusBanner } from '@/module/duty/components/StoreStatusBanner';
import { useVendorDuty } from '@/module/duty/hooks/use-vendor-duty';
import { useUnreadNotificationCount } from '@/module/notifications/hooks/use-unread-count';
import { useAuthStore } from '@/store/auth.store';
import { FieldTodayScreen } from '@/module/partner/field/FieldTodayScreen';
import { selectIsFieldShell, usePartnerModeStore } from '@/store/partner-mode.store';
import { PartnerHomeHeader } from '@/module/partner/shared/PartnerHomeHeader';
import { Href, router } from 'expo-router';
import { ScrollView, View } from 'react-native';

const GATED_STATES = new Set(['pending_approval', 'rejected', 'blocked']);

function OwnerHomeScreen() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name.split(' ')[0] ?? 'Partner';
  const unreadCount = useUnreadNotificationCount();
  const { onboardingStatus, isOnDuty, canToggle } = useVendorDuty();
  const { bookings, actionBookings, actionCount, isLoading, refreshControl } =
    useVendorJobsScreen();

  const { state, pendingActionBookings, activeBooking } = getHomeViewModel(
    onboardingStatus,
    isOnDuty,
    bookings,
    actionBookings,
  );

  const todayEarnings = getTodayEarnings(bookings);
  const monthlyStats = getMonthlyStats(bookings);
  const previewBookings = getHomePreviewBookings(bookings, {
    limit: 3,
    excludeIds: activeBooking ? [activeBooking.id] : [],
  });
  const showBookingSections = !GATED_STATES.has(state);

  const openPayouts = () => router.push('/(app)/payouts' as Href);

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}>
        <PartnerHomeHeader
          firstName={firstName}
          unreadCount={unreadCount}
          storeClosed={canToggle && !isOnDuty}
        />

        <View className="gap-5 px-5">
          {/* Opaque backing so the card's translucent tints stay readable over the green curve. */}
          <View className="-mt-10 mb-1 rounded-3xl bg-card">
            <DutyStatusCard pendingActionCount={actionCount} />
          </View>

          <VendorStoreStatusBanner />

          {isLoading && showBookingSections ? (
            <HomeScreenSkeleton />
          ) : showBookingSections ? (
            <>
              {state === 'needs_action' ? (
                <ActionRequiredBanner bookings={pendingActionBookings} />
              ) : null}

              {state === 'active_job' && activeBooking ? (
                <NextJobHero
                  booking={activeBooking}
                  onViewBooking={() => router.push(`/(app)/bookings/${activeBooking.id}` as Href)}
                />
              ) : null}

              {state === 'online_idle' ? <HomeIdleCard variant="online_idle" /> : null}
              {state === 'offline' ? <HomeIdleCard variant="offline" /> : null}

              <FadeInView delay={120}>
                <HomeEarningsCard
                  earnedTodayPaise={todayEarnings.earnedTodayPaise}
                  completedToday={todayEarnings.completedToday}
                  earnedThisMonthPaise={monthlyStats.earnedThisMonthPaise}
                  completedThisMonth={monthlyStats.completedThisMonth}
                  onPress={openPayouts}
                />
              </FadeInView>

              <FadeInView delay={200}>
                <HomeBookingsPreview bookings={previewBookings} homeState={state} />
              </FadeInView>
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

export default function VendorHomeScreen() {
  const user = useAuthStore((s) => s.user);
  const partnerMode = usePartnerModeStore((s) => s.mode);

  if (selectIsFieldShell(partnerMode, user)) {
    return <FieldTodayScreen />;
  }

  return <OwnerHomeScreen />;
}
