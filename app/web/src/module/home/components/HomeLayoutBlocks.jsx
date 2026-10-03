import { HomeCategoryExplorer } from "@/module/home/components/HomeCategoryExplorer";
import { HomeProductRail } from "@/module/home/components/HomeProductRail";
import {
  normalizeCategoryTree,
  normalizeLayoutProducts,
} from "@/module/home/lib/home-catalog";

export function HomeLayoutBlocks({ blocks = [], loading = false }) {
  if (!loading && blocks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-10 md:space-y-12">
      {blocks.map((block) => {
        if (block.type === "category_row") {
          const categories = normalizeCategoryTree(block.categories ?? []);
          return (
            <HomeCategoryExplorer
              key={block.id}
              categories={categories}
              loading={loading}
              headingTitle={block.title}
              headingSubtitle={block.subtitle}
              showTitle={block.showTitle}
              showSubtitle={block.showSubtitle}
              maxVisible={block.maxVisible}
              showViewAll={block.showViewAll}
              enableDrillDown={block.enableDrillDown}
            />
          );
        }
        if (block.type === "product_rail") {
          const items = normalizeLayoutProducts(block.items ?? []);
          return (
            <HomeProductRail
              key={block.id}
              section={{
                id: block.id,
                slug: block.sectionSlug ?? block.id,
                name: block.title ?? "Popular setups",
                badgeLabel: block.sectionName ?? block.title ?? "Popular setups",
                badgeColor: block.sectionBadgeColor ?? "amber",
                items,
              }}
              title={block.title}
              subtitle={block.subtitle}
              showTitle={block.showTitle}
              showSubtitle={block.showSubtitle}
              loading={loading}
            />
          );
        }
        return null;
      })}
    </div>
  );
}
