import { resolvePincode } from '@/api/geo.api';
import type { FulfillmentMode } from '@/module/catalog/components/ProductFulfillmentTabs';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IndiaFlag } from '@/components/ui/india-flag';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { lightImpact } from '@/lib/light-haptic';
import { useThemeColors } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { useLocationStore } from '@/store/location.store';
import { CalendarDays, CircleAlert, CircleCheck, MapPin, Zap } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Keyboard, Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
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

type PinLookup = {
  deliverable?: boolean;
  reason?: string;
  /** "Patna, Bihar" — where Ola Maps puts this pincode. */
  area?: string | null;
  city?: { id?: string; name?: string } | null;
};

type PinResult =
  | { tone: 'ok'; text: string }
  | { tone: 'error'; text: string }
  /** Pincode is in another city we serve: offer to switch. */
  | { tone: 'switch'; text: string; city: { id: string; name: string } };

/**
 * Delivery pincode + Check. The server asks Ola Maps which city the pincode is in and
 * matches it to an admin city:
 * - same city as the one being browsed → "we deliver", pincode saved;
 * - another city we serve → "800002 is in Patna" + Switch button;
 * - city not served / unknown pincode → "we don't deliver there yet".
 */
function DeliveryPincodeField() {
  const city = useLocationStore((s) => s.city);
  const storedPin = useLocationStore((s) => s.pincode?.code);
  const setLocation = useLocationStore((s) => s.setLocation);

  const [pin, setPin] = useState(() => (storedPin ?? '').replace(/\D/g, '').slice(0, PIN_LENGTH));
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<PinResult | null>(null);
  const [switching, setSwitching] = useState(false);
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

    let result: PinResult;
    try {
      const data = (await resolvePincode(pin, { cityId: city?.id })) as PinLookup | null;
      if (requestId !== requestRef.current) return; // edited while checking
      const where = data?.area ? ` (${data.area})` : '';
      const realCity =
        data?.city?.id && data.city.name ? { id: data.city.id, name: data.city.name } : null;

      if (data?.deliverable && realCity) {
        await setLocation({ city: realCity, pincode: { code: pin }, source: 'pincode' });
        result = { tone: 'ok', text: `Great news, we deliver to ${pin}, ${realCity.name}` };
      } else if (data?.reason === 'pincode_city_mismatch' && realCity) {
        result = {
          tone: 'switch',
          text: `${pin} is in ${realCity.name}. We deliver there — switch to ${realCity.name} to book.`,
          city: realCity,
        };
      } else if (data?.reason === 'unknown_pin') {
        result = { tone: 'error', text: `We couldn't find pincode ${pin}. Please check it.` };
      } else {
        result = { tone: 'error', text: `Sorry, we don't deliver to ${pin}${where} yet.` };
      }
    } catch {
      result = { tone: 'error', text: "Couldn't check this pincode. Please try again." };
    }
    if (requestId !== requestRef.current) return;
    setChecking(false);
    setMessage(result);
  }

  async function switchCity(target: { id: string; name: string }) {
    setSwitching(true);
    try {
      // Prices and availability on this page reload for the new city.
      await setLocation({ city: target, pincode: { code: pin }, source: 'pincode' });
      setMessage({ tone: 'ok', text: `Great news, we deliver to ${pin}, ${target.name}` });
    } finally {
      setSwitching(false);
    }
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
        <View className="gap-2" accessibilityLiveRegion="polite" accessibilityLabel={message.text}>
          <View className="flex-row items-start gap-1.5">
            <Icon
              as={message.tone === 'ok' ? CircleCheck : message.tone === 'switch' ? MapPin : CircleAlert}
              className={cn(
                'mt-0.5 size-4',
                message.tone === 'ok'
                  ? 'text-primary'
                  : message.tone === 'switch'
                    ? 'text-foreground'
                    : 'text-destructive',
              )}
            />
            <Text
              className={cn(
                'min-w-0 flex-1 text-sm font-medium',
                message.tone === 'ok'
                  ? 'text-primary'
                  : message.tone === 'switch'
                    ? 'text-foreground'
                    : 'text-destructive',
              )}>
              {message.text}
            </Text>
          </View>
          {message.tone === 'switch' ? (
            <Button
              variant="secondary"
              size="sm"
              className="self-start"
              loading={switching}
              onPress={() => void switchCity(message.city)}>
              <Text>Switch to {message.city.name}</Text>
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** Height of the visible 3D edge under a raised button. */
const RAISE = 4;
/** How far the face sinks when pressed (leaves 1px of edge). */
const PRESS_DEPTH = 3;
const FACE_RADIUS = 12;

/** "Book a slot" yellow: face + darker edge + dark brown text (reads well on yellow). */
const SLOT_FACE = '#FACC15';
const SLOT_EDGE = '#CA8A04';
const SLOT_TEXT = '#422006';
const SLOT_SUBTEXT = '#713F12';
const INSTANT_EDGE = '#9F1239';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Raised "key cap" button: a solid face sitting on a darker edge. Selected = full colour
 * (yellow for Book a slot, crimson for Instant); unselected = white face on a light edge.
 * Pressing sinks the face onto the edge, so it feels like a physical button.
 */
function FulfillmentCard({
  title,
  subtitle,
  icon: IconComponent,
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
  const theme = useThemeColors();
  const isInstant = tone === 'instant';
  const sink = useSharedValue(0);

  const faceMotion = useAnimatedStyle(() => ({
    transform: [{ translateY: sink.value }],
  }));

  const palette = selected
    ? isInstant
      ? {
          face: theme.instant,
          edge: INSTANT_EDGE,
          title: '#FFFFFF',
          subtitle: 'rgba(255,255,255,0.85)',
          icon: '#FFFFFF',
        }
      : {
          face: SLOT_FACE,
          edge: SLOT_EDGE,
          title: SLOT_TEXT,
          subtitle: SLOT_SUBTEXT,
          icon: SLOT_TEXT,
        }
    : {
        face: theme.card,
        edge: theme.border,
        title: theme.foreground,
        subtitle: theme.mutedForeground,
        icon: isInstant ? theme.instant : SLOT_EDGE,
      };

  return (
    <View className="flex-1" style={{ marginBottom: RAISE }}>
      {/* Edge layer: sits RAISE px lower than the face, so only a bottom strip shows. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: RAISE,
          bottom: -RAISE,
          left: 0,
          right: 0,
          borderRadius: FACE_RADIUS,
          backgroundColor: palette.edge,
        }}
      />
      <AnimatedPressable
        onPress={() => {
          lightImpact();
          onPress();
        }}
        onPressIn={() => {
          sink.value = withTiming(PRESS_DEPTH, { duration: 70 });
        }}
        onPressOut={() => {
          sink.value = withTiming(0, { duration: 140 });
        }}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={`${title}, ${subtitle}`}
        style={[
          {
            minHeight: 64,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: FACE_RADIUS,
            backgroundColor: palette.face,
            borderWidth: 1,
            borderColor: selected ? 'transparent' : theme.border,
            // Soft top highlight on a selected face = light catching the top edge.
            borderTopColor: selected ? 'rgba(255,255,255,0.45)' : theme.border,
          },
          faceMotion,
        ]}>
        <View className="flex-row items-center gap-1.5">
          <IconComponent
            size={16}
            color={palette.icon}
            fill={selected && isInstant ? palette.icon : 'transparent'}
          />
          <Text className="text-[15px] font-semibold" style={{ color: palette.title }}>
            {title}
          </Text>
        </View>
        <Text className="text-xs" style={{ color: palette.subtitle }}>
          {subtitle}
        </Text>
      </AnimatedPressable>
    </View>
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
            <Text className="text-muted-foreground text-sm">Choose booking type</Text>
          </View>
          <View className="flex-row gap-3">
            {canScheduled ? (
              <FulfillmentCard
                title="Book a slot"
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
