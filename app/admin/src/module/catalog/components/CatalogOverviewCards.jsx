import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function formatCount(value) {
  if (value == null) return "—"
  return Number(value).toLocaleString("en-IN")
}

export function CatalogOverviewCards({ cards, loading = false }) {
  const rows = cards ?? []

  if (loading && rows.every((card) => card.value == null)) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {rows.map((card) => (
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
    <div className="grid gap-4 sm:grid-cols-3">
      {rows.map((card) => (
        <Card key={card.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight">{formatCount(card.value)}</p>
            {card.sub ? <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
