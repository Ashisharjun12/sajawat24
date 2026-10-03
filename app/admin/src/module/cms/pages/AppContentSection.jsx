import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MobilePhonePreview } from "@/module/cms/components/MobilePhonePreview"
import { APP_TABS } from "@/module/cms/lib/content-channels"
import { AppBannersPanel } from "@/module/cms/pages/AppBannersPanel"
import { AppHomeLayoutPanel } from "@/module/cms/pages/AppHomeLayoutPanel"

function DemoPanel({ title, description }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">{description}</p>
      <p className="mt-4 text-xs text-muted-foreground">Coming in a later slice.</p>
    </div>
  )
}

function AndroidTabBody({ atab, cities }) {
  if (atab === "banners") {
    return <AppBannersPanel cities={cities} />
  }

  if (atab === "homepage") {
    return <AppHomeLayoutPanel cities={cities} />
  }

  const copy = {
    announcements: {
      title: "App announcement bar",
      description:
        "Short promo line above the home feed on the customer app (not the website header).",
    },
  }
  const panel = copy[atab] ?? copy.announcements

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        <DemoPanel title={panel.title} description={panel.description} />
      </div>
      <MobilePhonePreview className="lg:sticky lg:top-4" />
    </div>
  )
}

export function AppContentSection({ channel, atab, onAppTabChange, disabled, cities = [] }) {
  if (disabled) {
    return (
      <div className="flex flex-col gap-6">
        <Alert>
          <AlertDescription>
            iOS app content editing is coming soon. Configure Android first; iOS
            will reuse the same structure when the app ships.
          </AlertDescription>
        </Alert>
        <Tabs value={atab} onValueChange={() => {}}>
          <TabsList variant="line" className="pointer-events-none opacity-50">
            {APP_TABS.map((t) => (
              <TabsTrigger key={t} value={t} disabled>
                {t === "homepage" ? "Homepage" : t.charAt(0).toUpperCase() + t.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row">
            <div className="min-w-0 flex-1 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Preview only — not editable yet.
            </div>
            <MobilePhonePreview dimmed />
          </div>
        </Tabs>
      </div>
    )
  }

  return (
    <Tabs value={atab} onValueChange={onAppTabChange}>
      <TabsList variant="line">
        <TabsTrigger value="announcements">Announcements</TabsTrigger>
        <TabsTrigger value="banners">Banners</TabsTrigger>
        <TabsTrigger value="homepage">Homepage</TabsTrigger>
      </TabsList>
      <TabsContent value="announcements">
        <AndroidTabBody atab="announcements" cities={cities} />
      </TabsContent>
      <TabsContent value="banners">
        <AndroidTabBody atab="banners" cities={cities} />
      </TabsContent>
      <TabsContent value="homepage">
        <AndroidTabBody atab="homepage" cities={cities} />
      </TabsContent>
    </Tabs>
  )
}

export { APP_TABS }
