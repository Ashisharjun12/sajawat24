import { ScalePressable } from '@/components/shell';
import { WhatsAppIcon } from '@/components/shell/WhatsAppIcon';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatPaise } from '@/lib/format-money';
import { INSTANT_TAB_HEX } from '@/lib/theme';
import { Check, ChevronRight, Zap } from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';

const WHATSAPP_GREEN = '#00A859';
const ACTION_SIZE = 52;

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
  const bookLabel = booking
    ? 'Adding…'
    : isInstantBooking
      ? 'Book instant'
      : 'Book your setup';

  return (
    <View className="flex-row items-end gap-2.5">
      <View className="min-w-0 flex-1 pb-0.5">
        <Text className="text-muted-foreground text-[11px] leading-tight">All-inclusive price</Text>
        <Text className="text-foreground text-[22px] font-extrabold leading-tight tracking-tight">
          {pricePaise != null ? formatPaise(pricePaise) : '—'}
        </Text>
        <View className="mt-0.5 flex-row items-center gap-1">
          <Icon as={Check} className="size-3 text-emerald-600" strokeWidth={2.5} />
          <Text className="text-[10px] font-medium leading-tight text-emerald-600">
            Setup, delivery & materials included
          </Text>
        </View>
      </View>

      <View className="shrink-0 flex-row items-center gap-2.5">
        <ScalePressable
          haptic
          onPress={onWhatsApp}
          accessibilityRole="button"
          accessibilityLabel="Chat on WhatsApp"
          className="items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40"
          style={{ width: ACTION_SIZE, height: ACTION_SIZE }}>
          <WhatsAppIcon size={24} color={WHATSAPP_GREEN} />
        </ScalePressable>

        <ScalePressable
          haptic
          disabled={booking}
          onPress={onBookNow}
          accessibilityRole="button"
          accessibilityLabel={bookLabel}
          className={`max-w-[184px] min-w-[152px] flex-row items-center justify-center gap-1 rounded-full px-3.5 shadow-sm ${
            isInstantBooking ? '' : 'bg-primary'
          }`}
          style={{
            height: ACTION_SIZE,
            ...(isInstantBooking ? { backgroundColor: INSTANT_TAB_HEX } : undefined),
          }}>
          {booking ? (
            <ActivityIndicator color={isInstantBooking ? '#fff' : '#000'} />
          ) : (
            <>
              {isInstantBooking ? (
                <Icon as={Zap} className="size-4 text-white" fill="#fff" />
              ) : null}
              <Text
                className={`flex-1 text-center text-sm font-bold ${
                  isInstantBooking ? 'text-white' : 'text-black'
                }`}
                numberOfLines={1}>
                {bookLabel}
              </Text>
              <Icon
                as={ChevronRight}
                className={`size-4 shrink-0 ${isInstantBooking ? 'text-white' : 'text-black'}`}
              />
            </>
          )}
        </ScalePressable>
      </View>
    </View>
  );
}
