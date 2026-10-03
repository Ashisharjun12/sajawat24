import { ExternalLinkIcon, PackageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { formatPaise } from "@/lib/money"
import { webProductUrl } from "@/lib/web-url"

function formatLinePaise(paise) {
  return `₹${formatPaise(paise)}`
}

function AddonPrice({ addon }) {
  const total = addon.pricePaise * addon.quantity
  if (total === 0) {
    return <span className="text-sm font-semibold text-emerald-600">Free</span>
  }
  return (
    <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
      {formatLinePaise(total)}
    </span>
  )
}

function ItemThumb({ imageUrl, size = "size-12" }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className={`${size} shrink-0 rounded-lg object-cover`}
      />
    )
  }
  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center rounded-lg bg-muted`}
      aria-hidden
    >
      <PackageIcon className="size-5 text-muted-foreground" />
    </div>
  )
}

export function BookingItemsTable({ items, subtotalPaise }) {
  const hasItems = items?.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Items</CardTitle>
      </CardHeader>
      <CardContent>
        {hasItems ? (
          <div className="space-y-5">
            {items.map((item) => {
              const productTotalPaise = item.productPaise * item.quantity
              return (
                <div key={item.id} className="space-y-2">
                  {item.productId ? (
                    <div className="flex justify-end">
                      <Button
                        nativeButton={false}
                        render={
                          <a
                            href={webProductUrl(item.productId)}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        }
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                      >
                        View product
                        <ExternalLinkIcon className="size-3.5" />
                      </Button>
                    </div>
                  ) : null}

                  <div className="space-y-0 overflow-hidden rounded-lg border border-border">
                    <div className="flex items-center gap-3 bg-muted/20 px-3 py-3">
                      <ItemThumb imageUrl={item.imageUrl} size="size-14" />
                      <span className="min-w-0 flex-1 text-sm font-semibold leading-5">
                        {item.name}
                      </span>
                      <span className="w-16 shrink-0 text-center text-sm tabular-nums text-muted-foreground">
                        Qty {item.quantity}
                      </span>
                      <span className="w-24 shrink-0 text-right text-base font-semibold tabular-nums">
                        {formatLinePaise(productTotalPaise)}
                      </span>
                    </div>

                    {item.addons?.map((addon, index) => (
                      <div
                        key={addon.id}
                        className={`flex items-center gap-3 px-3 py-3 ${index < item.addons.length - 1 ? "border-b border-border/70" : ""}`}
                      >
                        <ItemThumb imageUrl={addon.imageUrl} size="size-10" />
                        <span className="min-w-0 flex-1 text-sm font-medium">{addon.name}</span>
                        <span className="w-16 shrink-0 text-center text-sm tabular-nums text-muted-foreground">
                          Qty {addon.quantity}
                        </span>
                        <div className="w-24 shrink-0 text-right">
                          <AddonPrice addon={addon} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="font-medium">Total</span>
              <span className="text-lg font-semibold tabular-nums">
                {formatLinePaise(subtotalPaise)}
              </span>
            </div>
          </div>
        ) : (
          <Empty className="border-0 p-6">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackageIcon />
              </EmptyMedia>
              <EmptyTitle>No items</EmptyTitle>
              <EmptyDescription>
                This booking does not have any line items.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}
