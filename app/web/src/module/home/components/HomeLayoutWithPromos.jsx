import { Fragment } from "react";
import { HomeLayoutBlocks } from "@/module/home/components/HomeLayoutBlocks";
import { HomePromoBanner } from "@/module/cms/components/HomePromoBanner";

const SECTIONS_PER_CHUNK = 2;

/**
 * Renders CMS homepage blocks in pairs. Mid promo after the first pair (≥2 sections);
 * end promo after the second pair (≥4 sections).
 */
export function HomeLayoutWithPromos({ blocks = [], midSlide, endSlide }) {
  if (blocks.length === 0) {
    return null;
  }

  const chunks = [];
  for (let i = 0; i < blocks.length; i += SECTIONS_PER_CHUNK) {
    chunks.push(blocks.slice(i, i + SECTIONS_PER_CHUNK));
  }

  const showMid = Boolean(midSlide) && blocks.length >= SECTIONS_PER_CHUNK;
  const showEnd = Boolean(endSlide) && blocks.length >= SECTIONS_PER_CHUNK * 2;

  return (
    <div className="space-y-10 md:space-y-12">
      {chunks.map((chunk, index) => (
        <Fragment key={`home-chunk-${index}`}>
          <HomeLayoutBlocks blocks={chunk} />
          {index === 0 && showMid ? (
            <HomePromoBanner slide={midSlide} className="!mt-0" />
          ) : null}
          {index === 1 && showEnd ? (
            <HomePromoBanner slide={endSlide} className="!mt-0" />
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}
