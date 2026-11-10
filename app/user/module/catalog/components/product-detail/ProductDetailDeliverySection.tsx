import { resolvePincode } from '@/api/geo.api';
import type { FulfillmentMode } from '@/module/catalog/components/ProductFulfillmentTabs';
import { ScalePressable } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IndiaFlag } from '@/components/ui/india-flag';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { INSTANT_TAB_HEX } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { useLocationStore } from '@/store/location.store';
import { CalendarDays, CircleCheck, Zap } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Keyboard, View } from 'react-native';
import { ProductInstantDetails } from './ProductInstantDetails';

type ProductDetailDeliverySectionProps = {
  canInstant: boolean;
  canScheduled: boolean;
  fulfillment: FulfillmentMode;
  onFulfillmentChange: (mode: FulfillmentMode) => void;
  instantLabel?: string | null;
  instantNote?: string | null;
  instantEtaMinutes?: number | null;
};

const ETA_FALLBACK = 15;
const PIN_LENGTH = 6;

type PinLookup = { deliverable?: boolean; city?: { id?: string; name?: string } };

/**
 * Delivery pincode + green Check button. For now every valid 6-digit pincode gets the
 * "we deliver" message. If the lookup confirms the pincode is served in the city the user is
 * already browsing, it is also saved so prices and availability follow it; otherwise the saved
 * location is left alone (checkout still validates the delivery PIN).
 */
function DeliveryPincodeField() {
  const city = useLocationStore((s) => s.city);
  const storedPin = useLocationStore((s) => s.pincode?.code);
  const setLocation = useLocationStore((s) => s.setLocation);

  const [pin, setPin] = useState(() => (storedPin ?? '').replace(/\D/g, '').slice(0, PIN_LENGTH));
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  /** Bumped on every edit/check so a lookup that finishes late is ignored. */
  const requestRef = useRef(0);

  function onChangePin(text: string) {
    requestRef.current += 1;
    setChecking(false);
    setMessage(null);
    setPin(text.replace(/\D/g, '').slice(0, PIN_LENGTH));
  }

  async function onCheck() {
    if (pin.length !== PIN_LENGTH || checking) return;
    Keyboard.dismiss();
    const requestId = ++requestRef.current;
    setChecking(true);
    setMessage(null);

    let text = `Great news, we deliver to ${pin}`;
    try {
      const data = (await resolvePincode(pin, { cityId: city?.id })) as PinLookup | null;
      if (requestId !== requestRef.current) return; // edited while checking
      if (city && data?.deliverable && data.city?.id === city.id) {
        await setLocation({ city, pincode: { code: pin }, source: 'pincode' });
        text = `Great news, we deliver to ${pin}, ${city.name}`;
      }
    } catch {
      // Lookup unavailable: keep the friendly message and leave the saved location unchanged.
    }
    if (requestId !== requestRef.current) return;
    setChecking(false);
    setMessage(text);
  }

  const ready = pin.length === PIN_LENGTH;

  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-3">
        <View className="relative min-w-0 flex-1">
          <Input
            value={pin}
            onChangeText={onChangePin}
            onSubmitEditing={() => void onCheck()}
            placeholder="Delivery pincode"
            keyboardType="number-pad"
            returnKeyType="done"
            maxLength={PIN_LENGTH}
            autoComplete="postal-code"
            textContentType="postalCode"
            className="pl-12"
            accessibilityLabel="Delivery pincode"
          />
          {/* Flag sits inside the field; it must not swallow taps meant for the input. */}
          <View
            pointerEvents="none"
            className="absolute bottom-0 left-3.5 top-0 justify-center">
            <IndiaFlag width={24} />
          </View>
        </View>
        <Button
          variant="primary"
          className="px-6"
          onPress={() => void onCheck()}
          disabled={!ready}
          loading={checking}
          accessibilityLabel="Check delivery for this pincode">
          <Text>Check</Text>
        </Button>
      </View>
      {message ? (
        <View
          className="flex-row items-center gap-1.5"
          accessibilityLiveRegion="polite"
          accessibilityLabel={message}>
          <Icon as={CircleCheck} className="size-4 text-primary" />
          <Text className="text-primary min-w-0 flex-1 text-sm font-medium">{message}</Text>
        </View>
      ) : null}
    </View>
  );
}

function FulfillmentCard({
  title,
  subtitle,
  icon,
  selected,
  tone,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: typeof CalendarDays;
  selected: boolean;
  tone: 'primary' | 'instant';
  onPress: () => void;
}) {
  const isInstant = tone === 'instant';
  const activeText = isInstant ? 'text-instant' : 'text-primary';

  return (
    <ScalePressable
      onPress={onPress}
      haptic
      className={cn(
        'min-h-16 flex-1 items-center justify-center gap-0.5 rounded-xl border px-3 py-2.5',
        selected
          ? isInstant
            ? 'border-instant bg-instant/10'
            : 'border-primary bg-primary/10'
          : 'border-border bg-card',
      )}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}, ${subtitle}`}>
      <View className="flex-row items-center gap-1.5">
        <Icon
          as={icon}
          className={cn('size-4', selected ? activeText : 'text-foreground')}
          fill={selected && isInstant ? INSTANT_TAB_HEX : 'transparent'}
        />
        <Text className={cn('text-[15px] font-semibold', selected ? activeText : 'text-foreground')}>
          {title}
        </Text>
      </View>
      <Text className="text-muted-foreground text-xs">{subtitle}</Text>
    </ScalePressable>
  );
}

/** "Where & when?" — delivery pincode check + Schedule / Instant cards. */
export function ProductDetailDeliverySection({
  canInstant,
  canScheduled,
  fulfillment,
  onFulfillmentChange,
  instantLabel,
  instantNote,
  instantEtaMinutes,
}: ProductDetailDeliverySectionProps) {
  const isInstantBooking = fulfillment === 'instant' && canInstant;
  const eta = instantEtaMinutes ?? ETA_FALLBACK;

  return (
    // Full width: cancel the PDP's 20px side padding so the white panel spans edge to edge
    // (same panel as "Make it yours" / "About this package").
    <View className="-mx-5 gap-4 border-y border-border/80 bg-card px-5 py-4">
      <View className="flex-row items-center gap-2.5">
        <View className="size-7 items-center justify-center rounded-full bg-primary">
          <Text className="text-primary-foreground text-sm font-bold">1</Text>
        </View>
        <Text className="text-foreground text-lg font-semibold">Where &amp; when?</Text>
      </View>

      <DeliveryPincodeField />

      {canScheduled || canInstant ? (
        <View className="gap-2">
          <View className="flex-row items-center gap-1.5">
            <Icon as={CalendarDays} className="size-4 text-muted-foreground" />
            <Text className="text-muted-foreground text-sm">Choose delivery type</Text>
          </View>
          <View className="flex-row gap-3">
            {canScheduled ? (
              <FulfillmentCard
                title="Schedule"
                subtitle="Pick date & time"
                icon={CalendarDays}
                tone="primary"
                selected={!isInstantBooking}
                onPress={() => onFulfillmentChange('scheduled')}
              />
            ) : null}
            {canInstant ? (
              <FulfillmentCard
                title={(instantLabel ?? 'Instant').trim() || 'Instant'}
                subtitle={`In ~${eta} min`}
                icon={Zap}
                tone="instant"
                selected={isInstantBooking}
                onPress={() => onFulfillmentChange('instant')}
              />
            ) : null}
          </View>
        </View>
      ) : null}

      {isInstantBooking ? (
        <ProductInstantDetails note={instantNote} etaMinutes={instantEtaMinutes} />
      ) : null}
    </View>
  );
}
