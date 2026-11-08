import type { FulfillmentMode } from '@/module/catalog/components/ProductFulfillmentTabs';
import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { IndiaFlag } from '@/components/ui/india-flag';
import { Text } from '@/components/ui/text';
import { SELECT_LOCATION_HREF } from '@/lib/select-location-route';
import { INSTANT_TAB_HEX } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { useDeliveryLocationStore } from '@/store/delivery-location.store';
import { CheckoutAddressPickerSheet } from '@/module/booking/components/checkout/CheckoutAddressPickerSheet';
import { useAuthStore } from '@/store/auth.store';
import { useLocationStore } from '@/store/location.store';
import { type Href, router } from 'expo-router';
import { CalendarDays, ChevronDown, MapPin, Zap } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { ProductInstantDetails } from './ProductInstantDetails';

type ProductDetailDeliverySectionProps = {
  canInstant: boolean;
  canScheduled: boolean;
  fulfillment: FulfillmentMode;
  onFulfillmentChange: (mode: FulfillmentMode) => void;
  instantLabel?: string | null;
  instantNote?: string | null;
  instantEtaMinutes?: number | null;
  /** After adding an address, the flow returns to this product page. */
  productId?: string | null;
};

const ETA_FALLBACK = 15;

/** "Ashish-800001, Patna" style line from the saved delivery address, else city + pincode. */
function useDeliveryLocationLine() {
  const snapshot = useDeliveryLocationStore((s) => s.snapshot);
  const city = useLocationStore((s) => s.city);
  const pincode = useLocationStore((s) => s.pincode);

  if (snapshot) {
    const head = [snapshot.label?.trim(), snapshot.pincode?.trim()].filter(Boolean).join('-');
    return [head, snapshot.cityName?.trim()].filter(Boolean).join(', ');
  }
  const parts = [pincode?.code, city?.name].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Set delivery location';
}

function DeliveryLocationField({ returnHref }: { returnHref?: Href }) {
  const line = useDeliveryLocationLine();
  const user = useAuthStore((s) => s.user);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Signed in: pick a saved address in a sheet (with Add address). Signed out: city picker.
  function onPress() {
    if (!user) {
      router.push(SELECT_LOCATION_HREF);
      return;
    }
    setPickerOpen(true);
  }

  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-1.5">
        <Icon as={MapPin} className="size-4 text-muted-foreground" />
        <Text className="text-muted-foreground text-sm">Delivery location</Text>
      </View>
      <ScalePressable
        onPress={onPress}
        haptic
        className="min-h-12 flex-row items-center gap-3 rounded-xl border border-border bg-card px-3.5"
        accessibilityRole="button"
        accessibilityLabel={`Delivery location: ${line}. Change`}>
        <IndiaFlag width={24} />
        <Text className="text-foreground min-w-0 flex-1 text-sm font-medium" numberOfLines={1}>
          {line}
        </Text>
        <Icon as={ChevronDown} className="size-5 text-foreground" />
      </ScalePressable>
      {user ? (
        <CheckoutAddressPickerSheet
          visible={pickerOpen}
          onClose={() => setPickerOpen(false)}
          subtitle="Choose where this setup should be delivered."
          addAddressReturnHref={returnHref}
        />
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

/** "Choose delivery preference" — location field + Schedule / Instant cards. */
export function ProductDetailDeliverySection({
  canInstant,
  canScheduled,
  fulfillment,
  onFulfillmentChange,
  instantLabel,
  instantNote,
  instantEtaMinutes,
  productId,
}: ProductDetailDeliverySectionProps) {
  const isInstantBooking = fulfillment === 'instant' && canInstant;
  const eta = instantEtaMinutes ?? ETA_FALLBACK;

  return (
    <View className="gap-4">
      <Text className="text-foreground text-lg font-semibold">Choose delivery preference</Text>

      <DeliveryLocationField returnHref={productId ? (`/(app)/product/${productId}` as Href) : undefined} />

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
