import { ScalePressable } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { openCmsLink } from '@/lib/open-cms-link';
import { resolveViewAllCategoryHref } from '@/module/catalog/lib/category-nav';
import { HomeCategoryTile } from '@/module/home/components/HomeCategoryTile';
import { HomeSectionHeading } from '@/module/home/components/HomeSectionHeading';
import {
  HOME_CATEGORY_PREVIEW_COUNT,
  type HomeCategory,
} from '@/module/home/lib/home-catalog';
import { type Href, router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

const TILE_WIDTH = 88;
/** `home-layout.service` default when a category row has no custom "View all" link. */
const DEFAULT_CMS_VIEW_ALL_HREF = '/decorations';

type HomeCategoryHorizontalSectionProps = {
  categories: HomeCategory[];
  catalogCategories?: HomeCategory[];
  loading?: boolean;
  headingTitle?: string;
  headingSubtitle?: string;
  showTitle?: boolean;
  showSubtitle?: boolean;
  maxVisible?: number;
  showViewAll?: boolean;
  viewAllHref?: string | null;
};

function categoryPath(category: HomeCategory): Href {
  return `/(app)/category?parentSlug=${encodeURIComponent(category.slug)}` as Href;
}

export function HomeCategoryHorizontalSection({
  categories,
  catalogCategories = [],
  loading = false,
  headingTitle = 'Top decoration categories',
  headingSubtitle = 'Trusted decorators for all events',
  showTitle = true,
  showSubtitle = true,
  maxVisible = HOME_CATEGORY_PREVIEW_COUNT,
  showViewAll = true,
  viewAllHref,
}: HomeCategoryHorizontalSectionProps) {
  if (!loading && categories.length === 0) return null;

  const cap = Math.max(1, maxVisible);
  const visible = categories.slice(0, cap);

  // Backend fills `/decorations` when the admin left the link empty; treat that as unset so
  // "View all" shows products from every category in this row.
  const customHref = useMemo(() => {
    const cmsHref = viewAllHref?.trim();
    return cmsHref && cmsHref !== DEFAULT_CMS_VIEW_ALL_HREF ? cmsHref : null;
  }, [viewAllHref]);

  const resolvedHref = useMemo(() => {
    if (!showViewAll || loading) return null;
    if (customHref) return customHref;
    return resolveViewAllCategoryHref({
      rowCategories: categories,
      catalogCategories,
    });
  }, [showViewAll, loading, customHref, categories, catalogCategories]);

  const showViewAllLink = Boolean(resolvedHref);

  function onViewAllPress() {
    if (!resolvedHref) return;
    if (customHref) {
      openCmsLink(customHref);
      return;
    }
    router.push(resolvedHref as Href);
  }

  return (
    <View className="gap-4">
      <View className="flex-row items-start justify-between gap-2 px-4">
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
            onPress={onViewAllPress}
            haptic
            className="shrink-0 self-center pt-0.5"
            accessibilityRole="button"
            accessibilityLabel="View all categories">
            <Text className="text-primary text-[13px] font-bold">View all →</Text>
          </ScalePressable>
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-4">
        {visible.map((category) => (
          <View key={category.id} style={{ width: TILE_WIDTH }}>
            <HomeCategoryTile
              category={category}
              onPress={() => router.push(categoryPath(category))}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
