import { useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { adminNeedsSetup } from "@/module/auth/admin-setup"
import { useAuthStore } from "@/store/auth.store"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AiPolicyPanel } from "@/module/settings/components/AiPolicyPanel"
import { BookingPolicyPanel } from "@/module/settings/components/BookingPolicyPanel"
import { InstantBookingSettingsPanel } from "@/module/settings/components/InstantBookingSettingsPanel"
import { NotificationChannelsPanel } from "@/module/settings/components/NotificationChannelsPanel"
import { NotificationTemplatesPanel } from "@/module/settings/components/NotificationTemplatesPanel"
import { AuditLogPage } from "@/module/settings/pages/AuditLogPage"
import { AdminAccountPanel } from "@/module/settings/components/AdminAccountPanel"
import { MessageServicePage } from "@/module/settings/pages/MessageServicePage"
import { DemoAuthPanel } from "@/module/settings/components/DemoAuthPanel"

const TABS = ["account", "notifications", "message-service", "booking", "ai", "demo", "audit"]

function normalizeTab(value) {
  return TABS.includes(value) ? value : "account"
}

export function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const setupRequired = adminNeedsSetup(user)
  const [params, setParams] = useSearchParams()
  const tab = setupRequired ? "account" : normalizeTab(params.get("tab"))

  useEffect(() => {
    if (setupRequired && params.get("tab") && params.get("tab") !== "account") {
      setParams({ tab: "account" }, { replace: true })
    }
  }, [setupRequired, params, setParams])

  function onTabChange(next) {
    if (setupRequired) return
    setParams({ tab: next }, { replace: true })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium tracking-tight">
          {setupRequired ? "Set up your admin account" : "Settings"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {setupRequired
            ? "Verify your login email and choose a new password before using the admin panel."
            : "Admin account, notifications, MSG91 message service, booking and instant dispatch, AI controls, Play review demo login, and audit trail."}
        </p>
      </div>

      <Tabs value={tab} onValueChange={onTabChange}>
        {setupRequired ? null : (
          <TabsList variant="line">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="message-service">Message service</TabsTrigger>
            <TabsTrigger value="booking">Booking</TabsTrigger>
            <TabsTrigger value="ai">AI</TabsTrigger>
            <TabsTrigger value="demo">Demo credentials</TabsTrigger>
            <TabsTrigger value="audit">Audit log</TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="account" className="pt-4">
          <AdminAccountPanel />
        </TabsContent>

        <TabsContent value="notifications" className="flex flex-col gap-6 pt-4">
          <NotificationChannelsPanel />
          <NotificationTemplatesPanel />
        </TabsContent>

        <TabsContent value="message-service" className="pt-4">
          {tab === "message-service" ? <MessageServicePage /> : null}
        </TabsContent>

        <TabsContent value="booking" className="flex flex-col gap-6 pt-4">
          <BookingPolicyPanel />
          <InstantBookingSettingsPanel />
        </TabsContent>

        <TabsContent value="ai" className="pt-4">
          <AiPolicyPanel />
        </TabsContent>

        <TabsContent value="demo" className="pt-4">
          <DemoAuthPanel />
        </TabsContent>

        <TabsContent value="audit" className="pt-4">
          <AuditLogPage />
        </TabsContent>
      </Tabs>
    </div>
  )
}
