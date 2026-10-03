import { useEffect, useState } from "react"
import { format } from "date-fns"
import { listAdmin as listProducts } from "@/api/products.api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { ProductMediaPickerDialog } from "@/module/catalog/components/ProductMediaPickerDialog"
import { toGalleryItem } from "@/module/catalog/components/ProductMediaGallery"
import { ReviewStarRow } from "@/module/reviews/components/ReviewStarRow"

function toDateInput(value) {
  if (!value) return format(new Date(), "yyyy-MM-dd")
  try {
    return format(new Date(value), "yyyy-MM-dd")
  } catch {
    return format(new Date(), "yyyy-MM-dd")
  }
}

export function CustomerReviewFormDialog({
  open,
  onOpenChange,
  review,
  productId,
  productName,
  onSubmit,
  submitting,
}) {
  const [rating, setRating] = useState(5)
  const [reviewerName, setReviewerName] = useState("")
  const [reviewerCity, setReviewerCity] = useState("")
  const [body, setBody] = useState("")
  const [reviewedAt, setReviewedAt] = useState(toDateInput())
  const [isVerified, setIsVerified] = useState(false)
  const [status, setStatus] = useState("draft")
  const [avatar, setAvatar] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState(productId ?? "")
  const [products, setProducts] = useState([])

  useEffect(() => {
    if (!open) return
    setSelectedProductId(review?.productId ?? productId ?? "")
    setRating(review?.rating ?? 5)
    setReviewerName(review?.reviewerName ?? "")
    setReviewerCity(review?.reviewerCity ?? "")
    setBody(review?.body ?? "")
    setReviewedAt(toDateInput(review?.reviewedAt))
    setIsVerified(review?.isVerified ?? false)
    setStatus(review?.status ?? "draft")
    setAvatar(review?.avatar ?? null)
    if (!productId) {
      listProducts({ page: 1, limit: 100, isActive: "true" })
        .then((data) => setProducts(data.items ?? []))
        .catch(() => setProducts([]))
    }
  }, [open, review, productId])

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit?.({
      productId: review?.productId ?? productId ?? selectedProductId,
      rating,
      reviewerName,
      reviewerCity: reviewerCity || null,
      body,
      reviewedAt: new Date(reviewedAt).toISOString(),
      isVerified,
      status,
      reviewerAvatarUploadId: avatar?.id ?? avatar?.uploadId ?? null,
      photoUploadIds: [],
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{review ? "Edit review" : "Add customer review"}</DialogTitle>
            <DialogDescription>
              {productName
                ? `Review for ${productName}. Shown on the product page when published.`
                : "Create a curated customer review for a product."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4">
            {!productId && !review?.productId ? (
              <div className="grid gap-2">
                <Label>Product</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label>Rating</Label>
              <ReviewStarRow
                rating={rating}
                interactive
                size="lg"
                disabled={submitting}
                onChange={setRating}
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Reviewer name</Label>
                <Input value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label>City</Label>
                <Input value={reviewerCity} onChange={(e) => setReviewerCity(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Review</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                required
                minLength={10}
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Review date</Label>
                <Input
                  type="date"
                  value={reviewedAt}
                  onChange={(e) => setReviewedAt(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Verified purchase</p>
                <p className="text-xs text-muted-foreground">Show verified badge on web</p>
              </div>
              <Switch checked={isVerified} onCheckedChange={setIsVerified} />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">Avatar</p>
                <p className="truncate text-xs text-muted-foreground">
                  {avatar?.filename || "Optional profile image"}
                </p>
              </div>
              <div className="flex gap-2">
                {avatar ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => setAvatar(null)}>
                    Remove
                  </Button>
                ) : null}
                <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                  Choose
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Spinner className="size-4" /> : review ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ProductMediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        attached={avatar ? [avatar] : []}
        max={1}
        kinds={["image"]}
        onAdd={(picked) => {
          const row = picked[0] ? toGalleryItem(picked[0]) : null
          setAvatar(row)
        }}
        disabled={submitting}
      />
    </>
  )
}
