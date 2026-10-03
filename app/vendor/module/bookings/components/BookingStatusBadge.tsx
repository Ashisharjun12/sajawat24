import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import {
  bookingStatusBadgeClass,
  bookingStatusLabel,
  bookingStatusTextClass,
} from '@/module/bookings/lib/booking-status';
import { cn } from '@/lib/utils';

type BookingStatusBadgeProps = {
  status: string;
  className?: string;
};

export function BookingStatusBadge({ status, className }: BookingStatusBadgeProps) {
  return (
    <Badge variant="secondary" className={cn('border-0', bookingStatusBadgeClass(status), className)}>
      <Text className={cn('text-xs font-medium', bookingStatusTextClass(status))}>
        {bookingStatusLabel(status)}
      </Text>
    </Badge>
  );
}
