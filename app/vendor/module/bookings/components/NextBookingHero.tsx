import { FadeInView } from '@/components/motion';
import { IconWell, Surface } from '@/components/shell';
import { triggerHaptic } from '@/components/motion/haptics';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { BookingStatusBadge } from '@/module/bookings/components/BookingStatusBadge';
import { formatInr } from '@/module/bookings/lib/booking-format';
import type { VendorJobSummary } from '@/module/bookings/lib/booking.types';
import { Calendar, MapPin } from 'lucide-react-native';
import { View } from 'react-native';

type NextJobHeroProps = {
  booking: VendorJobSummary;
  onViewBooking: () => void;
};

export function NextJobHero({ booking, onViewBooking }: NextJobHeroProps) {
  return (
    <FadeInView delay={80}>
      <Surface accent className="p-5">
      <View className="gap-4">
        <View className="gap-2">
          <Text className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Next booking
          </Text>
          <Text className="text-foreground text-2xl font-semibold">{booking.slotLabel}</Text>
          <Text className="text-foreground text-lg font-medium">{booking.packageName}</Text>
          <BookingStatusBadge status={booking.status} className="self-start" />
        </View>

        <View className="gap-2">
          <View className="flex-row items-center gap-3">
            <IconWell icon={MapPin} />
            <Text className="text-muted-foreground flex-1 text-sm">{booking.area}</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <IconWell icon={Calendar} />
            <Text className="text-foreground flex-1 text-sm">
              {booking.customerName} · {formatInr(booking.subtotalPaise)}
            </Text>
          </View>
        </View>

        <Button
          className="h-12 rounded-full"
          onPress={() => {
            triggerHaptic();
            onViewBooking();
          }}>
          <Text>Open job</Text>
        </Button>
      </View>
      </Surface>
    </FadeInView>
  );
}
