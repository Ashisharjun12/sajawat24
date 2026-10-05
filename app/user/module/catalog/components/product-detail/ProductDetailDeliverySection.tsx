import {
  ProductFulfillmentTabs,
  type FulfillmentMode,
} from '@/module/catalog/components/ProductFulfillmentTabs';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { INSTANT_TAB_HEX } from '@/lib/theme';
import { Zap } from 'lucide-react-native';
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
};

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
  const scheduledOnly = canScheduled && !isInstantBooking;

  return (
    <View className="gap-3">
      {canInstant && canScheduled ? (
        <ProductFulfillmentTabs
          value={fulfillment}
          onChange={onFulfillmentChange}
          instantLabel={instantLabel}
        />
      ) : canInstant && !canScheduled ? (
        <View className="flex-row items-center gap-2 border-b border-border pb-3">
          <Icon as={Zap} className="size-5 shrink-0 text-instant" fill={INSTANT_TAB_HEX} />
          <Text className="text-instant text-sm font-semibold" style={{ color: INSTANT_TAB_HEX }}>
            {(instantLabel ?? 'Instant booking').trim()}
          </Text>
        </View>
      ) : null}

      {isInstantBooking ? (
        <ProductInstantDetails note={instantNote} etaMinutes={instantEtaMinutes} />
      ) : scheduledOnly ? (
        <Text className="text-muted-foreground text-sm leading-relaxed">
          Choose your date and time when you tap Book your setup.
        </Text>
      ) : null}
    </View>
  );
}
