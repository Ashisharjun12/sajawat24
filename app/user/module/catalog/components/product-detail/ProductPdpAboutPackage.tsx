import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Gift } from 'lucide-react-native';
import { View } from 'react-native';

type ProductPdpAboutPackageProps = {
  description?: string | null;
};

export function ProductPdpAboutPackage({ description }: ProductPdpAboutPackageProps) {
  const text = (description ?? '').trim();
  if (!text) return null;

  return (
    <Accordion type="single" collapsible className="rounded-3xl border border-border bg-card px-4">
      <AccordionItem value="about">
        <AccordionTrigger className="py-3">
          <View className="flex-1 flex-row items-center gap-3 pr-2">
            <View className="size-8 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/40">
              <Icon as={Gift} className="size-4 text-sky-600 dark:text-sky-400" />
            </View>
            <View className="min-w-0 flex-1 gap-1">
              <Text className="text-muted-foreground text-left text-[10px] font-semibold uppercase tracking-wider">
                Package details
              </Text>
              <Text className="text-foreground text-left text-sm font-semibold">
                About this package
              </Text>
              <Text className="text-muted-foreground text-left text-xs">
                Décor, styling & finishing touches
              </Text>
            </View>
          </View>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <Text className="text-muted-foreground text-sm leading-relaxed">{text}</Text>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
