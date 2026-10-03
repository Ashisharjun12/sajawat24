import { Reveal } from "@/module/home/components/Reveal";
import { HomeCategoryExplorer } from "@/module/home/components/HomeCategoryExplorer";
import { HomeProductRails } from "@/module/home/components/HomeProductRails";
import { useHomeDiscovery } from "@/module/home/hooks/use-home-discovery";

export function HomeDiscovery() {
  const { categories, sections, loading } = useHomeDiscovery();

  return (
    <Reveal
      id="home-picks"
      className="mx-auto max-w-[1240px] scroll-mt-24 px-4 pt-6 pb-4 md:px-8 md:pt-12"
    >
      <HomeCategoryExplorer categories={categories} />
      <div className="mt-10 md:mt-12">
        <HomeProductRails sections={sections} loading={loading} />
      </div>
    </Reveal>
  );
}
