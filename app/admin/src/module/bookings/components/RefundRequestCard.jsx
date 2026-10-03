import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { getApiError } from "@/api/api"
import { getOrderRefundRequest, patchRefundRequest } from "@/api/financials.api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { formatInr } from "@/module/payouts/lib/payout-format"
import { REFUND_STATUS_LABELS, refundStatusVariant } from "@/module/payouts/lib/refund-format"

export function RefundRequestCard({ orderId }) {
  const [refund, setRefund] = useState(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await getOrderRefundRequest(orderId)
      setRefund(data?.refund ?? null)
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [orderId])

  async function onAction(action) {
    if (!refund) return
    setActing(true)
    try {
      await patchRefundRequest(refund.id, { action })
      toast.add({ title: "Refund updated", type: "success" })
      await load()
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setActing(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!refund) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customer refund</CardTitle>
          <CardDescription>No refund request for this booking yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="link" className="h-auto px-0 text-xs" asChild>
            <Link to="/payouts?tab=refunds">View all refund requests</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-amber-200/80 dark:border-amber-900/50">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Customer refund request</CardTitle>
          <CardDescription>
            {formatInr(refund.amountPaise)} · {refund.paymentMethod}
          </CardDescription>
        </div>
        <Badge variant={refundStatusVariant(refund.status)}>
          {REFUND_STATUS_LABELS[refund.status] ?? refund.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {refund.customerName ? (
          <p className="text-sm">
            <span className="text-muted-foreground">Customer: </span>
            {refund.userId ? (
              <Button variant="link" className="h-auto p-0 font-medium" asChild>
                <Link to={`/people/customers/${refund.userId}`}>{refund.customerName}</Link>
              </Button>
            ) : (
              <span className="font-medium">{refund.customerName}</span>
            )}
            {refund.customerPhone ? (
              <span className="text-muted-foreground"> · {refund.customerPhone}</span>
            ) : null}
          </p>
        ) : null}
        <p className="text-sm text-muted-foreground">{refund.reason}</p>
        {refund.adminNote ? (
          <p className="text-xs text-muted-foreground">Note: {refund.adminNote}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {refund.status === "requested" ? (
            <>
              <Button type="button" size="sm" disabled={acting} onClick={() => void onAction("approve")}>
                Approve
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={acting}
                onClick={() => void onAction("reject")}
              >
                Decline
              </Button>
            </>
          ) : null}
          {refund.status === "processing" ? (
            <Button type="button" size="sm" disabled={acting} onClick={() => void onAction("complete")}>
              Mark completed
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" asChild>
            <Link to="/payouts?tab=refunds">All requests</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
