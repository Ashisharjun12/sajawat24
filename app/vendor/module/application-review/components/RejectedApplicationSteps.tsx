import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { REJECTED_APPLICATION_STEPS } from '@/module/application-review/lib/rejected-copy';
import { getRejectedStepState } from '@/module/application-review/lib/rejected-steps';
import { cn } from '@/lib/utils';
import { Check, Circle, X } from 'lucide-react-native';
import { View } from 'react-native';

export function RejectedApplicationSteps() {
  return (
    <View className="gap-0">
      {REJECTED_APPLICATION_STEPS.map((step, index) => {
        const state = getRejectedStepState(index);
        const isLast = index === REJECTED_APPLICATION_STEPS.length - 1;

        return (
          <View key={step.id} className="flex-row gap-4">
            <View className="items-center">
              <View
                className={cn(
                  'size-8 items-center justify-center rounded-full border-2',
                  state === 'done' && 'border-primary bg-primary',
                  state === 'active' && 'border-destructive bg-destructive/15',
                  state === 'upcoming' && 'border-border bg-muted'
                )}>
                {state === 'done' ? (
                  <Icon as={Check} className="text-primary-foreground size-4" strokeWidth={3} />
                ) : state === 'active' ? (
                  <Icon as={X} className="text-destructive size-4" strokeWidth={3} />
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
                  state === 'active' && 'text-destructive',
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
