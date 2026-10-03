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
const HORIZONTAL_PADDING = 16;
const SLIDE_GAP = 12;
const CARD_WIDTH = Dimensions.get('window').width - HORIZONTAL_PADDING * 2;
const CARD_HEIGHT = Math.round((CARD_WIDTH * 9) / 16);
const SNAP_INTERVAL = CARD_WIDTH + SLIDE_GAP;

type HomeBannerCarouselProps = {
  slides: HomeBannerSlide[];
};

function BannerSlideCard({ item }: { item: HomeBannerSlide }) {
  const hasLink = Boolean(item.href?.trim());
  const a11yLabel =
    item.ctaLabel?.trim() || item.alt || item.title?.trim() || 'Banner';

  const content = (
    <View
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
      className="mr-3 overflow-hidden rounded-2xl border border-border bg-muted/50">
      <Image
        source={{ uri: item.imageUrl }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        accessibilityLabel={item.alt}
      />
    </View>
  );

  if (hasLink) {
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

  return content;
}

export function HomeBannerCarousel({ slides }: HomeBannerCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const listRef = useRef<FlatList<HomeBannerSlide>>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (slides.length < 2 || paused) return undefined;
    const id = setInterval(() => {
      setIndex((current) => {
        const next = (current + 1) % slides.length;
        listRef.current?.scrollToOffset({
          offset: next * SNAP_INTERVAL,
          animated: true,
        });
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
    const next = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
    setIndex(next);
  }, []);

  const renderItem: ListRenderItem<HomeBannerSlide> = ({ item }) => (
    <BannerSlideCard item={item} />
  );

  if (!slides.length) return null;

  return (
    <View className="px-4 pt-2">
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SNAP_INTERVAL}
        onScrollBeginDrag={pauseAutoplay}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={(_, i) => ({
          length: SNAP_INTERVAL,
          offset: SNAP_INTERVAL * i,
          index: i,
        })}
        renderItem={renderItem}
      />
      {slides.length > 1 ? (
        <View className="mt-2 flex-row justify-center gap-1.5">
          {slides.map((slide, dotIndex) => (
            <View
              key={slide.id}
              className={
                dotIndex === index
                  ? 'bg-primary h-1.5 w-4 rounded-full'
                  : 'bg-muted h-1.5 w-1.5 rounded-full'
              }
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
