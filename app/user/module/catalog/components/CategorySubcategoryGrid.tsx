import { HomeCategoryTile } from '@/module/home/components/HomeCategoryTile';
import type { HomeCategory } from '@/module/home/lib/home-catalog';
import { View } from 'react-native';

const COLS = 4;

type CategorySubcategoryGridProps = {
  subcategories: HomeCategory[];
  onSelectChild: (child: HomeCategory) => void;
};

/** Plain grid of subcategory images, shown when a parent category is opened. */
export function CategorySubcategoryGrid({
  subcategories,
  onSelectChild,
}: CategorySubcategoryGridProps) {
  if (subcategories.length === 0) return null;

  const rows: HomeCategory[][] = [];
  for (let i = 0; i < subcategories.length; i += COLS) {
    rows.push(subcategories.slice(i, i + COLS));
  }

  return (
    <View className="gap-4 px-5">
      {rows.map((row, rowIndex) => (
        <View key={`sub-row-${rowIndex}`} className="flex-row gap-2">
          {row.map((category) => (
            // flex-row so the tile's own `flex-1` stretches it across the cell. In a column
            // cell, `flex-1` gives the tile a zero height and the next row draws over it.
            <View key={category.id} className="min-w-0 flex-1 flex-row">
              <HomeCategoryTile category={category} onPress={() => onSelectChild(category)} />
            </View>
          ))}
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
