import {
  ProductFulfillmentTabs,
  type FulfillmentMode,
} from '@/module/catalog/components/ProductFulfillmentTabs';
import { buildScheduledIso } from '@/module/catalog/lib/time-slots';
import { ScalePressable } from '@/components/shell';
import { Text } from '@/components/ui/text';
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
      ) : null}

      {isInstantBooking ? (
        <ProductInstantDetails note={instantNote} etaMinutes={instantEtaMinutes} />
      ) : canScheduled ? (
        <View className="gap-3 rounded-xl border border-primary/15 bg-primary/5 px-3 py-3">
          <ProductDeliveryDateChips
            mode={dateMode}
            selectedDate={selectedDate}
            onSelectMode={handleSelectMode}
            onOpenLater={openLaterDialog}
          />

          {isLater ? (
            <View className="flex-row items-center justify-between gap-2 rounded-lg border border-sky-200/80 bg-sky-50 px-2.5 py-2 dark:border-sky-900 dark:bg-sky-950/40">
              <Text className="text-sky-900 min-w-0 flex-1 text-xs font-medium dark:text-sky-100">
                {format(selectedDate, 'EEE, d MMM yyyy')}
              </Text>
              <ScalePressable haptic onPress={openLaterDialog} accessibilityRole="button">
                <Text className="text-sky-800 text-xs font-semibold dark:text-sky-300">Change</Text>
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
