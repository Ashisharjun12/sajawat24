import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { buildAddonFilterTabs } from '@/module/catalog/lib/addon-selection';
import type { PublicAddonForCity } from '@/module/catalog/lib/product-detail';
import { Gift } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Dimensions, FlatList, ScrollView, View } from 'react-native';
import {
  ADDON_CARD_GAP,
  ProductAddonCustomizeCard,
  getAddonCustomizeCardHeight,
  getAddonRailSnapInterval,
} from './ProductAddonCustomizeCard';

const CARD_GAP = ADDON_CARD_GAP;
/** ~9.5rem — matches web PDP addon rail card width */
const PDP_ADDON_CARD_WIDTH = 152;
const PDP_SCROLL_HORIZONTAL_PADDING = 20;
const SECTION_HORIZONTAL_PADDING = 16;

function addonSectionContentWidth(windowWidth = Dimensions.get('window').width) {
  return windowWidth - PDP_SCROLL_HORIZONTAL_PADDING * 2 - SECTION_HORIZONTAL_PADDING * 2;
}

type ProductPdpAddonsSectionProps = {
  addons: PublicAddonForCity[];
  qtyById: Record<string, number>;
  disabled?: boolean;
  onSetQty: (addonId: string, qty: number) => void;
  onToggle: (addon: PublicAddonForCity) => void;
  onIncrement: (addon: PublicAddonForCity) => void;
};

export function ProductPdpAddonsSection({
  addons,
  qtyById,
  disabled = false,
  onSetQty,
  onToggle,
  onIncrement,
}: ProductPdpAddonsSectionProps) {
  const tabs = useMemo(() => buildAddonFilterTabs(addons), [addons]);
  const [activeTab, setActiveTab] = useState('all');
  const [expanded, setExpanded] = useState(false);

  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  const visibleAddons = useMemo(
    () => addons.filter((addon) => active.filter(addon)),
    [addons, active],
  );

  const cardWidth = PDP_ADDON_CARD_WIDTH;
  const listMinHeight = getAddonCustomizeCardHeight(cardWidth);
  const snapInterval = getAddonRailSnapInterval(cardWidth);

  const gridCardWidth = useMemo(() => {
    const contentWidth = addonSectionContentWidth();
    return (contentWidth - CARD_GAP) / 2;
  }, []);

  if (!addons.length) return null;

  return (
    <View className="rounded-3xl border border-border/80 bg-card px-4 py-4 shadow-sm">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row items-start gap-2.5">
          <View
            className="size-9 shrink-0 items-center justify-center rounded-full bg-sky-50 dark:bg-sky-950/40"
            accessibilityElementsHidden>
            <Icon as={Gift} className="size-4 text-rose-500" />
          </View>
          <View className="min-w-0 flex-1 gap-0.5">
            <Text className="text-foreground text-lg font-semibold tracking-tight">Make it yours</Text>
            <Text className="text-muted-foreground text-sm">Optional extras. Add only what you love.</Text>
          </View>
        </View>
        {addons.length > 3 ? (
          <ScalePressable haptic onPress={() => setExpanded((value) => !value)}>
            <Text className="text-primary text-sm font-semibold">
              {expanded ? 'Show less' : 'See all'} →
            </Text>
          </ScalePressable>
        ) : null}
      </View>

      {tabs.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4 border-b border-border/60"
          contentContainerStyle={{ gap: 16, paddingBottom: 0 }}>
          {tabs.map((tab) => {
            const selected = tab.id === activeTab;
            return (
              <ScalePressable key={tab.id} haptic onPress={() => setActiveTab(tab.id)}>
                <View
                  className={`shrink-0 border-b-2 pb-2.5 ${selected ? 'border-primary' : 'border-transparent'}`}>
                  <Text
                    className={`text-sm font-semibold ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {tab.label}
                  </Text>
                </View>
              </ScalePressable>
            );
          })}
        </ScrollView>
      ) : null}

      {expanded ? (
        <FlatList
          key="addons-grid"
          data={visibleAddons}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          style={{ marginTop: 16, width: addonSectionContentWidth() }}
          columnWrapperStyle={{ gap: CARD_GAP, marginBottom: CARD_GAP }}
          renderItem={({ item: addon }) => (
            <ProductAddonCustomizeCard
              addon={addon}
              width={gridCardWidth}
              qty={qtyById[addon.id] ?? 0}
              submitting={disabled}
              onToggle={onToggle}
              onIncrement={onIncrement}
              onSetQty={onSetQty}
            />
          )}
        />
      ) : (
        <FlatList
          key="addons-rail"
          data={visibleAddons}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={snapInterval}
          snapToAlignment="start"
          disableIntervalMomentum
          nestedScrollEnabled
          style={{ minHeight: listMinHeight, flexGrow: 0, marginTop: 16 }}
          contentContainerStyle={{ gap: CARD_GAP, paddingRight: 4 }}
          renderItem={({ item: addon }) => (
            <ProductAddonCustomizeCard
              addon={addon}
              width={cardWidth}
              qty={qtyById[addon.id] ?? 0}
              submitting={disabled}
              onToggle={onToggle}
              onIncrement={onIncrement}
              onSetQty={onSetQty}
            />
          )}
        />
      )}

      <Text className="text-muted-foreground mt-4 text-center text-xs">
        Extras are optional — you can skip this
      </Text>
    </View>
  );
}
