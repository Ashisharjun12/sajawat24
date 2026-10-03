import { HomeCategoryTile } from '@/module/home/components/HomeCategoryTile';
import { Text } from '@/components/ui/text';
import { BRAND_PRIMARY_HEX } from '@/lib/theme';
import type { HomeCategory } from '@/module/home/lib/home-catalog';
import { View } from 'react-native';

const COLS = 4;

type CategorySubcategoryGridProps = {
  subcategories: HomeCategory[];
  activeChildSlug: string | undefined;
  onSelectChild: (child: HomeCategory) => void;
};

export function CategorySubcategoryGrid({
  subcategories,
  activeChildSlug,
  onSelectChild,
}: CategorySubcategoryGridProps) {
  if (subcategories.length === 0) return null;

  const rows: HomeCategory[][] = [];
  for (let i = 0; i < subcategories.length; i += COLS) {
    rows.push(subcategories.slice(i, i + COLS));
  }

  return (
    <View className="gap-3 px-5">
      <Text className="text-foreground text-lg font-semibold">Subcategories</Text>
      {rows.map((row, rowIndex) => (
        <View key={`sub-row-${rowIndex}`} className="flex-row gap-2">
          {row.map((category) => {
            const highlighted = activeChildSlug === category.slug;
            return (
              <View
                key={category.id}
                className="min-w-0 flex-1 rounded-2xl"
                style={
                  highlighted
                    ? { borderWidth: 2, borderColor: BRAND_PRIMARY_HEX }
                    : { borderWidth: 2, borderColor: 'transparent' }
                }>
                <HomeCategoryTile category={category} onPress={() => onSelectChild(category)} />
              </View>
            );
          })}
          {row.length < COLS
            ? Array.from({ length: COLS - row.length }).map((_, i) => (
                <View key={`pad-${rowIndex}-${i}`} className="min-w-0 flex-1" />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}
