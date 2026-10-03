import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { filledFaqs, filledPoints } from '@/module/catalog/lib/product-pdp-helpers';
import type { ProductFaq } from '@/module/catalog/lib/product-pdp-helpers';
import {
  ProductPdpDetailPanel,
  type PdpDetailTabId,
} from '@/module/catalog/components/product-detail/ProductPdpDetailPanel';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

type ProductPdpDetailsTabsProps = {
  includes?: unknown[] | null;
  faqs?: ProductFaq[] | null;
  deliverySetup?: unknown[] | null;
  careInstructions?: unknown[] | null;
};

const TABS: { id: PdpDetailTabId; label: string }[] = [
  { id: 'includes', label: "What's included" },
  { id: 'faqs', label: 'FAQs' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'care', label: 'Care' },
];

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

  return (
    <View className="rounded-3xl border border-border bg-card px-4 pb-4 pt-2">
      <View className="border-b border-border">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="min-w-full flex-row">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                className={cn(
                  'items-center border-b-2 px-3 pb-3 pt-1',
                  isActive ? 'border-primary' : 'border-transparent',
                )}>
                <Text
                  className={cn(
                    'text-sm font-semibold',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View className="mt-3">
        <ProductPdpDetailPanel
          tab={activeTab}
          includePoints={includePoints}
          faqItems={faqItems}
          deliveryPoints={deliveryPoints}
          carePoints={carePoints}
        />
      </View>
    </View>
  );
}
