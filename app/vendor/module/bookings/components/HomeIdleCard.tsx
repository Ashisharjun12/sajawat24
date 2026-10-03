import { FadeInView } from '@/components/motion';
import { IconWell } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { CalendarClock, Power } from 'lucide-react-native';
import { View } from 'react-native';

type HomeIdleCardVariant = 'online_idle' | 'offline';

const COPY: Record<HomeIdleCardVariant, { title: string; body: string }> = {
  online_idle: {
    title: "You're all set",
    body: "You're online and visible to customers — we'll notify you when a booking comes in.",
  },
  offline: {
    title: "You're not receiving bookings",
    body: 'Switch on above when you are ready to work. Going offline pauses new requests.',
  },
};

type HomeIdleCardProps = {
  variant: HomeIdleCardVariant;
};

/**
 * Explicit "nothing to do right now" state for Home. Silence reads as a
 * broken app to a vendor waiting on income — this always names the reason
 * (online-and-waiting vs. offline) instead of a generic empty message.
 */
export function HomeIdleCard({ variant }: HomeIdleCardProps) {
  const copy = COPY[variant];

  const icon = variant === 'online_idle' ? CalendarClock : Power;

  return (
    <FadeInView delay={80}>
      <View className="items-center gap-3 rounded-3xl bg-muted/70 px-5 py-8">
        <IconWell icon={icon} size="lg" className="bg-muted" iconClassName="text-muted-foreground" />
        <Text className="text-foreground text-center font-medium">{copy.title}</Text>
        <Text className="text-muted-foreground text-center text-sm leading-5">{copy.body}</Text>
      </View>
    </FadeInView>
  );
}
