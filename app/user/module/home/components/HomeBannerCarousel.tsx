import { ScalePressable } from '@/components/shell';
import type { HomeBannerSlide } from '@/module/home/lib/home-catalog';
import { openCmsLink } from '@/lib/open-cms-link';
import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  View,
} from 'react-native';

const AUTOPLAY_MS = 6000;
/** Full-bleed: each slide is exactly the screen width, edge to edge, no gap. */
const SLIDE_WIDTH = Dimensions.get('window').width;
/**
 * Banner width : height. Fixed 2:1, so the box size never depends on image loading.
 * Upload banners at 1080 x 540 (or 1440 x 720) and they fill it exactly, edge to edge.
 */
export const HOME_BANNER_ASPECT = 2;

type HomeBannerCarouselProps = {
  slides: HomeBannerSlide[];
  /**
   * Draw the dots on top of the banner instead of below it, lifted by this many px.
   * Use when something (the search bar) overlaps the bottom of the banner.
   */
  dotsOverlayBottom?: number;
};

function BannerSlide({ item, height }: { item: HomeBannerSlide; height: number }) {
  const hasLink = Boolean(item.href?.trim());
  const a11yLabel = item.ctaLabel?.trim() || item.alt || item.title?.trim() || 'Banner';

  // "contain": the whole image always stays inside the banner, never cropped.
  // When the image has the same ratio as the banner (normal case) it fills it edge to edge.
  const content = (
    <View style={{ width: SLIDE_WIDTH, height }} className="overflow-hidden bg-muted/50">
      <Image
        source={{ uri: item.imageUrl }}
        style={{ width: '100%', height: '100%' }}
        contentFit="contain"
        accessibilityLabel={item.alt}
      />
    </View>
  );

  if (!hasLink) return content;

  return (
    <ScalePressable
      onPress={() => openCmsLink(item.href!)}
      haptic
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}>
      {content}
    </ScalePressable>
  );
}

export function HomeBannerCarousel({ slides, dotsOverlayBottom }: HomeBannerCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const listRef = useRef<FlatList<HomeBannerSlide>>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const height = Math.round(SLIDE_WIDTH / HOME_BANNER_ASPECT);

  useEffect(() => {
    if (slides.length < 2 || paused) return undefined;
    const id = setInterval(() => {
      setIndex((current) => {
        const next = (current + 1) % slides.length;
        listRef.current?.scrollToOffset({ offset: next * SLIDE_WIDTH, animated: true });
        return next;
      });
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, slides.length]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const pauseAutoplay = useCallback(() => {
    setPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => setPaused(false), AUTOPLAY_MS);
  }, []);

  const onMomentumScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / SLIDE_WIDTH));
  }, []);

  const renderItem: ListRenderItem<HomeBannerSlide> = ({ item }) => (
    <BannerSlide item={item} height={height} />
  );

  if (!slides.length) return null;

  const overlay = dotsOverlayBottom != null;

  return (
    <View>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={pauseAutoplay}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={(_, i) => ({ length: SLIDE_WIDTH, offset: SLIDE_WIDTH * i, index: i })}
        renderItem={renderItem}
      />
      {slides.length > 1 ? (
        <View
          pointerEvents="none"
          className={
            overlay
              ? 'absolute inset-x-0 flex-row justify-center gap-1.5'
              : 'mt-2 flex-row justify-center gap-1.5'
          }
          style={overlay ? { bottom: dotsOverlayBottom } : undefined}>
          {slides.map((slide, dotIndex) => {
            const active = dotIndex === index;
            const color = overlay
              ? active
                ? 'bg-white'
                : 'bg-white/50'
              : active
                ? 'bg-primary'
                : 'bg-muted';
            return (
              <View
                key={slide.id}
                className={`h-1.5 rounded-full ${active ? 'w-4' : 'w-1.5'} ${color}`}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
