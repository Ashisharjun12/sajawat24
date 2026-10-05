import { getApiError } from '@/api/client';
import { catalogLocationErrorMessage } from '@/lib/catalog-location';
import { Text } from '@/components/ui/text';
import { cardShadow } from '@/lib/design-tokens';
import { useGoBack } from '@/lib/use-go-back';
import { cartLocationBody } from '@/lib/catalog-location';
import { isBackendCityId } from '@/lib/location-label';
import { openWhatsAppSupport } from '@/lib/support-actions';
import type { FulfillmentMode } from '@/module/catalog/components/ProductFulfillmentTabs';
import { ProductOtherCategoriesRail } from '@/module/catalog/components/ProductOtherCategoriesRail';
import { ProductSimilarRail } from '@/module/catalog/components/ProductSimilarRail';
import {
  useProductDetailLocation,
  useProductDetailQuery,
} from '@/module/catalog/hooks/use-product-detail-query';
import { useOtherCategoryProductsQuery } from '@/module/catalog/hooks/use-other-category-products-query';
import { useSimilarProductsQuery } from '@/module/catalog/hooks/use-similar-products-query';
import {
  parseRatingAvg,
  productImageUrls,
  type CatalogProductDetail,
} from '@/module/catalog/lib/product-detail';
import { queryClient } from '@/lib/query-client';
import { goToCheckoutAfterAdd } from '@/module/booking/lib/open-cart-checkout';
import { syncCartQueryCache } from '@/module/booking/hooks/use-cart-query';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useLocationStore } from '@/store/location.store';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { Href, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProductPdpAddonsSection } from './ProductPdpAddonsSection';
import { ProductDetailDeliverySection } from './ProductDetailDeliverySection';
import { ProductDetailError } from './ProductDetailError';
import { ProductDetailGallery } from './ProductDetailGallery';
import { ProductDetailHeader } from './ProductDetailHeader';
import { ProductDetailLocationPrompt } from './ProductDetailLocationPrompt';
import { ProductDetailSkeleton } from './ProductDetailSkeleton';
import { ProductDetailTitleBlock } from './ProductDetailTitleBlock';
import { ProductPdpMobileBookingBar } from './ProductPdpMobileBookingBar';
import { ProductPdpBreadcrumb } from './ProductPdpBreadcrumb';
import { ProductPdpDetailsTabs } from './ProductPdpDetailsTabs';
import { ProductPdpAboutPackage } from './ProductPdpAboutPackage';
import { ProductPdpOffers } from './ProductPdpOffers';
import { ProductPdpPrice } from './ProductPdpPrice';
import { ProductReviewsPreview } from './ProductReviewsPreview';
import { ProductPdpSimilarPackages } from './ProductPdpSimilarPackages';
import { ProductShareSheet } from './ProductShareSheet';
import { ProductScheduleBookingSheet } from './ProductScheduleBookingSheet';
import { useProductAddonSelection } from './use-product-addon-selection';

type ProductPdpScreenProps = {
  productId: string;
};

