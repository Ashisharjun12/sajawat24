import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { HomeBottomSheetModal } from '@/module/home/components/HomeBottomSheetModal';
import {
  ADDON_CARD_GAP,
  getAddonCustomizeCardHeight,
  getAddonRailSnapInterval,
  ProductAddonCustomizeCard,
} from './ProductAddonCustomizeCard';
import type { PublicAddonForCity } from '@/module/catalog/lib/product-detail';
import type { AddonSelection } from './use-product-addon-selection';
import { useMemo } from 'react';
import { Dimensions, FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SHEET_HORIZONTAL_PADDING = 20;

const CARD_GAP = ADDON_CARD_GAP;
const VISIBLE_ADDON_COLUMNS = 2;
const SHEET_MIN_HEIGHT_RATIO = 0.5;

/** Two cards + one gap fill the sheet content width (symmetric side padding). */
export function getAddonCustomizeCardWidth(windowWidth = Dimensions.get('window').width) {
  const contentWidth = windowWidth - SHEET_HORIZONTAL_PADDING * 2;
  const totalGap = CARD_GAP * (VISIBLE_ADDON_COLUMNS - 1);
  return (contentWidth - totalGap) / VISIBLE_ADDON_COLUMNS;
}

type ProductCustomizeSheetProps = {
  visible: boolean;
  addons: PublicAddonForCity[];
  qtyById: Record<string, number>;
  submitting: boolean;
  onClose: () => void;
  onSetQty: (addonId: string, qty: number) => void;
  onToggle: (addon: PublicAddonForCity) => void;
  onIncrement: (addon: PublicAddonForCity) => void;
  onSkip: () => void;
  onProceed: (selections: AddonSelection[]) => void;
  buildSelections: () => AddonSelection[];
};

export function ProductCustomizeSheet({
  visible,
  addons,
  qtyById,
  submitting,
  onClose,
  onSetQty,
  onToggle,
  onIncrement,
  onSkip,
  onProceed,
  buildSelections,
}: ProductCustomizeSheetProps) {
  const { cardWidth, sheetMinHeight, snapInterval } = useMemo(() => {
    const { height, width } = Dimensions.get('window');
    const w = getAddonCustomizeCardWidth(width);
    return {
      cardWidth: w,
      sheetMinHeight: height * SHEET_MIN_HEIGHT_RATIO,
      snapInterval: getAddonRailSnapInterval(w),
    };
  }, []);
  const insets = useSafeAreaInsets();
  const selectedTotal = Object.values(qtyById).reduce((sum, n) => sum + n, 0);
  const listMinHeight = getAddonCustomizeCardHeight(cardWidth);

  return (
    <HomeBottomSheetModal
      visible={visible}
      onClose={onClose}
      sheetMinHeight={sheetMinHeight}
      closeAccessibilityLabel="Close add extras">
      <View className="px-5 pt-4">
        <Text className="text-foreground text-lg font-semibold">Add extras</Text>
        <Text className="text-muted-foreground mt-0.5 text-sm">Optional add-ons for your setup</Text>
      </View>

      <FlatList
        data={addons}
        keyExtractor={(item) => item.id}
        horizontal
        scrollEnabled={addons.length > VISIBLE_ADDON_COLUMNS}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="start"
        disableIntervalMomentum
        style={{ minHeight: listMinHeight, flexGrow: 0 }}
        contentContainerStyle={{
          paddingHorizontal: SHEET_HORIZONTAL_PADDING,
          paddingTop: 16,
          paddingBottom: 20,
          gap: CARD_GAP,
          alignItems: 'stretch',
        }}
        renderItem={({ item: addon }) => (
          <ProductAddonCustomizeCard
            addon={addon}
            width={cardWidth}
            qty={qtyById[addon.id] ?? 0}
            submitting={submitting}
            onToggle={onToggle}
            onIncrement={onIncrement}
            onSetQty={onSetQty}
          />
        )}
      />

      <View
        className="gap-3 border-t border-border/60 bg-muted/30 px-5 pt-4"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <View className="flex-row items-center justify-between gap-3">
          <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-wide">
            Selected
          </Text>
          <Text className="text-foreground text-base font-semibold">
            {selectedTotal} add-on{selectedTotal === 1 ? '' : 's'}
          </Text>
        </View>
        <View className="flex-row gap-2">
          <Button variant="secondary" className="flex-1 rounded-full" disabled={submitting} onPress={onSkip}>
            <Text>Skip</Text>
          </Button>
          <Button
            className="flex-1 rounded-full bg-primary"
            disabled={submitting}
            onPress={() => {
              const selections = buildSelections();
              if (selections.length === 0) {
                onSkip();
                return;
              }
              onProceed(selections);
            }}>
            <Text className="text-primary-foreground font-bold">
              {submitting ? 'Adding…' : 'Add to bag'}
            </Text>
          </Button>
        </View>
      </View>
    </HomeBottomSheetModal>
  );
}
