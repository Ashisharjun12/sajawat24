import { Text } from '@/components/ui/text';
import { INSTANT_TAB_HEX } from '@/lib/theme';
import { View } from 'react-native';

type ProductDetailTitleBlockProps = {
  title: string;
  description?: string | null;
  showInstantBadge?: boolean;
  instantLabel?: string | null;
};

export function ProductDetailTitleBlock({
  title,
  description,
  showInstantBadge,
  instantLabel,
}: ProductDetailTitleBlockProps) {
  const copy = (description ?? '').trim();

  return (
    <View className="gap-2">
      <Text className="text-foreground text-2xl font-semibold leading-snug">{title}</Text>
      {showInstantBadge ? (
        <View
          className="self-start rounded-md px-2 py-0.5"
          style={{ backgroundColor: `${INSTANT_TAB_HEX}22` }}>
          <Text className="text-[10px] font-bold uppercase" style={{ color: INSTANT_TAB_HEX }}>
            {(instantLabel ?? 'Instant').trim()}
          </Text>
        </View>
      ) : null}
      {copy ? (
        <Text className="text-muted-foreground text-sm leading-relaxed">{copy}</Text>
      ) : null}
    </View>
  );
}
