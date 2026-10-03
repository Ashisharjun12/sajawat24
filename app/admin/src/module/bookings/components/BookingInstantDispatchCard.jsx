import { format } from "date-fns"
import { AlertCircleIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  dispatchOfferStatusLabel,
  dispatchOfferStatusVariant,
  dispatchStatusLabel,
  dispatchStatusVariant,
  fulfillmentTypeLabel,
} from "@/module/bookings/lib/instant-dispatch-ui"

function formatTs(iso) {
  if (!iso) return "—"
  try {
    return format(new Date(iso), "MMM d, h:mm a")
  } catch {
    return "—"
  }
}

function formatDistance(meters) {
  if (meters == null || !Number.isFinite(meters)) return null
  if (meters < 1000) return `${meters} m`
  return `${(meters / 1000).toFixed(1)} km`
}

export function BookingInstantDispatchCard({ order }) {
  if (!order || order.fulfillmentType !== "instant") {
    return null
  }

  const exhausted = order.dispatchStatus === "exhausted"
  const offers = Array.isArray(order.dispatchOffers) ? order.dispatchOffers : []
  const activeOffer = offers.find((row) => row.status === "offered")

  return (
    <Card className={exhausted ? "border-destructive/50 bg-destructive/5" : undefined}>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">Instant dispatch</CardTitle>
          <Badge variant="secondary">{fulfillmentTypeLabel(order.fulfillmentType)}</Badge>
          <Badge variant={dispatchStatusVariant(order.dispatchStatus)}>
            {dispatchStatusLabel(order.dispatchStatus)}
          </Badge>
        </div>
        <CardDescription>
          Auto-offers go to one vendor at a time. Expired or declined offers move to the next partner.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {exhausted ? (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>No vendor accepted</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                Auto-dispatch used every configured offer and no partner accepted in time. Assign a
                vendor manually above.
              </p>
              {order.dispatchExhaustedAt ? (
                <p className="text-destructive-foreground/90 text-xs">
                  Marked exhausted at {formatTs(order.dispatchExhaustedAt)}. An email alert is sent
                  to platform admin account email(s).
                </p>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}

        {!exhausted && order.dispatchStatus === "offering" && order.assignee?.vendorResponse === "pending" ? (
          <p className="text-sm text-muted-foreground">
            Waiting for {order.assignee?.name ?? "assigned vendor"} to accept or decline
            {activeOffer?.expiresAt ? ` (offer expires ${formatTs(activeOffer.expiresAt)})` : ""}.
          </p>
        ) : null}

        {offers.length > 0 ? (
          <div>
            <p className="text-sm font-medium text-foreground">Offer history</p>
            <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
              {offers.map((row) => (
                <li key={row.id} className="flex flex-wrap items-start justify-between gap-2 px-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{row.vendorName}</p>
                    <p className="text-xs text-muted-foreground">
                      Offered {formatTs(row.offeredAt)}
                      {row.expiresAt ? ` · expires ${formatTs(row.expiresAt)}` : ""}
                      {formatDistance(row.distanceMeters) ? ` · ${formatDistance(row.distanceMeters)}` : ""}
                    </p>
                  </div>
                  <Badge variant={dispatchOfferStatusVariant(row.status)} className="shrink-0">
                    {dispatchOfferStatusLabel(row.status)}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No vendor offers recorded yet. Dispatch may be disabled or still starting.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
