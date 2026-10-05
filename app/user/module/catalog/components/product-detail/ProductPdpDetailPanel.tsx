import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type {
  PdpDetailTabId,
  PdpPackageDetailTabMeta,
} from '@/module/catalog/lib/pdp-package-detail-tabs';
import type { ProductFaq } from '@/module/catalog/lib/product-pdp-helpers';
import { cn } from '@/lib/utils';
import { Check, CircleHelp, Sparkles, Truck } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

export type { PdpDetailTabId };

type ProductPdpDetailPanelProps = {
  tab: PdpDetailTabId;
  tabMeta: PdpPackageDetailTabMeta;
  itemCount?: number;
  countLabel?: string | null;
  includePoints: string[];
  faqItems: ProductFaq[];
  deliveryPoints: string[];
  carePoints: string[];
};

function nonEmptyLines(items: string[]) {
  return items.map((line) => line.trim()).filter(Boolean);
}

function validFaqs(items: ProductFaq[]) {
  return items.filter((item) => item.question?.trim() && item.answer?.trim());
}

function PanelHeader({ title, countLabel }: { title: string; countLabel?: string | null }) {
  return (
    <View className="mb-3 flex-row flex-wrap items-center justify-between gap-2">
      <Text className="text-foreground text-base font-semibold">{title}</Text>
      {countLabel ? (
        <View className="rounded-full bg-primary/10 px-2.5 py-0.5">
          <Text className="text-primary text-xs font-semibold">{countLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

function IncludedList({ items }: { items: string[] }) {
  const lines = nonEmptyLines(items);
  if (!lines.length) {
    return <Text className="text-muted-foreground text-sm">No details available.</Text>;
  }
  return (
    <View className="gap-3">
      {lines.map((point, index) => (
        <View key={`${index}-${point}`} className="flex-row gap-2.5">
          <View className="mt-0.5 size-5 shrink-0 items-center justify-center rounded-full bg-emerald-600">
            <Icon as={Check} className="size-3.5 text-white" strokeWidth={3} />
          </View>
          <Text className="text-foreground min-w-0 flex-1 text-sm leading-snug">{point}</Text>
        </View>
      ))}
    </View>
  );
}

function IconBulletList({
  items,
  emptyLabel,
  lineIcon,
  iconClassName,
  iconColorClassName,
}: {
  items: string[];
  emptyLabel: string;
  lineIcon: LucideIcon;
  iconClassName: string;
  iconColorClassName: string;
}) {
  const lines = nonEmptyLines(items);
  if (!lines.length) {
    return <Text className="text-muted-foreground text-sm">{emptyLabel}</Text>;
  }
  return (
    <View className="gap-3">
      {lines.map((point, index) => (
        <View key={`${index}-${point}`} className="flex-row gap-2.5">
          <View className={cn('mt-0.5 size-5 shrink-0 items-center justify-center rounded-full', iconClassName)}>
            <Icon as={lineIcon} className={cn('size-3', iconColorClassName)} />
          </View>
          <Text className="text-foreground min-w-0 flex-1 text-sm leading-snug">{point}</Text>
        </View>
      ))}
    </View>
  );
}

function FaqList({ items }: { items: ProductFaq[] }) {
  const faqs = validFaqs(items);
  if (!faqs.length) {
    return <Text className="text-muted-foreground text-sm">No FAQs available.</Text>;
  }
  return (
    <Accordion type="multiple" className="gap-2">
      {faqs.map((item, index) => (
        <AccordionItem
          key={item.key ?? `${index}-${item.question}`}
          value={item.key ?? String(index)}
          className="mb-0 overflow-hidden rounded-2xl border-0 bg-muted/80">
          <AccordionTrigger className="px-3 py-3">
            <View className="min-w-0 flex-1 flex-row items-center gap-2 pr-2">
              <Icon as={CircleHelp} className="size-4 shrink-0 text-violet-600" />
              <Text className="text-foreground min-w-0 flex-1 text-left text-sm font-medium">
                {item.question?.trim()}
              </Text>
            </View>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-3">
            <Text className="text-muted-foreground pl-6 text-sm leading-relaxed">
              {item.answer?.trim()}
            </Text>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function ProductPdpDetailPanel({
  tab,
  tabMeta,
  countLabel,
  includePoints,
  faqItems,
  deliveryPoints,
  carePoints,
}: ProductPdpDetailPanelProps) {
  return (
    <View>
      <PanelHeader title={tabMeta.panelTitle} countLabel={countLabel} />
      {tab === 'includes' ? <IncludedList items={includePoints} /> : null}
      {tab === 'faqs' ? <FaqList items={faqItems} /> : null}
      {tab === 'delivery' ? (
        <IconBulletList
          items={deliveryPoints}
          emptyLabel="No delivery details yet."
          lineIcon={Truck}
          iconClassName="bg-sky-600/15"
          iconColorClassName="text-sky-700"
        />
      ) : null}
      {tab === 'care' ? (
        <IconBulletList
          items={carePoints}
          emptyLabel="No care instructions yet."
          lineIcon={Sparkles}
          iconClassName="bg-amber-600/15"
          iconColorClassName="text-amber-800"
        />
      ) : null}
    </View>
  );
}
