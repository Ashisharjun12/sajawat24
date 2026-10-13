import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { APP_TABS } from "@/module/cms/lib/content-channels"
import { AppAnnouncementsPanel } from "@/module/cms/pages/AppAnnouncementsPanel"
import { AppBannersPanel } from "@/module/cms/pages/AppBannersPanel"
import { AppHomeLayoutPanel } from "@/module/cms/pages/AppHomeLayoutPanel"

function AndroidTabBody({ atab, cities }) {
  if (atab === "announcements") {
    return <AppAnnouncementsPanel cities={cities} />
  }

  if (atab === "banners") {
    return <AppBannersPanel cities={cities} />
  }

  if (atab === "homepage") {
    return <AppHomeLayoutPanel cities={cities} />
  }

  return null
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
          <div className="mt-4 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Preview only — not editable yet.
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
