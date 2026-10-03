import { HomeCategoryHorizontalSection } from '@/module/home/components/HomeCategoryHorizontalSection';
import { HomeProductRail } from '@/module/home/components/HomeProductRail';
import { useHomeCategories } from '@/module/home/hooks/use-home-categories';
import {
  normalizeCategoryTree,
  normalizeLayoutProducts,
  type HomeCmsLayoutBlock,
  type HomeProductSection,
} from '@/module/home/lib/home-catalog';
import { View } from 'react-native';

type HomeLayoutBlocksProps = {
  blocks: HomeCmsLayoutBlock[];
  loading?: boolean;
};

export function HomeLayoutBlocks({ blocks, loading = false }: HomeLayoutBlocksProps) {
  const { categories: catalogCategories } = useHomeCategories();

  if (!loading && blocks.length === 0) return null;

  return (
    <View className="gap-10">
      {blocks.map((block) => {
        if (block.type === 'category_row') {
          const categories = normalizeCategoryTree(block.categories ?? []);
          return (
            <HomeCategoryHorizontalSection
              key={block.id}
              categories={categories}
              catalogCategories={catalogCategories}
              loading={loading}
              headingTitle={block.title ?? 'Categories'}
              headingSubtitle={block.subtitle ?? undefined}
              showTitle={block.showTitle ?? true}
              showSubtitle={block.showSubtitle ?? true}
              maxVisible={block.maxVisible ?? undefined}
              showViewAll={block.showViewAll ?? true}
              viewAllHref={block.viewAllHref}
            />
          );
        }
        if (block.type === 'product_rail') {
          const items = normalizeLayoutProducts(block.items ?? []);
          if (!loading && items.length === 0) return null;
          const section: HomeProductSection = {
            id: block.id,
            slug: block.sectionSlug ?? block.id,
            title: block.title ?? block.sectionName ?? 'Popular setups',
            subtitle: block.showSubtitle ? block.subtitle ?? undefined : undefined,
            badgeLabel: block.sectionName ?? block.title ?? null,
            badgeColor: block.badgeColor ?? null,
            items,
          };
          return (
            <HomeProductRail
              key={block.id}
              section={section}
              showTitle={block.showTitle ?? true}
              showSubtitle={block.showSubtitle ?? true}
              loading={loading}
            />
          );
        }
        return null;
      })}
    </View>
  );
}
