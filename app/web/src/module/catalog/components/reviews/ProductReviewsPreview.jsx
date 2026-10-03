import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRightIcon, PenLineIcon, StarIcon } from "lucide-react";
import { listProductReviews } from "@/api/reviews.api";
import { productReviewsPath } from "@/lib/catalog-path";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductReviewCard } from "@/module/catalog/components/reviews/ProductReviewCard";
import { ProductReviewsSummary } from "@/module/catalog/components/reviews/ProductReviewsSummary";
import {
  hasProductReviews,
  resolveProductReviewCount,
} from "@/module/catalog/components/reviews/review-count";

export function ProductReviewsPreview({
  productId,
  product,
  previewLimit = 4,
  className,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    listProductReviews(productId, { page: 1, limit: previewLimit })
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
          setError("Couldn't load reviews right now.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId, previewLimit]);

  const items = data?.items ?? [];
  const reviewCount = resolveProductReviewCount({ data, product, items });
  const showSection =
    loading ||
    hasProductReviews({ data, product, items }) ||
    (error && Number(product?.reviewCount) > 0);

  if (!showSection) return null;

  const summary =
    data?.summary ??
    (reviewCount > 0
      ? {
          ratingAvg: product?.ratingAvg != null ? Number(product.ratingAvg) : null,
          reviewCount,
          distribution: {},
        }
      : null);

  const showMore = reviewCount > items.length || reviewCount > previewLimit;
  const reviewsHref = productId ? productReviewsPath(productId) : "#";

  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-4 md:p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/50"
            aria-hidden
          >
            <StarIcon className="size-4 fill-amber-500 text-amber-500" />
          </span>
          <h2 className="font-heading text-lg font-bold tracking-tight text-foreground">
            Customer reviews
          </h2>
        </div>
        <Link
          to="/account/bookings"
          className="inline-flex shrink-0 items-center gap-1 pt-0.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-500"
        >
          <PenLineIcon className="size-3.5" aria-hidden />
          Write review
        </Link>
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-x-auto pb-1 max-md:flex-row md:flex-col md:overflow-visible md:gap-3">
          <Skeleton className="h-36 w-[min(82vw,18.5rem)] shrink-0 rounded-[var(--r-card)] md:h-32 md:w-full" />
          <Skeleton className="hidden h-36 w-[min(82vw,18.5rem)] shrink-0 rounded-[var(--r-card)] max-md:block md:block md:h-16 md:w-full" />
        </div>
      ) : (
        <>
          {error ? <p className="text-sm text-muted-foreground">{error}</p> : null}

          <ProductReviewsSummary
            summary={summary}
            availableCount={data?.total ?? reviewCount}
          />

          {reviewCount > 0 ? (
            <span
              className="inline-flex w-fit items-center rounded-full border border-emerald-700/30 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-600/40 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              All reviews {reviewCount.toLocaleString()}
            </span>
          ) : null}

          <div
            className="-mx-4 flex gap-3 overflow-x-auto overscroll-x-contain scroll-smooth px-4 pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] max-md:flex-row md:mx-0 md:flex-col md:gap-0 md:overflow-visible md:px-0 md:pb-0 md:snap-none [&::-webkit-scrollbar]:hidden"
            aria-label="Recent customer reviews"
          >
            {items.map((review) => (
              <ProductReviewCard key={review.id} review={review} variant="pdpPreview" />
            ))}
          </div>

          {items.length > 0 && showMore ? (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="mt-1 w-full rounded-[var(--r-btn)] md:mt-2 md:w-auto md:self-start"
              nativeButton={false}
              render={<Link to={reviewsHref} />}
            >
              View all reviews
              <ChevronRightIcon className="size-4" aria-hidden />
            </Button>
          ) : null}

          {items.length > 0 && !showMore ? (
            <p className="hidden text-xs text-muted-foreground md:block">
              Showing {items.length} of {reviewCount.toLocaleString()}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
