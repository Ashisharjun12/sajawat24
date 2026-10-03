import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeftIcon } from "lucide-react"
import { getAdmin as getProduct } from "@/api/products.api"
import { getApiError } from "@/api/api"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DecoryImageFallback } from "@/module/catalog/components/DecoryImageFallback"
import { CustomerReviewsPanel } from "@/module/reviews/pages/CustomerReviewsPanel"

function coverSrc(product) {
  const cover = (product?.images ?? []).find((item) => item.kind === "image") ?? product?.images?.[0]
  return cover?.thumbnailUrl || cover?.url || cover?.publicUrl || ""
}

export function ProductReviewsAdminPage() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getProduct(id)
      .then((data) => {
        setProduct(data)
        setError("")
      })
      .catch((err) => {
        setProduct(null)
        setError(getApiError(err))
      })
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon-sm" render={<Link to="/catalog?tab=products" />}>
          <ArrowLeftIcon />
        </Button>
        <div>
          <h1 className="font-heading text-2xl font-medium tracking-tight">Product reviews</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Customer reviews shown on the web product page.
          </p>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-20 w-full rounded-2xl" />
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
          <div className="relative size-14 overflow-hidden rounded-xl bg-muted">
            {coverSrc(product) ? (
              <img src={coverSrc(product)} alt="" className="size-full object-cover" />
            ) : (
              <DecoryImageFallback />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{product?.name}</p>
            <p className="text-sm text-muted-foreground">
              {product?.ratingAvg != null ? `${product.ratingAvg} ★` : "No rating"} ·{" "}
              {product?.reviewCount ?? 0} review{(product?.reviewCount ?? 0) === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      )}

      {id && !error ? <CustomerReviewsPanel productId={id} productName={product?.name} /> : null}
    </div>
  )
}
