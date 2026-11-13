import { FadeInView } from '@/components/motion';
import { StoreStatusBanner } from '@/module/duty/components/StoreStatusBanner';
import { PartnerHomeHeader } from '@/module/partner/shared/PartnerHomeHeader';
import { NextJobHero } from '@/module/bookings/components/NextBookingHero';
import { HomeIdleCard } from '@/module/bookings/components/HomeIdleCard';
import { HomeScreenSkeleton } from '@/module/bookings/components/skeletons/HomeScreenSkeleton';
import { useVendorJobsScreen } from '@/module/bookings/hooks/use-vendor-jobs-screen';
import { getHomeViewModel } from '@/module/bookings/lib/get-home-state';
import { getShopDuty } from '@/api/vendor.api';
import { useUnreadNotificationCount } from '@/module/notifications/hooks/use-unread-count';
import { useAuthStore } from '@/store/auth.store';
import { useQuery } from '@tanstack/react-query';
import { Href, router } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';

export function FieldTodayScreen() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name.split(' ')[0] ?? 'there';
  const unreadCount = useUnreadNotificationCount();
  const { data: shopDuty, refetch: refetchShopDuty } = useQuery({
    queryKey: ['shop-duty'],
    queryFn: getShopDuty,
  });
  const isOnDuty = shopDuty?.isOnDuty ?? false;
  const refetchDuty = useCallback(() => refetchShopDuty(), [refetchShopDuty]);
  const { bookings, actionBookings, isLoading, refreshControl } = useVendorJobsScreen(undefined, [
    refetchDuty,
  ]);

  const { state, activeBooking } = getHomeViewModel(
    'ACTIVE',
    isOnDuty,
    bookings,
    actionBookings,
  );

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
          storeClosed={shopDuty ? !shopDuty.isOnDuty : false}
          className="pb-6"
        />

        <View className="gap-5 px-5 pt-5">
          <StoreStatusBanner variant="worker" isOpen={isOnDuty} />

          {!isOnDuty ? (
            <View className="rounded-card border border-border bg-muted/40 px-4 py-3">
              <Text className="text-muted-foreground text-sm leading-5">
                Your shop is offline. Trip actions stay disabled until the owner turns duty on.
              </Text>
            </View>
          ) : null}

          {isLoading ? (
            <HomeScreenSkeleton />
          ) : state === 'active_job' && activeBooking ? (
            <FadeInView>
              <NextJobHero
                booking={activeBooking}
                onViewBooking={() => router.push(`/(app)/bookings/${activeBooking.id}` as Href)}
              />
            </FadeInView>
          ) : (
            <HomeIdleCard variant={isOnDuty ? 'online_idle' : 'offline'} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
