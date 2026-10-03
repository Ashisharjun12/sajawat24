import { BannerSearch } from "@/module/home/components/BannerSearch";
import { BannerSlider } from "@/module/home/components/BannerSlider";
import { HomeMobileHero } from "@/module/home/components/HomeMobileHero";
import { HomeDiscovery } from "@/module/home/components/HomeDiscovery";
import { HomeLayoutWithPromos } from "@/module/home/components/HomeLayoutWithPromos";
import { HomeCta } from "@/module/home/components/HomeCta";
import { HomeFaq } from "@/module/home/components/HomeFaq";
import { HostQuotes } from "@/module/home/components/HostQuotes";
import { PopularCities } from "@/module/home/components/PopularCities";
import { HomePromoBanner } from "@/module/cms/components/HomePromoBanner";
import { Reveal } from "@/module/home/components/Reveal";
import { useHomeCms } from "@/module/cms/hooks/use-home-cms";

export function HomePage() {
  const { hero, mid, end, testimonials, layoutBlocks } = useHomeCms();
  const useCmsLayout = layoutBlocks.length > 0;

  return (
    <div className="pb-2 md:pb-4">
      <HomeMobileHero slides={hero} />
      <div className="mx-auto hidden max-w-[1240px] px-4 pt-6 md:block md:px-8">
        <BannerSlider slides={hero} />
        <div className="mx-auto mt-8 max-w-[920px]">
          <BannerSearch />
        </div>
      </div>
      <Reveal
        id="home-picks"
        className="mx-auto max-w-[1240px] scroll-mt-24 px-4 pt-6 pb-4 md:px-8 md:pt-12"
      >
        {useCmsLayout ? (
          <HomeLayoutWithPromos
            blocks={layoutBlocks}
            midSlide={mid[0]}
            endSlide={end[0]}
          />
        ) : (
          <HomeDiscovery />
        )}
      </Reveal>
      {!useCmsLayout && mid[0] ? (
        <HomePromoBanner slide={mid[0]} className="mt-10" />
      ) : null}
      <PopularCities />
      <HostQuotes reviews={testimonials} />
      {!useCmsLayout && end[0] ? (
        <HomePromoBanner slide={end[0]} className="mt-4" />
      ) : null}
      <HomeFaq />
      <HomeCta />
    </div>
  );
}
