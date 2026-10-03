import { ScalePressable } from '@/components/shell';
import type { HomeBannerSlide } from '@/module/home/lib/home-catalog';
import { openCmsLink } from '@/lib/open-cms-link';
import { Image } from 'expo-image';
import { View } from 'react-native';

type HomePromoBannerProps = {
  slide: HomeBannerSlide | null;
};

export function HomePromoBanner({ slide }: HomePromoBannerProps) {
  if (!slide) return null;

  const onPress = slide.href
    ? () => {
        openCmsLink(slide.href!);
      }
    : undefined;

  const content = (
    <View className="mx-4 overflow-hidden rounded-2xl border border-border bg-muted/50">
      <Image
        source={{ uri: slide.imageUrl }}
        style={{ width: '100%', aspectRatio: 16 / 9 }}
        contentFit="contain"
        accessibilityLabel={slide.alt}
      />
    </View>
  );

  if (!onPress) return content;

  return (
    <ScalePressable onPress={onPress} haptic accessibilityRole="button" accessibilityLabel={slide.alt}>
      {content}
    </ScalePressable>
  );
}
