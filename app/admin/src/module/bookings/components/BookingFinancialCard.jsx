import { useEffect, useState } from "react"
import { getApiError } from "@/api/api"
import { getOrderFinancials } from "@/api/financials.api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function formatInr(paise) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`
}

export function BookingFinancialCard({ orderId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    getOrderFinancials(orderId)
      .then((payload) => {
        if (!cancelled) setData(payload)
      })
      .catch((err) => {
        if (!cancelled) setError(getApiError(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [orderId])

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

  if (error) return null
  if (!data?.financials) return null

  const { financials, ledger = [] } = data

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financials</CardTitle>
        <CardDescription>
          Snapshot at booking · {financials.platformPercentSnapshot}% platform fee
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Gross</p>
            <p className="font-medium">{formatInr(financials.grossPaise)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Platform fee</p>
            <p className="font-medium">{formatInr(financials.platformFeePaise)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Vendor share</p>
            <p className="font-medium">{formatInr(financials.vendorSharePaise)}</p>
          </div>
        </div>
        {ledger.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Ledger timeline</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {ledger.map((row) => (
                <li key={row.id}>
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
