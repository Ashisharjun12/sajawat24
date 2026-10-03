import { HomeLayoutBlocks } from '@/module/home/components/HomeLayoutBlocks';
import { HomePromoBanner } from '@/module/home/components/HomePromoBanner';
import type { HomeBannerSlide, HomeCmsLayoutBlock } from '@/module/home/lib/home-catalog';
import { Fragment } from 'react';
import { View } from 'react-native';

const SECTIONS_PER_CHUNK = 2;

type HomeLayoutWithPromosProps = {
  blocks: HomeCmsLayoutBlock[];
  midSlide?: HomeBannerSlide | null;
  endSlide?: HomeBannerSlide | null;
  loading?: boolean;
};

export function HomeLayoutWithPromos({
  blocks,
  midSlide,
  endSlide,
  loading = false,
}: HomeLayoutWithPromosProps) {
  if (!loading && blocks.length === 0) return null;

  const chunks: HomeCmsLayoutBlock[][] = [];
  for (let i = 0; i < blocks.length; i += SECTIONS_PER_CHUNK) {
    chunks.push(blocks.slice(i, i + SECTIONS_PER_CHUNK));
  }

  const showMid = Boolean(midSlide) && blocks.length >= SECTIONS_PER_CHUNK;
  const showEnd = Boolean(endSlide) && blocks.length >= SECTIONS_PER_CHUNK * 2;

  return (
    <View className="gap-10">
      {chunks.map((chunk, index) => (
        <Fragment key={`chunk-${index}`}>
          <HomeLayoutBlocks blocks={chunk} loading={loading} />
          {index === 0 && showMid ? <HomePromoBanner slide={midSlide ?? null} /> : null}
          {index === 1 && showEnd ? <HomePromoBanner slide={endSlide ?? null} /> : null}
        </Fragment>
      ))}
    </View>
  );
}
