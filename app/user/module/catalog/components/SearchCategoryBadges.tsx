import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { CategorySearchHit } from '@/module/catalog/lib/search-category-suggestions';
import { ArrowUpRight } from 'lucide-react-native';
import { View } from 'react-native';

const CHIP_STYLES = [
  'border-emerald-200/80 bg-emerald-50',
  'border-violet-200/80 bg-violet-50',
  'border-amber-200/80 bg-amber-50',
] as const;

const CHIP_TEXT_STYLES = [
  'text-emerald-900',
  'text-violet-900',
  'text-amber-950',
] as const;

function chipStyle(index: number) {
  return {
    container: CHIP_STYLES[index % CHIP_STYLES.length],
    text: CHIP_TEXT_STYLES[index % CHIP_TEXT_STYLES.length],
  };
}

function BadgeLabel({
  text,
  query,
  textClassName,
}: {
  text: string;
  query: string;
  textClassName: string;
}) {
  const base = `shrink text-[13px] font-medium leading-tight ${textClassName}`;
  const trimmed = query.trim();
  if (!trimmed) {
    return (
      <Text className={base} numberOfLines={1}>
        {text}
      </Text>
    );
  }
  const lower = text.toLowerCase();
  const q = trimmed.toLowerCase();
  const index = lower.indexOf(q);
  if (index < 0) {
    return (
      <Text className={base} numberOfLines={1}>
        {text}
      </Text>
    );
  }
  return (
    <Text className={base} numberOfLines={1}>
      {text.slice(0, index)}
      <Text className={`font-semibold ${textClassName}`}>
        {text.slice(index, index + trimmed.length)}
      </Text>
      {text.slice(index + trimmed.length)}
    </Text>
  );
}

type SearchCategoryBadgesProps = {
  hits: CategorySearchHit[];
  query: string;
  onSelect: (hit: CategorySearchHit) => void;
};

export function SearchCategoryBadges({ hits, query, onSelect }: SearchCategoryBadgesProps) {
  if (!hits.length) return null;

  return (
    <View className="flex-row flex-wrap gap-2 px-1 py-2">
      {hits.map((hit, index) => {
        const style = chipStyle(index);
        return (
          <ScalePressable
            key={hit.id}
            onPress={() => onSelect(hit)}
            haptic
            className={`max-w-full flex-row items-center gap-1.5 self-start rounded-lg border px-3 py-2 active:opacity-90 ${style.container}`}
            accessibilityRole="button"
            accessibilityLabel={hit.label}>
            <BadgeLabel text={hit.label} query={query} textClassName={style.text} />
            <Icon as={ArrowUpRight} className={`size-3.5 shrink-0 opacity-75 ${style.text}`} />
          </ScalePressable>
        );
      })}
    </View>
  );
}
