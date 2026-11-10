import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { listTopLevelCategories, resolveCategoryIcon } from '@/lib/category-icons';
import type { HomeCategory } from '@/module/home/lib/home-catalog';
import { ScrollView, View } from 'react-native';

type CategoryParentChipsProps = {
  parents: HomeCategory[];
  selectedSlug: string;
  allSlug: string;
  onSelectAll: () => void;
  onSelectParent: (parent: HomeCategory) => void;
};

export function CategoryParentChips({
  parents,
  selectedSlug,
  allSlug,
  onSelectAll,
  onSelectParent,
}: CategoryParentChipsProps) {
  const showAllParents = selectedSlug === allSlug;
  const topLevel = listTopLevelCategories(parents);

  if (topLevel.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="items-center gap-2 px-5 pb-1 pr-6"
      accessibilityLabel="Browse categories">
      <ScalePressable
        onPress={onSelectAll}
        haptic
        pressScale={0.96}
        // Same as the Explore tab: fixed 44px height (matches the icon chips), pill shape,
        // centred label.
        className={cn(
          'h-11 min-w-16 items-center justify-center rounded-full px-5',
          showAllParents ? 'bg-primary' : 'bg-muted',
        )}
        accessibilityRole="button"
        accessibilityState={{ selected: showAllParents }}
        accessibilityLabel="All categories">
        <Text
          className={cn(
            'text-center text-xs font-semibold',
            showAllParents ? 'text-primary-foreground' : 'text-foreground',
          )}>
          All
        </Text>
      </ScalePressable>
      {topLevel.map((parent) => {
        const active = parent.slug === selectedSlug;
        const { Icon: CategoryIcon, toneBg, toneIcon } = resolveCategoryIcon({
          iconKey: parent.iconKey,
          iconTone: parent.iconTone,
          slug: parent.slug,
        });
        return (
          <ScalePressable
            key={parent.id}
            onPress={() => onSelectParent(parent)}
            haptic
            pressScale={0.96}
            className={cn(
              'h-11 flex-row items-center gap-1.5 rounded-full pl-2 pr-3.5',
              active ? 'bg-primary' : 'bg-muted',
            )}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={parent.name}>
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
              {parent.name}
            </Text>
          </ScalePressable>
        );
      })}
    </ScrollView>
  );
}
