import { useEffect, useState } from "react"
import { getApiError } from "@/api/api"
import { getMessageServiceCatalog } from "@/api/settings.api"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { MessageServiceSmsPanel } from "@/module/settings/components/MessageServiceSmsPanel"
import { MessageServiceWhatsAppPanel } from "@/module/settings/components/MessageServiceWhatsAppPanel"

export function MessageServicePage() {
  const [items, setItems] = useState(null)
  const [loading, setLoading] = useState(true)
  const [section, setSection] = useState("whatsapp")

  useEffect(() => {
    let cancelled = false
    getMessageServiceCatalog()
      .then((data) => {
        if (!cancelled) setItems(data.items ?? [])
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

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Message service (MSG91)</CardTitle>
          <CardDescription>
            Register templates in MSG91 and DLT using the copy-paste text below. Platform toggles
            live under Notifications. Editable customer copy stays in Notification templates.
            WhatsApp sends via MSG91 One API Flow (<code>WHATSAPP_PROVIDER=msg91</code>); SMS uses
            DLT template IDs when the SMS channel is on.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={section === "whatsapp" ? "default" : "outline"}
          onClick={() => setSection("whatsapp")}
        >
          WhatsApp templates
        </Button>
        <Button
          type="button"
          size="sm"
          variant={section === "sms" ? "default" : "outline"}
          onClick={() => setSection("sms")}
        >
          SMS templates
        </Button>
      </div>

      <div className="pt-2">
        {section === "whatsapp" ? (
          <MessageServiceWhatsAppPanel items={items} />
        ) : (
          <MessageServiceSmsPanel items={items} />
        )}
      </div>
    </div>
  )
}
