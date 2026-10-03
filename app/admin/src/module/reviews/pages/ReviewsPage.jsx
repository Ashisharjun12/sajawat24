import { useSearchParams } from "react-router-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CustomerReviewsPanel } from "@/module/reviews/pages/CustomerReviewsPanel"
import { VideoReviewsPanel } from "@/module/reviews/pages/VideoReviewsPanel"

const TABS = ["customer-reviews", "video-reviews"]

function normalizeTab(value) {
  return TABS.includes(value) ? value : "customer-reviews"
}

export function ReviewsPage() {
  const [params, setParams] = useSearchParams()
  const tab = normalizeTab(params.get("tab"))

  function onTabChange(next) {
    setParams({ tab: next }, { replace: true })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium tracking-tight">Reviews</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customer text reviews per product, plus general platform videos (caption + upload only).
        </p>
      </div>

      <Tabs value={tab} onValueChange={onTabChange}>
        <TabsList variant="line">
          <TabsTrigger value="customer-reviews">Customer reviews</TabsTrigger>
          <TabsTrigger value="video-reviews">Video reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="customer-reviews">
          <CustomerReviewsPanel />
        </TabsContent>

        <TabsContent value="video-reviews">
          <VideoReviewsPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
