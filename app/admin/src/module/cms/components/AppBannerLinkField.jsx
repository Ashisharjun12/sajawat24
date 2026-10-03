import { useEffect, useState } from "react"
import { listAdmin as listCategories } from "@/api/categories.api"
import { getAdmin as getProduct } from "@/api/products.api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { AppBannerProductPickerDialog } from "@/module/cms/components/AppBannerProductPickerDialog"
import { DecoryImageFallback } from "@/module/catalog/components/DecoryImageFallback"
import { productCoverUrl } from "@/module/bookings/package-picker/package-picker.utils"
import {
  APP_BANNER_SCREEN_LINKS,
  buildCategoryHref,
  inferAppBannerLinkType,
  parseCategoryHref,
  productHrefFromId,
  productIdFromHref,
} from "@/module/cms/lib/app-banner-link"

export function AppBannerLinkField({ value = "", onChange, disabled = false }) {
  const [linkType, setLinkType] = useState("none")
  const [screenHref, setScreenHref] = useState("/(app)/explore")
  const [customHref, setCustomHref] = useState("")
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productLoading, setProductLoading] = useState(false)
  const [parentSlug, setParentSlug] = useState("")
  const [childSlug, setChildSlug] = useState("")
  const [parents, setParents] = useState([])
  const [children, setChildren] = useState([])
  const [productPickerOpen, setProductPickerOpen] = useState(false)

  const productId = productIdFromHref(value)

  useEffect(() => {
    const type = inferAppBannerLinkType(value)
    setLinkType(type)
    if (type === "screen") setScreenHref(value)
    if (type === "custom") setCustomHref(value)
    if (type === "category") {
      const parsed = parseCategoryHref(value)
      setParentSlug(parsed.parentSlug)
      setChildSlug(parsed.childSlug)
    }
  }, [value])

  useEffect(() => {
    if (linkType !== "product" || !productId) {
      setSelectedProduct(null)
      return
    }
    let cancelled = false
    setProductLoading(true)
    getProduct(productId)
      .then((data) => {
        if (!cancelled) setSelectedProduct(data)
      })
      .catch(() => {
        if (!cancelled) setSelectedProduct({ id: productId, name: "Product", images: [] })
      })
      .finally(() => {
        if (!cancelled) setProductLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [linkType, productId])

  useEffect(() => {
    listCategories({ parentId: null, limit: 100, isActive: "true" })
      .then((data) => setParents(data.items ?? []))
      .catch(() => setParents([]))
  }, [])

  useEffect(() => {
    if (!parentSlug) {
      setChildren([])
      return
    }
    const parent = parents.find((row) => row.slug === parentSlug)
    if (!parent?.id) {
      setChildren([])
      return
    }
    listCategories({ parentId: parent.id, limit: 100, isActive: "true" })
      .then((data) => setChildren(data.items ?? []))
      .catch(() => setChildren([]))
  }, [parentSlug, parents])

  function emit(next) {
    onChange?.(next?.trim() ? next.trim() : "")
  }

  function onLinkTypeChange(next) {
    setLinkType(next)
    if (next === "none") emit("")
    if (next === "screen") emit(screenHref)
    if (next === "custom") emit(customHref)
    if (next === "product") emit(productHrefFromId(productId))
    if (next === "category") emit(buildCategoryHref(parentSlug, childSlug))
  }

  const productImage = selectedProduct ? productCoverUrl(selectedProduct) : ""

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <Label>Tap destination</Label>
        <p className="text-xs text-muted-foreground">
          The whole banner is tappable on Android. Put marketing copy in the image.
        </p>
        <Select value={linkType} onValueChange={onLinkTypeChange} disabled={disabled}>
          <SelectTrigger><SelectValue placeholder="Choose link type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="screen">App screen</SelectItem>
            <SelectItem value="product">Product</SelectItem>
            <SelectItem value="category">Category</SelectItem>
            <SelectItem value="custom">Custom URL / path</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {linkType === "screen" ? (
        <Select
          value={screenHref}
          onValueChange={(next) => {
            setScreenHref(next)
            emit(next)
          }}
          disabled={disabled}
        >
          <SelectTrigger><SelectValue placeholder="Choose screen" /></SelectTrigger>
          <SelectContent>
            {APP_BANNER_SCREEN_LINKS.map((row) => (
              <SelectItem key={row.id} value={row.href}>{row.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {linkType === "product" ? (
        <div className="grid gap-2">
          {productLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner className="size-4" />
              Loading product…
            </div>
          ) : selectedProduct ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3">
              <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                {productImage ? (
                  <img src={productImage} alt="" className="size-full object-cover" />
                ) : (
                  <DecoryImageFallback className="size-full min-h-0" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">Selected product</p>
                <p className="line-clamp-2 text-sm font-medium">{selectedProduct.name}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => setProductPickerOpen(true)}
              >
                Change
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={() => setProductPickerOpen(true)}
            >
              Search & select product
            </Button>
          )}
        </div>
      ) : null}

      {linkType === "category" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <Select
            value={parentSlug || "_"}
            onValueChange={(next) => {
              const slug = next === "_" ? "" : next
              setParentSlug(slug)
              setChildSlug("")
              emit(buildCategoryHref(slug, ""))
            }}
            disabled={disabled}
          >
            <SelectTrigger><SelectValue placeholder="Parent category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_">Select parent…</SelectItem>
              {parents.map((row) => (
                <SelectItem key={row.id} value={row.slug}>{row.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={childSlug || "_"}
            onValueChange={(next) => {
              const slug = next === "_" ? "" : next
              setChildSlug(slug)
              emit(buildCategoryHref(parentSlug, slug))
            }}
            disabled={disabled || !parentSlug}
          >
            <SelectTrigger><SelectValue placeholder="Subcategory (optional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_">All in parent</SelectItem>
              {children.map((row) => (
                <SelectItem key={row.id} value={row.slug}>{row.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {linkType === "custom" ? (
        <Input
          value={customHref}
          onChange={(e) => {
            setCustomHref(e.target.value)
            emit(e.target.value)
          }}
          placeholder="/(app)/explore or https://…"
          disabled={disabled}
        />
      ) : null}

      <AppBannerProductPickerDialog
        open={productPickerOpen}
        onOpenChange={setProductPickerOpen}
        selectedId={productId}
        onSelect={(product) => {
          setSelectedProduct(product)
          emit(productHrefFromId(product.id))
        }}
      />
    </div>
  )
}
