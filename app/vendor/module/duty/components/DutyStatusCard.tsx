import { FadeInView } from '@/components/motion';
import { triggerHaptic } from '@/components/motion/haptics';
import { Surface } from '@/components/shell';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { useVendorDuty } from '@/module/duty/hooks/use-vendor-duty';
import { cn } from '@/lib/utils';
import { AppSpinner } from '@/components/ui/app-spinner';
import { Pressable, View } from 'react-native';

type DutyStatusCardProps = {
  variant?: 'full' | 'compact';
  pendingActionCount?: number;
  className?: string;
};

const LOCKED_COPY: Record<string, { title: string; body: string }> = {
  PENDING: {
    title: 'Awaiting approval',
    body: 'Your application is under review. You can go online after approval.',
  },
  REJECTED: {
    title: 'Application not approved',
    body: 'Update your details and reapply from the onboarding flow.',
  },
  BLOCKED: {
    title: 'Account paused',
    body: 'Contact Decoryy support if you think this is a mistake.',
  },
};

export function DutyStatusCard({
  variant = 'full',
  pendingActionCount = 0,
  className,
}: DutyStatusCardProps) {
  const { onboardingStatus, isOnDuty, canToggle, isUpdating, setOnDuty } = useVendorDuty();

  if (!onboardingStatus) return null;

  if (!canToggle) {
    const copy = LOCKED_COPY[onboardingStatus] ?? LOCKED_COPY.PENDING;
    return (
      <FadeInView>
        <Surface className={cn('gap-2 p-4', className)}>
          <Text className="text-foreground text-base font-semibold">{copy.title}</Text>
          <Text className="text-muted-foreground text-sm">{copy.body}</Text>
        </Surface>
      </FadeInView>
    );
  }

  const online = isOnDuty;
  const dotClass = online ? 'bg-emerald-500' : 'bg-muted-foreground/50';
  const title = online ? "You're online" : "You're offline";
  const subtitle = online
    ? 'Ready to take new bookings'
    : "You won't receive new bookings";

  async function handleToggle(next: boolean) {
    triggerHaptic();
    await setOnDuty(next, { pendingActionCount });
  }

  if (variant === 'compact') {
    return (
      <View className={cn('flex-row items-center justify-between gap-3 rounded-2xl bg-muted/60 px-4 py-3', className)}>
        <View className="flex-1 flex-row items-center gap-2">
          <View className={cn('size-2.5 rounded-full', dotClass)} />
          <Text className="text-foreground text-sm font-medium">{title}</Text>
        </View>
        {isUpdating ? (
          <AppSpinner size="sm" />
        ) : (
          <Switch
            size="lg"
            checked={online}
            onCheckedChange={handleToggle}
            disabled={isUpdating}
          />
        )}
      </View>
    );
  }

  return (
    <FadeInView>
      <Pressable onPress={() => !isUpdating && handleToggle(!online)} disabled={isUpdating}>
        <Surface
          className={cn(
            'flex-row items-center justify-between gap-4 p-4',
            online ? 'border-emerald-500/20 bg-emerald-500/5' : 'bg-muted/50',
            className,
          )}>
          <View className="flex-1 gap-1">
            <View className="flex-row items-center gap-2">
              <View className={cn('size-2.5 rounded-full', dotClass)} />
              <Text className="text-foreground text-base font-semibold">{title}</Text>
            </View>
            <Text className="text-muted-foreground text-sm">{subtitle}</Text>
          </View>
          {isUpdating ? (
            <AppSpinner />
          ) : (
            <Switch
              size="lg"
              checked={online}
              onCheckedChange={handleToggle}
              disabled={isUpdating}
            />
          )}
        </Surface>
      </Pressable>
    </FadeInView>
  );
}
