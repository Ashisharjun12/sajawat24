import { PressableScale } from '@/components/motion';
import { triggerHaptic } from '@/components/motion/haptics';
import { IconWell, Surface } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { BookingStatusBadge } from '@/module/bookings/components/BookingStatusBadge';
import { formatInr } from '@/module/bookings/lib/booking-format';
import type { VendorJobSummary } from '@/module/bookings/lib/booking.types';
import { Calendar } from 'lucide-react-native';
import { View } from 'react-native';

type HomeBookingPreviewCardProps = {
  booking: VendorJobSummary;
  onPress: () => void;
};

/** Dense row card — title, when/where, status, price. No chevron so text gets the space. */
export function HomeBookingPreviewCard({ booking, onPress }: HomeBookingPreviewCardProps) {
  return (
    <PressableScale
      className="rounded-3xl"
      onPress={() => {
        triggerHaptic();
        onPress();
      }}
      scaleTo={0.98}>
      <Surface className="flex-row items-start gap-3 p-3.5">
        <IconWell
          icon={Calendar}
          size="sm"
          className="bg-primary/10"
          iconClassName="text-foreground"
        />

        <View className="min-w-0 flex-1 gap-1.5">
          <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
            {booking.packageName}
          </Text>
          <Text className="text-muted-foreground text-xs" numberOfLines={1}>
            {booking.slotLabel} · {booking.area}
          </Text>
          <BookingStatusBadge status={booking.status} className="self-start" />
        </View>

        <Text className="text-foreground text-sm font-semibold">
          {formatInr(booking.subtotalPaise)}
        </Text>
      </Surface>
    </PressableScale>
  );
}
