import { FadeInView } from '@/components/motion';
import { PillFilter, Screen, ScreenHeader, SearchField, type PillOption } from '@/components/shell';
import { BookingsEmptyState } from '@/module/bookings/components/BookingsEmptyState';
import { JobCard } from '@/module/bookings/components/JobCard';
import { BookingsScreenSkeleton } from '@/module/bookings/components/skeletons/BookingsScreenSkeleton';
import { useVendorJobsInfinite } from '@/module/bookings/hooks/use-vendor-jobs-infinite';
import { useVendorJobsScreen } from '@/module/bookings/hooks/use-vendor-jobs-screen';
import { getBookingsEmptyMessage } from '@/module/bookings/lib/get-bookings-empty-message';
import type { JobFilter } from '@/module/bookings/lib/booking.types';
import { OfflineDutyBanner } from '@/module/duty/components/OfflineDutyBanner';
import { useVendorDuty } from '@/module/duty/hooks/use-vendor-duty';
import { useUnreadNotificationCount } from '@/module/notifications/hooks/use-unread-count';
import { useAuthStore } from '@/store/auth.store';
import { selectIsFieldShell, usePartnerModeStore } from '@/store/partner-mode.store';
import { Href, router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { AppSpinner } from '@/components/ui/app-spinner';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function useFilterOptions(actionCount: number): PillOption<JobFilter>[] {
  return useMemo(() => {
    const base: PillOption<JobFilter>[] = [
      { value: 'today', label: 'Today' },
      { value: 'upcoming', label: 'Upcoming' },
      { value: 'completed', label: 'Completed' },
    ];
    if (actionCount > 0) {
      return [{ value: 'action', label: 'Action', badgeCount: actionCount }, ...base];
    }
    return base;
  }, [actionCount]);
}

function OwnerBookingsScreen() {
  const [filter, setFilter] = useState<JobFilter>('today');
  const unreadCount = useUnreadNotificationCount();
  const { isOnDuty, canToggle } = useVendorDuty();
  const { bookings, actionCount, isLoading, refreshControl } = useVendorJobsScreen(filter);
  const options = useFilterOptions(actionCount);
  const emptyMessage = getBookingsEmptyMessage(filter, { isOnDuty, canToggle });

  return (
    <Screen scrollProps={{ refreshControl }}>
      <ScreenHeader
        title="Bookings"
        subtitle="Your assigned jobs"
        unreadCount={unreadCount}
      />

      <PillFilter value={filter} options={options} onChange={setFilter} />

      <OfflineDutyBanner />

      {isLoading ? (
        <BookingsScreenSkeleton />
      ) : bookings.length === 0 ? (
        <BookingsEmptyState message={emptyMessage} />
      ) : (
        <View className="gap-3">
          {bookings.map((booking, index) => (
            <FadeInView key={booking.id} delay={index * 60}>
              <JobCard
                booking={booking}
                onPress={() => router.push(`/(app)/bookings/${booking.id}` as Href)}
              />
            </FadeInView>
          ))}
        </View>
      )}
    </Screen>
  );
}

function FieldBookingsScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<JobFilter>('today');
  const [search, setSearch] = useState('');
  const unreadCount = useUnreadNotificationCount();
  const { isOnDuty, canToggle } = useVendorDuty();
  const { bookings, isLoading, isLoadingMore, hasMore, loadMore, refreshControl, isError } =
    useVendorJobsInfinite(filter, search);

  const options = useFilterOptions(0);
  const hasSearch = search.trim().length > 0;
  const emptyMessage = hasSearch
    ? 'No jobs match your search. Try customer name, order ref, or area.'
    : getBookingsEmptyMessage(filter, { isOnDuty, canToggle });

  const handleEndReached = useCallback(() => {
    if (hasMore) loadMore();
  }, [hasMore, loadMore]);

  const listHeader = useMemo(
    () => (
      <View className="gap-4 pb-2">
        <ScreenHeader title="My jobs" subtitle="Assigned to you" unreadCount={unreadCount} />
        <SearchField
          value={search}
          onChangeText={setSearch}
          placeholder="Search jobs"
          accessibilityLabel="Search jobs"
        />
        <PillFilter value={filter} options={options} onChange={setFilter} />
        <OfflineDutyBanner />
      </View>
    ),
    [filter, options, search, unreadCount],
  );

  const listEmpty = useMemo(() => {
    if (isLoading) return <BookingsScreenSkeleton />;
    if (isError) {
      return (
        <BookingsEmptyState
          variant="icon"
          message="Could not load jobs. Pull to refresh and try again."
        />
      );
    }
    return <BookingsEmptyState variant="icon" message={emptyMessage} />;
  }, [emptyMessage, isError, isLoading]);

  const listFooter = useMemo(() => {
    if (!isLoadingMore) return <View style={{ height: insets.bottom }} />;
    return (
      <View className="items-center py-4">
        <AppSpinner size="sm" />
      </View>
    );
  }, [insets.bottom, isLoadingMore]);

  return (
    <Screen scroll={false} contentClassName="flex-1 pb-0">
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <FadeInView delay={index * 40}>
            <JobCard
              booking={item}
              onPress={() => router.push(`/(app)/bookings/${item.id}` as Href)}
            />
          </FadeInView>
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        ItemSeparatorComponent={() => <View className="h-3" />}
        contentContainerClassName="flex-grow px-5 pb-4 pt-4"
        refreshControl={refreshControl}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.35}
      />
    </Screen>
  );
}

export default function BookingsScreen() {
  const user = useAuthStore((s) => s.user);
  const partnerMode = usePartnerModeStore((s) => s.mode);
  const isFieldShell = selectIsFieldShell(partnerMode, user);

  if (isFieldShell) {
    return <FieldBookingsScreen />;
  }

  return <OwnerBookingsScreen />;
}
