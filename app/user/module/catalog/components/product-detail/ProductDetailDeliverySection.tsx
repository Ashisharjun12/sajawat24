import {
  ProductFulfillmentTabs,
  type FulfillmentMode,
} from '@/module/catalog/components/ProductFulfillmentTabs';
import { buildScheduledIso } from '@/module/catalog/lib/time-slots';
import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { INSTANT_TAB_HEX } from '@/lib/theme';
import { CalendarDays, Zap } from 'lucide-react-native';
import { addDays, format, startOfToday } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import {
  ProductDeliveryDateChips,
  type DeliveryDateMode,
} from './ProductDeliveryDateChips';
import { ProductDeliveryEtaBanner } from './ProductDeliveryEtaBanner';
import { ProductDeliveryScheduleDialog } from './ProductDeliveryScheduleDialog';
import { ProductDeliverySlotPicker } from './ProductDeliverySlotPicker';
import { ProductInstantDetails } from './ProductInstantDetails';
type ProductDetailDeliverySectionProps = {
  canInstant: boolean;
  canScheduled: boolean;
  fulfillment: FulfillmentMode;
  onFulfillmentChange: (mode: FulfillmentMode) => void;
  instantLabel?: string | null;
  instantNote?: string | null;
  instantEtaMinutes?: number | null;
  onScheduledAtChange: (iso: string | null) => void;
};

export function ProductDetailDeliverySection({
  canInstant,
  canScheduled,
  fulfillment,
  onFulfillmentChange,
  instantLabel,
  instantNote,
  instantEtaMinutes,
  onScheduledAtChange,
}: ProductDetailDeliverySectionProps) {
  const today = useMemo(() => startOfToday(), []);
  const [dateMode, setDateMode] = useState<DeliveryDateMode | null>(null);
  const [selectedDate, setSelectedDate] = useState(today);
  const [slotId, setSlotId] = useState('9-12');
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const isInstantBooking = fulfillment === 'instant' && canInstant;
  const isLater = dateMode === 'later';

  const dialogInitialDate = useMemo(() => {
    if (dateMode === 'later') return selectedDate;
    return addDays(today, 2);
  }, [dateMode, selectedDate, today]);

  const openLaterDialog = useCallback(() => {
    setScheduleDialogOpen(true);
  }, []);

  const handleDateConfirm = useCallback((date: Date) => {
    setSelectedDate(date);
    setDateMode('later');
  }, []);

  const handleSelectMode = useCallback(
    (mode: DeliveryDateMode) => {
      setDateMode(mode);
      if (mode === 'today') setSelectedDate(today);
      if (mode === 'tomorrow') setSelectedDate(addDays(today, 1));
    },
    [today],
  );

  const dateChosen = dateMode != null;

  useEffect(() => {
    if (isInstantBooking || !canScheduled || !dateChosen) {
      onScheduledAtChange(null);
      return;
    }
    onScheduledAtChange(buildScheduledIso(selectedDate, slotId));
  }, [isInstantBooking, canScheduled, dateChosen, selectedDate, slotId, onScheduledAtChange]);

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
      ) : canScheduled ? (
        <View className="gap-4 overflow-hidden rounded-2xl border border-border/80 bg-card px-4 py-4 shadow-sm">
          <View className="flex-row items-start gap-3">
            <View className="size-10 shrink-0 items-center justify-center rounded-full bg-emerald-600/15">
              <Icon as={CalendarDays} className="size-4 text-emerald-600" />
            </View>
            <View className="min-w-0 flex-1 gap-0.5">
              <Text className="text-foreground text-base font-semibold">Choose Date & Time</Text>
              <Text className="text-muted-foreground text-sm">When should we arrive to set up?</Text>
            </View>
          </View>
          <ProductDeliveryDateChips
            mode={dateMode}
            selectedDate={selectedDate}
            onSelectMode={handleSelectMode}
            onOpenLater={openLaterDialog}
          />

          {isLater ? (
            <View className="flex-row items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary-tint px-2.5 py-2">
              <Text className="text-foreground min-w-0 flex-1 text-xs font-medium">
                {format(selectedDate, 'EEE, d MMM yyyy')}
              </Text>
              <ScalePressable haptic onPress={openLaterDialog} accessibilityRole="button">
                <Text className="text-primary text-xs font-semibold">Change</Text>
              </ScalePressable>
            </View>
          ) : null}

          {dateChosen ? (
            <>
              <ProductDeliverySlotPicker slotId={slotId} onSlotChange={setSlotId} />
              <ProductDeliveryEtaBanner />
            </>
          ) : null}

          <ProductDeliveryScheduleDialog
            open={scheduleDialogOpen}
            onOpenChange={setScheduleDialogOpen}
            initialDate={dialogInitialDate}
            onConfirm={handleDateConfirm}
          />
        </View>
      ) : null}
    </View>
  );
}
