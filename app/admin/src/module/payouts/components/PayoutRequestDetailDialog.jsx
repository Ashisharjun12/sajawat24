import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Building2, Smartphone, User } from "lucide-react"
import { getApiError } from "@/api/api"
import { getPayoutRequestDetail, updatePayoutRequest } from "@/api/payouts.api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { formatInr, formatPayoutStatus } from "@/module/payouts/lib/payout-format"

function statusVariant(status) {
  if (status === "paid") return "secondary"
  if (status === "failed") return "destructive"
  if (status === "processing") return "outline"
  return "default"
}

function DetailRow({ label, value, mono = false }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className={mono ? "font-mono text-sm font-medium sm:text-right" : "text-sm font-medium sm:text-right"}>
        {value}
      </dd>
    </div>
  )
}

function PayoutMethodCard({ method }) {
  if (!method) {
    return (
      <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        No payout method linked to this request.
      </div>
    )
  }

  const isUpi = method.type === "upi"
  const Icon = isUpi ? Smartphone : Building2

  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-background">
          <Icon className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">{isUpi ? "UPI payout" : "Bank transfer"}</p>
          <p className="text-sm text-muted-foreground">{method.accountHolderName}</p>
        </div>
      </div>
      <dl className="space-y-3">
        {isUpi ? (
          <DetailRow label="UPI ID" value={method.upiId} mono />
        ) : (
          <>
            <DetailRow label="Bank" value={method.bankName} />
            <DetailRow
              label="Account number"
              value={method.accountNumber ?? `•••• ${method.accountNumberLast4 ?? ""}`}
              mono
            />
            <DetailRow label="IFSC" value={method.ifsc} mono />
          </>
        )}
      </dl>
    </div>
  )
}

export function PayoutRequestDetailDialog({ requestId, open, onOpenChange, onUpdated }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [failureReason, setFailureReason] = useState("")

  useEffect(() => {
    if (!open || !requestId) {
      setDetail(null)
      setFailureReason("")
      return
    }

    let cancelled = false
    setLoading(true)
    getPayoutRequestDetail(requestId)
      .then((data) => {
        if (!cancelled) setDetail(data)
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
  }, [open, requestId])

  async function handleStatus(nextStatus) {
    if (!requestId) return
    setSaving(true)
    try {
      const updated = await updatePayoutRequest(requestId, {
        status: nextStatus,
        failureReason: nextStatus === "failed" ? failureReason.trim() || "Marked failed by admin" : undefined,
      })
      setDetail((current) =>
        current
          ? {
              ...current,
              status: updated.status,
              failureReason: updated.failureReason,
              processedAt: updated.processedAt,
            }
          : current,
      )
      toast.add({
        title: nextStatus === "paid" ? "Payout marked paid" : `Payout marked ${nextStatus}`,
        type: "success",
      })
      onUpdated?.()
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  const canMarkProcessing = detail?.status === "pending"
  const canMarkPaid = detail?.status === "pending" || detail?.status === "processing"
  const canMarkFailed = detail?.status === "pending" || detail?.status === "processing"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-[min(96vw,42rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-5 pr-14 text-left">
          <DialogTitle>Payout request</DialogTitle>
          <DialogDescription>
            Review the vendor&apos;s linked account and update status after manual transfer.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="space-y-5 px-6 py-5">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-36 w-full" />
              </div>
            ) : detail ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-3xl font-semibold tabular-nums tracking-tight">
                      {formatInr(detail.amountPaise)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Requested{" "}
                      {new Date(detail.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Badge variant={statusVariant(detail.status)} className="text-sm">
                    {formatPayoutStatus(detail.status)}
                  </Badge>
                </div>

                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Vendor</h3>
                  </div>
                  <div className="rounded-xl border p-4">
                    <Link
                      to={`/people/vendors/${detail.vendorId}`}
                      className="text-base font-medium hover:underline"
                      onClick={() => onOpenChange(false)}>
                      {detail.vendorName}
                    </Link>
                    {detail.vendorPhone ? (
                      <p className="mt-1 text-sm text-muted-foreground">{detail.vendorPhone}</p>
                    ) : null}
                    {detail.wallet ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <div className="rounded-lg bg-muted/40 px-3 py-2">
                          <p className="text-xs text-muted-foreground">Available</p>
                          <p className="font-semibold tabular-nums">
                            {formatInr(detail.wallet.availablePaise)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted/40 px-3 py-2">
                          <p className="text-xs text-muted-foreground">COD dues</p>
                          <p className="font-semibold tabular-nums">
                            {formatInr(detail.wallet.codDuesPaise)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted/40 px-3 py-2">
                          <p className="text-xs text-muted-foreground">Earned this month</p>
                          <p className="font-semibold tabular-nums">
                            {formatInr(detail.wallet.earnedThisMonthPaise ?? 0)}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </section>

                <Separator />

                <section className="space-y-3">
                  <h3 className="text-sm font-semibold">Linked payout account</h3>
                  <PayoutMethodCard method={detail.payoutMethod} />
                </section>

                {detail.failureReason ? (
                  <p className="text-sm text-destructive">Failure reason: {detail.failureReason}</p>
                ) : null}

                {canMarkFailed ? (
                  <div className="space-y-2">
                    <Label htmlFor="failure-reason">Failure reason (if marking failed)</Label>
                    <Input
                      id="failure-reason"
                      value={failureReason}
                      onChange={(event) => setFailureReason(event.target.value)}
                      placeholder="e.g. Invalid bank details"
                    />
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t bg-popover px-6 py-4 sm:justify-end">
          {canMarkProcessing ? (
            <Button variant="outline" disabled={saving} onClick={() => handleStatus("processing")}>
              Mark processing
            </Button>
          ) : null}
          {canMarkPaid ? (
            <Button disabled={saving} onClick={() => handleStatus("paid")}>
              Mark paid
            </Button>
          ) : null}
          {canMarkFailed ? (
            <Button variant="destructive" disabled={saving} onClick={() => handleStatus("failed")}>
              Mark failed
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
