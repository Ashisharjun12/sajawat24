import { CopyIcon, MoreHorizontalIcon, PencilIcon, PowerIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { CouponPreview } from "@/module/promotions/components/CouponPreview"
import { buildCouponPreviewFromCoupon } from "@/module/promotions/lib/promotion-preview"

const SKELETON_COUNT = 6

function CouponActions({ coupon, onEdit, onToggleStatus, onCopyCode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8 text-foreground/70 hover:bg-foreground/10 hover:text-foreground dark:text-white/85 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label={`Actions for ${coupon.code}`}
          />
        }
      >
        <MoreHorizontalIcon className="size-4" strokeWidth={2} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit?.(coupon)}>
          <PencilIcon />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onCopyCode?.(coupon.code)}>
          <CopyIcon />
          Copy code
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onToggleStatus?.(coupon)}>
          <PowerIcon />
          {coupon.status === "disabled" ? "Enable" : "Disable"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function CouponsGrid({
  items,
  loading = false,
  onEdit,
  onToggleStatus,
  onCopyCode,
}) {
  if (loading && items.length === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <Skeleton key={index} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((coupon) => {
        const preview = buildCouponPreviewFromCoupon(coupon)
        const inactive = coupon.status === "disabled" || coupon.status === "expired"

        return (
          <CouponPreview
            key={coupon.id}
            {...preview}
            className={cn(inactive && "opacity-75")}
            onCopy={onCopyCode}
            actions={
              <CouponActions
                coupon={coupon}
                onEdit={onEdit}
                onToggleStatus={onToggleStatus}
                onCopyCode={onCopyCode}
              />
            }
          />
        )
      })}
    </div>
  )
}
