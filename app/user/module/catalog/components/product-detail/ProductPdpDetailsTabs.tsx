import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { filledFaqs, filledPoints } from '@/module/catalog/lib/product-pdp-helpers';
import type { ProductFaq } from '@/module/catalog/lib/product-pdp-helpers';
import {
  PDP_PACKAGE_DETAIL_TABS,
  pdpDetailCountLabel,
  type PdpDetailTabId,
} from '@/module/catalog/lib/pdp-package-detail-tabs';
import { ProductPdpDetailPanel } from '@/module/catalog/components/product-detail/ProductPdpDetailPanel';
import { CircleHelp, Package, Sparkles, Truck } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

type ProductPdpDetailsTabsProps = {
  includes?: unknown[] | null;
  faqs?: ProductFaq[] | null;
  deliverySetup?: unknown[] | null;
  careInstructions?: unknown[] | null;
};

const TAB_ICONS: Record<PdpDetailTabId, LucideIcon> = {
  includes: Package,
  faqs: CircleHelp,
  delivery: Truck,
  care: Sparkles,
};

const CHIP_LABEL: Record<PdpDetailTabId, { idle: string; active: string }> = {
  includes: { idle: 'text-emerald-900', active: 'text-primary-foreground' },
  faqs: { idle: 'text-violet-900', active: 'text-white' },
  delivery: { idle: 'text-sky-900', active: 'text-white' },
  care: { idle: 'text-amber-950', active: 'text-white' },
};

export function ProductPdpDetailsTabs({
  includes,
  faqs,
  deliverySetup,
  careInstructions,
}: ProductPdpDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<PdpDetailTabId>('includes');

  const includePoints = filledPoints(includes);
  const faqItems = filledFaqs(faqs);
  const deliveryPoints = filledPoints(deliverySetup);
  const carePoints = filledPoints(careInstructions);

  const itemCounts = useMemo(
    () => ({
      includes: includePoints.length,
      faqs: faqItems.length,
      delivery: deliveryPoints.length,
      care: carePoints.length,
    }),
    [includePoints.length, faqItems.length, deliveryPoints.length, carePoints.length],
  );

  const activeMeta =
    PDP_PACKAGE_DETAIL_TABS.find((tab) => tab.id === activeTab) ?? PDP_PACKAGE_DETAIL_TABS[0];
  const countLabel = pdpDetailCountLabel(activeTab, itemCounts[activeTab]);

  return (
    <View className="rounded-3xl border border-border/80 bg-card px-4 py-4 shadow-sm">
      <View className="flex-row items-center gap-2.5">
        <View
          className="size-10 shrink-0 items-center justify-center rounded-full bg-primary/15"
          accessibilityElementsHidden>
          <Icon as={Package} className="size-4 text-primary" />
        </View>
        <Text className="text-foreground text-lg font-semibold tracking-tight">Package details</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-4"
        contentContainerClassName="flex-row gap-2 pb-1">
        {PDP_PACKAGE_DETAIL_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const TabIcon = TAB_ICONS[tab.id];
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              className={cn(
                'shrink-0 flex-row items-center gap-1.5 rounded-btn px-3 py-2',
                isActive ? tab.chipActive : tab.chipIdle,
              )}>
              <Icon
                as={TabIcon}
                className={cn(
                  'size-4 shrink-0',
                  isActive ? CHIP_LABEL[tab.id].active : CHIP_LABEL[tab.id].idle,
                )}
              />
              <Text
                className={cn(
                  'text-sm font-semibold',
                  isActive ? CHIP_LABEL[tab.id].active : CHIP_LABEL[tab.id].idle,
                )}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View className="mt-4 border-t border-border/60 pt-4">
        <ProductPdpDetailPanel
          tab={activeTab}
          tabMeta={activeMeta}
          countLabel={countLabel}
          includePoints={includePoints}
          faqItems={faqItems}
          deliveryPoints={deliveryPoints}
          carePoints={carePoints}
        />
      </View>
    </View>
  );
}
