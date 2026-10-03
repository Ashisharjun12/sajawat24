import { useEffect, useMemo, useState } from "react"
import { getApiError } from "@/api/api"
import { getDemoAuth, patchDemoAuth } from "@/api/settings.api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"

function displayPhone(phone) {
  if (!phone) return ""
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2)
  }
  if (digits.length === 10) return digits
  return phone
}

const TOGGLE_ROWS = [
  {
    key: "enabled",
    id: "demo-master",
    title: "Demo login enabled",
    description: "Master switch. When off, all apps use normal SMS OTP.",
  },
  {
    key: "customerApp",
    id: "demo-customer",
    title: "Customer app",
    description: "User app phone login for the review customer number.",
  },
  {
    key: "vendorOwnerApp",
    id: "demo-vendor-owner",
    title: "Vendor owner",
    description: "Partner app → vendor sign-in with the review owner number.",
  },
  {
    key: "vendorStaffApp",
    id: "demo-vendor-staff",
    title: "Vendor staff",
    description: "Partner app → staff sign-in with the review staff number.",
  },
]

export function DemoAuthPanel() {
  const [policy, setPolicy] = useState(null)
  const [savedPolicy, setSavedPolicy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const dirty = useMemo(() => {
    if (!policy || !savedPolicy) return false
    return JSON.stringify(policy) !== JSON.stringify(savedPolicy)
  }, [policy, savedPolicy])

  useEffect(() => {
    let cancelled = false
    getDemoAuth()
      .then((data) => {
        if (!cancelled) {
          setPolicy(data)
          setSavedPolicy(data)
        }
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

  async function onSave() {
    if (!policy || !dirty) return
    setSaving(true)
    try {
      const next = await patchDemoAuth({
        enabled: policy.enabled,
        customerApp: policy.customerApp,
        vendorOwnerApp: policy.vendorOwnerApp,
        vendorStaffApp: policy.vendorStaffApp,
      })
      setPolicy(next)
      setSavedPolicy(next)
      toast.add({ title: "Demo credentials saved", type: "success" })
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Skeleton className="h-64 w-full" />
  }

  if (!policy) {
    return <p className="text-sm text-muted-foreground py-8">Could not load demo credentials.</p>
  }

  const creds = policy.credentials

  return (
    <div className="flex flex-col gap-6">
      <Alert>
        <AlertDescription>
          Phones and OTP are set on the API server (defaults 9000000001–9000000003, OTP 123456).
          After deploy, run <code className="text-xs">npm run db:seed:demo-access</code> in the
          backend folder, then enable toggles below. Paste the same numbers in Play Console → App
          access.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Review login numbers</CardTitle>
          <CardDescription>Read-only. Override via backend .env if needed.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p>
            <span className="text-muted-foreground">Customer:</span>{" "}
            {displayPhone(creds?.customerPhone)}
          </p>
          <p>
            <span className="text-muted-foreground">Vendor owner:</span>{" "}
            {displayPhone(creds?.vendorOwnerPhone)}
          </p>
          <p>
            <span className="text-muted-foreground">Vendor staff:</span>{" "}
            {displayPhone(creds?.vendorStaffPhone)}
          </p>
          <p>
            <span className="text-muted-foreground">OTP:</span> {creds?.otpMasked ?? "******"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enable demo login</CardTitle>
          <CardDescription>
            Fixed OTP instead of SMS for the numbers above (production-safe for store review).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {TOGGLE_ROWS.map((row) => (
            <div key={row.key} className="flex items-start justify-between gap-6">
              <div className="space-y-1">
                <Label htmlFor={row.id}>{row.title}</Label>
                <p className="text-sm text-muted-foreground">{row.description}</p>
              </div>
              <Switch
                id={row.id}
                checked={Boolean(policy[row.key])}
                onCheckedChange={(checked) =>
                  setPolicy((current) => ({ ...current, [row.key]: checked }))
                }
              />
            </div>
          ))}
          <Button onClick={onSave} disabled={!dirty || saving} className="w-fit">
            {saving ? "Saving…" : "Save demo credentials"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
