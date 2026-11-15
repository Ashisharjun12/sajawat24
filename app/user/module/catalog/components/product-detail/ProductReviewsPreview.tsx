import { Text } from '@/components/ui/text';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Icon } from '@/components/ui/icon';
import { useProductReviewsPreviewQuery } from '@/module/catalog/hooks/use-product-reviews-preview-query';
import { hasProductReviews, resolveProductReviewCount } from '@/module/catalog/lib/review-count';
import type { CatalogProductDetail } from '@/module/catalog/lib/product-detail';
import { ProductReviewCard, type ProductReviewItem } from '@/module/catalog/components/product-detail/reviews/ProductReviewCard';
import { ProductReviewsSummary } from '@/module/catalog/components/product-detail/reviews/ProductReviewsSummary';
import { ProductStarRow } from '@/module/catalog/components/product-detail/reviews/ProductStarRow';
import { ActivityIndicator, type LayoutChangeEvent, View } from 'react-native';
import { Star } from 'lucide-react-native';

type ProductReviewsPreviewProps = {
  productId: string;
  product: CatalogProductDetail;
  previewLimit?: number;
  /** Controlled open state (the photo's rating pill opens it). */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Reports the section's y inside its parent, so the PDP can scroll to it. */
  onLayout?: (e: LayoutChangeEvent) => void;
};

type ReviewsPayload = {
  items?: ProductReviewItem[];
  summary?: {
    ratingAvg?: number | null;
    reviewCount?: number;
    distribution?: Record<string | number, number>;
  };
  total?: number;
} | null;

export function ProductReviewsPreview({
  productId,
  product,
  previewLimit = 3,
  expanded,
  onExpandedChange,
  onLayout,
}: ProductReviewsPreviewProps) {
  const { data, isPending, isError } = useProductReviewsPreviewQuery(productId, previewLimit);
  const payload = data as ReviewsPayload;
  const items = payload?.items ?? [];
  const reviewCount = resolveProductReviewCount({
    data: payload as { summary?: { reviewCount?: number }; total?: number; items?: unknown[] } | null,
    product,
    items,
  });
  const showSection =
    isPending ||
    hasProductReviews({
      data: payload as { summary?: { reviewCount?: number }; total?: number; items?: unknown[] } | null,
      product,
      items,
    }) ||
    (isError && Number(product.reviewCount) > 0);

  if (!showSection) return null;

  const summary =
    payload?.summary ??
    (reviewCount > 0
      ? {
          ratingAvg: product.ratingAvg != null ? Number(product.ratingAvg) : null,
          reviewCount,
          distribution: {},
        }
      : null);

  const ratingAvg = summary?.ratingAvg != null ? Number(summary.ratingAvg) : null;
  const subtitleRating =
    ratingAvg != null ? `${ratingAvg.toFixed(1)} out of 5` : 'Customer ratings';
  const subtitleCount = `${reviewCount.toLocaleString('en-IN')} review${reviewCount === 1 ? '' : 's'}`;

  return (
    // Full width: cancel the PDP's 20px side padding (same panel as "Make it yours").
    <View className="-mx-5" onLayout={onLayout}>
    <Accordion
      type="single"
      collapsible
      {...(expanded !== undefined
        ? {
            value: expanded ? 'reviews' : '',
            onValueChange: (v: string | undefined) => onExpandedChange?.(v === 'reviews'),
          }
        : {})}
      className="border-y border-border/80 bg-card px-5">
      <AccordionItem value="reviews">
        <AccordionTrigger className="py-3">
          <View className="flex-1 flex-row items-center gap-3 pr-2">
            <View className="size-8 items-center justify-center rounded-lg bg-primary-tint">
              <Icon as={Star} className="size-4 text-primary" />
            </View>
            <View className="min-w-0 flex-1 gap-1">
              <Text className="text-muted-foreground text-left text-[10px] font-semibold uppercase tracking-wider">
                Customer feedback
              </Text>
              <Text className="text-foreground text-left text-sm font-semibold">
                Ratings & reviews
              </Text>
              <View className="flex-row flex-wrap items-center gap-2">
                {ratingAvg != null ? (
                  <>
                    <Text className="text-foreground text-sm font-semibold tabular-nums">
                      {ratingAvg.toFixed(1)}
                    </Text>
                    <ProductStarRow rating={ratingAvg} size="sm" />
                  </>
                ) : null}
                <Text className="text-muted-foreground text-xs">{subtitleCount}</Text>
              </View>
              {!ratingAvg ? (
                <Text className="text-muted-foreground text-left text-xs">{subtitleRating}</Text>
              ) : null}
            </View>
          </View>
        </AccordionTrigger>
        <AccordionContent className="gap-4 pb-4">
          {isPending ? (
            <ActivityIndicator className="py-8" />
          ) : (
            <>
              {isError ? (
                <Text className="text-muted-foreground text-sm">
                  Could not load reviews right now.
                </Text>
              ) : null}
              <ProductReviewsSummary summary={summary} />
              <View className="gap-3">
                {items.map((review) => (
                  <ProductReviewCard key={review.id} review={review} />
                ))}
              </View>
            </>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
    </View>
  );
}
