import { ScalePressable } from '@/components/shell';
import { WhatsAppIcon } from '@/components/shell/WhatsAppIcon';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatPaise } from '@/lib/format-money';
import { lightImpact } from '@/lib/light-haptic';
import { Check } from 'lucide-react-native';
import { View } from 'react-native';

/** WhatsApp's own brand green — a third-party mark, not a brand token. */
const WHATSAPP_GREEN = '#25D366';

type ProductPdpMobileBookingBarProps = {
  pricePaise: number | null | undefined;
  booking: boolean;
  isInstantBooking: boolean;
  onWhatsApp: () => void;
  onBookNow: () => void;
};

export function ProductPdpMobileBookingBar({
  pricePaise,
  booking,
  isInstantBooking,
  onWhatsApp,
  onBookNow,
}: ProductPdpMobileBookingBarProps) {
  const bookLabel = isInstantBooking ? 'Book instant' : 'Book your setup';

  return (
    <View className="flex-row items-center gap-3">
      <View className="shrink-0">
        <Text className="text-muted-foreground text-caption">Total</Text>
        <Text className="text-h3 font-semibold">
          {pricePaise != null ? formatPaise(pricePaise) : '—'}
        </Text>
        <View className="flex-row items-center gap-1">
          <Icon as={Check} size={12} className="text-success" strokeWidth={2.5} />
          <Text className="text-micro font-medium text-success">All inclusive</Text>
        </View>
      </View>

      <ScalePressable
        haptic
        onPress={onWhatsApp}
        accessibilityRole="button"
        accessibilityLabel="Chat on WhatsApp"
        className="size-12 items-center justify-center rounded-btn border border-border bg-surface">
        <WhatsAppIcon size={22} color={WHATSAPP_GREEN} />
      </ScalePressable>

      <Button
        className="flex-1"
        variant={isInstantBooking ? 'instant' : 'cta'}
        loading={booking}
        accessibilityLabel={bookLabel}
        onPress={() => {
          lightImpact();
          onBookNow();
        }}>
        <Text numberOfLines={1}>{bookLabel}</Text>
      </Button>
    </View>
  );
}
