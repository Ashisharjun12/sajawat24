import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { ProductPdpSimilarGalleryButton } from '@/module/catalog/components/product-detail/ProductPdpSimilarPackages';
import { ChevronLeft, Home, Share2 } from 'lucide-react-native';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ProductDetailGalleryProps = {
  imageUrls: string[];
  title: string;
  onBack: () => void;
  onHome: () => void;
  onShare?: () => void;
  showSimilar?: boolean;
  onSimilar?: () => void;
};

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=600&fit=crop';

export function ProductDetailGallery({
  imageUrls,
  title,
  onBack,
  onHome,
  onShare,
  showSimilar,
  onSimilar,
}: ProductDetailGalleryProps) {
  const width = Dimensions.get('window').width;
  const insets = useSafeAreaInsets();
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
    <View style={{ marginHorizontal: -20 }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        decelerationRate="fast">
        {urls.map((uri, i) => (
          <Image
            key={`${uri}-${i}`}
            source={{ uri }}
            style={{ width, aspectRatio: 1 }}
            contentFit="cover"
            accessibilityLabel={title}
          />
        ))}
      </ScrollView>
      <View
        className="absolute inset-x-0 top-0 z-20 flex-row items-start justify-between px-3"
        style={{ paddingTop: Math.max(insets.top, 12) }}>
        <Pressable
          onPress={onBack}
          className="size-10 items-center justify-center rounded-full bg-background/95 shadow-md"
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Icon as={ChevronLeft} className="text-foreground size-5" />
        </Pressable>
        <View className="flex-row items-center gap-2">
          {onShare ? (
            <Pressable
              onPress={onShare}
              className="size-10 items-center justify-center rounded-full bg-background/95 shadow-md"
              accessibilityRole="button"
              accessibilityLabel="Share">
              <Icon as={Share2} className="text-foreground size-5" />
            </Pressable>
          ) : null}
          <Pressable
            onPress={onHome}
            className="size-10 items-center justify-center rounded-full bg-background/95 shadow-md"
            accessibilityRole="button"
            accessibilityLabel="Home">
            <Icon as={Home} className="text-foreground size-5" />
          </Pressable>
        </View>
      </View>
      {urls.length > 1 ? (
        <View className="absolute bottom-3 w-full flex-row justify-center gap-1.5">
          {urls.map((_, i) => (
            <View
              key={i}
              className={cn(
                'h-2 rounded-full',
                i === index ? 'w-5 bg-primary' : 'w-2 bg-white/70',
              )}
            />
          ))}
        </View>
      ) : null}
      {showSimilar && onSimilar ? (
        <View
          className={cn(
            'absolute right-0 z-20 px-3',
            urls.length > 1 ? 'bottom-10' : 'bottom-3',
          )}
          pointerEvents="box-none">
          <ProductPdpSimilarGalleryButton onPress={onSimilar} />
        </View>
      ) : null}
    </View>
  );
}
