import { PressableScale } from '@/components/motion';
import { IconWell, Surface } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { BookingStatusBadge } from '@/module/bookings/components/BookingStatusBadge';
import { formatInr } from '@/module/bookings/lib/booking-format';
import type { VendorJobSummary } from '@/module/bookings/lib/booking.types';
import { cn } from '@/lib/utils';
import { Calendar, ChevronRight, MapPin } from 'lucide-react-native';
import { View } from 'react-native';

type JobCardProps = {
  booking: VendorJobSummary;
  onPress?: () => void;
};

function NeedsActionTag() {
  return (
    <View className="flex-row items-center gap-1.5 self-start rounded-full bg-amber-500/15 px-2.5 py-1">
      <View className="size-1.5 rounded-full bg-amber-500" />
      <Text className="text-xs font-semibold text-amber-600">Response needed</Text>
    </View>
  );
}

export function JobCard({ booking, onPress }: JobCardProps) {
  return (
    <PressableScale onPress={onPress} disabled={!onPress} scaleTo={0.98}>
      <Surface className={cn('p-4', booking.needsAction && 'border border-amber-500/30')}>
        <View className="gap-3">
          <View className="flex-row items-start justify-between gap-2">
            <View className="flex-1 gap-1">
              <Text className="text-foreground text-base font-semibold">{booking.packageName}</Text>
              <Text className="text-muted-foreground text-sm">{booking.customerName}</Text>
            </View>
            {booking.needsAction ? <NeedsActionTag /> : <BookingStatusBadge status={booking.status} />}
          </View>

          <View className="gap-2">
            <View className="flex-row items-center gap-2">
              <IconWell icon={Calendar} size="sm" />
              <Text className="text-foreground flex-1 text-sm">{booking.slotLabel}</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <IconWell icon={MapPin} size="sm" />
              <Text className="text-muted-foreground flex-1 text-sm">{booking.area}</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-foreground text-sm font-semibold">
              {formatInr(booking.subtotalPaise)}
            </Text>
            {onPress ? <Icon as={ChevronRight} className="text-muted-foreground size-4" /> : null}
          </View>
        </View>
      </Surface>
    </PressableScale>
  );
}
