import { useSearchParams } from "react-router-dom"
import { motion, useReducedMotion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CustomersPanel } from "@/module/people/pages/CustomersPanel"
import { VendorsPanel } from "@/module/people/pages/VendorsPanel"

const TABS = ["customers", "vendors"]

function normalizeTab(value) {
  return TABS.includes(value) ? value : "vendors"
}

export function PeoplePage() {
  const reduceMotion = useReducedMotion()
  const [params, setParams] = useSearchParams()
  const tab = normalizeTab(params.get("tab"))

  function onTabChange(next) {
    setParams({ tab: next }, { replace: true })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="shrink-0">
        <h1 className="font-heading text-2xl font-medium tracking-tight">People</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customers who book decorations and vendors who fulfill jobs.
        </p>
      </div>

      <Tabs value={tab} onValueChange={onTabChange} className="flex min-h-0 flex-1 flex-col">
        <TabsList className="shrink-0" variant="line">
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="min-h-0 flex-1 overflow-auto">
          <motion.div
            key="customers"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
          >
            <CustomersPanel />
          </motion.div>
        </TabsContent>

        <TabsContent value="vendors" className="min-h-0 flex-1 overflow-auto">
          <motion.div
            key="vendors"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
          >
            <VendorsPanel />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
