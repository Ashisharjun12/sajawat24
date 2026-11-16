import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { categoryImageUrl, type HomeCategory } from '@/module/home/lib/home-catalog';
import { Image } from 'expo-image';
import { ChevronRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

type HomeCategoryCardProps = {
  category: HomeCategory;
  width: number;
  onPress: () => void;
};

/** Card ratio 3:4 — admin category images should be 900×1200 (no baked-in title). */
export const HOME_CATEGORY_CARD_RATIO = 3 / 4;

/**
 * Home category card (web mobile parity): image fills a 3:4 card; name + teal "Explore ›"
 * sit top-left on a soft white fade so they read on light and dark photos.
 */
export function HomeCategoryCard({ category, width, onPress }: HomeCategoryCardProps) {
  const remoteUri = categoryImageUrl(category)?.trim() || null;
  const [remoteFailed, setRemoteFailed] = useState(false);

  useEffect(() => {
    setRemoteFailed(false);
  }, [category.id, remoteUri]);

  const showRemote = Boolean(remoteUri) && !remoteFailed;
  const height = Math.round(width / HOME_CATEGORY_CARD_RATIO);
  // Unique per card so SVG gradient ids never collide in the same screen.
  const fadeId = `homeCatFade-${category.id}`.replace(/[^A-Za-z0-9_-]/g, '');

  return (
    <ScalePressable
      onPress={onPress}
      haptic
      pressScale={0.97}
      className="overflow-hidden rounded-2xl border border-border/70 bg-card"
      style={{ width, height }}
      accessibilityRole="button"
      accessibilityLabel={`${category.name}, explore`}>
      {showRemote ? (
        <Image
          source={{ uri: remoteUri! }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
          onError={() => setRemoteFailed(true)}
        />
      ) : (
        <View className="absolute inset-0 bg-muted" />
      )}

      {/* Soft white fade behind the title (top ~45% of the card). */}
      <View pointerEvents="none" style={[styles.fade, { height: height * 0.45 }]}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
              <Stop offset="0.55" stopColor="#FFFFFF" stopOpacity={0.7} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${fadeId})`} />
        </Svg>
      </View>

      <View pointerEvents="none" className="absolute inset-x-0 top-0 items-start gap-1 px-3 pt-3">
        <Text
          className="text-[15px] font-semibold leading-tight tracking-tight"
          // Always dark: it sits on the white fade in both light and dark theme.
          style={{ color: '#171717' }}
          numberOfLines={2}>
          {category.name}
        </Text>
        <View className="flex-row items-center gap-0.5">
          <Text className="text-primary text-xs font-semibold">Explore</Text>
          <Icon as={ChevronRight} className="text-primary size-3.5" strokeWidth={2.5} />
        </View>
      </View>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  fade: { position: 'absolute', left: 0, right: 0, top: 0 },
});
