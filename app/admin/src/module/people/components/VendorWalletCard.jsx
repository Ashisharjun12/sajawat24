import { useEffect, useState } from "react"
import { getApiError } from "@/api/api"
import { getVendorWallet } from "@/api/payouts.api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { formatInr } from "@/module/payouts/lib/payout-format"

export function VendorWalletCard({ vendorId }) {
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getVendorWallet(vendorId)
      .then((data) => {
        if (!cancelled) setWallet(data)
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
  }, [vendorId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!wallet) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet</CardTitle>
        <CardDescription>Pending clearance, available balance, and COD dues.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!wallet.assignable ? (
          <Alert variant="destructive">
            <AlertDescription>
              COD dues ({formatInr(wallet.codDuesPaise)}) exceed the cap (
              {formatInr(wallet.codMaxDuePaise)}). New assignments are blocked until dues are
              cleared.
            </AlertDescription>
          </Alert>
        ) : null}

        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">Available</dt>
            <dd className="text-lg font-semibold">{formatInr(wallet.availablePaise)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Pending clearance</dt>
            <dd className="text-lg font-semibold">{formatInr(wallet.pendingPaise)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Earned this month</dt>
            <dd className="text-lg font-semibold">{formatInr(wallet.earnedThisMonthPaise ?? 0)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">COD dues</dt>
            <dd className="text-lg font-semibold">{formatInr(wallet.codDuesPaise)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Min withdrawal</dt>
            <dd className="text-lg font-semibold">{formatInr(wallet.minWithdrawalPaise)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}
