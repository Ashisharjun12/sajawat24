import { useEffect, useMemo, useState } from "react"
import { getApiError } from "@/api/api"
import { getPayoutPolicy, patchPayoutPolicy } from "@/api/settings.api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"
import { RupeesPolicyInput } from "@/components/RupeesPolicyInput"
import { formatInr } from "@/module/payouts/lib/payout-format"

const PREVIEW_GROSS_PAISE = 1_000_000

export function CommissionPanel() {
  const [policy, setPolicy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    getPayoutPolicy()
      .then((data) => {
        if (!cancelled) setPolicy(data)
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

  const preview = useMemo(() => {
    if (!policy) return null
    const pct = Math.min(50, Math.max(0, Math.round(policy.platformCommissionPercent)))
    const platformFee = Math.floor((PREVIEW_GROSS_PAISE * pct) / 100)
    const vendorShare = PREVIEW_GROSS_PAISE - platformFee
    return { pct, platformFee, vendorShare }
  }, [policy])

  async function onSave() {
    if (!policy) return
    setSaving(true)
    try {
      const next = await patchPayoutPolicy(policy)
      setPolicy(next)
      toast.add({ title: "Commission policy saved", type: "success" })
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!policy || !preview) return null

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardHeader>
          <CardTitle>Split preview</CardTitle>
          <CardDescription>
            On a {formatInr(PREVIEW_GROSS_PAISE)} booking with {preview.pct}% commission (frozen per
            order at creation).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Gross</p>
            <p className="text-xl font-semibold">{formatInr(PREVIEW_GROSS_PAISE)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Platform ({preview.pct}%)</p>
            <p className="text-xl font-semibold">{formatInr(preview.platformFee)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Vendor share</p>
            <p className="text-xl font-semibold text-emerald-700">
              {formatInr(preview.vendorShare)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commission & wallet rules</CardTitle>
          <CardDescription>
            Changes apply to new orders only. In-flight bookings keep their snapshot.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="platformCommissionPercent">Platform commission (%)</Label>
            <Input
              id="platformCommissionPercent"
              type="number"
              min={0}
              max={50}
              value={policy.platformCommissionPercent}
              onChange={(e) =>
                setPolicy({ ...policy, platformCommissionPercent: Number(e.target.value) })
              }
            />
          </div>
          <RupeesPolicyInput
            id="minWithdrawalPaise"
            label="Minimum withdrawal"
            valuePaise={policy.minWithdrawalPaise}
            onChangePaise={(minWithdrawalPaise) => setPolicy({ ...policy, minWithdrawalPaise })}
            min={0}
            step={50}
            hint="Smallest amount a vendor can request in a single payout."
          />
          <div className="space-y-2">
            <Label htmlFor="settlementHoldDays">Settlement hold (days)</Label>
            <Input
              id="settlementHoldDays"
              type="number"
              min={0}
              max={30}
              value={policy.settlementHoldDays}
              onChange={(e) => setPolicy({ ...policy, settlementHoldDays: Number(e.target.value) })}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4 md:col-span-2">
            <div>
              <Label htmlFor="autoNetCodFromEarnings">Auto-net COD from earnings</Label>
              <p className="text-sm text-muted-foreground">
                Available balance subtracts outstanding COD commission dues.
              </p>
            </div>
            <Switch
              id="autoNetCodFromEarnings"
              checked={policy.autoNetCodFromEarnings}
              onCheckedChange={(checked) =>
                setPolicy({ ...policy, autoNetCodFromEarnings: checked })
              }
            />
          </div>
          <div className="md:col-span-2">
            <Button onClick={() => void onSave()} disabled={saving}>
              {saving ? "Saving…" : "Save commission policy"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
