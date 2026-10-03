import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatInr } from "@/module/payouts/lib/payout-format"

export function PlatformOverviewCards({ overview, loading }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
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

  if (!overview) return null

  const cards = [
    { title: "Platform revenue", value: formatInr(overview.platformRevenuePaise) },
    { title: "Order escrow", value: formatInr(overview.orderEscrowPaise) },
    { title: "Vendor COD dues", value: formatInr(overview.totalCodDuesPaise) },
    {
      title: "Pending payouts",
      value: String(overview.pendingPayoutRequests),
      sub: `${overview.pendingCodCollections} COD collections waiting`,
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      {overview.ledgerBacklogCount > 0 ? (
        <Alert variant="destructive">
          <AlertDescription>
            {overview.ledgerBacklogCount} completed job
            {overview.ledgerBacklogCount === 1 ? "" : "s"} missing wallet ledger entries. Use
            repost-ledger on the order or complete a fresh test job after restarting the API.
          </AlertDescription>
        </Alert>
      ) : null}

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
    </div>
  )
}
