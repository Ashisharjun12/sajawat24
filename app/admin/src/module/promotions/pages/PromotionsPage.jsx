import { useSearchParams } from "react-router-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CouponsPanel } from "@/module/promotions/pages/CouponsPanel"
import { RedemptionsPanel } from "@/module/promotions/pages/RedemptionsPanel"

const TABS = ["coupons", "redemptions"]

function normalizeTab(value) {
  if (value === "overview") return "coupons"
  return TABS.includes(value) ? value : "coupons"
}

export function PromotionsPage() {
  const [params, setParams] = useSearchParams()
  const tab = normalizeTab(params.get("tab"))

  function onTabChange(next) {
    setParams({ tab: next }, { replace: true })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium tracking-tight">Promotions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Coupon codes customers can apply at checkout. Platform-funded discounts for now.
        </p>
      </div>

      <Tabs value={tab} onValueChange={onTabChange}>
        <TabsList variant="line">
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
          <TabsTrigger value="redemptions">Redemptions</TabsTrigger>
        </TabsList>

        <TabsContent value="coupons">
          <CouponsPanel />
        </TabsContent>

        <TabsContent value="redemptions">
          <RedemptionsPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
