import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { PENDING_REVIEW_STEPS } from '@/module/application-review/lib/review-copy';
import { getReviewStepState } from '@/module/application-review/lib/review-steps';
import { cn } from '@/lib/utils';
import { Check, Circle } from 'lucide-react-native';
import { View } from 'react-native';

export function ApplicationReviewSteps() {
  return (
    <View className="gap-0">
      {PENDING_REVIEW_STEPS.map((step, index) => {
        const state = getReviewStepState(index);
        const isLast = index === PENDING_REVIEW_STEPS.length - 1;

        return (
          <View key={step.id} className="flex-row gap-4">
            <View className="items-center">
              <View
                className={cn(
                  'size-8 items-center justify-center rounded-full border-2',
                  state === 'done' && 'border-primary bg-primary',
                  state === 'active' && 'border-primary bg-primary/15',
                  state === 'upcoming' && 'border-border bg-muted'
                )}>
                {state === 'done' ? (
                  <Icon as={Check} className="text-primary-foreground size-4" strokeWidth={3} />
                ) : state === 'active' ? (
                  <View className="bg-primary size-2.5 rounded-full" />
                ) : (
                  <Icon as={Circle} className="text-muted-foreground size-3" />
                )}
              </View>
              {!isLast ? <View className="bg-border my-1 w-0.5 flex-1 min-h-[36px]" /> : null}
            </View>

            <View className={cn('flex-1 pb-6', isLast && 'pb-0')}>
              <Text
                className={cn(
                  'text-base font-semibold',
                  state === 'upcoming' ? 'text-muted-foreground' : 'text-foreground'
                )}>
                {step.label}
              </Text>
              <Text className="text-muted-foreground mt-1 text-sm leading-5">{step.detail}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
