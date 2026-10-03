import { useEffect, useState } from "react"
import { getApiError } from "@/api/api"
import { getPaymentMethods, patchPaymentMethods } from "@/api/settings.api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"

const METHODS = [
  {
    key: "razorpay",
    title: "Razorpay",
    description: "UPI, cards, and net banking. Capture is not wired yet.",
    logo: "https://ik.imagekit.io/aevhlnk0h/razorpay.png",
    well: "bg-white",
  },
  {
    key: "cashfree",
    title: "Cashfree",
    description: "Alternate online gateway. Only one online provider can be on at a time.",
    logo: "https://ik.imagekit.io/aevhlnk0h/25682196.png",
    well: "bg-transparent",
  },
  {
    key: "cod",
    title: "Cash on delivery",
    description: "Pay the decorator after setup. Default for Decoryy.",
    logo: "https://ik.imagekit.io/aevhlnk0h/cod.png",
    well: "bg-white",
  },
]

function labelFor(key) {
  return METHODS.find((row) => row.key === key)?.title ?? key
}

function optimisticMethods(current, key, enabled) {
  const next = { ...current, [key]: enabled }
  if (key === "razorpay" && enabled) next.cashfree = false
  if (key === "cashfree" && enabled) next.razorpay = false
  return next
}

function switchDisabled(methods, pending, key) {
  if (pending === key) return true
  if (key === "cashfree" && methods.razorpay) return true
  if (key === "razorpay" && methods.cashfree) return true
  return false
}

function PaymentMethodsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-2 h-4 w-full max-w-xl" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="size-14 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
            <Skeleton className="h-6 w-10 rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function PaymentMethodsPanel() {
  const [methods, setMethods] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(null)

  useEffect(() => {
    let cancelled = false
    getPaymentMethods()
      .then((data) => {
        if (!cancelled) setMethods(data)
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

  async function onToggle(key, enabled) {
    if (!methods) return
    const previous = methods
    setMethods(optimisticMethods(methods, key, enabled))
    setPending(key)
    try {
      const next = await patchPaymentMethods({ [key]: enabled })
      setMethods(next)
      toast.add({
        title: enabled ? `${labelFor(key)} enabled` : `${labelFor(key)} disabled`,
        type: "success",
      })
    } catch (err) {
      setMethods(previous)
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setPending(null)
    }
  }

  if (loading) return <PaymentMethodsSkeleton />

  if (!methods) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment platforms</CardTitle>
        <CardDescription>
          Turn on the methods customers can use. Only one of Razorpay or Cashfree can be on.
          Cash on delivery is independent. Keep at least one method enabled.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {METHODS.map((row) => (
          <div key={row.key} className="flex items-center gap-4">
            <div
              className={`flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border ${row.well}`}
            >
              <img
                src={row.logo}
                alt=""
                className="max-h-10 max-w-12 object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <Label htmlFor={`pay-${row.key}`} className="text-sm font-medium">
                {row.title}
              </Label>
              <p className="text-sm text-muted-foreground">{row.description}</p>
            </div>
            <Switch
              id={`pay-${row.key}`}
              checked={Boolean(methods[row.key])}
              disabled={switchDisabled(methods, pending, row.key)}
              onCheckedChange={(enabled) => void onToggle(row.key, enabled)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
