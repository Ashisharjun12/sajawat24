import { Text } from '@/components/ui/text';
import { resolveProductCategory } from '@/module/catalog/lib/product-breadcrumb';
import { useHomeCategories } from '@/module/home/hooks/use-home-categories';
import { type Href, router } from 'expo-router';
import { Pressable, View } from 'react-native';

type ProductPdpBreadcrumbProps = {
  title: string;
  categoryId?: string | null;
};

export function ProductPdpBreadcrumb({ title, categoryId }: ProductPdpBreadcrumbProps) {
  const { categories } = useHomeCategories();
  const category = resolveProductCategory(categoryId, categories);

  function goCategory() {
    if (category.parentSlug && category.childSlug) {
      router.push(
        `/(app)/category?parentSlug=${encodeURIComponent(category.parentSlug)}&childSlug=${encodeURIComponent(category.childSlug)}` as Href,
      );
      return;
    }
    if (category.parentSlug) {
      router.push(
        `/(app)/category?parentSlug=${encodeURIComponent(category.parentSlug)}` as Href,
      );
      return;
    }
    router.push('/(app)/category' as Href);
  }

  return (
    <View className="flex-row flex-wrap items-center gap-1">
      <Pressable onPress={() => router.push('/(app)/' as Href)} hitSlop={6}>
        <Text className="text-muted-foreground text-sm">Home</Text>
      </Pressable>
      <Text className="text-muted-foreground/60 text-sm">/</Text>
      <Pressable onPress={goCategory} hitSlop={6}>
        <Text className="text-muted-foreground max-w-[38%] text-sm" numberOfLines={1}>
          {category.label}
        </Text>
      </Pressable>
      <Text className="text-muted-foreground/60 text-sm">/</Text>
      <Text className="text-foreground min-w-0 flex-1 text-sm font-medium" numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}
