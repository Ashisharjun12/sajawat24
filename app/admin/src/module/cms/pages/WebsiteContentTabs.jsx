import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnnouncementsPanel } from "@/module/cms/pages/AnnouncementsPanel"
import { BannersPanel } from "@/module/cms/pages/BannersPanel"
import { TestimonialsPanel } from "@/module/cms/pages/TestimonialsPanel"
import { HomeLayoutPanel } from "@/module/cms/pages/HomeLayoutPanel"
import { FaqPanel } from "@/module/cms/pages/FaqPanel"
import { WEB_TABS } from "@/module/cms/lib/content-channels"

export function WebsiteContentTabs({ tab, onTabChange, cities, channel }) {
  return (
    <Tabs value={tab} onValueChange={onTabChange}>
      <TabsList variant="line">
        <TabsTrigger value="announcements">Announcements</TabsTrigger>
        <TabsTrigger value="banners">Banners</TabsTrigger>
        <TabsTrigger value="homepage">Homepage</TabsTrigger>
        <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
        <TabsTrigger value="faq">FAQ</TabsTrigger>
      </TabsList>
      {channel === "mobile" ? (
        <p className="text-xs text-muted-foreground">
          Editing the same CMS records as Web. Use platform checkboxes and mobile
          banner images for mobile browser visibility.
        </p>
      ) : null}
      <TabsContent value="announcements">
        <AnnouncementsPanel cities={cities} />
      </TabsContent>
      <TabsContent value="banners">
        <BannersPanel cities={cities} />
      </TabsContent>
      <TabsContent value="homepage">
        <HomeLayoutPanel cities={cities} />
      </TabsContent>
      <TabsContent value="testimonials">
        <TestimonialsPanel cities={cities} />
      </TabsContent>
      <TabsContent value="faq">
        <FaqPanel />
      </TabsContent>
    </Tabs>
  )
}

export { WEB_TABS }
