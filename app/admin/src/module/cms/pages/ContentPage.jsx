import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { listAdmin as listCities } from "@/api/cities.api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CONTENT_CHANNELS,
  channelSubtitle,
  contentSearchParams,
  parseContentParams,
} from "@/module/cms/lib/content-channels"
import { AppContentSection } from "@/module/cms/pages/AppContentSection"
import { WebsiteContentTabs } from "@/module/cms/pages/WebsiteContentTabs"

const CHANNEL_LABELS = {
  web: "Web",
  mobile: "Mobile",
  android: "Android",
  ios: "iOS",
}

export function ContentPage() {
  const [params, setParams] = useSearchParams()
  const { channel, tab, atab } = parseContentParams(params)
  const [cities, setCities] = useState([])

  useEffect(() => {
    listCities({ page: 1, limit: 100, isActive: "true" })
      .then((data) => setCities(data.items ?? []))
      .catch(() => setCities([]))
  }, [])

  function onChannelChange(nextChannel) {
    const next = contentSearchParams({
      channel: nextChannel,
      tab,
      atab,
    })
    setParams(next, { replace: true })
  }

  function onWebTabChange(nextTab) {
    const next = contentSearchParams({
      channel,
      tab: nextTab,
      atab,
    })
    setParams(next, { replace: true })
  }

  function onAppTabChange(nextAtab) {
    const next = contentSearchParams({
      channel,
      tab,
      atab: nextAtab,
    })
    setParams(next, { replace: true })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium tracking-tight">Content</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {channelSubtitle(channel)}
        </p>
      </div>
      <Tabs value={channel} onValueChange={onChannelChange}>
        <TabsList variant="line">
          {CONTENT_CHANNELS.map((ch) => (
            <TabsTrigger key={ch} value={ch}>
              {CHANNEL_LABELS[ch]}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="web">
          <WebsiteContentTabs
            channel="web"
            tab={tab}
            onTabChange={onWebTabChange}
            cities={cities}
          />
        </TabsContent>
        <TabsContent value="mobile">
          <WebsiteContentTabs
            channel="mobile"
            tab={tab}
            onTabChange={onWebTabChange}
            cities={cities}
          />
        </TabsContent>
        <TabsContent value="android">
          <AppContentSection
            channel="android"
            atab={atab}
            onAppTabChange={onAppTabChange}
            disabled={false}
            cities={cities}
          />
        </TabsContent>
        <TabsContent value="ios">
          <AppContentSection
            channel="ios"
            atab={atab}
            onAppTabChange={onAppTabChange}
            disabled
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
