import { useEffect, useState } from "react"
import { getApiError } from "@/api/api"
import { getAiPolicy, patchAiPolicy } from "@/api/settings.api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"

const SURFACES = [
  {
    key: "admin",
    title: "Admin panel",
    description: "Catalog copilot, CMS assist, and other admin-only AI tools.",
  },
  {
    key: "web",
    title: "Customer web",
    description: "Discovery assistant and support chat on the customer website.",
  },
  {
    key: "customer",
    title: "Customer app",
    description: "Discovery and support in the future Expo customer mobile app.",
  },
  {
    key: "vendor",
    title: "Vendor app",
    description: "Job prep hints and inbox assist in the Expo vendor app.",
  },
]

export function AiPolicyPanel() {
  const [policy, setPolicy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(null)

  useEffect(() => {
    let cancelled = false
    getAiPolicy()
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

  async function onToggle(key, enabled) {
    if (!policy) return
    const previous = policy
    const payload = { [key]: enabled }
    if (key === "enabled" && enabled && !policy.admin) {
      payload.admin = true
    }
    setPolicy({ ...policy, ...payload })
    setPending(key)
    try {
      const next = await patchAiPolicy(payload)
      setPolicy(next)
      toast.add({
        title: enabled ? `${labelFor(key)} enabled` : `${labelFor(key)} disabled`,
        description:
          key === "enabled" && enabled && !previous.admin
            ? "Admin panel was enabled automatically for catalog AI."
            : undefined,
        type: "success",
      })
    } catch (err) {
      setPolicy(previous)
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setPending(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-44" />
          <Skeleton className="mt-2 h-4 w-full max-w-lg" />
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start justify-between gap-6 py-4 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-full max-w-md" />
              </div>
              <Skeleton className="h-6 w-10 shrink-0 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!policy) {
    return (
      <p className="text-muted-foreground py-8 text-sm">Could not load AI policy.</p>
    )
  }

  const surfacesDisabled = !policy.enabled

  return (
    <div className="flex flex-col gap-4">
      {!policy.llmConfigured ? (
        <Alert variant="destructive">
          <AlertDescription>
            LLM is not configured. Set LLM_API_KEY, LLM_BASE_URL, and LLM_MODEL in the backend
            environment before AI features can run.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>AI platform</CardTitle>
          <CardDescription>
            Master switch for all AI features. Surface toggles apply only when AI is enabled.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          <div className="flex items-start justify-between gap-6 pb-4">
            <div className="space-y-1">
              <Label htmlFor="ai-enabled" className="text-foreground">
                Enable AI
              </Label>
              <p className="text-muted-foreground text-sm">
                Turns AI on or off across Decory. Individual surfaces can still be toggled below.
              </p>
            </div>
            <Switch
              id="ai-enabled"
              checked={Boolean(policy.enabled)}
              disabled={pending === "enabled"}
              onCheckedChange={(checked) => onToggle("enabled", checked)}
            />
          </div>

          {SURFACES.map((surface) => (
            <div
              key={surface.key}
              className="flex items-start justify-between gap-6 py-4 last:pb-0"
            >
              <div className="space-y-1">
                <Label
                  htmlFor={`ai-${surface.key}`}
                  className={surfacesDisabled ? "text-muted-foreground" : "text-foreground"}
                >
                  {surface.title}
                </Label>
                <p className="text-muted-foreground text-sm">{surface.description}</p>
              </div>
              <Switch
                id={`ai-${surface.key}`}
                checked={Boolean(policy[surface.key])}
                disabled={surfacesDisabled || pending === surface.key}
                onCheckedChange={(checked) => onToggle(surface.key, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function labelFor(key) {
  if (key === "enabled") return "AI platform"
  return SURFACES.find((surface) => surface.key === key)?.title ?? key
}
