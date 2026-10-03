import { FadeInView, PressableScale } from '@/components/motion';
import { triggerHaptic } from '@/components/motion/haptics';
import { Surface } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import type { VendorJobSummary } from '@/module/bookings/lib/booking.types';
import { useVendorDuty } from '@/module/duty/hooks/use-vendor-duty';
import { Href, router } from 'expo-router';
import { View } from 'react-native';

type ActionRequiredBannerProps = {
  /** Bookings waiting on accept/decline, soonest slot first. */
  bookings: VendorJobSummary[];
};

/**
 * The loudest thing on Home when a booking needs a response — promoted
 * above "next booking" so it can't be missed (loss-aversion framing: a
 * waiting booking reads as something to lose, not just an option).
 */
export function ActionRequiredBanner({ bookings }: ActionRequiredBannerProps) {
  const { isOnDuty, canToggle } = useVendorDuty();
  const [primary, ...rest] = bookings;
  if (!primary) return null;

  const openBooking = (id: string) => {
    triggerHaptic();
    router.push(`/(app)/bookings/${id}` as Href);
  };

  const title =
    rest.length > 0 ? `${bookings.length} bookings waiting` : primary.packageName;
  const statusHint = canToggle && !isOnDuty ? 'Go online to accept' : 'Tap to accept or decline';

  return (
    <FadeInView duration={280}>
      <PressableScale
        className="rounded-3xl"
        onPress={() => openBooking(primary.id)}
        scaleTo={0.98}>
        <Surface className="border border-amber-500/25 bg-amber-500/10 p-4">
          <View className="flex-row items-center gap-2">
            <View className="size-2 rounded-full bg-amber-500" />
            <Text className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Action required
            </Text>
          </View>

          <Text className="text-foreground mt-2 text-base font-semibold" numberOfLines={1}>
            {title}
          </Text>
          <Text className="text-muted-foreground mt-0.5 text-xs" numberOfLines={1}>
            {primary.slotLabel} · {statusHint}
          </Text>

          <Button className="mt-3 h-11 rounded-full" onPress={() => openBooking(primary.id)}>
            <Text>{rest.length > 0 ? 'Respond now' : 'Accept or decline'}</Text>
          </Button>
        </Surface>
      </PressableScale>
    </FadeInView>
  );
}
