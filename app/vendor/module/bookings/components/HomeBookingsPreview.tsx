import { FadeInView } from '@/components/motion';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { HomeBookingPreviewCard } from '@/module/bookings/components/HomeBookingPreviewCard';
import type { HomeState } from '@/module/bookings/lib/get-home-state';
import type { VendorJobSummary } from '@/module/bookings/lib/booking.types';
import { Href, router } from 'expo-router';
import { View } from 'react-native';

const EMPTY_COPY: Record<HomeState, { title: string; body: string }> = {
  needs_action: {
    title: 'Your schedule is next',
    body: 'Once you accept, confirmed jobs will show up here — ready to open in one tap.',
  },
  active_job: {
    title: 'No other jobs lined up',
    body: 'Focus on your current booking. New ones will appear here when assigned.',
  },
  online_idle: {
    title: 'Nothing scheduled yet',
    body: 'Stay online — new bookings land here the moment a customer picks you.',
  },
  offline: {
    title: 'You are offline',
    body: 'Go online from above to receive bookings. Your schedule will fill in here.',
  },
  pending_approval: { title: '', body: '' },
  rejected: { title: '', body: '' },
  blocked: { title: '', body: '' },
};

type HomeBookingsPreviewProps = {
  bookings: VendorJobSummary[];
  homeState: HomeState;
};

/**
 * Fills the lower Home area with scannable upcoming work — reduces the
 * "empty app" feeling and gives vendors locus of control over what's next.
 */
export function HomeBookingsPreview({ bookings, homeState }: HomeBookingsPreviewProps) {
  const openBookings = () => router.push('/(app)/bookings' as Href);
  const openBooking = (id: string) => router.push(`/(app)/bookings/${id}` as Href);
  const emptyCopy = EMPTY_COPY[homeState];

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2">
        <Text className="text-foreground text-base font-semibold">Your schedule</Text>
        {bookings.length > 0 ? (
          <View className="rounded-full bg-muted px-2 py-0.5">
            <Text className="text-muted-foreground text-xs font-semibold">{bookings.length}</Text>
          </View>
        ) : null}
      </View>

      {bookings.length > 0 ? (
        <View className="gap-2">
          {bookings.map((booking, index) => (
            <FadeInView key={booking.id} delay={index * 50}>
              <HomeBookingPreviewCard booking={booking} onPress={() => openBooking(booking.id)} />
            </FadeInView>
          ))}
        </View>
      ) : (
        <View className="rounded-3xl bg-muted/60 px-4 py-6">
          <Text className="text-foreground text-center text-sm font-medium">{emptyCopy.title}</Text>
          <Text className="text-muted-foreground mt-1 text-center text-xs leading-5">
            {emptyCopy.body}
          </Text>
        </View>
      )}

      <Button variant="outline" className="h-11 rounded-full" onPress={openBookings}>
        <Text>View all bookings</Text>
      </Button>
    </View>
  );
}
