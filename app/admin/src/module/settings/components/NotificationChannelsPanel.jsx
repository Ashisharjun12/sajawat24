import { useEffect, useState } from "react"
import { getApiError } from "@/api/api"
import { getNotificationChannels, patchNotificationChannels } from "@/api/settings.api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"

const CHANNELS = [
  {
    key: "sms",
    title: "SMS",
    description:
      "DLT transactional SMS via MSG91 v5 when on. Requires approved templates (Message service tab).",
  },
  {
    key: "email",
    title: "Email",
    description: "Receipts and confirmations. SMTP in test; swap provider later without domain changes.",
  },
  {
    key: "push",
    title: "Push",
    description: "Expo / FCM OS notifications for vendor and customer apps. Send is not wired yet.",
  },
  {
    key: "inApp",
    title: "In-app inbox",
    description: "Stored in Decory for the bell/inbox. Customer UI comes later.",
  },
  {
    key: "whatsapp",
    title: "WhatsApp",
    description:
      "Transactional WhatsApp via MSG91 One API Flow (WHATSAPP_PROVIDER=msg91). Phone login needs SMS or WhatsApp on.",
  },
]

export function NotificationChannelsPanel() {
  const [channels, setChannels] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(null)

  useEffect(() => {
    let cancelled = false
    getNotificationChannels()
      .then((data) => {
        if (!cancelled) setChannels(data)
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
    if (!channels) return
    const previous = channels
    setChannels({ ...channels, [key]: enabled })
    setPending(key)
    try {
      const next = await patchNotificationChannels({ [key]: enabled })
      setChannels(next)
      toast.add({
        title: enabled ? `${labelFor(key)} enabled` : `${labelFor(key)} disabled`,
        type: "success",
      })
    } catch (err) {
      setChannels(previous)
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

  if (!channels) {
    return (
      <p className="text-muted-foreground py-8 text-sm">
        Could not load notification channels.
      </p>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform channels</CardTitle>
        <CardDescription>
          Kill switches for the whole platform. Per-event policies come later.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-border">
        {CHANNELS.map((channel) => (
          <div
            key={channel.key}
            className="flex items-start justify-between gap-6 py-4 first:pt-0 last:pb-0"
          >
            <div className="space-y-1">
              <Label htmlFor={`notify-${channel.key}`} className="text-foreground">
                {channel.title}
              </Label>
              <p className="text-muted-foreground text-sm">{channel.description}</p>
            </div>
            <Switch
              id={`notify-${channel.key}`}
              checked={Boolean(channels[channel.key])}
              disabled={pending === channel.key}
              onCheckedChange={(checked) => onToggle(channel.key, checked)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function labelFor(key) {
  return CHANNELS.find((channel) => channel.key === key)?.title ?? key
}
