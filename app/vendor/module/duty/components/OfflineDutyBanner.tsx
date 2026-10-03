import { Surface } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { useVendorDuty } from '@/module/duty/hooks/use-vendor-duty';
import { cn } from '@/lib/utils';

type OfflineDutyBannerProps = {
  className?: string;
};

export function OfflineDutyBanner({ className }: OfflineDutyBannerProps) {
  const { isOnDuty, canToggle } = useVendorDuty();

  if (!canToggle || isOnDuty) return null;

  return (
    <Surface className={cn('border-amber-500/20 bg-amber-500/10 px-4 py-3', className)}>
      <Text className="text-foreground text-sm font-medium">You&apos;re offline</Text>
      <Text className="text-muted-foreground mt-0.5 text-sm">
        Go online from Home to accept new bookings.
      </Text>
    </Surface>
  );
}
