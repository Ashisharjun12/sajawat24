import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { Share2 } from 'lucide-react-native';
import { ProductPdpSimilarGalleryButton } from '@/module/catalog/components/product-detail/ProductPdpSimilarPackages';
import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

type ProductDetailGalleryProps = {
  imageUrls: string[];
  title: string;
  showSimilar?: boolean;
  onSimilar?: () => void;
  /** Share button at the photo's bottom-right. */
  onShare?: () => void;
  /** Hide floating chrome so modals/sheets sit above the hero image (Android z-order). */
  suppressChrome?: boolean;
  /** Scheduled flow: tap hero to open date/time sheet. */
  onSchedulePress?: () => void;
};

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=600&fit=crop';

/** Full-width swipeable photos; page dots sit below the image. Header lives in `ProductPdpTopBar`. */
export function ProductDetailGallery({
  imageUrls,
  title,
  showSimilar,
  onSimilar,
  onShare,
  suppressChrome = false,
  onSchedulePress,
}: ProductDetailGalleryProps) {
  const width = Dimensions.get('window').width;
  const urls = imageUrls.length > 0 ? imageUrls : [PLACEHOLDER];
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.round(x / width);
    if (next !== index && next >= 0 && next < urls.length) {
      setIndex(next);
    }
  }

  return (
    <View
      style={{
        marginHorizontal: -20,
        zIndex: suppressChrome ? 0 : undefined,
        elevation: suppressChrome ? 0 : undefined,
      }}>
      <View>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          decelerationRate="fast">
          {urls.map((uri, i) => (
            <Pressable
              key={`${uri}-${i}`}
              disabled={!onSchedulePress}
              onPress={onSchedulePress}
              accessibilityRole={onSchedulePress ? 'button' : undefined}
              accessibilityLabel={onSchedulePress ? 'Pick date and time' : title}>
              <Image
                source={{ uri }}
                style={{ width, aspectRatio: 1 }}
                contentFit="cover"
                accessibilityLabel={title}
              />
            </Pressable>
          ))}
        </ScrollView>
        {onShare ? (
          <View
            className={cn('absolute bottom-3 right-0 px-3', suppressChrome ? 'opacity-0' : 'z-20')}
            pointerEvents={suppressChrome ? 'none' : 'box-none'}>
            <ScalePressable
              onPress={onShare}
              haptic
              hitSlop={6}
              className="size-10 items-center justify-center rounded-full bg-background/95 shadow-md"
              accessibilityRole="button"
              accessibilityLabel="Share">
              <Icon as={Share2} className="size-5 text-foreground" />
            </ScalePressable>
          </View>
        ) : null}
        {showSimilar && onSimilar ? (
          <View
            className={cn('absolute bottom-3 left-0 px-3', suppressChrome ? 'opacity-0' : 'z-20')}
            pointerEvents={suppressChrome ? 'none' : 'box-none'}>
            <ProductPdpSimilarGalleryButton onPress={onSimilar} />
          </View>
        ) : null}
      </View>
      {urls.length > 1 ? (
        <View className="flex-row justify-center gap-1.5 pt-3" accessibilityLabel={`Photo ${index + 1} of ${urls.length}`}>
          {urls.map((_, i) => (
            <View
              key={i}
              className={cn('size-2 rounded-full', i === index ? 'bg-primary' : 'bg-border')}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
