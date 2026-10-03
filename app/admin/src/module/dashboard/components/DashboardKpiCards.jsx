import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatInr } from "@/module/payouts/lib/payout-format"

export function DashboardKpiCards({ kpis, loading }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!kpis) return null

  const cards = [
    {
      title: "Total bookings",
      value: kpis.totalBookings.toLocaleString("en-IN"),
      sub: `${kpis.bookingsToday} today`,
      to: "/bookings",
    },
    {
      title: "Needs assign",
      value: kpis.needsAssign.toLocaleString("en-IN"),
      sub: "Confirmed, unassigned",
      to: "/bookings?needsAssign=true",
    },
    {
      title: "Active vendors",
      value: kpis.activeVendors.toLocaleString("en-IN"),
      sub: `${kpis.pendingVendors} pending review`,
      to: "/people?tab=vendors",
    },
    {
      title: "Customers",
      value: kpis.totalCustomers.toLocaleString("en-IN"),
      sub: "Registered accounts",
      to: "/people?tab=customers",
    },
    {
      title: "Platform revenue",
      value: formatInr(kpis.platformRevenuePaise),
      sub: "Lifetime ledger balance",
      to: "/payouts",
    },
    {
      title: "Revenue this month",
      value: formatInr(kpis.revenueThisMonthPaise),
      sub: "Completed bookings",
      to: "/payouts",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <Link key={card.title} to={card.to} className="block outline-none">
          <Card className="h-full transition-colors hover:bg-muted/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight">{card.value}</p>
              {card.sub ? (
                <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
              ) : null}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
