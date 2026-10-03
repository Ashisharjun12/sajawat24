import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { motion, useReducedMotion } from "framer-motion"
import { MapIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CitiesPanel } from "@/module/geo/components/CitiesPanel"
import { LocationsMapDialog } from "@/module/geo/components/LocationsMapDialog"
import { PincodesPanel } from "@/module/geo/components/PincodesPanel"

function normalizeTab(value) {
  return value === "pincodes" ? "pincodes" : "cities"
}

export function LocationsPage() {
  const reduceMotion = useReducedMotion()
  const [params, setParams] = useSearchParams()
  const [mapOpen, setMapOpen] = useState(false)
  const tab = normalizeTab(params.get("tab"))

  function onTabChange(next) {
    setParams({ tab: next }, { replace: true })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-medium tracking-tight">
            Operational locations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Active cities define where customers can book. PIN rows are optional—use them to
            block specific PINs or keep a reference list, not to allow every delivery PIN.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => setMapOpen(true)}>
          <MapIcon />
          Open map
        </Button>
      </div>

      <LocationsMapDialog open={mapOpen} onOpenChange={setMapOpen} />

      <Tabs value={tab} onValueChange={onTabChange}>
        <TabsList variant="line">
          <TabsTrigger value="cities">Cities</TabsTrigger>
          <TabsTrigger value="pincodes">Pincodes</TabsTrigger>
        </TabsList>
        <TabsContent value="cities">
          <motion.div
            key="cities"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
            className="pt-4"
          >
            <CitiesPanel />
          </motion.div>
        </TabsContent>
        <TabsContent value="pincodes">
          <motion.div
            key="pincodes"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
            className="pt-4"
          >
            <PincodesPanel />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
