import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { listTopLevelCategories, resolveCategoryIcon } from '@/lib/category-icons';
import type { HomeCategory } from '@/module/home/lib/home-catalog';
import { ScrollView, View } from 'react-native';

type ExploreCategoryRailProps = {
  categories: HomeCategory[];
  selectedIds: string[];
  onSelectAll: () => void;
  onSelectCategory: (category: HomeCategory) => void;
};

export function ExploreCategoryRail({
  categories,
  selectedIds,
  onSelectAll,
  onSelectCategory,
}: ExploreCategoryRailProps) {
  const activeSingle = selectedIds.length === 1 ? selectedIds[0] : null;
  const allActive = selectedIds.length === 0;
  const topLevel = listTopLevelCategories(categories);

  if (topLevel.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-5 pb-3 pt-1"
      accessibilityLabel="Browse by category">
      <ScalePressable
        onPress={onSelectAll}
        haptic
        pressScale={0.96}
        className={cn(
          'rounded-full px-3.5 py-2',
          allActive ? 'bg-primary' : 'bg-muted',
        )}
        accessibilityRole="button"
        accessibilityState={allActive ? { selected: true } : {}}
        accessibilityLabel="All categories">
        <Text
          className={cn(
            'text-xs font-semibold',
            allActive ? 'text-primary-foreground' : 'text-foreground',
          )}>
          All
        </Text>
      </ScalePressable>
      {topLevel.map((category) => {
        const active = activeSingle === category.id;
        const { Icon: CategoryIcon, toneBg, toneIcon } = resolveCategoryIcon({
          iconKey: category.iconKey,
          iconTone: category.iconTone,
          slug: category.slug,
        });
        return (
          <ScalePressable
            key={category.id}
            onPress={() => onSelectCategory(category)}
            haptic
            pressScale={0.96}
            className={cn(
              'flex-row items-center gap-1.5 rounded-full py-2 pl-2 pr-3.5',
              active ? 'bg-primary' : 'bg-muted',
            )}
            accessibilityRole="button"
            accessibilityState={active ? { selected: true } : {}}
            accessibilityLabel={category.name}>
            <View
              className={cn(
                'flex size-7 items-center justify-center rounded-full',
                active ? 'bg-primary-foreground/15' : toneBg,
              )}>
              <Icon
                as={CategoryIcon}
                className={cn(
                  'size-3.5',
                  active ? 'text-primary-foreground' : toneIcon,
                )}
              />
            </View>
            <Text
              className={cn(
                'text-xs font-semibold',
                active ? 'text-primary-foreground' : 'text-foreground',
              )}
              numberOfLines={1}>
              {category.name}
            </Text>
          </ScalePressable>
        );
      })}
    </ScrollView>
  );
}
