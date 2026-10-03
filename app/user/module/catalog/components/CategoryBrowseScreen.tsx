import { SmoothScrollView, TabScreenTitle } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { CategoryParentChips } from '@/module/catalog/components/CategoryParentChips';
import { CategoryProductListing } from '@/module/catalog/components/CategoryProductListing';
import { CategorySubcategoryGrid } from '@/module/catalog/components/CategorySubcategoryGrid';
import {
  categoryProductIds,
  findCategoryBySlugs,
} from '@/module/catalog/lib/category-nav';
import { HomeCategoryTile } from '@/module/home/components/HomeCategoryTile';
import { useHomeCategories } from '@/module/home/hooks/use-home-categories';
import {
  filterCategoriesForDisplay,
  type HomeCategory,
} from '@/module/home/lib/home-catalog';
import { type Href, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useActiveOrderScrollPaddingBottom } from '@/module/home/hooks/use-tab-active-order-bar';
import { ActivityIndicator, RefreshControl, View } from 'react-native';

const COLS = 4;
const ALL_PARENTS = '__all__';

const TAB_SCROLL_BASE_BOTTOM = 112;

export function CategoryBrowseScreen() {
  const scrollBottomPadding = useActiveOrderScrollPaddingBottom(TAB_SCROLL_BASE_BOTTOM);
  const params = useLocalSearchParams<{
    parentSlug?: string;
    childSlug?: string;
  }>();
  const parentSlugParam =
    typeof params.parentSlug === 'string' ? params.parentSlug : undefined;
  const childSlugParam =
    typeof params.childSlug === 'string' ? params.childSlug : undefined;

  const {
    categories: rawParents,
    isPending,
    isRefetching: categoriesRefetching,
    refetch: refetchCategories,
  } = useHomeCategories();
  const [productRefreshNonce, setProductRefreshNonce] = useState(0);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const parents = useMemo(
    () => filterCategoriesForDisplay(rawParents),
    [rawParents],
  );
  const [selectedSlug, setSelectedSlug] = useState<string>(ALL_PARENTS);

  useEffect(() => {
    if (parentSlugParam) {
      setSelectedSlug(parentSlugParam);
    } else {
      setSelectedSlug(ALL_PARENTS);
    }
  }, [parentSlugParam]);

  const showAllParents = selectedSlug === ALL_PARENTS;

  const { parent: selectedParent, child: selectedChild } = useMemo(
    () => findCategoryBySlugs(parents, parentSlugParam, childSlugParam),
    [parents, parentSlugParam, childSlugParam],
  );

  const subcategories = useMemo(() => {
    if (!selectedParent) return [];
    return selectedParent.children ?? [];
  }, [selectedParent]);

  const productCategoryIds = useMemo(() => {
    if (!selectedParent) return [];
    return categoryProductIds({ parent: selectedParent, child: selectedChild });
  }, [selectedParent, selectedChild]);

  const pageTitle = selectedChild?.name ?? selectedParent?.name;

  function onSelectAll() {
    setSelectedSlug(ALL_PARENTS);
    router.replace('/(app)/category' as Href);
  }

  function onSelectParent(parent: HomeCategory) {
    setSelectedSlug(parent.slug);
    router.push(
      `/(app)/category?parentSlug=${encodeURIComponent(parent.slug)}` as Href,
    );
  }

  function onTilePress(parent: HomeCategory) {
    onSelectParent(parent);
  }

  function onSelectSubcategory(child: HomeCategory) {
    if (!selectedParent) return;
    router.push(
      `/(app)/category?parentSlug=${encodeURIComponent(selectedParent.slug)}&childSlug=${encodeURIComponent(child.slug)}` as Href,
    );
  }

  const gridParents = showAllParents ? parents : [];

  const rows: HomeCategory[][] = [];
  for (let i = 0; i < gridParents.length; i += COLS) {
    rows.push(gridParents.slice(i, i + COLS));
  }

  const showProductSection = !showAllParents && Boolean(selectedParent);

  const onRefresh = useCallback(async () => {
    setPullRefreshing(true);
    try {
      await refetchCategories();
      if (showProductSection) {
        setProductRefreshNonce((n) => n + 1);
      }
    } finally {
      setPullRefreshing(false);
    }
  }, [refetchCategories, showProductSection]);

  const refreshing = pullRefreshing || categoriesRefetching;

  const screenTitle = showAllParents ? 'Categories' : pageTitle ?? 'Categories';

  const onHeaderBack = useCallback(() => {
    if (childSlugParam && selectedParent) {
      router.replace(
        `/(app)/category?parentSlug=${encodeURIComponent(selectedParent.slug)}` as Href,
      );
      return;
    }
    if (parentSlugParam) {
      router.replace('/(app)/category' as Href);
      return;
    }
    router.navigate('/(app)/' as Href);
  }, [childSlugParam, parentSlugParam, selectedParent]);

  return (
    <View className="flex-1">
      <TabScreenTitle
        title={screenTitle}
        showBack
        onBack={onHeaderBack}
        backAccessibilityLabel={
          childSlugParam
            ? 'Back to category'
            : parentSlugParam
              ? 'Back to all categories'
              : 'Back to home'
        }
      />
    <SmoothScrollView
      className="flex-1"
      contentContainerClassName="gap-5 pt-3"
      contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
      }>
    <View className="gap-5">

      {isPending && parents.length === 0 ? (
        <ActivityIndicator className="py-8" />
      ) : null}

      {!isPending && parents.length === 0 ? (
        <View className="mx-5 rounded-2xl border border-border bg-muted/30 px-4 py-6">
          <Text className="text-foreground text-center text-sm font-medium">
            No categories yet
          </Text>
        </View>
      ) : null}

      {parents.length > 0 ? (
        <CategoryParentChips
          parents={parents}
          selectedSlug={selectedSlug}
          allSlug={ALL_PARENTS}
          onSelectAll={onSelectAll}
          onSelectParent={onSelectParent}
        />
      ) : null}

      {showAllParents && rows.length > 0 ? (
        <View className="gap-3 px-5 pb-4">
          <Text className="text-foreground text-lg font-semibold">All categories</Text>
          {rows.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} className="flex-row gap-2">
              {row.map((category) => (
                <View key={category.id} className="min-w-0 flex-1">
                  <HomeCategoryTile category={category} onPress={() => onTilePress(category)} />
                </View>
              ))}
              {row.length < COLS
                ? Array.from({ length: COLS - row.length }).map((_, i) => (
                    <View key={`pad-${i}`} className="min-w-0 flex-1" />
                  ))
                : null}
            </View>
          ))}
        </View>
      ) : null}

      {!showAllParents && selectedParent ? (
        <>
          {subcategories.length > 0 ? (
            <CategorySubcategoryGrid
              subcategories={subcategories}
              activeChildSlug={childSlugParam}
              onSelectChild={onSelectSubcategory}
            />
          ) : null}
          <CategoryProductListing
            categoryIds={productCategoryIds}
            sectionTitle="All packages"
            refreshNonce={productRefreshNonce}
          />
        </>
      ) : null}
    </View>
    </SmoothScrollView>
    </View>
  );
}
