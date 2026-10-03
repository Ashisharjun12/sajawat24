import { SmoothScrollView, TabScreenTitle } from '@/components/shell';
import { CategoryProductListing } from '@/module/catalog/components/CategoryProductListing';
import { ExploreCategoryRail } from '@/module/catalog/components/ExploreCategoryRail';
import {
  parseExploreCategoryIds,
  resolveExploreProductCategoryIds,
} from '@/module/catalog/lib/explore-category-filter';
import { useHomeCategories } from '@/module/home/hooks/use-home-categories';
import { filterCategoriesForDisplay, type HomeCategory } from '@/module/home/lib/home-catalog';
import { type Href, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useActiveOrderScrollPaddingBottom } from '@/module/home/hooks/use-tab-active-order-bar';
import { ActivityIndicator, RefreshControl, View } from 'react-native';

const TAB_SCROLL_BASE_BOTTOM = 112;

export function ExploreScreen() {
  const scrollBottomPadding = useActiveOrderScrollPaddingBottom(TAB_SCROLL_BASE_BOTTOM);
  const params = useLocalSearchParams<{
    categoryId?: string | string[];
    categoryIds?: string | string[];
  }>();

  const {
    categories: rawCategories,
    isPending,
    isRefetching,
    refetch,
  } = useHomeCategories();

  const categories = useMemo(
    () => filterCategoriesForDisplay(rawCategories),
    [rawCategories],
  );

  const appliedCategoryIds = useMemo(() => parseExploreCategoryIds(params), [params]);

  const productCategoryIds = useMemo(
    () => resolveExploreProductCategoryIds(categories, appliedCategoryIds),
    [appliedCategoryIds, categories],
  );

  const showAllProducts = appliedCategoryIds.length === 0;

  const [productRefreshNonce, setProductRefreshNonce] = useState(0);
  const [pullRefreshing, setPullRefreshing] = useState(false);

  const onSelectAll = useCallback(() => {
    router.setParams({ categoryId: '', categoryIds: '' });
  }, []);

  const onSelectCategory = useCallback((category: HomeCategory) => {
    router.setParams({ categoryId: category.id, categoryIds: '' });
  }, []);

  const onRefresh = useCallback(async () => {
    setPullRefreshing(true);
    try {
      await refetch();
      setProductRefreshNonce((n) => n + 1);
    } finally {
      setPullRefreshing(false);
    }
  }, [refetch]);

  const refreshing = pullRefreshing || isRefetching;

  const onHeaderBack = useCallback(() => {
    if (appliedCategoryIds.length > 0) {
      router.setParams({ categoryId: '', categoryIds: '' });
      return;
    }
    router.navigate('/(app)/' as Href);
  }, [appliedCategoryIds.length]);

  return (
    <View className="flex-1">
      <TabScreenTitle
        title="Explore"
        subtitle="All setups in your city"
        showBack
        onBack={onHeaderBack}
        backAccessibilityLabel={
          appliedCategoryIds.length > 0 ? 'Clear category filter' : 'Back to home'
        }
      />
      <SmoothScrollView
        className="flex-1"
        contentContainerClassName="gap-3 pt-3"
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {isPending && categories.length === 0 ? (
          <ActivityIndicator className="py-6" />
        ) : (
          <ExploreCategoryRail
            categories={categories}
            selectedIds={appliedCategoryIds}
            onSelectAll={onSelectAll}
            onSelectCategory={onSelectCategory}
          />
        )}
        <CategoryProductListing
          categoryIds={productCategoryIds ?? []}
          showAllProducts={showAllProducts}
          sectionTitle=""
          emptyTitle="No packages yet"
          emptyDescription="Try clearing filters or pick another category."
          refreshNonce={productRefreshNonce}
        />
      </SmoothScrollView>
    </View>
  );
}
