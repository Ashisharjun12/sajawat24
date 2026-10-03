import { useEffect, useMemo, useState } from "react"
import { getApiError } from "@/api/api"
import { getBookingPolicy, patchBookingPolicy } from "@/api/settings.api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"

export function BookingPolicyPanel() {
  const [policy, setPolicy] = useState(null)
  const [savedPolicy, setSavedPolicy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const policyDirty = useMemo(() => {
    if (!policy || !savedPolicy) return false
    return JSON.stringify(policy) !== JSON.stringify(savedPolicy)
  }, [policy, savedPolicy])

  useEffect(() => {
    let cancelled = false
    getBookingPolicy()
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
    if (!policy || !policyDirty) return
    setSaving(true)
    try {
      const next = await patchBookingPolicy(policy)
      setPolicy(next)
      setSavedPolicy(next)
      toast.add({ title: "Booking policy saved", type: "success" })
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
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!policy) {
    return (
      <p className="text-sm text-muted-foreground py-8">Could not load booking policy.</p>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking platform policy</CardTitle>
        <CardDescription>
          Kill switch, operating hours (IST), and minimum lead time for new customer bookings.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-1">
            <Label htmlFor="accepting-bookings">Accept new bookings</Label>
            <p className="text-sm text-muted-foreground">
              Turn off to pause checkout while keeping existing bookings active.
            </p>
          </div>
          <Switch
            id="accepting-bookings"
            checked={policy.acceptingBookings}
            onCheckedChange={(checked) =>
              setPolicy((current) => ({ ...current, acceptingBookings: checked }))
            }
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="hours-start">Operating hours start (IST)</Label>
            <Input
              id="hours-start"
              type="time"
              value={policy.operatingHoursStart}
              onChange={(event) =>
                setPolicy((current) => ({
                  ...current,
                  operatingHoursStart: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hours-end">Operating hours end (IST)</Label>
            <Input
              id="hours-end"
              type="time"
              value={policy.operatingHoursEnd}
              onChange={(event) =>
                setPolicy((current) => ({
                  ...current,
                  operatingHoursEnd: event.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="min-lead-hours">Minimum lead time (hours)</Label>
          <Input
            id="min-lead-hours"
            type="number"
            min={0}
            max={72}
            value={policy.minLeadHours}
            onChange={(event) =>
              setPolicy((current) => ({
                ...current,
                minLeadHours: Number(event.target.value) || 0,
              }))
            }
          />
          <p className="text-sm text-muted-foreground">
            Customers cannot book a slot sooner than this many hours from now.
          </p>
        </div>

        <div>
          <Button onClick={onSave} disabled={!policyDirty || saving}>
            {saving ? "Saving…" : "Save booking policy"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
