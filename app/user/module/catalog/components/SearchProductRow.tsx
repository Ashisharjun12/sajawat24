import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { formatPaise } from '@/lib/format-money';
import { discountPercent } from '@/lib/product-price';
import type { HomeCatalogProduct } from '@/module/home/lib/home-catalog';
import { Image } from 'expo-image';
import { ChevronRight } from 'lucide-react-native';
import { View } from 'react-native';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=200&h=200&fit=crop';

type SearchProductRowProps = {
  product: HomeCatalogProduct;
  onPress: () => void;
};

export function SearchProductRow({ product, onPress }: SearchProductRowProps) {
  const percentOff = discountPercent(product.pricePaise, product.compareAtPaise);
  const imageUri = product.imageUrl ?? PLACEHOLDER;

  return (
    <ScalePressable
      onPress={onPress}
      haptic
      className="flex-row items-center gap-3 rounded-xl py-2.5 active:bg-muted/80"
      accessibilityRole="button"
      accessibilityLabel={product.title}>
      <View className="size-14 shrink-0 overflow-hidden rounded-md bg-muted">
        <Image source={{ uri: imageUri }} style={{ width: 56, height: 56 }} contentFit="cover" />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-foreground text-sm font-medium leading-snug" numberOfLines={2}>
          {product.title}
        </Text>
        <View className="mt-1 flex-row flex-wrap items-center gap-2">
          <Text className="text-sm font-semibold tabular-nums text-emerald-700">
            {formatPaise(product.pricePaise)}
          </Text>
          {percentOff > 0 ? (
            <View className="rounded-md bg-emerald-100 px-1.5 py-0.5">
              <Text className="text-[11px] font-semibold text-emerald-800">
                {percentOff}% off
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <Icon as={ChevronRight} className="text-muted-foreground/60 size-4 shrink-0" />
    </ScalePressable>
  );
}

export function SearchProductRowSkeleton() {
  return (
    <View className="flex-row items-center gap-3 px-2 py-2.5">
      <View className="size-14 rounded-md bg-muted" />
      <View className="flex-1 gap-2">
        <View className="h-3.5 w-[88%] rounded-md bg-muted" />
        <View className="h-4 w-24 rounded-md bg-muted" />
      </View>
    </View>
  );
}
