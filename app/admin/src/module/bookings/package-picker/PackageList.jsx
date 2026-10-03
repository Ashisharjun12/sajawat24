import { DecoryImageFallback } from "@/module/catalog/components/DecoryImageFallback"
import { formatPaise } from "@/lib/money"
import { cn } from "@/lib/utils"
import {
  cityPricePaise,
  coverImage,
  imageSrc,
} from "@/module/bookings/package-picker/package-picker.utils"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const SKELETON_ROWS = 5

function clipName(name, max = 28) {
  const text = String(name ?? "").trim()
  if (text.length <= max) return text
  return `${text.slice(0, max)}…`
}

export function PackageList({
  items,
  cityId,
  selectedProductId,
  loading,
  onSelect,
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  if (!items.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No packages match for this state.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16" />
          <TableHead>Package</TableHead>
          <TableHead className="w-24 text-right">Price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((product) => {
          const cover = coverImage(product)
          const src = imageSrc(cover)
          const price = cityId ? cityPricePaise(product, cityId) : null
          const selected = product.id === selectedProductId

          return (
            <TableRow
              key={product.id}
              className={cn(
                "cursor-pointer",
                selected && "bg-primary/5 ring-1 ring-inset ring-primary",
              )}
              onClick={() => onSelect(product.id)}
            >
              <TableCell>
                <span className="inline-flex size-14 overflow-hidden rounded-lg bg-muted">
                  {src ? (
                    <img src={src} alt="" className="size-full object-cover" />
                  ) : (
                    <DecoryImageFallback />
                  )}
                </span>
              </TableCell>
              <TableCell>
                <div className="font-medium">{clipName(product.name)}</div>
                {product.categoryName ? (
                  <div className="text-xs text-muted-foreground">{product.categoryName}</div>
                ) : null}
              </TableCell>
              <TableCell className="text-right tabular-nums text-sm">
                {price != null ? `₹${formatPaise(price)}` : "—"}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
