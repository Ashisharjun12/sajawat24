import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { BOOKING_TIMELINE, bookingTimelineIndex } from '@/module/account/lib/booking-ui';
import { View } from 'react-native';

export function OrderTimeline({ status }: { status: string }) {
  if (status === 'CANCELLED') {
    return (
      <Text className="text-muted-foreground rounded-xl bg-muted/40 px-4 py-3 text-sm">
        This booking was cancelled.
      </Text>
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
                  done && 'border-emerald-600 bg-emerald-600',
                  current && 'border-primary bg-primary/15',
                  !done && !current && 'border-border bg-background',
                )}>
                <Text
                  className={cn(
                    'text-xs font-bold',
                    done ? 'text-white' : current ? 'text-foreground' : 'text-muted-foreground',
                  )}>
                  {done ? '✓' : index + 1}
                </Text>
              </View>
              {!isLast ? (
                <View
                  className={cn('my-1 w-0.5 flex-1 min-h-4', done ? 'bg-emerald-600' : 'bg-border')}
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
