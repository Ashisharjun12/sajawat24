import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatInr } from "@/module/payouts/lib/payout-format"

export function PromotionsOverviewCards({ overview, loading = false }) {
  const cards = [
    {
      title: "Active coupons",
      value: overview ? String(overview.activeCoupons) : "—",
      sub: "Currently valid and enabled",
    },
    {
      title: "Total redemptions",
      value: overview ? String(overview.totalRedemptions) : "—",
      sub: "Across all coupon codes",
    },
    {
      title: "Discount this month",
      value: overview ? formatInr(overview.discountThisMonthPaise) : "—",
      sub: "From redeemed coupons",
    },
    {
      title: "Top coupon",
      value: overview?.topCoupon?.code ?? "—",
      sub: overview?.topCoupon ? `${overview.topCoupon.uses} uses` : "No redemptions yet",
    },
  ]

  if (loading && !overview) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight">{card.value}</p>
            {card.sub ? <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
