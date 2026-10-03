import { ScalePressable } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { isBackendCityId } from '@/lib/location-label';
import { HomeLocationSheet } from '@/module/home/components/HomeLocationSheet';
import { useHomeCategories } from '@/module/home/hooks/use-home-categories';
import { SearchCategoryBadges } from '@/module/catalog/components/SearchCategoryBadges';
import {
  SearchProductRow,
  SearchProductRowSkeleton,
} from '@/module/catalog/components/SearchProductRow';
import {
  MIN_QUERY_LEN,
  useProductSearchQuery,
} from '@/module/catalog/hooks/use-product-search-query';
import {
  buildCategorySearchIndex,
  categoryIdsForSearchHits,
  filterCategorySearchHits,
  preferCategoryProductFilter,
  type CategorySearchHit,
} from '@/module/catalog/lib/search-category-suggestions';
import { useLocationStore } from '@/store/location.store';
import { type Href, router } from 'expo-router';
import { ArrowLeft, Search, Sparkles } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

const MODAL_CATEGORY_LIMIT = 8;
const MODAL_CATEGORY_SEARCH_LIMIT = 6;
const MODAL_PRODUCT_LIMIT = 5;

export function SearchScreen() {
  const [query, setQuery] = useState('');
  const [locationOpen, setLocationOpen] = useState(false);

  const city = useLocationStore((s) => s.city);
  const pincode = useLocationStore((s) => s.pincode);
  const cityId = city?.id && isBackendCityId(city.id) ? city.id : undefined;
  const pincodeCode = pincode?.code?.replace(/\D/g, '').slice(0, 6) || undefined;
  const hasLocation = Boolean(pincodeCode || cityId);

  const { categories } = useHomeCategories();

  const categorySearchIndex = useMemo(
    () => buildCategorySearchIndex(categories),
    [categories],
  );

  const categorySuggestions = useMemo(() => {
    const limit = query.trim() ? MODAL_CATEGORY_SEARCH_LIMIT : MODAL_CATEGORY_LIMIT;
    return filterCategorySearchHits(categorySearchIndex, query, { limit });
  }, [categorySearchIndex, query]);

  const categoryHitsForProducts = useMemo(() => {
    if (query.trim().length < MIN_QUERY_LEN) return [];
    return filterCategorySearchHits(categorySearchIndex, query, {
      limit: MODAL_CATEGORY_SEARCH_LIMIT,
    });
  }, [categorySearchIndex, query]);

  const productCategoryIds = useMemo(() => {
    const ids = categoryIdsForSearchHits(categoryHitsForProducts);
    return ids.length > 0 ? ids : undefined;
  }, [categoryHitsForProducts]);

  const categoryScopedProductSearch = useMemo(
    () => preferCategoryProductFilter(categoryHitsForProducts, query),
    [categoryHitsForProducts, query],
  );

  const { data: products = [], isLoading, isFetching, isError } = useProductSearchQuery(query, {
    enabled: hasLocation,
    categoryIds: productCategoryIds,
    categoryScopedSearch: categoryScopedProductSearch,
  });

  const isBrowseMode = query.trim().length < MIN_QUERY_LEN;
  const visibleProducts = useMemo(
    () => products.slice(0, MODAL_PRODUCT_LIMIT),
    [products],
  );
  const showSkeletons = (isLoading || isFetching) && products.length === 0;
  const showEmpty =
    !showSkeletons && !isLoading && products.length === 0 && hasLocation && !isError;

  function openCategory(hit: CategorySearchHit) {
    const parentSlug = hit.parent.slug;
    const childSlug = hit.child?.slug;
    if (childSlug) {
      router.push(
        `/(app)/category?parentSlug=${encodeURIComponent(parentSlug)}&childSlug=${encodeURIComponent(childSlug)}` as Href,
      );
    } else {
      router.push(`/(app)/category?parentSlug=${encodeURIComponent(parentSlug)}` as Href);
    }
  }

  return (
    <View className="flex-1">
      <View className="border-b border-border/70 bg-background px-5 pb-3 pt-3">
        <View className="flex-row items-center gap-2">
          <ScalePressable
            onPress={() => router.back()}
            haptic
            className="p-1"
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Icon as={ArrowLeft} className="text-foreground size-6" />
          </ScalePressable>
          <View className="relative min-w-0 flex-1 flex-row items-center">
            <Icon
              as={Search}
              className="text-muted-foreground absolute left-3 z-10 size-5"
            />
            <Input
              value={query}
              onChangeText={setQuery}
              placeholder="Search birthday, haldi, themes…"
              className="h-11 flex-1 rounded-2xl border-border/60 bg-muted/40 pl-10 pr-3"
              autoFocus
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>
        <Text className="text-muted-foreground mt-1 px-1 text-xs">
          Search by occasion, theme or decoration
        </Text>
      </View>

      {!hasLocation ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-foreground text-center text-sm font-medium">Pick your city</Text>
          <Text className="text-muted-foreground mt-1 text-center text-sm">
            We need a serviceable city to search local setups.
          </Text>
          <Button className="mt-4 rounded-lg" onPress={() => setLocationOpen(true)}>
            <Text>Select city</Text>
          </Button>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-28"
          keyboardShouldPersistTaps="handled">
          {categorySuggestions.length > 0 ? (
            <View className="px-4 pb-1 pt-3">
              <SearchCategoryBadges
                hits={categorySuggestions}
                query={query}
                onSelect={openCategory}
              />
            </View>
          ) : null}

          <View
            className={`px-5 pt-2 ${categorySuggestions.length > 0 ? 'mt-1 border-t border-border/50' : ''}`}>
            <View className="flex-row items-baseline justify-between gap-2 py-1.5">
              <View className="flex-row items-center gap-1.5">
                {isBrowseMode ? (
                  <Icon as={Sparkles} className="size-4 text-emerald-600" />
                ) : null}
                <Text className="text-foreground text-sm font-semibold">
                  {isBrowseMode ? 'Popular right now' : 'Results'}
                </Text>
              </View>
              {isBrowseMode ? (
                <Text className="text-muted-foreground text-xs">Ideas for your next party</Text>
              ) : null}
            </View>
            {showSkeletons ? (
              <View className="pb-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SearchProductRowSkeleton key={i} />
                ))}
              </View>
            ) : null}
            {visibleProducts.map((product) => (
              <SearchProductRow
                key={product.id}
                product={product}
                onPress={() => router.push(`/(app)/product/${product.id}` as Href)}
              />
            ))}
            {showEmpty ? (
              <Text className="text-muted-foreground px-2 py-6 text-center text-sm">
                No setups found. Try another search or category.
              </Text>
            ) : null}
            {isError ? (
              <Text className="text-destructive px-2 py-6 text-center text-sm">
                Could not load products. Try again.
              </Text>
            ) : null}
          </View>
        </ScrollView>
      )}

      <Modal
        visible={locationOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setLocationOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setLocationOpen(false)}>
          <Pressable
            className="rounded-t-3xl bg-background pb-8"
            onPress={(e) => e.stopPropagation()}>
            <HomeLocationSheet onClose={() => setLocationOpen(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
