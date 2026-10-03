import { ScalePressable } from '@/components/shell';
import { Text } from '@/components/ui/text';
import type { HomeCategory } from '@/module/home/lib/home-catalog';
import { ScrollView } from 'react-native';

type CategorySubcategoryRailProps = {
  parent: HomeCategory;
  subcategories: HomeCategory[];
  activeChildSlug: string | undefined;
  onSelectAll: () => void;
  onSelectChild: (child: HomeCategory) => void;
};

export function CategorySubcategoryRail({
  parent,
  subcategories,
  activeChildSlug,
  onSelectAll,
  onSelectChild,
}: CategorySubcategoryRailProps) {
  if (subcategories.length === 0) return null;

  const allActive = !activeChildSlug;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-5 pr-6"
      accessibilityLabel="Subcategories">
      <ScalePressable
        onPress={onSelectAll}
        haptic
        className={`rounded-full border px-4 py-2 ${
          allActive ? 'border-primary bg-primary' : 'border-border bg-card'
        }`}
        accessibilityRole="button"
        accessibilityState={{ selected: allActive }}>
        <Text
          className={`text-sm font-semibold ${allActive ? 'text-primary-foreground' : 'text-foreground'}`}>
          All {parent.name}
        </Text>
      </ScalePressable>
      {subcategories.map((child) => {
        const active = child.slug === activeChildSlug;
        return (
          <ScalePressable
            key={child.id}
            onPress={() => onSelectChild(child)}
            haptic
            className={`rounded-full border px-4 py-2 ${
              active ? 'border-primary bg-primary' : 'border-border bg-card'
            }`}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}>
            <Text
              className={`text-sm font-semibold ${
                active ? 'text-primary-foreground' : 'text-foreground'
              }`}>
              {child.name}
            </Text>
          </ScalePressable>
        );
      })}
    </ScrollView>
  );
}
