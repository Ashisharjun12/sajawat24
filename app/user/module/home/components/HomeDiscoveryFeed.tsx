import { Text } from '@/components/ui/text';
import { HomeCategoryHorizontalSection } from '@/module/home/components/HomeCategoryHorizontalSection';
import { HomeLayoutWithPromos } from '@/module/home/components/HomeLayoutWithPromos';
import { HomeProductRails } from '@/module/home/components/HomeProductRails';
import {
  cmsLayoutHasProductRails,
  type HomeBannerSlide,
  type HomeCategory,
  type HomeCmsLayoutBlock,
  type HomeProductSection,
} from '@/module/home/lib/home-catalog';
import { View } from 'react-native';

type HomeDiscoveryFeedProps = {
  useCmsLayout: boolean;
  layoutBlocks: HomeCmsLayoutBlock[];
  midSlide: HomeBannerSlide | null;
  endSlide: HomeBannerSlide | null;
  categories: HomeCategory[];
  sections: HomeProductSection[];
  discoveryLoading: boolean;
  /** Native app: only Android/iOS homepage blocks from CMS — no web-style catalog fallback. */
  cmsOnlyFeed?: boolean;
  cmsLoading?: boolean;
};

export function HomeDiscoveryFeed({
  useCmsLayout,
  layoutBlocks,
  midSlide,
  endSlide,
  categories,
  sections,
  discoveryLoading,
  cmsOnlyFeed = false,
  cmsLoading = false,
}: HomeDiscoveryFeedProps) {
  if (useCmsLayout || cmsOnlyFeed) {
    const feedLoading = cmsOnlyFeed ? cmsLoading : discoveryLoading;
    const showCatalogPackages =
      !cmsOnlyFeed &&
      !feedLoading &&
      !cmsLayoutHasProductRails(layoutBlocks) &&
      sections.length > 0;

    return (
      <>
        <HomeLayoutWithPromos
          blocks={layoutBlocks}
          midSlide={midSlide}
          endSlide={endSlide}
          loading={feedLoading}
        />
        {showCatalogPackages ? (
          <View className="gap-10">
            <HomeProductRails sections={sections} loading={false} />
          </View>
        ) : null}
        {cmsOnlyFeed && !feedLoading && layoutBlocks.length === 0 ? (
          <View className="mx-4 rounded-2xl border border-border bg-muted/30 px-4 py-6">
            <Text className="text-foreground text-center text-sm font-medium">
              Home feed not configured yet
            </Text>
            <Text className="text-muted-foreground mt-1 text-center text-xs">
              Add published homepage blocks for Android in admin (Content → Android → Homepage).
            </Text>
          </View>
        ) : null}
      </>
    );
  }

  const showEmpty = !discoveryLoading && sections.length === 0;

  return (
    <View className="gap-10">
      <HomeCategoryHorizontalSection
        categories={categories}
        catalogCategories={categories}
        loading={discoveryLoading}
      />
      <HomeProductRails sections={sections} loading={discoveryLoading} />
      {showEmpty ? (
        <View className="mx-4 rounded-2xl border border-border bg-muted/30 px-4 py-6">
          <Text className="text-foreground text-center text-sm font-medium">
            No packages in this area yet
          </Text>
          <Text className="text-muted-foreground mt-1 text-center text-xs">
            Try another city or pincode from the location bar.
          </Text>
        </View>
      ) : null}
    </View>
  );
}
