import { useEffect, useState } from "react"
import { getApiError } from "@/api/api"
import { getWebhookEndpoints } from "@/api/payouts.api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { PaymentMethodsPanel } from "@/module/settings/components/PaymentMethodsPanel"

export function OnlineGatewaysPanel() {
  const [webhooks, setWebhooks] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getWebhookEndpoints()
      .then((data) => {
        if (!cancelled) setWebhooks(data)
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
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <PaymentMethodsPanel />

      <Card>
        <CardHeader>
          <CardTitle>Webhook endpoints</CardTitle>
          <CardDescription>
            Paste these URLs in Razorpay and Cashfree dashboards. Use your ngrok or production API
            URL in <code className="text-xs">API_PUBLIC_URL</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <Skeleton className="h-20 w-full" />
          ) : webhooks ? (
            <>
              <div>
                <p className="text-sm font-medium">API base</p>
                <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                  {webhooks.apiPublicUrl}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Razorpay</p>
                <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                  {webhooks.razorpay}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Cashfree</p>
                <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                  {webhooks.cashfree}
                </p>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
