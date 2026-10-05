import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { BOOKING_TIMELINE, bookingTimelineIndex } from '@/module/account/lib/booking-ui';
import {
  orderStatusDisplayLabel,
  orderStatusPillClass,
  orderStatusPillTextClass,
  orderStatusTone,
} from '@/module/account/lib/order-status-ui';
import { View } from 'react-native';

type Props = {
  status: string;
  checkoutAbandoned?: boolean;
};

export function OrderTimeline({ status, checkoutAbandoned = false }: Props) {
  if (status === 'PENDING_PAYMENT') {
    return (
      <Text className="text-cta rounded-xl bg-cta/10 px-4 py-3 text-sm leading-5">
        Complete payment to confirm this booking. Your bag is saved until you pay or the session
        expires.
      </Text>
    );
  }

  if (status === 'CANCELLED' || checkoutAbandoned) {
    const tone = orderStatusTone(status, checkoutAbandoned);
    return (
      <View className={cn('rounded-xl px-4 py-3', orderStatusPillClass(tone))}>
        <Text className={cn('text-sm font-semibold', orderStatusPillTextClass(tone))}>
          {orderStatusDisplayLabel(status, checkoutAbandoned)}
        </Text>
        <Text className="text-muted-foreground mt-1 text-sm leading-5">
          {checkoutAbandoned
            ? 'No payment was taken. You can checkout again from your bag anytime.'
            : 'This booking was cancelled.'}
        </Text>
      </View>
    );
  }

  const activeIndex = bookingTimelineIndex(status);
  const completed = status === 'COMPLETED';

  return (
    <View className="gap-1">
      {BOOKING_TIMELINE.map((step, index) => {
        const done = activeIndex > index || (completed && index <= activeIndex);
        const current = !completed && activeIndex === index;
        const isLast = index === BOOKING_TIMELINE.length - 1;
        return (
          <View key={step.key} className="flex-row gap-3">
            <View className="items-center">
              <View
                className={cn(
                  'size-8 items-center justify-center rounded-full border-2',
                  done && 'border-success bg-success',
                  current && 'border-primary bg-primary-tint',
                  !done && !current && 'border-border bg-background',
                )}>
                <Text
                  className={cn(
                    'text-xs font-bold',
                    done ? 'text-white' : current ? 'text-primary' : 'text-muted-foreground',
                  )}>
                  {done ? '✓' : index + 1}
                </Text>
              </View>
              {!isLast ? (
                <View
                  className={cn('my-1 w-0.5 flex-1 min-h-4', done ? 'bg-success' : 'bg-border')}
                />
              ) : null}
            </View>
            <View className={cn('min-w-0 flex-1 pb-4', isLast && 'pb-0')}>
              <Text
                className={cn(
                  'text-sm',
                  current || done ? 'text-foreground font-semibold' : 'text-muted-foreground',
                )}>
                {step.label}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
