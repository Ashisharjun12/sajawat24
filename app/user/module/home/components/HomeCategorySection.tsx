import { ScalePressable } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { resolveViewAllCategoryHref } from '@/module/catalog/lib/category-nav';
import { HomeCategoryTile } from '@/module/home/components/HomeCategoryTile';
import { HomeSectionHeading } from '@/module/home/components/HomeSectionHeading';
import {
  HOME_CATEGORY_PREVIEW_COUNT,
  type HomeCategory,
} from '@/module/home/lib/home-catalog';
import { Href, router } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

const COLS = 4;

type HomeCategorySectionProps = {
  categories: HomeCategory[];
  catalogCategories?: HomeCategory[];
  loading?: boolean;
  headingTitle?: string;
  headingSubtitle?: string;
  showTitle?: boolean;
  showSubtitle?: boolean;
  maxVisible?: number;
  showViewAll?: boolean;
};

export function HomeCategorySection({
  categories,
  catalogCategories = [],
  loading = false,
  headingTitle = 'Top decoration categories',
  headingSubtitle = 'Trusted decorators for all events',
  showTitle = true,
  showSubtitle = true,
  maxVisible = HOME_CATEGORY_PREVIEW_COUNT,
  showViewAll = true,
}: HomeCategorySectionProps) {
  if (!loading && categories.length === 0) return null;

  const visible = categories.slice(0, maxVisible);
  const rows: HomeCategory[][] = [];
  for (let i = 0; i < visible.length; i += COLS) {
    rows.push(visible.slice(i, i + COLS));
  }

  const resolvedHref = useMemo(() => {
    if (!showViewAll || loading) return null;
    return resolveViewAllCategoryHref({
      rowCategories: categories,
      catalogCategories,
    });
  }, [showViewAll, loading, categories, catalogCategories]);

  const showViewAllLink = Boolean(resolvedHref);

  return (
    <View className="gap-4 px-4">
      <View className="flex-row items-start justify-between gap-2">
        {showTitle ? (
          <HomeSectionHeading
            title={headingTitle}
            subtitle={showSubtitle ? headingSubtitle : null}
          />
        ) : (
          <View className="flex-1" />
        )}
        {showViewAllLink ? (
          <ScalePressable
            onPress={() => router.push(resolvedHref as Href)}
            haptic
            className="shrink-0 self-center pt-0.5"
            accessibilityRole="button"
            accessibilityLabel="View all categories">
            <Text className="text-muted-foreground text-xs font-medium">View all →</Text>
          </ScalePressable>
        ) : null}
      </View>
      <View className="gap-3">
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} className="flex-row gap-2">
            {row.map((category) => (
              <HomeCategoryTile
                key={category.id}
                category={category}
                onPress={() =>
                  router.push(
                    `/(app)/category?parentSlug=${encodeURIComponent(category.slug)}` as Href,
                  )
                }
              />
            ))}
            {row.length < COLS
              ? Array.from({ length: COLS - row.length }).map((_, i) => (
                  <View key={`pad-${i}`} className="min-w-0 flex-1" />
                ))
              : null}
          </View>
        ))}
      </View>
    </View>
  );
}
