import { format } from "date-fns"
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { ReviewStarRow } from "@/module/reviews/components/ReviewStarRow"

const SKELETON_ROWS = 8

function statusBadge(status) {
  if (status === "published") return <Badge className="text-xs">Published</Badge>
  if (status === "hidden") return <Badge variant="secondary" className="text-xs">Hidden</Badge>
  return <Badge variant="outline" className="text-xs">Draft</Badge>
}

function clipText(value, max = 24) {
  const text = String(value ?? "").trim()
  if (!text) return "—"
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

export function CustomerReviewsTable({
  items,
  loading,
  productId,
  onEdit,
  onDelete,
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="w-full overflow-hidden rounded-md border">
      <Table className="w-full table-fixed text-sm">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {!productId ? <TableHead className="h-9 w-[18%] px-2">Product</TableHead> : null}
            <TableHead className="h-9 w-[16%] px-2">Reviewer</TableHead>
            <TableHead className="h-9 w-[12%] px-2">Rating</TableHead>
            <TableHead className="h-9 px-2">Review</TableHead>
            <TableHead className="h-9 w-[11%] px-2">Status</TableHead>
            <TableHead className="h-9 w-[12%] px-2">Date</TableHead>
            <TableHead className="h-9 w-10 px-2" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => {
            const reviewerLine = [row.reviewerName, row.reviewerCity].filter(Boolean).join(" · ")
            const reviewPreview = clipText(row.body, 42)

            return (
              <TableRow key={row.id} className="text-sm">
                {!productId ? (
                  <TableCell className="px-2 py-2 font-medium" title={row.productName}>
                    {clipText(row.productName, 20)}
                  </TableCell>
                ) : null}
                <TableCell className="px-2 py-2" title={reviewerLine}>
                  <span className="font-medium">{clipText(row.reviewerName, 16)}</span>
                  {row.reviewerCity ? (
                    <span className="block text-xs text-muted-foreground">
                      {clipText(row.reviewerCity, 18)}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="px-2 py-2">
                  <ReviewStarRow rating={row.rating} />
                </TableCell>
                <TableCell className="px-2 py-2 text-muted-foreground" title={row.body}>
                  {reviewPreview}
                </TableCell>
                <TableCell className="px-2 py-2">{statusBadge(row.status)}</TableCell>
                <TableCell className="px-2 py-2 text-muted-foreground">
                  {row.reviewedAt ? format(new Date(row.reviewedAt), "d MMM yy") : "—"}
                </TableCell>
                <TableCell className="px-2 py-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button type="button" variant="ghost" size="icon-sm" />}
                    >
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit?.(row)}>
                        <PencilIcon />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => onDelete?.(row)}>
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
    </div>
  )
}
