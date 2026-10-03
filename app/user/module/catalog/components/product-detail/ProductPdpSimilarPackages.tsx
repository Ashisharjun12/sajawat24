import { ScalePressable } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { afterModalDismiss } from '@/lib/share-product';
import { BRAND_PRIMARY_HEX } from '@/lib/theme';
import {
  CatalogProductCard,
  CatalogProductCardSkeleton,
} from '@/module/catalog/components/CatalogProductCard';
import { usePdpSimilarPackages } from '@/module/catalog/hooks/use-pdp-similar-packages';
import type { CatalogProductDetail } from '@/module/catalog/lib/product-detail';
import { HomeBottomSheetModal } from '@/module/home/components/HomeBottomSheetModal';
import type { HomeCatalogProduct } from '@/module/home/lib/home-catalog';
import { type Href, router } from 'expo-router';
import { ArrowRight, Sparkles } from 'lucide-react-native';
import { useMemo } from 'react';
import { Dimensions, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SHEET_HEIGHT_RATIO = 0.88;
const GRID_GAP = 12;
const GRID_PADDING = 20;

type ProductPdpSimilarGalleryButtonProps = {
  onPress: () => void;
  disabled?: boolean;
  className?: string;
};

export function ProductPdpSimilarGalleryButton({
  onPress,
  disabled,
}: ProductPdpSimilarGalleryButtonProps) {
  return (
    <ScalePressable
      onPress={onPress}
      haptic
      disabled={disabled}
      className="flex-row items-center gap-1.5 rounded-full bg-background/95 px-3 py-1.5 shadow-md active:opacity-90 disabled:opacity-50"
      accessibilityRole="button"
      accessibilityLabel="Similar packages">
      <Icon as={Sparkles} className="size-3.5 text-primary" />
      <Text className="text-foreground text-xs font-semibold">Similar</Text>
    </ScalePressable>
  );
}

function SimilarPackagesHeader() {
  return (
    <View className="border-b border-border/60 px-5 py-4">
      <View className="flex-row items-center gap-2">
        <View
          className="size-8 items-center justify-center rounded-full"
          style={{ backgroundColor: `${BRAND_PRIMARY_HEX}26` }}>
          <Icon as={Sparkles} className="size-4 text-primary" />
        </View>
        <Text className="text-foreground text-lg font-semibold">Similar packages</Text>
      </View>
      <Text className="text-muted-foreground mt-1 text-sm">More setups you may like</Text>
    </View>
  );
}

type SimilarPackagesBodyProps = {
  product: CatalogProductDetail;
  enabled: boolean;
  onNavigate: () => void;
};

function SimilarPackagesBody({ product, enabled, onNavigate }: SimilarPackagesBodyProps) {
  const insets = useSafeAreaInsets();
  const { meta, items, loading, hasLocation } = usePdpSimilarPackages(product, { enabled });
  const { width } = Dimensions.get('window');
  const cardWidth = (width - GRID_PADDING * 2 - GRID_GAP) / 2;

  async function openProduct(item: HomeCatalogProduct) {
    onNavigate();
    await afterModalDismiss();
    router.push(`/(app)/product/${item.id}` as Href);
  }

  async function openViewAll() {
    if (!meta?.viewAllHref) return;
    onNavigate();
    await afterModalDismiss();
    router.push(meta.viewAllHref);
  }

  if (!meta) {
    return (
      <View className="px-5 py-10">
        <Text className="text-muted-foreground text-center text-sm">
          Similar packages are not available for this setup.
        </Text>
      </View>
    );
  }

  if (!hasLocation) {
    return (
      <View className="items-center gap-3 px-5 py-10">
        <Text className="text-muted-foreground text-center text-sm">
          Choose your city to see similar packages and local prices.
        </Text>
      </View>
    );
  }

  return (
    <View className="min-h-0 flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: GRID_PADDING,
          paddingTop: 12,
          paddingBottom: 12,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="mb-3 self-start rounded-full bg-primary/15 px-2.5 py-1">
          <Text className="text-foreground text-xs font-semibold">{meta.categoryLabel}</Text>
        </View>

        {loading ? (
          <View className="flex-row flex-wrap" style={{ gap: GRID_GAP }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <View key={index} style={{ width: cardWidth }}>
                <CatalogProductCardSkeleton layout="grid" />
              </View>
            ))}
          </View>
        ) : items.length === 0 ? (
          <Text className="text-muted-foreground py-8 text-center text-sm">
            No similar packages right now. Browse the full category instead.
          </Text>
        ) : (
          <View className="flex-row flex-wrap" style={{ gap: GRID_GAP }}>
            {items.map((item) => (
              <View key={item.id} style={{ width: cardWidth }}>
                <CatalogProductCard
                  product={item}
                  layout="grid"
                  onPress={() => openProduct(item)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {meta.viewAllHref ? (
        <View
          className="border-t border-border/80 px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          <Button className="h-11 w-full flex-row gap-2 rounded-full bg-primary" onPress={openViewAll}>
            <Text className="text-primary-foreground text-sm font-semibold">{meta.viewAllLabel}</Text>
            <Icon as={ArrowRight} className="text-primary-foreground size-4 shrink-0" />
          </Button>
        </View>
      ) : null}
    </View>
  );
}

type ProductPdpSimilarPackagesProps = {
  product: CatalogProductDetail | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProductPdpSimilarPackages({
  product,
  open,
  onOpenChange,
}: ProductPdpSimilarPackagesProps) {
  const sheetHeight = useMemo(
    () => Dimensions.get('window').height * SHEET_HEIGHT_RATIO,
    [],
  );

  const canShow = Boolean(product?.id && product?.categoryId);
  if (!canShow) return null;

  function close() {
    onOpenChange(false);
  }

  return (
    <HomeBottomSheetModal
      visible={open}
      onClose={close}
      sheetMinHeight={sheetHeight}
      closeAccessibilityLabel="Close similar packages">
      <View style={{ height: sheetHeight }} className="flex-col overflow-hidden">
        <SimilarPackagesHeader />
        <View className="min-h-0 flex-1">
          <SimilarPackagesBody product={product!} enabled={open} onNavigate={close} />
        </View>
      </View>
    </HomeBottomSheetModal>
  );
}
