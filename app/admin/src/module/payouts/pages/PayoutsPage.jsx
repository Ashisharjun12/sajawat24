import { useSearchParams } from "react-router-dom"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CommissionPanel } from "@/module/payouts/components/CommissionPanel"
import { OnlineGatewaysPanel } from "@/module/payouts/components/OnlineGatewaysPanel"
import { PayOnDeliveryPanel } from "@/module/payouts/components/PayOnDeliveryPanel"
import { SettlementsPanel } from "@/module/payouts/components/SettlementsPanel"
import { RefundRequestsPanel } from "@/module/payouts/components/RefundRequestsPanel"

const TABS = ["commission", "cod", "settlements", "refunds", "gateways"]
const COD_SUBS = ["awaiting", "rules"]
const SETTLEMENT_SUBS = ["liability", "requests"]

function normalizeTab(value) {
  return TABS.includes(value) ? value : "commission"
}

function defaultSub(tab) {
  if (tab === "cod") return "awaiting"
  if (tab === "settlements") return "liability"
  return undefined
}

function normalizeSub(tab, value) {
  if (tab === "cod") return COD_SUBS.includes(value) ? value : "awaiting"
  if (tab === "settlements") return SETTLEMENT_SUBS.includes(value) ? value : "liability"
  return undefined
}

export function PayoutsPage() {
  const [params, setParams] = useSearchParams()
  const tab = normalizeTab(params.get("tab"))
  const sub = normalizeSub(tab, params.get("sub"))

  function onTabChange(next) {
    const nextParams = { tab: next }
    const nextSub = defaultSub(next)
    if (nextSub) nextParams.sub = nextSub
    setParams(nextParams, { replace: true })
  }

  function onSubChange(next) {
    setParams({ tab, sub: next }, { replace: true })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium tracking-tight">Payouts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Commission, settlements, customer refund requests, and payment gateways.
        </p>
      </div>

      <Tabs value={tab} onValueChange={onTabChange}>
        <TabsList variant="line" className="max-w-full overflow-x-auto">
          <TabsTrigger value="commission">Commission</TabsTrigger>
          <TabsTrigger value="cod">Pay on delivery</TabsTrigger>
          <TabsTrigger value="settlements">Settlements</TabsTrigger>
          <TabsTrigger value="refunds">Customer refunds</TabsTrigger>
          <TabsTrigger value="gateways">Online gateways</TabsTrigger>
        </TabsList>

        <TabsContent value="commission" className="pt-4">
          <CommissionPanel />
        </TabsContent>
        <TabsContent value="cod" className="pt-4">
          <PayOnDeliveryPanel sub={sub} onSubChange={onSubChange} />
        </TabsContent>
        <TabsContent value="settlements" className="pt-4">
          <SettlementsPanel sub={sub} onSubChange={onSubChange} />
        </TabsContent>
        <TabsContent value="refunds" className="pt-4">
          <RefundRequestsPanel
            title="Customer refund requests"
            description="Review requests from customers on cancelled or disputed bookings. Approve online refunds to run the payment gateway automatically."
          />
        </TabsContent>
        <TabsContent value="gateways" className="pt-4">
          <OnlineGatewaysPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
