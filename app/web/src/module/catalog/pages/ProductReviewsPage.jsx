import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getApiError } from "@/api/api";
import { getProduct } from "@/api/products.api";
import { listProductReviews } from "@/api/reviews.api";
import { productPath } from "@/lib/catalog-path";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DecoryImageFallback } from "@/components/decory-image-fallback";
import { ProductReviewCard } from "@/module/catalog/components/reviews/ProductReviewCard";
import { ProductReviewsSummary } from "@/module/catalog/components/reviews/ProductReviewsSummary";
import { resolveProductReviewCount } from "@/module/catalog/components/reviews/review-count";
import { isBackendCityId, useLocationStore } from "@/store/location.store";

const PAGE_SIZE = 10;

function coverSrc(product) {
  const cover = product?.images?.[0];
  return cover?.url || cover?.thumbnailUrl || cover?.publicUrl || "";
}

export function ProductReviewsPage() {
  const { id } = useParams();
  const city = useLocationStore((s) => s.city);
  const pincode = useLocationStore((s) => s.pincode);
  const hasLocation =
    Boolean(pincode?.code) || (Boolean(city?.id) && isBackendCityId(city.id));

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id || !hasLocation) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.all([
      getProduct(id, {
        pincode: pincode?.code || undefined,
        cityId: pincode?.code ? undefined : city?.id,
      }),
      listProductReviews(id, { page, limit: PAGE_SIZE }),
    ])
      .then(([productData, reviewData]) => {
        if (cancelled) return;
        setProduct(productData);
        setReviews(reviewData);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(getApiError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, hasLocation, pincode?.code, city?.id, page]);

  const total = reviews?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const reviewCount = resolveProductReviewCount({ data: reviews, product, items: reviews?.items });
  const summary =
    reviews?.summary ??
    (reviewCount > 0
      ? {
          ratingAvg: product?.ratingAvg != null ? Number(product.ratingAvg) : null,
          reviewCount,
          distribution: {},
        }
      : null);

  return (
    <div className="mx-auto w-full min-w-0 max-w-[840px] px-4 py-8 md:px-8 md:py-12">
      <p className="mb-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link>
        {" / "}
        <Link to="/decorations" className="hover:text-foreground">Decorations</Link>
        {" / "}
        <Link to={productPath({ id })} className="hover:text-foreground">
          {product?.name || "Product"}
        </Link>
        {" / "}
        <span className="text-foreground">Reviews</span>
      </p>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
            <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
              {coverSrc(product) ? (
                <img src={coverSrc(product)} alt="" className="size-full object-cover" />
              ) : (
                <DecoryImageFallback />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-heading text-xl font-medium">{product?.name}</h1>
              <p className="text-sm text-muted-foreground">All customer reviews for this setup</p>
            </div>
            <Button type="button" variant="outline" size="sm" render={<Link to={productPath({ id })} />}>
              Back to product
            </Button>
          </div>

          <div>
            <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              Customer feedback
            </p>
            <h2 className="font-heading text-2xl font-medium tracking-tight">Ratings &amp; Reviews</h2>
          </div>

          <ProductReviewsSummary summary={summary} />

          {reviews?.items?.length ? (
            <div className="flex flex-col gap-3">
              {reviews.items.map((review) => (
                <ProductReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : reviewCount > 0 ? (
            <p className="rounded-2xl border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
              Reviews are temporarily unavailable. Please try again in a moment.
            </p>
          ) : (
            <p className="rounded-2xl border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
              No reviews yet for this product.
            </p>
          )}

          {pageCount > 1 ? (
            <div className="flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {pageCount}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= pageCount}
                onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
