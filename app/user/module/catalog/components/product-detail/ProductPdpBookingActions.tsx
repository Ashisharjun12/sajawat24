import { ScalePressable } from '@/components/shell';
import { WhatsAppIcon } from '@/components/shell/WhatsAppIcon';
import { Text } from '@/components/ui/text';
import { INSTANT_TAB_HEX } from '@/lib/theme';
import { Zap } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { ActivityIndicator, View } from 'react-native';

type ProductPdpBookingActionsProps = {
  booking: boolean;
  isInstantBooking: boolean;
  onWhatsApp: () => void;
  onBookNow: () => void;
};

export function ProductPdpBookingActions({
  booking,
  isInstantBooking,
  onWhatsApp,
  onBookNow,
}: ProductPdpBookingActionsProps) {
  const bookBg = isInstantBooking ? INSTANT_TAB_HEX : undefined;

  return (
    <View className="flex-row gap-3">
      <ScalePressable
        haptic
        onPress={onWhatsApp}
        accessibilityRole="button"
        accessibilityLabel="Chat on WhatsApp"
        className="h-12 min-w-0 flex-1 flex-row items-center justify-center gap-2 rounded-full bg-[#00A859]">
        <WhatsAppIcon size={20} color="#ffffff" />
        <Text className="text-base font-semibold text-white">WhatsApp</Text>
      </ScalePressable>

      <ScalePressable
        haptic
        disabled={booking}
        onPress={onBookNow}
        accessibilityRole="button"
        accessibilityLabel={isInstantBooking ? 'Book instant' : 'Book now'}
        className="h-12 min-w-0 flex-1 flex-row items-center justify-center gap-2 rounded-full bg-primary"
        style={bookBg ? { backgroundColor: bookBg } : undefined}>
        {booking ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            {isInstantBooking ? (
              <Icon as={Zap} className="size-5 text-white" fill="#fff" />
            ) : null}
            <Text
              className={`text-base font-semibold ${isInstantBooking ? 'text-white' : 'text-primary-foreground'}`}>
              {isInstantBooking ? 'Book instant' : 'Book now'}
            </Text>
          </>
        )}
      </ScalePressable>
    </View>
  );
}
