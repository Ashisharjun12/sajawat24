import { useEffect, useState } from "react"
import { getApiError } from "@/api/api"
import { getOrderFinancials } from "@/api/financials.api"
import { refundOrder } from "@/api/payouts.api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { formatCollectionStatus, formatInr } from "@/module/payouts/lib/payout-format"

export function BookingPaymentCard({ orderId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refunding, setRefunding] = useState(false)

  useEffect(() => {
    let cancelled = false
    getOrderFinancials(orderId)
      .then((payload) => {
        if (!cancelled) setData(payload)
      })
      .catch((err) => {
        if (!cancelled) toast.add({ title: getApiError(err), type: "error" })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [orderId])

  async function onRefund() {
    if (!data?.canRefund) return
    setRefunding(true)
    try {
      await refundOrder(orderId, { reason: "Admin refund from booking detail" })
      toast.add({ title: "Refund processed", type: "success" })
      const refreshed = await getOrderFinancials(orderId)
      setData(refreshed)
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setRefunding(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const { order, financials, paymentIntent, ledger, warnings, canRefund } = data

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Payment & settlement</CardTitle>
          <CardDescription>
            {order.paymentMethod} · {formatCollectionStatus(order.collectionStatus)}
          </CardDescription>
        </div>
        {canRefund ? (
          <Button variant="outline" size="sm" disabled={refunding} onClick={() => void onRefund()}>
            {refunding ? "Refunding…" : "Refund online payment"}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {warnings?.length ? (
          <div className="space-y-2">
            {warnings.map((warning) => (
              <Alert key={warning} variant="destructive">
                <AlertDescription>{warning}</AlertDescription>
              </Alert>
            ))}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Method</p>
            <p className="font-medium">{order.paymentMethod}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Collection</p>
            <p className="font-medium">{formatCollectionStatus(order.collectionStatus)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Gross</p>
            <p className="font-medium">{formatInr(order.subtotalPaise)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ledger posted</p>
            <p className="font-medium">{order.ledgerPostedAt ? "Yes" : "No"}</p>
          </div>
        </div>

        {financials ? (
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-medium">Financial snapshot</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Frozen at {financials.platformPercentSnapshot}% commission
              {data.currentPolicyPercent !== financials.platformPercentSnapshot
                ? ` (current policy: ${data.currentPolicyPercent}%)`
                : ""}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Platform fee</p>
                <p className="font-medium">{formatInr(financials.platformFeePaise)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vendor share</p>
                <p className="font-medium">{formatInr(financials.vendorSharePaise)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Collected via</p>
                <p className="font-medium">{order.collectionMethod ?? "—"}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No financial snapshot on this order.</p>
        )}

        {paymentIntent ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Online intent:</span>
            <Badge variant="secondary">{paymentIntent.provider}</Badge>
            <Badge variant={paymentIntent.status === "paid" ? "default" : "outline"}>
              {paymentIntent.status}
            </Badge>
            <span className="font-mono text-xs text-muted-foreground">{paymentIntent.providerRef}</span>
          </div>
        ) : null}

        {ledger?.length > 0 ? (
          <div>
            <p className="mb-2 text-sm font-medium">Ledger timeline</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {ledger.map((row) => (
                <li key={row.id} className="font-mono text-xs">
                  {formatInr(row.amountPaise)} · {row.debitAccount} → {row.creditAccount}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