export function ProductPdpScreen({ productId }: ProductPdpScreenProps) {
  const { hasLocation } = useProductDetailLocation();
  const {
    data: product,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useProductDetailQuery(productId);
  const city = useLocationStore((s) => s.city);
  const pincode = useLocationStore((s) => s.pincode);
  const addItem = useCartStore((s) => s.addItem);
  const user = useAuthStore((s) => s.user);

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const footerPad = 108 + Math.max(insets.bottom, 12);

  const [fulfillment, setFulfillment] = useState<FulfillmentMode>('scheduled');
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [similarOpen, setSimilarOpen] = useState(false);
  const [scheduleSheetOpen, setScheduleSheetOpen] = useState(false);
  const addons = product?.addons ?? [];
  const addonSelection = useProductAddonSelection(addons);

  const { data: similar = [], isLoading: similarLoading } = useSimilarProductsQuery(
    product?.id,
    product?.categoryId,
  );
  const { data: otherCategory = [], isLoading: otherCategoryLoading } =
    useOtherCategoryProductsQuery(product?.id, product?.categoryId);

  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent?.setOptions({ tabBarStyle: undefined });
    };
  }, [navigation]);

  useEffect(() => {
    if (!product) return;
    const canInstant = Boolean(product.instant?.enabled);
    const canScheduled = product.scheduledEnabled !== false;
    setFulfillment(canInstant && !canScheduled ? 'instant' : 'scheduled');
  }, [product]);

  const resetAddonSelection = addonSelection.reset;

  const canInstant = Boolean(product?.instant?.enabled);
  const canScheduled = product?.scheduledEnabled !== false;
  const isInstantBooking = fulfillment === 'instant' && canInstant;
  const hasAddons = addons.length > 0;

  const completeBooking = useCallback(
    async (
      addonSelections: { addonId: string; quantity: number }[],
      scheduledIso?: string | null,
    ) => {
      if (!product?.id) return;
      const serviceCityId =
        city?.id && isBackendCityId(city.id) ? city.id : undefined;
      const pincodeCode = pincode?.code?.replace(/\D/g, '').slice(0, 6) || undefined;
      const locationBody = cartLocationBody({
        cityId: serviceCityId,
        pincode: pincodeCode,
      });

      setBooking(true);
      try {
        const cart = await addItem({
          productId: product.id,
          quantity: 1,
          addons: addonSelections.length ? addonSelections : undefined,
          ...locationBody,
          scheduledAt: isInstantBooking
            ? null
            : (scheduledIso ?? scheduledAt) || undefined,
          fulfillmentType: isInstantBooking ? 'instant' : 'scheduled',
        });
        syncCartQueryCache(queryClient, cart);
        resetAddonSelection();
        if (!user) {
          router.push('/(onboarding)/login' as Href);
          return;
        }
        goToCheckoutAfterAdd(user);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          router.push('/(onboarding)/login' as Href);
          return;
        }
        Alert.alert('Could not add to bag', getApiError(err));
      } finally {
        setBooking(false);
      }
    },
    [product?.id, pincode, city, isInstantBooking, scheduledAt, addItem, user, resetAddonSelection],
  );

  const onBookNow = useCallback(() => {
    if (!product) return;
    if (!hasLocation) {
      Alert.alert('Select your city first', 'Choose your delivery area to continue.');
      return;
    }
    if (isInstantBooking) {
      void completeBooking(addonSelection.buildSelections());
      return;
    }
    setScheduleSheetOpen(true);
  }, [product, hasLocation, isInstantBooking, completeBooking, addonSelection.buildSelections]);

  const onScheduleSheetContinue = useCallback(
    (iso: string) => {
      setScheduledAt(iso);
      setScheduleSheetOpen(false);
      void completeBooking(addonSelection.buildSelections(), iso);
    },
    [completeBooking, addonSelection.buildSelections],
  );

  const onBack = useGoBack();

  function onHome() {
    router.navigate('/(app)/' as Href);
  }

  if (!productId) {
    return (
      <View className="flex-1 bg-background px-5" style={{ paddingTop: insets.top + 8 }}>
        <Text className="text-foreground text-h1 font-semibold">Product not found</Text>
      </View>
    );
  }

  if (!hasLocation) {
    return (
      <View className="flex-1 bg-background">
        <ProductDetailHeader onBack={onBack} variant="solid" />
        <ProductDetailLocationPrompt />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <ProductDetailSkeleton />
      </View>
    );
  }

  if (isError || !product) {
    return (
      <View className="flex-1 bg-background">
        <ProductDetailHeader onBack={onBack} variant="solid" />
        <ProductDetailError
          message={catalogLocationErrorMessage(error)}
          onBack={onBack}
          onRetry={isFetching ? undefined : () => void refetch()}
        />
      </View>
    );
  }

  const detail = product as CatalogProductDetail;
  const title = (detail.name ?? '').trim() || 'Product';
  const images = productImageUrls(detail.images);
  const rating = parseRatingAvg(detail.ratingAvg);

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: footerPad,
          paddingHorizontal: 20,
        }}>
        <ProductDetailGallery
          imageUrls={images}
          title={title}
          onBack={onBack}
          onHome={onHome}
          wishlistProduct={{
            id: detail.id,
            title,
            imageUrl: images[0] ?? null,
            pricePaise: detail.pricePaise ?? 0,
            compareAtPaise: detail.compareAtPaise,
          }}
          onShare={detail.id ? () => setShareOpen(true) : undefined}
          showSimilar={Boolean(detail.categoryId)}
          onSimilar={() => setSimilarOpen(true)}
          suppressChrome={scheduleSheetOpen}
          onSchedulePress={
            canScheduled && !isInstantBooking ? () => setScheduleSheetOpen(true) : undefined
          }
        />

        <View className="mt-4 gap-4">
          <ProductPdpBreadcrumb title={title} categoryId={detail.categoryId} />

          <ProductDetailTitleBlock title={title} showInstantBadge={false} />

          <ProductPdpPrice
            pricePaise={detail.pricePaise}
            compareAtPaise={detail.compareAtPaise}
            ratingAvg={rating}
            reviewCount={detail.reviewCount != null ? Number(detail.reviewCount) : null}
          />
        </View>

        <View className="-mx-5 gap-4 bg-primary-tint px-5 py-4">
          <ProductDetailDeliverySection
            canInstant={canInstant}
            canScheduled={canScheduled}
            fulfillment={fulfillment}
            onFulfillmentChange={setFulfillment}
            instantLabel={detail.instant?.badgeLabel}
            instantNote={detail.instant?.pdpNote}
            instantEtaMinutes={detail.instant?.etaMinutes}
          />

          <ProductPdpOffers productId={detail.id} categoryId={detail.categoryId} />

          {hasAddons ? (
            <ProductPdpAddonsSection
              addons={addons}
              qtyById={addonSelection.qtyById}
              disabled={booking}
              onSetQty={addonSelection.setQty}
              onToggle={addonSelection.toggleSingle}
              onIncrement={addonSelection.increment}
            />
          ) : null}
        </View>

        <View className="mt-4 gap-4">
          <ProductPdpAboutPackage description={detail.description} />

          <ProductPdpDetailsTabs
            includes={detail.includes}
            faqs={detail.faqs}
            deliverySetup={detail.deliverySetup}
            careInstructions={detail.careInstructions}
          />

          <ProductReviewsPreview productId={detail.id} product={detail} />

          <ProductSimilarRail
            items={similar}
            loading={similarLoading}
            categoryId={detail.categoryId}
          />
          <ProductOtherCategoriesRail
            items={otherCategory}
            loading={otherCategoryLoading}
            stackedBelowRail={similarLoading || similar.length > 0}
          />
        </View>
      </ScrollView>

      {!scheduleSheetOpen ? (
        <View
          className="absolute inset-x-0 bottom-0 border-t border-border bg-surface px-4 pt-3"
          style={{
            paddingBottom: Math.max(insets.bottom, 12),
            shadowColor: cardShadow.shadowColor,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: cardShadow.shadowOpacity,
            shadowRadius: cardShadow.shadowRadius,
            elevation: 8,
          }}>
          <ProductPdpMobileBookingBar
            pricePaise={detail.pricePaise}
            booking={booking}
            isInstantBooking={isInstantBooking}
            onWhatsApp={() => void openWhatsAppSupport()}
            onBookNow={onBookNow}
          />
        </View>
      ) : null}

      {detail.id ? (
        <ProductShareSheet
          open={shareOpen}
          onOpenChange={setShareOpen}
          title={title}
          productId={detail.id}
        />
      ) : null}

      <ProductPdpSimilarPackages
        product={detail}
        open={similarOpen}
        onOpenChange={setSimilarOpen}
      />

      <ProductScheduleBookingSheet
        visible={scheduleSheetOpen}
        submitting={booking}
        title={title}
        imageUrl={images[0]}
        onClose={() => setScheduleSheetOpen(false)}
        onContinue={onScheduleSheetContinue}
      />
    </View>
  );
}
