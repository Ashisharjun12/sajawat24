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
import { ActivityIndicator, View } from 'react-native';
import { Star } from 'lucide-react-native';

type ProductReviewsPreviewProps = {
  productId: string;
  product: CatalogProductDetail;
  previewLimit?: number;
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
    <Accordion type="single" collapsible className="rounded-3xl border border-border bg-card px-4">
      <AccordionItem value="reviews">
        <AccordionTrigger className="py-3">
          <View className="flex-1 flex-row items-center gap-3 pr-2">
            <View className="size-8 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/40">
              <Icon as={Star} className="size-4 text-sky-600 dark:text-sky-400" />
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
  );
}
