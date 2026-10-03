import { format } from "date-fns"
import { EyeIcon, MoreHorizontalIcon, PencilIcon, StarIcon, Trash2Icon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { DecoryImageFallback } from "@/module/catalog/components/DecoryImageFallback"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

function galleryImages(product) {
  return (product.images ?? []).filter((item) => item.kind === "image")
}

function coverImage(product) {
  return galleryImages(product)[0] ?? null
}

function imageSrc(item) {
  return item?.thumbnailUrl || item?.url || item?.publicUrl || item?.optimizedUrl || ""
}

function clipParts(value, separator, count = 2) {
  const text = String(value ?? "").trim()
  if (!text) return ""
  const parts = text.split(separator).filter(Boolean)
  if (parts.length <= count) return text
  return `${parts.slice(0, count).join(separator)}…`
}

function clippedName(name) {
  return clipParts(name, " ")
}

function clippedSlug(slug) {
  return clipParts(slug, "-")
}

export function ProductsTable({ items, loading, onTogglePublished, onDelete }) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-14">Image</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Slug</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Published</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((product) => {
          const cover = coverImage(product)
          const src = imageSrc(cover)
          const canPublish = product.canPublish !== false
          const toggleDisabled = !product.isActive && !canPublish

          return (
            <TableRow key={product.id}>
              <TableCell>
                <div className="relative size-10 overflow-hidden rounded-lg">
                  {src ? (
                    <img src={src} alt="" className="size-full object-cover" />
                  ) : (
                    <DecoryImageFallback />
                  )}
                </div>
              </TableCell>
              <TableCell className="max-w-40 font-medium">
                <span className="block truncate" title={product.name}>
                  {clippedName(product.name)}
                </span>
              </TableCell>
              <TableCell className="max-w-40 text-muted-foreground">
                <span className="block truncate" title={product.slug}>
                  {clippedSlug(product.slug)}
                </span>
              </TableCell>
              <TableCell>{product.categoryName || "—"}</TableCell>
              <TableCell>
                <span
                  className="inline-flex"
                  title={
                    toggleDisabled
                      ? "Add an image and a default price to publish"
                      : undefined
                  }
                >
                  <Switch
                    checked={product.isActive}
                    disabled={toggleDisabled}
                    onCheckedChange={(checked) => onTogglePublished(product, checked)}
                    aria-label={
                      product.isActive ? `Unpublish ${product.name}` : `Publish ${product.name}`
                    }
                  />
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {product.updatedAt ? format(new Date(product.updatedAt), "d MMM yyyy") : "—"}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Actions for ${product.name}`}
                      />
                    }
                  >
                    <MoreHorizontalIcon />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/catalog/products/${product.id}`)}>
                      <PencilIcon />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        navigate(`/catalog/products/${product.id}?preview`, {
                          state: { fromCatalog: true },
                        })
                      }
                    >
                      <EyeIcon />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/catalog/products/${product.id}/reviews`)}>
                      <StarIcon />
                      Reviews
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={() => onDelete(product)}>
                      <Trash2Icon />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
